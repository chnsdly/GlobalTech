---
title: "提交成功"
robots: "noindex, nofollow"
---

<p>感谢您的提交。</p>
<a id="dl-btn" href="#" class="button" hidden>立即下载</a>

<script>
  // 根据 URL 查询参数 ?dl=slug 拼出下载地址
  (function () {
    var p = new URLSearchParams(location.search);
    var slug = p.get('dl');                  // 例如 brochure-a4
    var a = document.getElementById('dl-btn');
    if (slug) {
      a.setAttribute('href', '/downloads/' + slug);
    } else {
      // 没有参数就隐藏按钮或跳回首页
      a.style.display = 'none';
    }
  })();
</script>
