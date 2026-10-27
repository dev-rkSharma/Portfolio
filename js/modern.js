/* The network is decorative. Existing content and interactions work without it. */
(function () {
  'use strict';
  // Add visual framing without changing the authored project descriptions.
  document.querySelectorAll('.card').forEach(function (card) {
    if (card.querySelector('.card__preview-bar')) return;
    var media = card.querySelector('.card__media');
    var body = card.querySelector('.card__body');
    if (!media || !body) return;
    var image = media.querySelector('img');
    var match = image && image.getAttribute('src').match(/project-(\d+)/);
    var number = match ? match[1].padStart(2, '0') : '';
    var palettes = { '01': ['#b49aff','#b49aff20'], '02': ['#75d9ed','#75d9ed20'], '03': ['#daa1e8','#daa1e820'], '04': ['#e5bd8b','#e5bd8b20'], '05': ['#82d6b0','#82d6b020'], '06': ['#a49aff','#a49aff20'], '07': ['#83dfd5','#83dfd520'], '08': ['#88d9bd','#88d9bd20'] };
    var palette = palettes[number] || palettes['01'];
    card.style.setProperty('--project-accent', palette[0]);
    card.style.setProperty('--project-tint', palette[1]);
    var bar = document.createElement('div');
    bar.className = 'card__preview-bar';
    bar.setAttribute('aria-hidden', 'true');
    var label = document.createElement('span');
    label.textContent = 'PROJECT' + (number ? ' / ' + number : '');
    var dots = document.createElement('span');
    dots.className = 'card__preview-dots';
    for (var i = 0; i < 3; i++) dots.appendChild(document.createElement('i'));
    bar.append(label, dots);
    media.appendChild(bar);
    if (card.classList.contains('is-openable')) {
      var footer = document.createElement('div');
      footer.className = 'card__footer';
      footer.setAttribute('aria-hidden', 'true');
      var action = document.createElement('span');
      action.textContent = 'View case study';
      var arrow = document.createElement('span');
      arrow.className = 'card__arrow';
      arrow.textContent = '\u2197';
      footer.append(action, arrow);
      body.appendChild(footer);
    }
  });

  // One shared portrait treatment for every profile photo, including About.
  var portraitMotion = matchMedia('(prefers-reduced-motion: reduce)');
  var portraitPointer = matchMedia('(hover: hover) and (pointer: fine)');
  document.querySelectorAll('img[src$="profile.png"], .hero__img').forEach(function (photo) {
    if (photo.closest('.portrait-3d')) return;
    var shell = photo.closest('.portrait-shell');
    if (!shell) {
      shell = document.createElement('div');
      shell.className = 'portrait-shell';
      photo.before(shell);
    }
    shell.classList.add('portrait-3d');
    photo.classList.add('portrait-photo');
    var layer = document.createElement('div');
    layer.className = 'portrait-photo-layer';
    shell.appendChild(layer);
    layer.appendChild(photo);
    if (!shell.querySelector('.portrait-signature')) {
      var signature = document.createElement('span');
      signature.className = 'portrait-signature';
      signature.textContent = 'ROUSHAN KUMAR';
      signature.setAttribute('aria-hidden', 'true');
      shell.appendChild(signature);
    }
    var frame = 0;
    function reset() {
      cancelAnimationFrame(frame);
      ['--portrait-rx', '--portrait-ry', '--shine-x', '--shine-y', '--shine-opacity'].forEach(function (name) { shell.style.removeProperty(name); });
    }
    shell.addEventListener('pointermove', function (event) {
      if (portraitMotion.matches || !portraitPointer.matches) return;
      cancelAnimationFrame(frame);
      var px = event.clientX, py = event.clientY;
      frame = requestAnimationFrame(function () {
        var rect = shell.getBoundingClientRect();
        var x = Math.max(0, Math.min(1, (px - rect.left) / rect.width));
        var y = Math.max(0, Math.min(1, (py - rect.top) / rect.height));
        shell.style.setProperty('--portrait-rx', ((.5 - y) * 12).toFixed(2) + 'deg');
        shell.style.setProperty('--portrait-ry', ((x - .5) * 16).toFixed(2) + 'deg');
        shell.style.setProperty('--shine-x', (x * 100) + '%');
        shell.style.setProperty('--shine-y', (y * 100) + '%');
        shell.style.setProperty('--shine-opacity', '.65');
      });
    });
    shell.addEventListener('pointerleave', reset);
    shell.addEventListener('pointercancel', reset);
    portraitMotion.addEventListener('change', reset);
    portraitPointer.addEventListener('change', reset);
    window.addEventListener('blur', reset);
  });

  var visual = document.querySelector('.hero__visual');
  if (!visual) return;
  var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 520 520');
  svg.setAttribute('class', 'network');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  var points = [[70,160],[420,100],[460,320],[100,410],[260,35],[260,475]];
  var markup = '<circle class="network__orbit" cx="260" cy="260" r="177"/><circle class="network__orbit network__orbit--outer" cx="260" cy="260" r="230"/><ellipse class="network__orbit" cx="260" cy="260" rx="230" ry="100" transform="rotate(-35 260 260)"/>';
  points.forEach(function (p, i) {
    var path = 'M' + p[0] + ',' + p[1] + ' Q260,' + (i % 2 ? 100 : 420) + ' 260,260';
    markup += '<g class="network__group"><path class="network__line" d="' + path + '"/><path class="network__pulse" pathLength="100" style="animation-delay:-' + i + 's" d="' + path + '"/><circle class="network__node" cx="' + p[0] + '" cy="' + p[1] + '" r="12"/><circle class="network__core" cx="' + p[0] + '" cy="' + p[1] + '" r="3"/></g>';
  });
  markup += '<text class="network__label" x="310" y="47">CONNECTED INTELLIGENCE</text>';
  svg.innerHTML = markup;
  visual.prepend(svg);
  ['ONTOLOGY / CONNECTED', 'AIP / AGENTIC SYSTEMS'].forEach(function (label, i) {
    var tag = document.createElement('span');
    tag.className = 'orbit-tag orbit-tag--' + (i ? 'b' : 'a');
    tag.textContent = label;
    tag.setAttribute('aria-hidden', 'true');
    visual.appendChild(tag);
  });
  var motion = matchMedia('(prefers-reduced-motion: reduce)');
  var fine = matchMedia('(hover: hover) and (pointer: fine)');
  var frame = 0;
  visual.addEventListener('pointermove', function (event) {
    if (motion.matches || !fine.matches) return;
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(function () {
      var rect = visual.getBoundingClientRect();
      var x = (event.clientX - rect.left) / rect.width - .5;
      var y = (event.clientY - rect.top) / rect.height - .5;
      svg.style.transform = 'perspective(800px) rotateY(' + x * 9 + 'deg) rotateX(' + -y * 9 + 'deg)';
    });
  });
  function reset() { cancelAnimationFrame(frame); svg.style.transform = ''; }
  visual.addEventListener('pointerleave', reset);
  motion.addEventListener('change', reset);
  // Pause decorative loops when the hero is offscreen or the tab is hidden.
  var visible = true;
  function pause() {
    visual.querySelectorAll('.network__orbit--outer, .network__pulse, .orbit-tag').forEach(function (node) {
      node.style.animationPlayState = visible && !document.hidden ? 'running' : 'paused';
    });
  }
  if ('IntersectionObserver' in window) new IntersectionObserver(function (entries) { visible = entries[0].isIntersecting; pause(); }).observe(visual);
  document.addEventListener('visibilitychange', pause);
})();

