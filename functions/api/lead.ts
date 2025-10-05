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

  // ……前面校验 Turnstile、写 leads 省略……

if (downloadSlug) {                                // ← 仅以是否有 download_slug 来判定下载型
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  await env.DB.prepare(`
    INSERT INTO tickets (id, slug, created_at, expires_at)
    VALUES (?,?,?,?)
  `).bind(id, downloadSlug, now, expiresAt).run();

  const url = new URL("/thanks/", request.url);

  // 构造 303 + 两个 Set-Cookie：
  // 1) dl_ticket：真正的受控下载票据（HttpOnly，仅 /downloads 可见）
  // 2) dl_slug：仅用于感谢页显示按钮（JS 可读，Path=/thanks；马上会被前端清除）
  const headers = new Headers();
  headers.set("Location", url.toString());
  headers.append(
    "Set-Cookie",
    `dl_ticket=${id}; Path=/downloads; HttpOnly; Secure; SameSite=Lax; Max-Age=900`
  );
  headers.append(
    "Set-Cookie",
    `dl_slug=${encodeURIComponent(downloadSlug)}; Path=/thanks; Secure; SameSite=Lax; Max-Age=600`
  );

  return new Response(null, { status: 303, headers });
}

// ……联系分支保持 303 到 /thanks/（不设置 dl_slug）……
return new Response(null, {
  status: 303,
  headers: { "Location": new URL("/thanks/", request.url).toString() }
});

};
