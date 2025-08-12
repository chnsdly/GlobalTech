(function(){
  function esc(s){ return (s||'').replace(/[&<>"]/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c])); }

  function highlight(text, matches, key){
    if(!text) return '';
    if(!matches) return esc(text);
    const m = matches.find(m=>m.key===key);
    if(!m || !m.indices || !m.indices.length) return esc(text);
    let out = '', last = 0;
    m.indices.forEach(([start,end])=>{
      out += esc(text.slice(last,start)) + '<mark>' + esc(text.slice(start,end+1)) + '</mark>';
      last = end+1;
    });
    out += esc(text.slice(last));
    return out;
  }

  function card(obj){
    const item = obj.item || obj;             // 支持两种形态：原始或 Fuse 包装
    const matches = obj.matches || null;
    const sum = (item.summary||'').slice(0,180);
    const titleHTML = matches ? highlight(item.title, matches, 'title') : esc(item.title);
    const sumHTML = matches ? highlight(sum, matches, 'summary') : esc(sum);
    const cert = (item.certifications||[]).join(', ');
    const sku = item.sku ? `<p class="sku"><strong>SKU:</strong> ${esc(item.sku)}</p>` : '';
    const meta = [item.section, cert].filter(Boolean).join(' · ');
    return `
      <article class="product-card">
        <a href="${item.permalink}">
          <div style="height:180px;background:#f3f4f6;display:flex;align-items:center;justify-content:center;">
            <span style="color:#6b7280">No Image</span>
          </div>
          <h3>${titleHTML}</h3>
          ${sku}
          <p class="muted">${sumHTML}</p>
          <p class="muted" style="font-size:.85rem">${esc(meta)}</p>
        </a>
      </article>`;
  }

  async function fetchIndex(){
    const res = await fetch('/index.json',{cache:'no-store'});
    return await res.json();
  }
  function render(list){
    const box = document.getElementById('results');
    box.innerHTML = list.map(card).join('') || `<p class="muted">No results</p>`;
  }

  document.addEventListener('DOMContentLoaded', async ()=>{
    const data = await fetchIndex();
    render(data.slice(0,12));
    const fuse = new Fuse(data, {
      keys: ["title","summary","sku","certifications"],
      threshold: 0.3, ignoreLocation: true,
      includeMatches: true, minMatchCharLength: 2
    });
    const q = document.getElementById('q');
    q.addEventListener('input', (e)=>{
      const s = e.target.value.trim();
      if(!s){ render(data.slice(0,12)); return; }
      render(fuse.search(s));
    });
  });
})();