/* Decorative smoke stays behind content and sleeps outside the viewport. */
(function () {
  'use strict';
  var hero = document.querySelector('.hero');
  if (!hero || hero.querySelector('.hero-atmosphere')) return;
  var layer = document.createElement('div');
  layer.className = 'hero-atmosphere';
  layer.setAttribute('aria-hidden', 'true');
  for (var i = 0; i < 3; i++) {
    var wisp = document.createElement('span');
    wisp.className = 'hero-atmosphere__wisp';
    layer.appendChild(wisp);
  }
  hero.prepend(layer);
  var button = document.createElement('button');
  button.type = 'button';
  button.className = 'atmosphere-toggle';
  button.textContent = 'Pause atmosphere';
  button.setAttribute('aria-label', 'Pause atmosphere');
  button.setAttribute('aria-pressed', 'false');
  hero.appendChild(button);
  var paused = false;
  var visible = true;
  function sync() {
    hero.classList.toggle('atmosphere-paused', paused || !visible || document.hidden);
  }
  button.addEventListener('click', function () {
    paused = !paused;
    button.setAttribute('aria-pressed', String(paused));
    button.textContent = paused ? 'Resume atmosphere' : 'Pause atmosphere';
    sync();
  });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      sync();
    }).observe(hero);
  }
  document.addEventListener('visibilitychange', sync);
  sync();
})();

