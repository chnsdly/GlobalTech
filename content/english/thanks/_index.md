---
title: "提交成功"
robots: "noindex, nofollow"
---

<p>感谢您的提交。</p>
<a id="dl-btn" href="#" class="button" hidden>立即下载</a>

<script>
  (function(){
    const p = new URLSearchParams(location.search);
    const a = document.getElementById('dl-btn');

    // 仅当“确认为下载表单提交” 且 有有效 slug 时才显示
    const lastType = sessionStorage.getItem('last_form_type');
    const slugFromQS = p.get('dl');
    const slugFromSS = sessionStorage.getItem('last_download_slug');
    const slug = slugFromQS || slugFromSS;

    if (lastType === 'download' && slug) {
      a.href = '/downloads/' + slug;
      a.hidden = false;
    } else {
      a.hidden = true;
    }

    // 用完即清，避免后续页面误用
    sessionStorage.removeItem('last_form_type');
    sessionStorage.removeItem('last_download_slug');
  })();
</script>

