export const onRequestGet: PagesFunction<{ DB: D1Database, ADMIN_KEY: string }> =
async ({ request, env }) => {
  const url = new URL(request.url);
  const key = url.searchParams.get("key") || "";
  const format = (url.searchParams.get("format") || "").toLowerCase();
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "200", 10) || 200, 1000);

  // 1) 简单鉴权
  if (!env.ADMIN_KEY || key !== env.ADMIN_KEY) {
    return new Response("Unauthorized", { status: 401 });
  }

  // 2) 查询最近线索
  const rows = await env.DB.prepare(`
    SELECT
      created_at, form_type, name, email, company, country, message,
      page_url, utm_source, utm_medium, utm_campaign, utm_term, utm_content
    FROM leads
    ORDER BY datetime(created_at) DESC
    LIMIT ?
  `).bind(limit).all<{[k:string]:string}>();

  // 3) CSV 导出
  if (format === "csv") {
    const headers = [
      "created_at","form_type","name","email","company","country","message",
      "page_url","utm_source","utm_medium","utm_campaign","utm_term","utm_content"
    ];
    const escape = (v: any) => {
      const s = (v ?? "").toString();
      // CSV 转义：包含逗号/引号/换行时用双引号包裹，并把引号重复一次
      return /[",\n]/.test(s) ? `"${s.replace(/"/g,'""')}"` : s;
    };
    const csv = [
      headers.join(","),
      ...(rows.results || []).map(r => headers.map(h => escape(r[h])).join(","))
    ].join("\n");

    const h = new Headers();
    h.set("Content-Type", "text/csv; charset=utf-8");
    const date = new Date().toISOString().slice(0,10);
    h.set("Content-Disposition", `attachment; filename="leads-${date}.csv"`);
    return new Response(csv, { headers: h });
  }

  // 4) HTML 简单后台（零依赖）
  const esc = (s: any) => (s ?? "").toString()
    .replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;");
  const th = (t: string) => `<th style="text-align:left;padding:6px 8px;border-bottom:1px solid #eee">${t}</th>`;
  const td = (t: any) => `<td style="padding:6px 8px;border-bottom:1px solid #f6f6f6;vertical-align:top">${esc(t)}</td>`;

  const headers = ["created_at","form_type","name","email","company","country","message",
                   "page_url","utm_source","utm_medium","utm_campaign","utm_term","utm_content"];

  const rowsHtml = (rows.results || []).map(r => `
    <tr>
      ${headers.map(h => td(r[h])).join("")}
    </tr>
  `).join("");

  const body = `
<!doctype html>
<meta charset="utf-8">
<title>Leads (${rows.results?.length || 0})</title>
<div style="font:14px/1.4 -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial">
  <h2 style="margin:10px 0 6px">Leads (${rows.results?.length || 0})</h2>
  <div style="margin:6px 0 12px">
    <a href="${esc(`/admin/leads?key=${key}&format=csv&limit=${limit}`)}">⬇️ 下载 CSV</a>
    &nbsp;·&nbsp; 显示上限：
    <a href="${esc(`/admin/leads?key=${key}&limit=200`)}">200</a> /
    <a href="${esc(`/admin/leads?key=${key}&limit=500`)}">500</a> /
    <a href="${esc(`/admin/leads?key=${key}&limit=1000`)}">1000</a>
  </div>
  <table cellspacing="0" cellpadding="0" style="border-collapse:collapse; width:100%; overflow:auto">
    <thead><tr>${headers.map(th).join("")}</tr></thead>
    <tbody>${rowsHtml}</tbody>
  </table>
</div>`;
  return new Response(body, { headers: { "Content-Type": "text/html; charset=utf-8" } });
};
