export const onRequestPost: PagesFunction<{ DB: D1Database, R2: R2Bucket, TURNSTILE_SECRET: string }> = async ({ request, env }) => {
  const f = await request.formData();

  // 1) 简单反垃圾（蜜罐字段 website，正常用户不会填）
  if ((f.get("website") as string)?.trim()) return new Response("ok", { status: 200 });

  // 2) Turnstile 服务端校验
  const token = String(f.get("cf-turnstile-response") || "");
  const ip = request.headers.get("CF-Connecting-IP") || "";
  const v = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: new URLSearchParams({ secret: env.TURNSTILE_SECRET, response: token, remoteip: ip }),
  }).then(r => r.json());
  if (!v.success) return new Response("Bot check failed", { status: 400 });

  // 3) 取字段
  const now = new Date().toISOString();
  const get = (k:string)=> String(f.get(k) || "").trim();
  const email = get("email"); const name = get("name");
  const company = get("company"); const country = get("country");
  const message = get("message"); const formType = get("form_type") || "contact";
  const pageUrl = get("page_url"); const downloadSlug = get("download_slug");
  const consent = get("consent") || "no";
  const utm = (k:string)=> get(k);
  const ua = request.headers.get("User-Agent") || "";

  // 4) 入库
  await env.DB.prepare(`
    INSERT INTO leads (created_at,name,email,company,country,message,form_type,page_url,
      utm_source,utm_medium,utm_campaign,utm_term,utm_content,ip,user_agent,consent)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).bind(
    now,name,email,company,country,message,formType,pageUrl,
    utm("utm_source"),utm("utm_medium"),utm("utm_campaign"),utm("utm_term"),utm("utm_content"),
    ip,ua,consent
  ).run();

  // 5) 下载型：签发 15 分钟票据 + 跳转感谢页
  if (formType === "download" && downloadSlug) {
    const id = crypto.randomUUID();
    const expiresAt = new Date(Date.now()+15*60*1000).toISOString();
    await env.DB.prepare(`INSERT INTO tickets (id,slug,created_at,expires_at) VALUES (?,?,?,?)`)
      .bind(id, downloadSlug, now, expiresAt).run();

    const url = new URL("/thanks/", request.url);
    url.searchParams.set("dl", downloadSlug);

    return new Response(null, {
      status: 303,
      headers: {
        "Location": url.toString(),
        "Set-Cookie": `dl_ticket=${id}; Path=/downloads; HttpOnly; Secure; SameSite=Lax; Max-Age=900`
      }
    });
  }

  return Response.redirect(new URL("/thanks/", request.url), 303);
};
