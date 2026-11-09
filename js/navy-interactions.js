(function(){
 'use strict';
 if(!matchMedia('(hover:hover) and (pointer:fine)').matches||matchMedia('(prefers-reduced-motion:reduce)').matches)return;
 var glow=document.createElement('div');glow.className='navy-cursor-glow';glow.setAttribute('aria-hidden','true');document.body.appendChild(glow);
 var frame=0,x=0,y=0;
 document.addEventListener('pointermove',function(event){
  if(event.pointerType==='touch')return;x=event.clientX;y=event.clientY;
  if(!frame)frame=requestAnimationFrame(function(){frame=0;glow.style.setProperty('--cursor-x',x+'px');glow.style.setProperty('--cursor-y',y+'px');glow.classList.add('is-visible');});
 },{passive:true});
 function hide(){glow.classList.remove('is-visible');}
 document.documentElement.addEventListener('pointerleave',hide);window.addEventListener('blur',hide);
})();
