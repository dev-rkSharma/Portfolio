(function(){
 'use strict';
 var header=document.querySelector('.header'),nav=document.querySelector('.nav__list');if(!header||!nav)return;
 var labels={'#home':'Home','#projects':'Projects','#skills':'Skills','#experience':'Journey','#badges':'Badges','#about-me':'About','#contacts':'Contact'};
 var links=Array.from(nav.querySelectorAll('.nav__link'));
 links.forEach(function(link,index){
  var label=labels[link.getAttribute('href')];
  if(label)Array.from(link.childNodes).filter(function(n){return n.nodeType===3;}).forEach(function(n){if(n.textContent.trim())n.textContent=label;});
  link.parentElement.style.setProperty('--nav-index',index);
 });
 var progress=document.createElement('span');progress.className='nav-progress';progress.setAttribute('aria-hidden','true');header.appendChild(progress);
 var releaseTimer;
 function releaseSelection(){clearTimeout(releaseTimer);window.modernNavTarget=null;window.dispatchEvent(new Event('scroll'));}
 nav.addEventListener('click',function(event){var link=event.target.closest('.nav__link');if(!link)return;var href=link.getAttribute('href');if(!href||href.charAt(0)!=='#')return;window.modernNavTarget=href.slice(1);clearTimeout(releaseTimer);releaseTimer=setTimeout(releaseSelection,2200);window.dispatchEvent(new Event('scroll'));},true);
 window.addEventListener('scroll',function(){if(window.modernNavTarget){clearTimeout(releaseTimer);releaseTimer=setTimeout(releaseSelection,180);}},{passive:true});
 var queued=false;
 function update(){queued=false;var height=document.documentElement.scrollHeight-innerHeight;header.style.setProperty('--nav-progress',height>0?Math.min(1,Math.max(0,scrollY/height)):0);}
 function queue(){if(!queued){queued=true;requestAnimationFrame(update);}}
 window.addEventListener('scroll',queue,{passive:true});window.addEventListener('resize',queue);update();
 window.dispatchEvent(new Event('resize'));
})();
