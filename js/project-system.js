(function(){
 'use strict';
 var root=document.querySelector('.selected-work'),stories=window.PORTFOLIO_STORIES||{};if(!root)return;
 var grid=root.querySelector('.selected-work__grid'),cards=Array.from(grid.children),keys=['7','6','1'],active=0;
 function el(tag,cls,text){var e=document.createElement(tag);e.className=cls;if(text)e.textContent=text;return e;}
 root.classList.add('project-system');
 var nav=el('div','system-nav');nav.setAttribute('role','group');nav.setAttribute('aria-label','Explore project systems');
 var panel=el('section','system-panel');panel.setAttribute('aria-label','Selected project workflow');
 var label=el('p','system-kicker','Inside the system'),title=el('h4','system-title'),steps=el('ol','system-steps'),tools=el('ul','system-tools'),open=el('button','system-open','Open full case study ↗');open.type='button';
 panel.append(label,title,steps,tools,open);grid.before(nav);grid.after(panel);
 var buttons=cards.map(function(card,i){var b=el('button','system-tab','0'+(i+1)+' / '+stories[keys[i]].discipline);b.type='button';b.addEventListener('click',function(){select(i);if(matchMedia('(max-width:700px)').matches)card.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth',block:'nearest',inline:'center'});});nav.append(b);card.addEventListener('pointerenter',function(e){if(e.pointerType!=='touch')select(i);});card.addEventListener('focus',function(){select(i);});return b;});
 function select(i){active=i;var story=stories[keys[i]];cards.forEach(function(c,n){c.classList.toggle('system-active',n===i);});buttons.forEach(function(b,n){b.setAttribute('aria-pressed',String(n===i));});title.textContent=story.short;steps.replaceChildren();story.choices.forEach(function(choice,n){var li=el('li','system-step');li.append(el('span','system-step-number','0'+(n+1)),el('strong','',choice[0]),el('p','',choice[1]));steps.append(li);});tools.replaceChildren();var source=document.querySelector('#projects .card[data-project-key="'+keys[i]+'"]');if(source)source.querySelectorAll('.card__tech li').forEach(function(t){tools.append(el('li','',t.textContent.trim()));});}
 open.addEventListener('click',function(){document.dispatchEvent(new CustomEvent('portfolio:open-project',{detail:{key:keys[active],opener:open}}));});
 var pending=0;grid.addEventListener('scroll',function(){if(pending)return;pending=requestAnimationFrame(function(){pending=0;if(!matchMedia('(max-width:700px)').matches)return;var box=grid.getBoundingClientRect(),best=0,distance=Infinity;cards.forEach(function(c,i){var r=c.getBoundingClientRect(),d=Math.abs(r.left+r.width/2-box.left-box.width/2);if(d<distance){distance=d;best=i;}});if(best!==active)select(best);});},{passive:true});
 select(0);
})();
