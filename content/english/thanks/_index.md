---
title: "提交成功"
robots: "noindex, nofollow"
---

<p>感谢您的提交。</p>
<a id="dl-btn" href="#" class="button" hidden>立即下载</a>

<script>
  (function () {
    const qs = new URLSearchParams(location.search);
    const slug = qs.get('dl');
    const btn  = document.getElementById('dl-btn');
    // 仅当存在 "dl_ticket"（只会在下载表单成功后下发）时才显示下载按钮
    const hasTicket = document.cookie.split('; ').some(s => s.startsWith('dl_ticket='));

    if (slug && hasTicket) {
      btn.href = '/downloads/' + encodeURIComponent(slug);
      btn.hidden = false;
    } else {
      btn.hidden = true;
    }
  })();
</script>

