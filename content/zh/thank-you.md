---
title: "提交成功"
robots: "noindex, nofollow"
---

<h1>感谢您的提交！</h1>
<p>我们已收到您的需求{{ with .Site.Params.company_name }}（{{ . }}）{{ end }}。</p>
<p id="prodLine" class="muted"></p>
<p><a class="cta-button" href="{{ "/" | relLangURL }}">返回首页</a></p>

<script>
(function(){
  try{
    var p = new URLSearchParams(location.search).get('product');
    if(p){
      document.getElementById('prodLine').textContent = '意向产品：' + decodeURIComponent(p.replace(/\+/g,'%20'));
    }
  }catch(e){}
})();
</script>
