(function(){
 'use strict';
 var names=['navy','ocean','forest','plum','copper','midnight'],current='navy',link=document.createElement('link');link.rel='stylesheet';link.id='portfolio-theme';
 function apply(name){if(!names.includes(name))return false;current=name;document.documentElement.dataset.palette=name;if(name==='navy'){link.removeAttribute('href');link.remove();}else{link.href='css/themes/'+name+'.css?v=20261109';document.head.appendChild(link);}try{localStorage.setItem('portfolio-theme',name);}catch(e){}return true;}
 window.portfolioThemeCommand=function(args){var name=args[0];if(!name||name==='list')return ['Current theme: '+current,'Available: '+names.join(' | '),'Apply: theme forest','Reset: theme reset'];if(name==='reset')name='navy';if(!apply(name))return ['Unknown theme. Type theme list to see the available palettes.'];return ['Theme applied: '+current+'. Your choice is saved in this browser.'];};
 try{var saved=localStorage.getItem('portfolio-theme');if(names.includes(saved))apply(saved);}catch(e){}
})();
