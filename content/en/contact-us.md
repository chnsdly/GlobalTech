---
title: "Contact Us"
description: "Request a quote or speak with our sales engineers."
---

<form method="POST" action="https://formspree.io/f/your-form-id"
      data-thank="{{ "thank-you" | relLangURL }}" id="contactForm">

  <!-- 两列：姓名 + 邮箱 -->
  <div class="row2">
    <label class="sr-only" for="name">Your Name</label>
    <input type="text"   id="name"     name="name"      placeholder="Your Name" required>
    <label class="sr-only" for="email">Email</label>
    <input type="email"  id="email"    name="_replyto"  placeholder="Email" required>
  </div>

  <label class="sr-only" for="product">Product</label>
  <input type="text"   name="product" id="product" placeholder="Product (auto-filled)">

  <label class="sr-only" for="message">Project details</label>
  <textarea name="message" id="message" placeholder="Project details" required></textarea>

  <!-- Honeypot（请保持隐藏） -->
  <div style="position:absolute;left:-5000px;top:auto;width:1px;height:1px;overflow:hidden;">
    <label>Company</label>
    <input type="text" name="company_hp" tabindex="-1" autocomplete="off">
  </div>

  <!-- 延迟时间戳 -->
  <input type="hidden" name="ts" id="ts">

  <!-- 额外上下文（可在邮件里看到） -->
  <input type="hidden" name="language" value="{{ .Site.Language.Lang }}">
  <input type="hidden" name="page_path" value="{{ .RelPermalink }}">

  <div class="actions">
    <button type="submit" id="submitBtn" class="cta-button">Send</button>
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

    // 蜜罐
    var hp = form.querySelector('input[name="company_hp"]');
    if (hp && hp.value) { msg.textContent = 'Submission blocked.'; return; }
    // 延迟
    if (Date.now() - start < 3000) { msg.textContent = 'Please wait a moment before submitting.'; return; }

    // UI: 禁用按钮
    btn.disabled = true; btn.textContent = 'Sending...'; msg.textContent = '';

    // 3) AJAX 提交
    try{
      var fd = new FormData(form);
      var res = await fetch(form.action, { method:'POST', body: fd, headers:{'Accept':'application/json'} });
      if(res.ok){
        // 4) GA4 事件（可选）
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
        // 5) 跳转 Thank You，带上 product
        var thank = form.getAttribute('data-thank') || '/thank-you/';
        var q = '';
        var pv = (form.querySelector('input[name="product"]')||{}).value;
        if(pv) q = '?product=' + encodeURIComponent(pv);
        location.href = thank + q;
      }else{
        msg.textContent = 'Submit failed. Please try again.';
        btn.disabled = false; btn.textContent = 'Send';
      }
    }catch(err){
      // 网络异常时回退常规提交
      form.removeEventListener('submit', arguments.callee);
      form.submit();
    }
  });
})();
</script>
