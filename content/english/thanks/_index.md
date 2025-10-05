---
title: "提交成功"
robots: "noindex, nofollow"
---

<p>感谢您的提交。</p>
<a id="dl-btn" href="#" class="button" hidden>立即下载</a>

<script>
  // 读取指定 Cookie 值
  function getCookie(name) {
    return document.cookie.split('; ').reduce((r, v) => {
      const [k, ...rest] = v.split('=');
      return k === name ? decodeURIComponent(rest.join('=')) : r;
    }, '');
  }

  // 仅当存在 dl_slug（由“下载型表单”重定向时设置）才显示按钮
  const slug = getCookie('dl_slug');
  const a = document.getElementById('dl-btn');
  if (slug && /^[A-Za-z0-9._-]+$/.test(slug)) {
    a.href = '/downloads/' + slug;   // 或 + '.pdf'，你的后端两种都支持
    a.hidden = false;

    // 立刻清除 dl_slug，避免后续“联系表单”误显
    document.cookie = 'dl_slug=; Path=/thanks; Max-Age=0; Secure; SameSite=Lax';
  }
</script>