﻿/* Cursor smoke: cached replacement with a single quiet cursor spotlight. */
(function () {
  'use strict';
  if (document.querySelector('.cursor-smoke')) return;
  var motion = matchMedia('(prefers-reduced-motion: reduce)');
  var pointer = matchMedia('(hover: hover) and (pointer: fine)');
  var canvas = document.createElement('canvas');
  canvas.className = 'cursor-smoke';
  canvas.setAttribute('aria-hidden', 'true');
  var ctx = canvas.getContext('2d');
  if (!ctx) return;
  var x = 0, y = 0, targetX = 0, targetY = 0;
  var lastMove = 0, lastFrame = 0, frame = 0, active = false;
  function enabled() { return !motion.matches && pointer.matches && !document.hidden; }
  function clear() {
    cancelAnimationFrame(frame);
    frame = 0; lastFrame = 0; active = false;
    ctx.clearRect(0, 0, innerWidth, innerHeight);
  }
  function resize() {
    clear();
    var dpr = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(innerWidth * dpr);
    canvas.height = Math.round(innerHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function sync() {
    clear();
    if (enabled()) {
      if (!canvas.isConnected) document.body.appendChild(canvas);
      document.body.classList.add('has-cursor-smoke');
      resize();
    } else {
      canvas.remove();
      document.body.classList.remove('has-cursor-smoke');
    }
  }
  function draw(now) {
    var dt = Math.min(now - (lastFrame || now - 16), 50);
    lastFrame = now;
    var ease = 1 - Math.exp(-dt / 45);
    x += (targetX - x) * ease;
    y += (targetY - y) * ease;
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    var alpha = Math.max(0, 1 - Math.max(0, now - lastMove - 150) / 500);
    if (!alpha) { frame = 0; lastFrame = 0; active = false; return; }
    var light = ctx.createRadialGradient(x, y, 0, x, y, 100);
    light.addColorStop(0, 'rgba(171,207,255,' + (.12 * alpha) + ')');
    light.addColorStop(.35, 'rgba(171,184,255,' + (.055 * alpha) + ')');
    light.addColorStop(1, 'rgba(171,184,255,0)');
    ctx.fillStyle = light;
    ctx.fillRect(x - 100, y - 100, 200, 200);
    frame = requestAnimationFrame(draw);
  }
  document.addEventListener('pointermove', function (event) {
    if (!enabled() || event.pointerType === 'touch') return;
    targetX = event.clientX; targetY = event.clientY;
    if (!active) { x = targetX; y = targetY; active = true; }
    lastMove = performance.now();
    if (!frame) frame = requestAnimationFrame(draw);
  }, { passive: true });
  document.documentElement.addEventListener('pointerleave', clear);
  window.addEventListener('blur', clear);
  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', sync);
  motion.addEventListener('change', sync);
  pointer.addEventListener('change', sync);
  sync();
})();

/* Fine grid background with a restrained cursor glow. */
(function () {
  'use strict';
  if (document.querySelector('.grid-background')) return;
  var canvas = document.createElement('canvas');
  canvas.className = 'fracture-background grid-background';
  canvas.setAttribute('aria-hidden','true');
  var ctx=canvas.getContext('2d');
  if(!ctx)return;
  document.body.prepend(canvas);
  var base=document.createElement('canvas'),lit=document.createElement('canvas');
  var spot=document.createElement('canvas');spot.width=spot.height=360;
  var spotCtx=spot.getContext('2d');
  var motion=matchMedia('(prefers-reduced-motion: reduce)');
  var fine=matchMedia('(hover: hover) and (pointer: fine)');
  var pointer=null,frame=0,timer;
  function paint(){
    frame=0;
    ctx.clearRect(0,0,innerWidth,innerHeight);
    ctx.drawImage(base,0,0,innerWidth,innerHeight);
    if(!pointer||motion.matches||!fine.matches||document.hidden)return;
    var x=pointer.x-180,y=pointer.y-180;
    spotCtx.globalCompositeOperation='source-over';
    spotCtx.clearRect(0,0,360,360);
    spotCtx.drawImage(lit,-x,-y,innerWidth,innerHeight);
    var mask=spotCtx.createRadialGradient(180,180,0,180,180,180);
    mask.addColorStop(0,'#000');mask.addColorStop(.4,'rgba(0,0,0,.65)');mask.addColorStop(1,'transparent');
    spotCtx.globalCompositeOperation='destination-in';spotCtx.fillStyle=mask;spotCtx.fillRect(0,0,360,360);
    ctx.drawImage(spot,x,y);
  }
  function schedule(){if(!frame)frame=requestAnimationFrame(paint);}
  function render(){
    var w=innerWidth,h=innerHeight,dpr=Math.min(devicePixelRatio||1,1.5);
    [canvas,base,lit].forEach(function(c){c.width=Math.round(w*dpr);c.height=Math.round(h*dpr);});
    ctx.setTransform(dpr,0,0,dpr,0,0);
    var normal=base.getContext('2d'),bright=lit.getContext('2d');
    normal.setTransform(dpr,0,0,dpr,0,0);bright.setTransform(dpr,0,0,dpr,0,0);
    var spacing=32,path=new Path2D();
    for(var x=0;x<=w;x+=spacing){path.moveTo(x,0);path.lineTo(x,h);}
    for(var y=0;y<=h;y+=spacing){path.moveTo(0,y);path.lineTo(w,y);}
    normal.strokeStyle='rgba(170,157,222,.065)';normal.lineWidth=.6;normal.stroke(path);
    var tint=bright.createLinearGradient(0,0,w,h);
    tint.addColorStop(0,'rgba(180,154,255,.55)');tint.addColorStop(1,'rgba(102,226,220,.5)');
    bright.strokeStyle='rgba(180,154,255,.055)';bright.lineWidth=5;bright.stroke(path);
    bright.strokeStyle=tint;bright.lineWidth=.8;bright.stroke(path);
    paint();
  }
  document.addEventListener('pointermove',function(e){
    if(e.pointerType==='touch'||motion.matches||!fine.matches)return;
    pointer={x:e.clientX,y:e.clientY};schedule();
  },{passive:true});
  function reset(){pointer=null;schedule();}
  document.documentElement.addEventListener('pointerleave',reset);
  window.addEventListener('blur',reset);
  document.addEventListener('visibilitychange',reset);
  motion.addEventListener('change',reset);fine.addEventListener('change',reset);
  window.addEventListener('resize',function(){clearTimeout(timer);timer=setTimeout(render,120);});
  render();
})();

/* Scroll choreography: randomized throws with continuous damped settling. */
(function () {
  'use strict';
  if (!('IntersectionObserver' in window) || !Element.prototype.animate) return;
  var motion=matchMedia('(prefers-reduced-motion: reduce)');
  var selector='main .section-head, main .stat, main .card:not(.proj-rail .card), main .skill-box, main .badge-group, main .badge-more, main .certs--cards > li, main .milestone__card, main .about__content, main .contacts__copy, main .contact-composer, main .contacts__box';
  var nodes=Array.from(document.querySelectorAll(selector)),seen=new WeakSet(),animations=new Map();
  document.body.classList.add('scroll-motion');
  nodes.forEach(function(node){node.classList.add('scroll-component');});
  function finish(node){var animation=animations.get(node);if(animation){animation.cancel();animations.delete(node);}node.classList.remove('is-arriving');}
  function reveal(node){
    if(seen.has(node))return;seen.add(node);observer.unobserve(node);
    if(motion.matches||node.contains(document.activeElement))return;
    var siblings=Array.from(node.parentElement.children).filter(function(child){return child.matches(selector);});
    var index=Math.max(0,siblings.indexOf(node));
    var card=!node.matches('.section-head,.contacts__copy');
    var side=Math.random()<.5?-1:1,small=innerWidth<900,rect=node.getBoundingClientRect();
    var margin=30+Math.random()*50;
    var x=card?(side<0?-rect.right-margin:innerWidth-rect.left+margin):0;
    var y=card?18+Math.random()*40:32,angle=card?side*(small?2+Math.random()*2:3+Math.random()*4):0;
    // Sample a damped spring so position, rotation and scale settle continuously.
    // No intermediate easing boundaries or repeated bounces.
    var frames=[];
    for(var step=0;step<=60;step++){
      var t=step/60,remaining=step===60?0:Math.exp(-8*t)*(Math.cos(6*t)+(8/6)*Math.sin(6*t));
      frames.push({opacity:Math.min(1,t*7),translate:(x*remaining).toFixed(3)+'px '+(y*remaining).toFixed(3)+'px',rotate:(angle*remaining).toFixed(3)+'deg',scale:String(1-(card?.045:.02)*remaining),transform:card?'perspective(1100px) translateZ('+(-remaining*(small?100:220)).toFixed(3)+'px) rotateX('+(remaining*(small?8:14)).toFixed(3)+'deg) rotateY('+(-side*remaining*(small?12:24)).toFixed(3)+'deg)':'none',offset:t});
    }
    node.classList.add('is-arriving');
    var animation=node.animate(frames,{duration:card?(small?1050:1250)+Math.random()*140:750,delay:card?Math.min(index,3)*45+Math.random()*40:0,easing:'linear',fill:'backwards'});
    animations.set(node,animation);
    animation.onfinish=function(){animations.delete(node);node.classList.remove('is-arriving');};
  }
  var observer=new IntersectionObserver(function(entries){entries.forEach(function(entry){if(entry.isIntersecting)reveal(entry.target);});},{threshold:0,rootMargin:'0px 0px -45px 0px'});
  nodes.forEach(function(node){observer.observe(node);});
  ['focusin','pointerdown'].forEach(function(type){document.addEventListener(type,function(event){var node=event.target.closest('.scroll-component');if(node)finish(node);});});
  function reset(){Array.from(animations.keys()).forEach(finish);}
  motion.addEventListener('change',reset);document.addEventListener('visibilitychange',function(){if(document.hidden)reset();});
})();



/* Polished standing workstation: fitted clothing, contact shadows, responsive camera. */
(function(){
 'use strict';
 var visual=document.querySelector('.hero__visual');if(!visual || visual.hasAttribute('data-hero-photo'))return;
 function script(src){return new Promise(function(resolve,reject){var s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=reject;document.head.appendChild(s);});}
 // Load the optional scene after the page, only while its hero is nearby.
 var requested=false,ready=false,near=false;
 function loadScene(){
  if(requested||!ready||!near||document.hidden)return;
  requested=true;
  Promise.resolve().then(function(){if(!window.THREE)return script('js/vendor/three.min.js');}).then(function(){return script('js/vendor/GLTFLoader.js');}).then(init).catch(function(){/* The portrait remains visible on failure. */});
 }
 var loadObserver=new IntersectionObserver(function(entries){near=entries[0].isIntersecting;loadScene();},{rootMargin:'100px'});loadObserver.observe(visual);
 function afterLoad(){setTimeout(function(){var idle=window.requestIdleCallback||function(fn){setTimeout(fn,0);};idle(function(){ready=true;loadScene();},{timeout:2000});},1400);}
 if(document.readyState!=='loading')afterLoad();else document.addEventListener('DOMContentLoaded',afterLoad,{once:true});
 document.addEventListener('visibilitychange',loadScene);

 function init(){
  var T=window.THREE,loader=new T.GLTFLoader();
  function parse(file){return new Promise(function(resolve,reject){loader.load(file,resolve,undefined,reject);});}
  // Local file previews cannot fetch GLB files because of browser CORS rules.
  // A script-wrapped copy works locally; hosted pages keep the smaller binaries.
  function localModels(){
   return script('assets/character/human-data.js').then(function(){
    function decode(text){var raw=atob(text),bytes=new Uint8Array(raw.length);for(var i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);return bytes.buffer;}
    function embedded(text){return new Promise(function(resolve,reject){loader.parse(decode(text),'',resolve,reject);});}
    return Promise.all([embedded(window.PORTFOLIO_HUMAN.model),embedded(window.PORTFOLIO_HUMAN.idle)]);
   });
  }
  var models=location.protocol==='file:'?localModels():Promise.all([parse('assets/character/human.glb'),parse('assets/character/idle.glb')]).catch(localModels);
  models.then(function(results){build(results[0],results[1]);}).catch(function(error){console.warn('Workstation unavailable:',error);});
  function build(gltf,idle){
   var renderer;try{renderer=new T.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});}catch(e){return;}
   renderer.setPixelRatio(Math.min(devicePixelRatio||1,innerWidth<900?1:1.5));renderer.outputEncoding=T.sRGBEncoding;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1;
   renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
   var stage=document.createElement('div');stage.className='character-stage human-character';stage.appendChild(renderer.domElement);
   renderer.domElement.setAttribute('role','img');renderer.domElement.setAttribute('aria-label','Developer seated in an office chair at an aligned dual-monitor workstation, waving hello and returning to work');
   var label=document.createElement('a');label.className='character-label';label.textContent='Avatar by Ready Player Me';label.href='https://github.com/readyplayerme/visage';label.target='_blank';label.rel='noopener';stage.appendChild(label);
   var controls=document.createElement('div');controls.className='character-controls';
   var hello=document.createElement('button');hello.type='button';hello.textContent='Say hi again';
   var pause=document.createElement('button');pause.type='button';pause.textContent='Pause';pause.setAttribute('aria-pressed','false');
   var greeting=document.createElement('span');greeting.className='character-greeting';greeting.textContent='Hi, I?m Roushan!';greeting.setAttribute('role','status');greeting.hidden=true;stage.appendChild(greeting);controls.append(hello,pause);stage.appendChild(controls);visual.prepend(stage);visual.classList.add('has-character');
   var scene=new T.Scene(),camera=new T.PerspectiveCamera(32,1,.1,100);
   camera.position.set(3,2.35,4.8);camera.lookAt(0,.95,0);
   scene.add(new T.HemisphereLight(0xe8edff,0x293044,.85));
   function light(color,power,x,y,z){var l=new T.DirectionalLight(color,power);l.position.set(x,y,z);if(power>1){l.castShadow=true;l.shadow.mapSize.set(1024,1024);l.shadow.camera.left=-2;l.shadow.camera.right=2;l.shadow.camera.top=3;l.shadow.camera.bottom=-2;l.shadow.camera.near=.1;l.shadow.camera.far=12;l.shadow.bias=-.0004;l.shadow.normalBias=.015;l.shadow.radius=3;}scene.add(l);}
   light(0xffecdc,1.25,-2,3,4);light(0xbaaaff,.65,2,2,-2);light(0x92ded8,.4,-2,1,-1);
   var person=gltf.scene;scene.add(person);
   var bounds=new T.Box3().setFromObject(person),height=bounds.max.y-bounds.min.y;
   var scale=1.85/height;person.scale.setScalar(scale);person.position.y=-bounds.min.y*scale;
   person.rotation.set(0,0,0);person.position.y-=.28;person.position.x=.65;person.position.z=-.5;
   person.traverse(function(n){if(n.isMesh){n.frustumCulled=false;if(n.material){n.material.envMapIntensity=.3;}}});
   // Replace the distressed clothing textures with quiet, professional fabrics.
   person.traverse(function(n){if(!n.isMesh)return;
    if(/Outfit_Top/.test(n.name))n.visible=false;
    if(/Outfit_Bottom|Outfit_Footwear/.test(n.name))n.visible=false;
   });
   var floor=new T.Mesh(new T.CircleGeometry(1.85,80),new T.ShadowMaterial({color:0x02040a,opacity:.35}));floor.rotation.x=-Math.PI/2;floor.position.y=.003;floor.receiveShadow=true;scene.add(floor);
   function material(color,rough,metal){return new T.MeshStandardMaterial({color:new T.Color(color).convertSRGBToLinear(),roughness:rough===undefined?.5:rough,metalness:metal||0});}
   var desktop=material(0x172332,.32,.4),frameMat=material(0x313f54,.3,.65),dark=material(0x0a101a,.5),accent=new T.MeshBasicMaterial({color:0x8bcac9});
   function box(parent,mat,x,y,z,w,h,d){var mesh=new T.Mesh(new T.BoxGeometry(w,h,d),mat);mesh.position.set(x,y,z);parent.add(mesh);return mesh;}
   var shirtMat=material(0x101c30,.95),cuffMat=material(0x9baabd,.85);
   var outfit=new T.Group();outfit.position.copy(person.position);outfit.rotation.y=person.rotation.y;scene.add(outfit);
   var profile=[[.18,1.01],[.205,1.08],[.22,1.29],[.245,1.4],[.19,1.47],[.09,1.49]].map(function(p){return new T.Vector2(p[0],p[1]);});
   var shirt=new T.Mesh(new T.LatheGeometry(profile,40),shirtMat);shirt.scale.z=.62;outfit.add(shirt);
   box(outfit,cuffMat,0,1.285,.143,.012,.32,.008);
   for(var b=0;b<4;b++)box(outfit,frameMat,0,1.14+b*.075,.15,.012,.012,.005);
   var collar=new T.Mesh(new T.CylinderGeometry(.083,.115,.05,32),cuffMat);collar.position.y=1.49;collar.scale.z=.75;outfit.add(collar);
   var sleeves={};['Left','Right'].forEach(function(side){
    sleeves[side]=new T.Mesh(new T.CylinderGeometry(.09,.075,1,24),shirtMat);scene.add(sleeves[side]);
   });
   var trousers=material(0x303746,.88),leather=material(0x171c26,.42),legs={};
   ['Left','Right'].forEach(function(side){
    var thigh=new T.Mesh(new T.CylinderGeometry(.105,.086,1,24),trousers),shin=new T.Mesh(new T.CylinderGeometry(.087,.07,1,24),trousers);
    var knee=new T.Mesh(new T.SphereGeometry(.086,20,14),trousers),foot=new T.Mesh(new T.SphereGeometry(1,24,16),leather);
    foot.scale.set(.085,.075,.175);scene.add(thigh,shin,knee,foot);legs[side]={thigh:thigh,shin:shin,knee:knee,foot:foot};
   });
   var furnitureStart=scene.children.length;var desk=new T.Group();scene.add(desk);
   var shape=new T.Shape(),hw=1.35,hd=.56,r=.045;
   shape.moveTo(-hw+r,-hd);shape.lineTo(hw-r,-hd);shape.quadraticCurveTo(hw,-hd,hw,-hd+r);shape.lineTo(hw,hd-r);shape.quadraticCurveTo(hw,hd,hw-r,hd);shape.lineTo(-hw+r,hd);shape.quadraticCurveTo(-hw,hd,-hw,hd-r);shape.lineTo(-hw,-hd+r);shape.quadraticCurveTo(-hw,-hd,-hw+r,-hd);
   var top=new T.Mesh(new T.ExtrudeGeometry(shape,{depth:.06,bevelEnabled:true,bevelSize:.008,bevelThickness:.008,bevelSegments:3,steps:1}),desktop);top.rotation.x=-Math.PI/2;top.position.set(0,.985,.35);desk.add(top);
   box(desk,frameMat,0,1.057,-.195,2.65,.01,.012);
   box(desk,accent,0,.988,.91,2.62,.009,.008);
   [-1.05,1.05].forEach(function(x){box(desk,frameMat,x,.51,.35,.065,.97,.065);box(desk,dark,x,.035,.35,.12,.055,.78);});
   box(desk,dark,0,.87,.35,2.1,.06,.065);
   var monitorMaps=[];
   function screenTexture(index){var c=document.createElement('canvas');c.width=768;c.height=448;var p=c.getContext('2d');
    p.fillStyle='#0c1420';p.fillRect(0,0,768,448);p.fillStyle='#192538';p.fillRect(0,0,768,42);
    p.fillStyle='#c3b3f1';p.font='18px monospace';p.fillText(index?'OPERATIONS / LIVE':'FOUNDRY / WORKSPACE',24,28);
    if(!index){for(var i=0;i<13;i++){p.fillStyle=['#b7a0e7','#70cfc5','#7b8fae'][i%3];p.fillRect(30+(i%3)*22,78+i*24,120+(i*39)%370,5);}p.fillStyle='#192b3d';p.fillRect(540,65,200,340);}
    else{p.strokeStyle='#263548';p.lineWidth=1;for(var i=0;i<6;i++){p.beginPath();p.moveTo(30,95+i*45);p.lineTo(730,95+i*45);p.stroke();}
     p.strokeStyle='#83d3c9';p.lineWidth=4;p.beginPath();for(var i=0;i<15;i++){var x=35+i*49,y=300-i*10+Math.sin(i*1.8)*35;if(i)p.lineTo(x,y);else p.moveTo(x,y);}p.stroke();
     p.fillStyle='#b5a0e9';p.font='25px monospace';p.fillText('WORKFLOW / ACTIVE',35,400);}
    var texture=new T.CanvasTexture(c);texture.encoding=T.sRGBEncoding;monitorMaps.push(texture);return texture;
   }
   function monitor(x,z,angle,index){var group=new T.Group();group.position.set(x,1.28,z);group.rotation.y=angle;scene.add(group);
    box(group,dark,0,0,0,.91,.57,.047);
    box(group,frameMat,0,0,-.025,.22,.018,.003);box(group,accent,0,-.03,-.026,.06,.004,.003);
    var face=new T.Mesh(new T.PlaneGeometry(.855,.51),new T.MeshBasicMaterial({map:screenTexture(index)}));face.position.z=.025;group.add(face);
    box(group,frameMat,0,-.35,-.03,.035,.22,.035);box(group,dark,0,-.43,-.03,.28,.018,.18);
    box(group,accent,0,-.266,.027,.07,.005,.003);return group;
   }
   monitor(-.85,.60,Math.PI-.1,0);monitor(.10,.65,Math.PI+.12,1);
   var keyboard=new T.Group();keyboard.position.set(.65,1.065,.10);keyboard.rotation.y=0;scene.add(keyboard);
   box(keyboard,dark,0,0,0,.56,.022,.2);
   for(var row=0;row<4;row++)for(var col=0;col<12;col++)box(keyboard,material((col+row)%7?0x3d4a60:0x8872b7,.6),-.25+col*.045,.018,-.075+row*.047,.034,.012,.032);
   var mouseMat=box(scene,material(0x111a28),.52,1.066,.39,.3,.006,.28);
   var mouseMesh=new T.Mesh(new T.SphereGeometry(1,20,12),frameMat);mouseMesh.scale.set(.037,.023,.061);mouseMesh.position.set(.52,1.09,.39);scene.add(mouseMesh);
   // Compact desktop tower, mug, and speakers complete the large setup.
   box(scene,dark,.93,.29,.1,.24,.52,.42);box(scene,frameMat,.93,.29,.315,.21,.47,.01);
   box(scene,accent,.86,.29,.323,.006,.32,.005);
   var mug=new T.Mesh(new T.CylinderGeometry(.06,.05,.12,28),material(0xd3d9e3,.4));mug.position.set(.87,1.12,.76);scene.add(mug);
   var handle=new T.Mesh(new T.TorusGeometry(.04,.009,8,24),mug.material);handle.position.set(.94,1.13,.76);scene.add(handle);
   var speaker=box(scene,dark,-1.13,1.18,-.02,.14,.25,.15);
   // Furniture shares one level; the seated body uses the bind pose, avoiding
   // the sideways lean baked into the imported standing idle animation.
   var workstation=new T.Group();scene.children.slice(furnitureStart).forEach(function(n){workstation.add(n);});scene.add(workstation);workstation.position.y=-.2;
   var chair=new T.Group();chair.position.set(.65,0,-.55);scene.add(chair);
   box(chair,dark,0,.69,0,.50,.09,.48);box(chair,shirtMat,0,1.01,-.21,.48,.58,.065);
   box(chair,frameMat,0,.30,0,.055,.50,.055);
   [-1,1].forEach(function(side){box(chair,frameMat,side*.28,.72,-.03,.035,.27,.035);box(chair,dark,side*.28,.85,0,.075,.035,.30);});
   for(var ci=0;ci<5;ci++){var spoke=new T.Group();spoke.rotation.y=ci*Math.PI*2/5;chair.add(spoke);box(spoke,frameMat,0,.08,.17,.045,.04,.38);var wheel=new T.Mesh(new T.SphereGeometry(.055,16,12),dark);wheel.position.set(0,.055,.34);spoke.add(wheel);}
   var rest=[];person.traverse(function(n){if(n.isBone)rest.push({bone:n,q:n.quaternion.clone()});});
   function resetPose(){rest.forEach(function(r){r.bone.quaternion.copy(r.q);});person.updateMatrixWorld(true);}

   var head=person.getObjectByName('Head');
   function aimBone(bone,end,target){
    person.updateMatrixWorld(true);var origin=bone.getWorldPosition(new T.Vector3()),current=end.getWorldPosition(new T.Vector3()).sub(origin).normalize(),desired=target.clone().sub(origin).normalize();
    var delta=new T.Quaternion().setFromUnitVectors(current,desired),world=bone.getWorldQuaternion(new T.Quaternion());world.premultiply(delta);
    var parent=bone.parent.getWorldQuaternion(new T.Quaternion()).invert();bone.quaternion.copy(parent.multiply(world));person.updateMatrixWorld(true);
   }
   function handIK(side,target){var upper=person.getObjectByName(side+'Arm'),lower=person.getObjectByName(side+'ForeArm'),hand=person.getObjectByName(side+'Hand');if(!upper||!lower||!hand)return;
    person.updateMatrixWorld(true);var a=upper.getWorldPosition(new T.Vector3()),b=lower.getWorldPosition(new T.Vector3()),c=hand.getWorldPosition(new T.Vector3());
    var lenA=a.distanceTo(b),lenB=b.distanceTo(c),dir=target.clone().sub(a),dist=Math.min(dir.length(),lenA+lenB-.005);dir.normalize();
    var bend=new T.Vector3(side==='Left'?1:-1,-.3,-.25);bend.addScaledVector(dir,-bend.dot(dir)).normalize();
    var cos=T.MathUtils.clamp((lenA*lenA+dist*dist-lenB*lenB)/(2*lenA*dist),-1,1);
    var elbow=a.clone().addScaledVector(dir,lenA*cos).addScaledVector(bend,lenA*Math.sqrt(1-cos*cos));aimBone(upper,lower,elbow);aimBone(lower,hand,target);
   }
   function workPose(time,helloAmount){helloAmount=helloAmount||0;resetPose();
    if(head){head.rotation.x+=.16*(1-helloAmount);head.rotation.y+=.4*helloAmount;}
    ['Left','Right'].forEach(function(side){var hip=person.getObjectByName(side+'UpLeg'),knee=person.getObjectByName(side+'Leg'),foot=person.getObjectByName(side+'Foot');if(!hip||!knee||!foot)return;var x=.65+(side==='Left'?.12:-.12);aimBone(hip,knee,new T.Vector3(x,.53,-.08));aimBone(knee,foot,new T.Vector3(x,.10,.12));});
    handIK('Left',new T.Vector3(.78,.905+Math.sin(time*7)*.003,.10));
    var typing=new T.Vector3(.52,.905+Math.sin(time*8+1)*.003,.10),waving=new T.Vector3(.22+Math.sin(time*10)*.065,1.61,-.30);
    handIK('Right',typing.lerp(waving,helloAmount||0));
    ['Left','Right'].forEach(function(side){var hand=person.getObjectByName(side+'Hand'),finger=person.getObjectByName(side+'HandMiddle1');if(!hand||!finger)return;var reach=hand.getWorldPosition(new T.Vector3()).add(new T.Vector3(0,-.025,.16));if(side==='Right')reach.lerp(hand.getWorldPosition(new T.Vector3()).add(new T.Vector3(Math.sin(time*10)*.05,.15,.03)),helloAmount);aimBone(hand,finger,reach);});

    ['Left','Right'].forEach(function(side){var upper=person.getObjectByName(side+'Arm'),lower=person.getObjectByName(side+'ForeArm');if(!upper||!lower)return;
     var a=upper.getWorldPosition(new T.Vector3()),b=lower.getWorldPosition(new T.Vector3());b.lerp(a,.12);var direction=b.clone().sub(a),mesh=sleeves[side];mesh.position.copy(a.clone().add(b).multiplyScalar(.5));mesh.scale.y=direction.length();mesh.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),direction.normalize());
    });
    function segment(mesh,a,b){var dir=b.clone().sub(a);mesh.position.copy(a.clone().add(b).multiplyScalar(.5));mesh.scale.y=dir.length();mesh.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),dir.normalize());}
    ['Left','Right'].forEach(function(side){var hip=person.getObjectByName(side+'UpLeg'),knee=person.getObjectByName(side+'Leg'),ankle=person.getObjectByName(side+'Foot');if(!hip||!knee||!ankle)return;
     var a=hip.getWorldPosition(new T.Vector3()),b=knee.getWorldPosition(new T.Vector3()),c=ankle.getWorldPosition(new T.Vector3()),parts=legs[side];
     segment(parts.thigh,a,b);segment(parts.shin,b,c);parts.knee.position.copy(b);parts.foot.position.copy(c);parts.foot.position.y=.08;parts.foot.rotation.y=person.rotation.y;parts.foot.position.add(new T.Vector3(0,0,.045).applyAxisAngle(new T.Vector3(0,1,0),person.rotation.y));
    });
   }
   workPose(0);
   scene.traverse(function(n){if(n.isMesh&&n!==floor){n.castShadow=true;n.receiveShadow=true;}});
   var motion=matchMedia('(prefers-reduced-motion: reduce)'),paused=false,visible=true,frame=0,last=0,time=0,waveStart=.65,waveEnd=5.1;
   var mouse={x:0,y:0};
   function still(){renderer.render(scene,camera);}
   function tick(now){
    frame=0;if(paused||motion.matches||!visible||document.hidden){last=0;still();return;}
    if(last&&now-last<32){frame=requestAnimationFrame(tick);return;}
    var dt=Math.min(last?(now-last)/1000:0,.05);last=now;time+=dt;
    var ramp=T.MathUtils.smoothstep(time,waveStart,waveStart+.8)*(1-T.MathUtils.smoothstep(time,waveEnd-.85,waveEnd));
    workPose(time,ramp);greeting.hidden=ramp<.6;stage.dataset.action=ramp>.01?'greeting':'working';
    accent.color.setHex(ramp>.5?0xb49aff:0x8bcac9);
    still();frame=requestAnimationFrame(tick);
   }
   function sync(){cancelAnimationFrame(frame);frame=0;last=0;if(motion.matches){workPose(time,0);greeting.hidden=true;stage.dataset.action='working';}if(!paused&&!motion.matches&&visible&&!document.hidden)frame=requestAnimationFrame(tick);else still();}
   function size(){var w=stage.clientWidth,h=stage.clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;
    var target=new T.Vector3(0,.96,.15),direction=new T.Vector3(2.8,1.35,4.8).normalize(),right=new T.Vector3().crossVectors(new T.Vector3(0,1,0),direction).normalize(),up=new T.Vector3().crossVectors(direction,right).normalize();
    var tanV=Math.tan(T.MathUtils.degToRad(camera.fov*.5)),tanH=tanV*camera.aspect,distance=0;
    [-1.43,1.43].forEach(function(x){[0,1.93].forEach(function(y){[-.7,1].forEach(function(z){var v=new T.Vector3(x,y,z).sub(target),depth=v.dot(direction);distance=Math.max(distance,depth+Math.abs(v.dot(right))/tanH,depth+Math.abs(v.dot(up))/tanV);});});});
    camera.position.copy(target).addScaledVector(direction,distance*1.08);camera.lookAt(target);camera.updateProjectionMatrix();still();}
   pause.addEventListener('click',function(){paused=!paused;pause.textContent=paused?'Play':'Pause';pause.setAttribute('aria-pressed',String(paused));sync();});
   hello.addEventListener('click',function(){if(motion.matches)return;waveStart=time;waveEnd=time+4.45;paused=false;pause.textContent='Pause';pause.setAttribute('aria-pressed','false');sync();});
   visual.addEventListener('pointermove',function(e){if(motion.matches||e.pointerType==='touch')return;var r=stage.getBoundingClientRect();mouse.x=Math.max(-.5,Math.min(.5,(e.clientX-r.left)/r.width-.5));mouse.y=Math.max(-.5,Math.min(.5,(e.clientY-r.top)/r.height-.5));},{passive:true});
   visual.addEventListener('pointerleave',function(){mouse.x=mouse.y=0;});
   new ResizeObserver(size).observe(stage);new IntersectionObserver(function(entries){visible=entries[0].isIntersecting;sync();}).observe(stage);
   motion.addEventListener('change',sync);document.addEventListener('visibilitychange',sync);
   renderer.domElement.addEventListener('webglcontextlost',function(e){e.preventDefault();cancelAnimationFrame(frame);visual.classList.remove('has-character');stage.remove();});
   stage.dataset.model='seated-workstation';size();sync();
   delete window.PORTFOLIO_HUMAN;
  }
 }
})();

