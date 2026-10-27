(function(){
  'use strict';
  var rail=document.querySelector('.certs--cards');if(!rail)return;
  var cards=Array.from(rail.children),motion=matchMedia('(prefers-reduced-motion: reduce)'),active=Math.min(1,rail.children.length-1),frame=0,pointerSelecting=false,settleTimer=0;
  rail.classList.add('cert-carousel');rail.setAttribute('aria-label','Certificates. Use left and right arrow keys to browse.');
  cards.forEach(function(card){
    var mark=document.createElement('span');mark.className='cert-preview__logo';mark.setAttribute('aria-hidden','true');
    var image=new Image();image.src=(window.PORTFOLIO_EXPERIENCE_LOGOS||{})['palantir.svg']||'assets/experience/palantir.svg';image.alt='';image.width=90;image.height=90;
    mark.append(image);card.querySelector('.cert-preview__image').append(mark);
  });
  var controls=document.createElement('div');controls.className='cert-carousel__controls';controls.setAttribute('role','group');controls.setAttribute('aria-label','Browse certificates');
  function button(label,text){var b=document.createElement('button');b.type='button';b.setAttribute('aria-label',label);b.textContent=text;return b;}
  var prev=button('Previous certificate','←'),next=button('Next certificate','→'),status=document.createElement('span');status.setAttribute('role','status');status.setAttribute('aria-live','polite');
  controls.append(prev,status,next);rail.after(controls);
  function select(index){active=index;cards.forEach(function(card,i){card.classList.toggle('is-centered',i===index);card.style.setProperty('--cert-angle',i<index?'8deg':i>index?'-8deg':'0deg');if(i===index)card.querySelector('a').setAttribute('aria-current','true');else card.querySelector('a').removeAttribute('aria-current');});prev.disabled=index===0;next.disabled=index===cards.length-1;status.textContent=String(index+1).padStart(2,'0')+' / '+String(cards.length).padStart(2,'0');}
  function center(index,instant){index=Math.max(0,Math.min(cards.length-1,index));var card=cards[index];rail.scrollTo({left:card.offsetLeft-(rail.clientWidth-card.offsetWidth)/2,behavior:instant||motion.matches?'instant':'smooth'});}
  function nearest(){frame=0;var midpoint=rail.getBoundingClientRect().left+rail.clientWidth/2,best=0,distance=Infinity;cards.forEach(function(card,i){var delta=Math.abs(rail.getBoundingClientRect().left+card.offsetLeft-rail.scrollLeft+card.offsetWidth/2-midpoint);if(delta<distance){distance=delta;best=i;}});if(best!==active)select(best);}
  rail.addEventListener('scroll',function(){if(!frame)frame=requestAnimationFrame(nearest);clearTimeout(settleTimer);settleTimer=setTimeout(function(){var target=cards[active].offsetLeft-(rail.clientWidth-cards[active].offsetWidth)/2;if(Math.abs(rail.scrollLeft-target)>1)center(active,true);},140);},{passive:true});
  prev.addEventListener('click',function(){center(active-1);});next.addEventListener('click',function(){center(active+1);});
  rail.addEventListener('keydown',function(e){if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();center(active+(e.key==='ArrowLeft'?-1:1));}});
  rail.addEventListener('pointerdown',function(){pointerSelecting=true;},{passive:true});
  rail.addEventListener('click',function(e){var card=e.target.closest('.certs--cards > li'),index=cards.indexOf(card);var centered=index>=0&&Math.abs(cards[index].offsetLeft-rail.scrollLeft-(rail.clientWidth-cards[index].offsetWidth)/2)<5;if(index>=0&&(!centered||index!==active)){e.preventDefault();center(index);}pointerSelecting=false;});
  rail.addEventListener('focusin',function(e){var index=cards.findIndex(function(card){return card.contains(e.target);});if(!pointerSelecting&&index>=0&&index!==active)center(index);});
  new ResizeObserver(function(){center(active,true);}).observe(rail);
  select(active);center(active,true);
})();
