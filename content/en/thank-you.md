---
title: "Thank You"
robots: "noindex, nofollow"
---

<h1>Thank you!</h1>
<p>We’ve received your request{{ with .Site.Params.company_name }} at {{ . }}{{ end }}.</p>
<p id="prodLine" class="muted"></p>
<p><a class="cta-button" href="{{ "/" | relLangURL }}">Back to Home</a></p>

<script>
(function(){
  try{
    var p = new URLSearchParams(location.search).get('product');
    if(p){
      document.getElementById('prodLine').textContent = 'Product: ' + decodeURIComponent(p.replace(/\+/g,'%20'));
    }
  }catch(e){}
})();
</script>
