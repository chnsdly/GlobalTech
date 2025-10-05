function getCookie(c:string, k:string){ return Object.fromEntries(c.split(/;\s*/).map(p=>p.split("=")))[k]; }
export const onRequestGet: PagesFunction<{ DB:D1Database, R2:R2Bucket }> = async ({ request, env, params }) => {
  const slug = String(params.slug||""); const ticket = getCookie(request.headers.get("Cookie")||"", "dl_ticket");
  const headers = { "X-Robots-Tag":"noindex, nofollow" };

  if (!slug || !ticket) return new Response("Forbidden", { status: 403, headers });

  const row = await env.DB.prepare(`SELECT slug,expires_at FROM tickets WHERE id=?`).bind(ticket).first<{slug:string,expires_at:string}>();
  if (!row || row.slug!==slug || new Date(row.expires_at).getTime()<Date.now()) return new Response("Expired", { status: 403, headers });

  const obj = await env.R2.get(`files/${slug}.pdf`);
  if (!obj) return new Response("Not Found", { status: 404, headers });

  const h = new Headers(headers);
  h.set("Content-Type", obj.httpMetadata?.contentType || "application/pdf");
  h.set("Content-Disposition", `attachment; filename="${slug}.pdf"`);
  return new Response(obj.body, { headers: h });
};
