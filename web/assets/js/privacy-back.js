// xr-privacy-back v1: go back to the page you came from; if the privacy page was opened on its own, go to the product's home page
(function(){var b=document.querySelector('[data-xr-back]');if(!b)return;b.addEventListener('click',function(e){
var r=document.referrer||'';if(history.length>1&&r&&r.indexOf(location.href)!==0){e.preventDefault();history.back();}});})();
