---
title: "提交成功"
robots: "noindex, nofollow"
---

<p>感谢您的提交。</p>
<a id="dl-btn" href="#" class="button" hidden>立即下载</a>

<script>
  const p = new URLSearchParams(location.search);
  const slug = p.get('dl');
  const a = document.getElementById('dl-btn');
  if (slug) { a.href = '/downloads/' + slug; a.hidden = false; }
</script>
