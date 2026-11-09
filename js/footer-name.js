(function(){
 'use strict';
 var name=document.querySelector('.footer-wordmark');
 if(!name||!window.IntersectionObserver)return;
 var motion=matchMedia('(prefers-reduced-motion:reduce)');if(motion.matches)return;
 var played=false,canvas=null,frame=0,timer=0,finished=false;
 function finish(){
  if(finished)return;finished=true;cancelAnimationFrame(frame);clearTimeout(timer);
  name.classList.remove('is-dot-forming');name.dataset.dotState='complete';
  if(canvas){var old=canvas;old.style.opacity='0';setTimeout(function(){old.remove();},320);}
  window.removeEventListener('resize',finish);document.removeEventListener('visibilitychange',onVisibility);motion.removeEventListener('change',finish);
 }
 function onVisibility(){if(document.hidden)finish();}
 function form(){
  if(motion.matches){finish();return;}
  var rect=name.getBoundingClientRect(),style=getComputedStyle(name),w=rect.width,h=rect.height;
  if(!w||!h){finish();return;}
  var mask=document.createElement('canvas');mask.width=Math.ceil(w);mask.height=Math.ceil(h);
  var ink=mask.getContext('2d');if(!ink){finish();return;}
  ink.font=style.fontWeight+' '+style.fontSize+' '+style.fontFamily;
  if('letterSpacing' in ink)ink.letterSpacing=style.letterSpacing;
  var metrics=ink.measureText(name.textContent.trim()),ascent=metrics.actualBoundingBoxAscent,descent=metrics.actualBoundingBoxDescent;
  ink.fillStyle='#fff';ink.fillText(name.textContent.trim(),0,(h+ascent-descent)/2);
  var pixels=ink.getImageData(0,0,mask.width,mask.height).data,points=[],step=w<600?2:4;
  for(var y=0;y<h;y+=step)for(var x=0;x<w;x+=step){if(pixels[(y*mask.width+x)*4+3]>150)points.push({x:x,y:y+40});}
  if(!points.length){finish();return;}
  var stride=Math.max(1,Math.ceil(points.length/2400));points=points.filter(function(_,i){return i%stride===0;});
  points.forEach(function(p,i){p.sx=((i*97.37)%w);p.sy=((i*61.73)%(h+80));p.delay=(p.x/w)*420+(i%7)*12;});
  canvas=document.createElement('canvas');canvas.className='footer-name-dots';canvas.setAttribute('aria-hidden','true');
  var dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.ceil(w*dpr);canvas.height=Math.ceil((h+80)*dpr);
  var ctx=canvas.getContext('2d');if(!ctx){finish();return;}ctx.scale(dpr,dpr);
  name.appendChild(canvas);name.classList.add('is-dot-forming');name.dataset.dotState='forming';
  var start=performance.now();
  function draw(now){
   if(finished)return;var elapsed=now-start;ctx.clearRect(0,0,w,h+80);
   points.forEach(function(p){var t=Math.max(0,Math.min(1,(elapsed-p.delay)/1050)),ease=1-Math.pow(1-t,3);
    ctx.globalAlpha=Math.min(1,t*5)*.6;ctx.fillStyle=window.portfolioThemeSurface||'#fff';ctx.beginPath();
    ctx.arc(p.sx+(p.x-p.sx)*ease,p.sy+(p.y-p.sy)*ease,t<1?1.35:1.05,0,Math.PI*2);ctx.fill();
   });
   if(elapsed>=1850){finish();return;}frame=requestAnimationFrame(draw);
  }
  frame=requestAnimationFrame(draw);timer=setTimeout(finish,3200);
  window.addEventListener('resize',finish);document.addEventListener('visibilitychange',onVisibility);motion.addEventListener('change',finish);
 }
 var observer=new IntersectionObserver(function(entries){
  if(played||!entries.some(function(e){return e.isIntersecting&&e.intersectionRatio>=.35;}))return;
  played=true;observer.disconnect();
  Promise.race([document.fonts?document.fonts.ready:Promise.resolve(),new Promise(function(resolve){setTimeout(resolve,500);})]).then(form).catch(finish);
 },{threshold:.35});observer.observe(name);
})();
