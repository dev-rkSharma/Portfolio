(function(){
 'use strict';
 document.querySelectorAll('main .section[id]').forEach(function(section){var heading=section.querySelector('.section-title'),link=document.querySelector('.header .nav__link[href="#'+section.id+'"]'),icon=link&&link.querySelector('.nav-icon');if(!heading||!icon||heading.querySelector('.section-heading-icon'))return;var copy=icon.cloneNode(true);copy.classList.add('section-heading-icon');var hash=heading.querySelector('.hash');if(hash)hash.replaceWith(copy);else heading.prepend(copy);});
 var motion=matchMedia('(prefers-reduced-motion:reduce)');if(motion.matches||!window.IntersectionObserver)return;
 var observer=new IntersectionObserver(function(entries){entries.forEach(function(entry){if(!entry.isIntersecting)return;observer.unobserve(entry.target);var card=entry.target;card.dataset.borderGlint='played';if(motion.matches)return;var blade=document.createElement('span');blade.className='card-border-blade';blade.setAttribute('aria-hidden','true');card.append(blade);blade.addEventListener('animationend',function(){blade.remove();},{once:true});setTimeout(function(){blade.remove();},1800);});},{threshold:.18});
 document.querySelectorAll('.selected-work__card,#projects .card,.skill-box,.cert-preview,.badge-tile,.kpi-grid .stat,.about-panel,.contact-composer,.work-explorer__result').forEach(function(card){card.classList.add('glint-card');observer.observe(card);});
 motion.addEventListener('change',function(e){if(e.matches)document.querySelectorAll('.card-border-blade').forEach(function(b){b.remove();});});
})();
