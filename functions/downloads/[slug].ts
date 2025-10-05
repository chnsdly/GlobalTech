function getCookie(raw: string, key: string) {
  if (!raw) return undefined;
  const map = Object.fromEntries(raw.split(/;\s*/).map(p => {
    const i = p.indexOf("=");
    return i === -1 ? [p, ""] : [p.slice(0, i), decodeURIComponent(p.slice(i + 1))];
  }));
  return map[key];
}

export const onRequestGet: PagesFunction<{ DB: D1Database, R2: R2Bucket }> =
async ({ request, env, params }) => {
  let slug = String(params.slug || "");                 // 可能是 "Baoheng-Quotation" 或 "Baoheng-Quotation.pdf"
  const ticket = getCookie(request.headers.get("Cookie") || "", "dl_ticket");
  const baseHeaders = { "X-Robots-Tag": "noindex, nofollow" };

  // 允许带 .pdf 的 URL：统一把后缀去掉（大小写不敏感）
  if (slug.toLowerCase().endsWith(".pdf")) slug = slug.slice(0, -4);

  if (!slug || !ticket) {
    return new Response("Forbidden", { status: 403, headers: baseHeaders });
  }

  // 校验票据（id 匹配 + slug 匹配 + 未过期）
  const row = await env.DB.prepare(
    `SELECT slug, expires_at FROM tickets WHERE id = ? LIMIT 1`
  ).bind(ticket).first<{ slug: string, expires_at: string }>();

  if (!row || row.slug !== slug || new Date(row.expires_at).getTime() < Date.now()) {
    return new Response("Expired", { status: 403, headers: baseHeaders });
  }

  // 依次尝试你可能使用的对象键（按你截图，首选 downloads/ 前缀）
  const candidates = [
    `downloads/${slug}.pdf`, `downloads/${slug}.PDF`,
    `files/${slug}.pdf`,     `files/${slug}.PDF`,
    `${slug}.pdf`,           `${slug}.PDF`,
  ];

  let obj: R2ObjectBody | null = null;
  let used = "";
  for (const k of candidates) {
    const r = await env.R2.get(k);
    if (r) { obj = r; used = k; break; }
  }

  if (!obj) {
    console.log("R2 Not Found", { slug, tried: candidates });  // 方便你在 Functions logs 查看尝试了哪些键
    return new Response("Not Found", { status: 404, headers: baseHeaders });
  }

  const h = new Headers(baseHeaders);
  h.set("Content-Type", obj.httpMetadata?.contentType || "application/pdf");
  h.set("Content-Disposition", `attachment; filename="${(used.split("/").pop() || slug + ".pdf")}"`);
  return new Response(obj.body, { headers: h });
};
