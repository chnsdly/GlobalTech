---
title: "联系我们"
description: "获取报价或与工程师沟通方案。"
---

<form method="POST" action="https://formspree.io/f/your-form-id"
      data-thank="{{ "thank-you" | relLangURL }}" id="contactForm">

  <!-- 两列：姓名 + 邮箱 -->
  <div class="row2">
    <label class="sr-only" for="name">您的姓名</label>
    <input type="text"   id="name"     name="name"      placeholder="您的姓名" required>
    <label class="sr-only" for="email">邮箱</label>
    <input type="email"  id="email"    name="_replyto"  placeholder="邮箱" required>
  </div>

  <label class="sr-only" for="product">意向产品</label>
  <input type="text"   name="product" id="product" placeholder="意向产品（自动填充）">

  <label class="sr-only" for="message">项目需求</label>
  <textarea name="message" id="message" placeholder="请描述您的项目需求" required></textarea>

  <!-- 蜜罐（请保持隐藏） -->
  <div style="position:absolute;left:-5000px;top:auto;width:1px;height:1px;overflow:hidden;">
    <label>Company</label>
    <input type="text" name="company_hp" tabindex="-1" autocomplete="off">
  </div>

  <!-- 延迟时间戳 -->
  <input type="hidden" name="ts" id="ts">

  <!-- 额外上下文 -->
  <input type="hidden" name="language" value="{{ .Site.Language.Lang }}">
  <input type="hidden" name="page_path" value="{{ .RelPermalink }}">

  <div class="actions">
    <button type="submit" id="submitBtn" class="cta-button">发送</button>
    <p id="formMsg" class="muted" aria-live="polite"></p>
  </div>
</form>

<script>
(function(){
  var form = document.getElementById('contactForm');
  if(!form) return;
  var btn  = document.getElementById('submitBtn');
  var msg  = document.getElementById('formMsg');

  // 1) 自动带入 ?product=XXX
  try{
    var params = new URLSearchParams(location.search);
    var p = params.get('product');
    if(p){
      var input = form.querySelector('input[name="product"]');
      if (input) input.value = decodeURIComponent(p.replace(/\+/g, '%20'));
    }
  }catch(e){}

  // 2) 防垃圾：时间戳 + 蜜罐
  var start = Date.now();
  var ts = document.getElementById('ts');
  if (ts) ts.value = start;

  form.addEventListener('submit', async function(e){
    e.preventDefault();

    var hp = form.querySelector('input[name="company_hp"]');
    if (hp && hp.value) { msg.textContent = '提交被拦截（疑似自动表单）。'; return; }
    if (Date.now() - start < 3000) { msg.textContent = '请稍等片刻再提交。'; return; }

    btn.disabled = true; btn.textContent = '发送中...'; msg.textContent = '';

    try{
      var fd = new FormData(form);
      var res = await fetch(form.action, { method:'POST', body: fd, headers:{'Accept':'application/json'} });
      if(res.ok){
        try{
          var product = (form.querySelector('input[name="product"]')||{}).value || '';
          if (window.gtag) {
            window.gtag('event','generate_lead', {
              item_name: product,
              language: document.documentElement.lang || '{{ .Site.Language.Lang }}',
              page_path: location.pathname
            });
          }
        }catch(e){}
        var thank = form.getAttribute('data-thank') || '/zh/thank-you/';
        var q = '';
        var pv = (form.querySelector('input[name="product"]')||{}).value;
        if(pv) q = '?product=' + encodeURIComponent(pv);
        location.href = thank + q;
      }else{
        msg.textContent = '提交失败，请重试。';
        btn.disabled = false; btn.textContent = '发送';
      }
    }catch(err){
      form.removeEventListener('submit', arguments.callee);
      form.submit();
    }
  });
})();
</script>
