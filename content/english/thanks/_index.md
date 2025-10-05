---
title: "提交成功"
robots: "noindex, nofollow"
---

<p>感谢您的提交。</p>
<a id="dl-btn" href="#" class="button" hidden>立即下载</a>

<script>
  const p = new URLSearchParams(location.search);
  const mode = p.get('m');             // 新增：模式标记
  const slug = p.get('dl');
  const a = document.getElementById('dl-btn');
  if (mode === 'download' && slug && /^[A-Za-z0-9._-]+$/.test(slug)) {
    a.href = '/downloads/' + slug; // 或 + '.pdf'
    a.hidden = false;
  }
</script>
