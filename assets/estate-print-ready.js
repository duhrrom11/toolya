(function(){
 'use strict';
 document.getElementById('print-again').addEventListener('click',()=>window.print());
 if(window.opener)window.opener.postMessage({type:'estate-print-ready'},location.origin);
})();
