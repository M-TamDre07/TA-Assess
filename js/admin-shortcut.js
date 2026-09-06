/* Hidden admin entry: Ctrl+Alt+A. This is not an authorization control; the protected backend remains authoritative. */
(function(){
  document.addEventListener('keydown',function(e){
    if(e.ctrlKey&&e.altKey&&String(e.key).toLowerCase()==='a'){
      e.preventDefault();
      window.location.href='admin.html';
    }
  });
})();
