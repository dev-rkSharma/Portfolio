(function(){
 'use strict';
 var motion=matchMedia('(prefers-reduced-motion:reduce)'),fine=matchMedia('(hover:hover) and (pointer:fine)');
 document.querySelectorAll('.selected-work__card').forEach(function(card,index){
  var preview=document.createElement('span');preview.className='project-peek';preview.setAttribute('aria-hidden','true');
  var img=document.createElement('img');img.src='assets/project-'+['7','6','1'][index]+'.svg';img.alt='';img.loading='lazy';img.width=600;img.height=340;preview.appendChild(img);
  card.insertBefore(preview,card.querySelector('.selected-work__action'));
  var frame=0,tx=0,ty=0,x=0,y=0;
  function draw(){frame=0;if(motion.matches||!fine.matches){card.style.transform='';return;}x+=(tx-x)*.18;y+=(ty-y)*.18;
   if(Math.abs(x-tx)<.02&&Math.abs(y-ty)<.02){x=tx;y=ty;}
   card.style.transform=x||y?'perspective(1000px) rotateX('+(-y*4)+'deg) rotateY('+(x*4)+'deg)':'';
   if(x!==tx||y!==ty)frame=requestAnimationFrame(draw);
  }
  function move(event){if(!fine.matches||motion.matches||event.pointerType==='touch')return;var r=card.getBoundingClientRect();tx=Math.max(-.5,Math.min(.5,(event.clientX-r.left)/r.width-.5));ty=Math.max(-.5,Math.min(.5,(event.clientY-r.top)/r.height-.5));if(!frame)frame=requestAnimationFrame(draw);}
  function reset(){tx=ty=0;if(!frame)frame=requestAnimationFrame(draw);}
  card.addEventListener('pointermove',move,{passive:true});card.addEventListener('pointerleave',reset);card.addEventListener('blur',reset);
  motion.addEventListener('change',reset);fine.addEventListener('change',reset);
 });
})();
(function(){
 'use strict';
 var motion=matchMedia('(prefers-reduced-motion:reduce)'),sections=[];
 document.querySelectorAll('main .section:not(#experience)').forEach(function(section){
  var rule=section.querySelector('.section-head__rule');if(!rule)return;
  rule.classList.add('chapter-connection');rule.setAttribute('aria-hidden','true');
  rule.innerHTML='<svg viewBox="0 0 320 24" preserveAspectRatio="none" aria-hidden="true"><path class="connection-track" d="M0 12H36L48 4H272L284 12H320"/><path class="connection-signal" pathLength="100" d="M0 12H36L48 4H272L284 12H320"/><circle cx="36" cy="12" r="2.5"/><circle cx="284" cy="12" r="2.5"/></svg>';
  sections.push({section:section,rule:rule});
 });
 var frame=0;
 function paint(){frame=0;sections.forEach(function(item){var rect=item.section.getBoundingClientRect(),active=rect.top<innerHeight*.8&&rect.bottom>innerHeight*.2;
  item.section.classList.toggle('chapter-in-view',active);
  var progress=motion.matches?1:Math.max(0,Math.min(1,(innerHeight*.85-rect.top)/(innerHeight*.7)));
  item.rule.style.setProperty('--connection-offset',(100-progress*100).toFixed(2));
 });}
 function queue(){if(!frame)frame=requestAnimationFrame(paint);}
 window.addEventListener('scroll',queue,{passive:true});window.addEventListener('resize',queue);motion.addEventListener('change',queue);paint();
})();
(function(){
 'use strict';
 var motion=matchMedia('(prefers-reduced-motion:reduce)');
 document.querySelectorAll('.btn,.footer-top').forEach(function(button){button.classList.add('tactile-button');});
 document.addEventListener('pointerdown',function(event){
  var button=event.target.closest('.btn,.footer-top');if(!button||motion.matches)return;
  button.classList.add('tactile-button');
  var rect=button.getBoundingClientRect(),size=Math.max(rect.width,rect.height)*2;
  var ripple=document.createElement('span');ripple.className='button-ripple';ripple.setAttribute('aria-hidden','true');
  ripple.style.width=ripple.style.height=size+'px';ripple.style.left=(event.clientX-rect.left-size/2)+'px';ripple.style.top=(event.clientY-rect.top-size/2)+'px';button.appendChild(ripple);
  var animation=ripple.animate([{transform:'scale(0)',opacity:.35},{transform:'scale(1)',opacity:0}],{duration:550,easing:'cubic-bezier(.2,.7,.2,1)'});
  var cleanup=setTimeout(function(){animation.cancel();ripple.remove();},800);
  animation.finished.then(function(){clearTimeout(cleanup);ripple.remove();},function(){clearTimeout(cleanup);ripple.remove();});
 },{passive:true});
})();
