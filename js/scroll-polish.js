(function(){
 'use strict';
 var header=document.querySelector('.header'),last=scrollY,anchor=last,queued=false;
 function paint(){queued=false;var y=scrollY;if(y<100||window.modernNavTarget||header.querySelector('.nav.is-open')){header.classList.remove('nav-away');anchor=y;}else if(Math.abs(y-anchor)>14){header.classList.toggle('nav-away',y>anchor);anchor=y;}last=y;}
 if(header){window.addEventListener('scroll',function(){if(!queued){queued=true;requestAnimationFrame(paint);}},{passive:true});header.addEventListener('focusin',function(){header.classList.remove('nav-away');});}
 var motion=matchMedia('(prefers-reduced-motion:reduce)'),pointer=matchMedia('(hover:hover) and (pointer:fine)');
 document.querySelectorAll('.kpi-grid .stat').forEach(function(card){var frame=0,x=0,y=0;function paintTilt(){frame=0;var number=card.querySelector('.stat__num');number.style.setProperty('--kpi-x',x+'deg');number.style.setProperty('--kpi-y',y+'deg');}function reset(){x=y=0;if(!frame)frame=requestAnimationFrame(paintTilt);}card.addEventListener('pointermove',function(e){if(motion.matches||!pointer.matches||e.pointerType==='touch')return;var r=card.getBoundingClientRect();x=Math.max(-7,Math.min(7,-((e.clientY-r.top)/r.height-.5)*14));y=Math.max(-7,Math.min(7,((e.clientX-r.left)/r.width-.5)*14));if(!frame)frame=requestAnimationFrame(paintTilt);},{passive:true});card.addEventListener('pointerleave',reset);motion.addEventListener('change',reset);pointer.addEventListener('change',reset);});
})();
