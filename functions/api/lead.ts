export const onRequestPost: PagesFunction<{
  DB: D1Database,
  R2: R2Bucket,
  TURNSTILE_SECRET: string
}> = async ({ request, env }) => {
  const f = await request.formData();

  // 1) 蜜罐（有值直接吞）
  if ((f.get("website") as string)?.trim()) {
    return new Response("ok", { status: 200 });
  }

  // 2) Turnstile 服务端校验
  const token = String(f.get("cf-turnstile-response") || "");
  const ip = request.headers.get("CF-Connecting-IP") || "";
  const v = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: new URLSearchParams({
      secret: env.TURNSTILE_SECRET,
      response: token,
      remoteip: ip
    }),
  }).then(r => r.json());

  if (!v.success) {
    return new Response("Bot check failed", { status: 400 });
  }

  // 3) 取字段
  const now = new Date().toISOString();
  const get = (k: string) => String(f.get(k) || "").trim();
  const email = get("email");
  const name = get("name");
  const company = get("company");
  const country = get("country");
  const message = get("message");
  const formType = get("form_type") || "contact";
  const pageUrl = get("page_url");               // 也可换成 request.headers.get("Referer") 兜底
  const downloadSlug = get("download_slug");
  const consent = get("consent") || "no";
  const utm = (k: string) => get(k);
  const ua = request.headers.get("User-Agent") || "";

  // 4) 入库（leads）
  await env.DB.prepare(`
    INSERT INTO leads
      (created_at, name, email, company, country, message, form_type, page_url,
       utm_source, utm_medium, utm_campaign, utm_term, utm_content, ip, user_agent, consent)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `).bind(
    now, name, email, company, country, message, formType, pageUrl,
    utm("utm_source"), utm("utm_medium"), utm("utm_campaign"),
    utm("utm_term"), utm("utm_content"),
    ip, ua, consent
  ).run();

  // 5) 下载型：写票据 + Set-Cookie + 303 跳感谢页（带 ?dl=slug）
  if (formType === "download" && downloadSlug) {
    const id = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    await env.DB.prepare(`
      INSERT INTO tickets (id, slug, created_at, expires_at)
      VALUES (?,?,?,?)
    `).bind(id, downloadSlug, now, expiresAt).run();

    const url = new URL("/thanks/", request.url);
    url.searchParams.set("dl", downloadSlug);

    // ✅ 自己构造 303 响应，并一次性设置 Location + Set-Cookie
    return new Response(null, {
      status: 303,
      headers: {
        "Location": url.toString(),
        "Set-Cookie": `dl_ticket=${id}; Path=/downloads; HttpOnly; Secure; SameSite=Lax; Max-Age=900`
      }
    });
  }

  // 6) 联系表单：无票据，直接去 /thanks/
  return new Response(null, {
    status: 303,
    headers: { "Location": new URL("/thanks/", request.url).toString() }
  });
};
