(function(){
  'use strict';
  var cards=Array.from(document.querySelectorAll('#projects .card'));
  var stories=window.PORTFOLIO_STORIES||{};
  function make(tag,cls,text){var node=document.createElement(tag);if(cls)node.className=cls;if(text!==undefined)node.textContent=text;return node;}
  function title(card){return card.querySelector('.card__title').textContent.trim();}
  function open(card,opener){document.dispatchEvent(new CustomEvent('portfolio:open-project',{detail:{key:card.dataset.projectKey,opener:opener}}));}
  // Three editorial entry points into the existing project collection.
  var rail=document.querySelector('[data-rail]');
  if(rail){
    var selected=make('section','selected-work');selected.setAttribute('aria-labelledby','selected-work-title');
    selected.append(make('p','work-kicker','Three ways into the work'));
    var heading=make('h3','selected-work__title','Systems, from foundation to interface.');heading.id='selected-work-title';selected.append(heading);
    var grid=make('div','selected-work__grid');
    ['7','6','1'].forEach(function(key,i){var card=cards.find(function(c){return c.dataset.projectKey===key;});if(!card)return;
      var story=stories[key],button=make('button','selected-work__card');button.type='button';button.style.setProperty('--work-accent',getComputedStyle(card).getPropertyValue('--project-accent'));
      button.append(make('span','selected-work__number','0'+(i+1)),make('span','selected-work__discipline',story.discipline),make('span','selected-work__name',story.short));
      var foot=make('span','selected-work__action','Read the case study');var arrow=make('span','','↗');arrow.setAttribute('aria-hidden','true');foot.append(arrow);button.append(foot);
      button.setAttribute('aria-label','Read case study: '+title(card));button.addEventListener('click',function(){open(card,button);});grid.append(button);
    });selected.append(grid);rail.before(selected);
  }
  var figure=document.querySelector('#skills .section-figure');if(!figure)return;
  var root=make('section','work-explorer');root.setAttribute('aria-labelledby','work-explorer-title');
  var header=make('div','work-explorer__header'),intro=make('div');intro.append(make('p','work-kicker','Follow a skill into the work'));
  var h=make('h3','','What does this skill look like in practice?');h.id='work-explorer-title';intro.append(h,make('p','work-explorer__intro','Choose a skill, or tap a node in the map. Explore the projects and the contribution behind each connection.'));header.append(intro);
  var label=make('label','work-explorer__select','Explore a skill');var select=make('select');select.id='work-skill-select';select.append(new Option('Choose a skill',''));
  var names=new Set();document.querySelectorAll('#skills .skill-box__head,#skills .skill-box__body li').forEach(function(n){names.add(n.textContent.trim());});['Pipeline Builder','Workshop','AIP','Ontology','Python','Data Governance'].forEach(function(n){names.add(n);});
  Array.from(names).sort().forEach(function(n){select.append(new Option(n,n));});label.append(select);header.append(label);root.append(header);
  var quick=make('div','work-explorer__quick');quick.setAttribute('role','group');quick.setAttribute('aria-label','Frequently used skills');
  var shortcuts=['Ontology','AIP','Pipeline Builder','Python','Data Governance','Workshop'];
  shortcuts.forEach(function(name){var button=make('button','',name);button.type='button';button.setAttribute('aria-pressed','false');button.addEventListener('click',function(){choose(select.value===name?'':name);});quick.append(button);});
  root.append(quick);
  var status=make('p','work-explorer__status');status.setAttribute('role','status');status.setAttribute('aria-live','polite');status.setAttribute('aria-atomic','true');
  var results=make('div','work-explorer__results');root.append(status,results);figure.after(root);
  var aliases={'Palantir Foundry':['Ontology','Pipeline Builder','Workshop','Quiver','Foundry'],'Agentic AI':['AIP','LLM','AI Analyst'],'Data Engineering':['Pipeline Builder','Python','SQL','ETL'],'Analytics':['Quiver','Timeseries','AI Analyst'],'Governance':['governance','access-control'],'Programming':['Python','SQL','JavaScript','TypeScript'],'Pipeline Engineering':['Pipeline Builder','pipeline'],'Geospatial Analytics':['Geospatial Mapping','geohash'],'AIP Logic & Agents':['AIP Logic','agent'],'LLM Pipelines':['LLM'],'Data Modeling':['modeling'],'Access Controls':['access-control','access controls']};
  function normalize(s){return s.toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();}
  function match(card,name){if(!name)return true;var corpus=' '+normalize(Array.from(card.querySelectorAll('.card__tech li,.card__contribution')).map(function(n){return n.textContent;}).join(' '))+' ';return (aliases[name]||[name]).some(function(term){return corpus.includes(' '+normalize(term)+' ');});}
  window.portfolioSkillMatches=match;
  function render(name){
    select.value=name;quick.querySelectorAll('button').forEach(function(b){b.setAttribute('aria-pressed',String(b.textContent===name));});
    var matches=cards.filter(function(card){return match(card,name);});
    if(!name)matches=matches.slice(0,3);
    status.textContent=name?matches.length+' project'+(matches.length===1?'':'s')+' connected to '+name:'Start with these three project stories, or choose a skill to narrow the connections.';
    results.replaceChildren();
    if(!matches.length){results.append(make('p','work-explorer__empty','There is no public project detail tagged with this skill yet. Choose another skill to explore the published work.'));return;}
    matches.forEach(function(card){var key=card.dataset.projectKey,story=stories[key],button=make('button','work-explorer__result');button.type='button';button.style.setProperty('--work-accent',getComputedStyle(card).getPropertyValue('--project-accent'));
      var media=card.querySelector('.card__media img, .card__media svg'),art=make('span','work-explorer__art');if(media){var image=media.cloneNode(true);if(image.tagName==='IMG'){image.alt='';image.loading='lazy';image.width=240;image.height=136;}else image.setAttribute('aria-hidden','true');art.append(image);}button.append(art);
      var body=make('span','work-explorer__body');body.append(make('span','work-explorer__discipline',story?story.discipline:'Project'),make('span','work-explorer__name',title(card)));
      var contribution=card.querySelector('.card__contribution');if(contribution){var copy=contribution.cloneNode(true),strong=copy.querySelector('strong');if(strong)strong.remove();body.append(make('span','work-explorer__contribution',copy.textContent.trim()));}
      button.append(body);var arrow=make('span','work-explorer__arrow','↗');arrow.setAttribute('aria-hidden','true');button.append(arrow);button.addEventListener('click',function(){open(card,button);});results.append(button);
    });
  }
  function choose(name){document.dispatchEvent(new CustomEvent('portfolio:skill-select',{detail:{label:name}}));}
  select.addEventListener('change',function(){choose(select.value);});
  document.addEventListener('portfolio:skill-select',function(e){var name=e.detail.label||'';window.portfolioSelectedSkill=name;if(name&&!Array.from(select.options).some(function(o){return o.value===name;}))select.append(new Option(name,name));render(name);});
  render('');
})();