/* Supporting hero choreography: title, description, buttons, then details. */
(function () {
  'use strict';
  var motion=matchMedia('(prefers-reduced-motion: reduce)');
  var copy=document.querySelector('.hero__text'),row=document.querySelector('.hero__copy .btn-row'),title=document.querySelector('.hero__title');
  if(!copy||!row||motion.matches||!Element.prototype.animate||scrollY>innerHeight*.5||(window.heroIntroBoot&&window.heroIntroBoot.expired)||(location.hash&&location.hash!=='#home')){document.documentElement.classList.remove('hero-support-pending');return;}
  var original=copy.innerHTML,label=copy.getAttribute('aria-label'),animations=[],holds=new Map(),done=false,running=false,startY=scrollY;
  var introWidth=innerWidth,introHeight=innerHeight;
  function onResize(){if(innerWidth!==introWidth||innerHeight!==introHeight)finish();}
  var buttons=Array.from(row.querySelectorAll('.btn'));
  var details=Array.from(document.querySelectorAll('.hero__copy .now,.hero__visual,.hero .fx-scroll-cue'));
  copy.classList.add('hero-support-entering');
  function hold(node){var a=node.animate([{opacity:0},{opacity:0}],{duration:1,fill:'both'});a.pause();a.currentTime=0;holds.set(node,a);}
  [copy].concat(buttons,details).forEach(hold);
  document.documentElement.classList.remove('hero-support-pending');
  function release(node){var a=holds.get(node);if(a){a.cancel();holds.delete(node);}}
  function finish(){
    if(done)return;done=true;document.documentElement.classList.remove('hero-support-pending');animations.forEach(function(a){a.cancel();});holds.forEach(function(a){a.cancel();});holds.clear();
    copy.innerHTML=original;copy.classList.remove('hero-support-entering');
    if(label===null)copy.removeAttribute('aria-label');else copy.setAttribute('aria-label',label);
    window.removeEventListener('scroll',onScroll);window.removeEventListener('resize',onResize);
    document.removeEventListener('visibilitychange',onVisibility);document.removeEventListener('hero-title-ready',start);document.removeEventListener('hero-intro-fallback',finish);motion.removeEventListener('change',finish);
    document.querySelector('.hero').removeEventListener('focusin',finish);row.removeEventListener('pointerdown',finish);
  }
  function onScroll(){if(Math.abs(scrollY-startY)>12)finish();}
  function onVisibility(){if(document.hidden)finish();}
  function play(node,frames,options){var a=node.animate(frames,options);animations.push(a);return a.finished.catch(function(){});}
  function split(node){Array.from(node.childNodes).forEach(function(child){
    if(child.nodeType===3){var fragment=document.createDocumentFragment();child.textContent.split(/(\s+)/).forEach(function(part){
      if(!part)return;if(/^\s+$/.test(part)){fragment.appendChild(document.createTextNode(part));return;}
      var word=document.createElement('span');word.className='hero-support-word';word.setAttribute('aria-hidden','true');word.style.display='inline-block';word.textContent=part;fragment.appendChild(word);
    });child.replaceWith(fragment);}else if(child.nodeType===1)split(child);
  });}
  async function start(){
    if(done||running)return;running=true;
    try{
      copy.setAttribute('aria-label',copy.textContent.replace(/\s+/g,' ').trim());split(copy);release(copy);
      await Promise.all(Array.from(copy.querySelectorAll('.hero-support-word')).map(function(word,index){return play(word,[
        {opacity:0,transform:'perspective(900px) translate3d(0,22px,-25px) rotateX(-12deg)'},
        {opacity:1,transform:'perspective(900px) translate3d(0,0,0) rotateX(0deg)'}
      ],{duration:800,delay:index*24,easing:'cubic-bezier(.16,1,.3,1)',fill:'backwards'});}));
      if(done)return;
      await Promise.all(buttons.map(function(button,index){release(button);return play(button,[
        {opacity:0,transform:'perspective(900px) translate3d('+(index%2?65:-65)+'px,18px,-60px) rotateY('+(index%2?-12:12)+'deg) scale(.96)'},
        {opacity:1,transform:'perspective(900px) translate3d(0,0,0) rotateY(0deg) scale(1)'}
      ],{duration:1050,delay:index*150,easing:'cubic-bezier(.16,1,.3,1)',fill:'backwards'});}));
      if(done)return;
      await Promise.all(details.map(function(node,index){release(node);return play(node,[{opacity:0,transform:'translateY(18px) scale(.985)'},{opacity:1,transform:'translateY(0) scale(1)'}],{duration:850,delay:index*100,easing:'cubic-bezier(.16,1,.3,1)',fill:'backwards'});}));
      finish();
    }catch(error){finish();}
  }
  window.addEventListener('scroll',onScroll,{passive:true});window.addEventListener('resize',onResize);
  document.addEventListener('visibilitychange',onVisibility);motion.addEventListener('change',finish);
  document.querySelector('.hero').addEventListener('focusin',finish);row.addEventListener('pointerdown',finish);
  document.addEventListener('hero-title-ready',start);
  document.addEventListener('hero-intro-fallback',finish);
  if(!title||title.dataset.introState!=='pending')start();
  setTimeout(finish,16000);
})();

