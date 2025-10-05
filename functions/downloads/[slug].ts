function getCookie(raw: string, key: string) {
  if (!raw) return undefined;
  const map = Object.fromEntries(raw.split(/;\s*/).map(p => {
    const i = p.indexOf("=");
    return i === -1 ? [p, ""] : [p.slice(0, i), decodeURIComponent(p.slice(i + 1))];
  }));
  return map[key];
}

export const onRequestGet: PagesFunction<{ DB: D1Database, R2: R2Bucket, DOWNLOADS_PREFIX?: string }> =
async ({ request, env, params }) => {
  const slug = String(params.slug || "");
  const ticket = getCookie(request.headers.get("Cookie") || "", "dl_ticket");
  const baseHeaders = { "X-Robots-Tag": "noindex, nofollow" };

  const keyPrefix = (env.DOWNLOADS_PREFIX || "downloads").replace(/^\/+|\/+$/g, "");

  if (!slug || !ticket) {
    return new Response("Forbidden", { status: 403, headers: baseHeaders });
  }

  const row = await env.DB.prepare(
    `SELECT slug, expires_at FROM tickets WHERE id = ? LIMIT 1`
  ).bind(ticket).first<{ slug: string, expires_at: string }>();

  if (!row || row.slug !== slug || new Date(row.expires_at).getTime() < Date.now()) {
    return new Response("Expired", { status: 403, headers: baseHeaders });
  }

  const obj = await env.R2.get(`${keyPrefix}/${slug}.pdf`);
  if (!obj) {
    return new Response("Not Found", { status: 404, headers: baseHeaders });
  }

  const h = new Headers(baseHeaders);
  h.set("Content-Type", obj.httpMetadata?.contentType || "application/pdf");
  h.set("Content-Disposition", `attachment; filename="${slug}.pdf"`);
  return new Response(obj.body, { headers: h });
};
