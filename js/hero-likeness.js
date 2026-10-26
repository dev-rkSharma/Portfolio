(function(){
  'use strict';
  var visual=document.querySelector('.hero__visual[data-hero-photo]');if(!visual)return;
  var photo=visual.querySelector('.portrait-shell');if(!photo)return;
  var motion=matchMedia('(prefers-reduced-motion: reduce)'),mode='portrait';
  var bar=document.createElement('div');bar.className='likeness-modes';bar.setAttribute('role','group');bar.setAttribute('aria-label','Portrait presentation');
  var modelButton=document.createElement('button'),photoButton=document.createElement('button');
  modelButton.type=photoButton.type='button';modelButton.textContent='3D likeness';photoButton.textContent='Depth portrait';
  modelButton.disabled=true;modelButton.setAttribute('aria-pressed','false');photoButton.setAttribute('aria-pressed','true');bar.append(modelButton,photoButton);visual.prepend(bar);
  var stage=document.createElement('div');stage.className='likeness-stage';stage.hidden=true;visual.insertBefore(stage,photo);
  var note=document.createElement('p');note.className='likeness-note';note.setAttribute('aria-live','polite');note.textContent='Move your mouse to explore the portrait';visual.insertBefore(note,visual.querySelector('.status'));
  function load(src){return new Promise(function(resolve,reject){var s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=reject;document.head.appendChild(s);});}
  function setMode(next){mode=next;var isModel=next==='model';stage.hidden=!isModel;photo.hidden=isModel;visual.classList.toggle('is-likeness-model',isModel);modelButton.setAttribute('aria-pressed',String(isModel));photoButton.setAttribute('aria-pressed',String(!isModel));note.textContent=isModel?'Drag to orbit · + / − to zoom · arrows work too':'Move your mouse to explore the portrait';if(isModel&&window.requestLikenessFrame)window.requestLikenessFrame();}
  photoButton.addEventListener('click',function(){setMode('portrait');});modelButton.addEventListener('click',function(){setMode('model');});
  // Photo subject and surrounding light move on separate depth planes.
  photo.addEventListener('pointermove',function(e){if(motion.matches||e.pointerType==='touch')return;var r=photo.getBoundingClientRect();var x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;photo.style.setProperty('--subject-x',(x*12).toFixed(2)+'px');photo.style.setProperty('--subject-y',(y*9).toFixed(2)+'px');photo.style.setProperty('--aura-x',(-x*20).toFixed(2)+'px');});
  function resetPhoto(){photo.style.setProperty('--subject-x','0px');photo.style.setProperty('--subject-y','0px');photo.style.setProperty('--aura-x','0px');}
  photo.addEventListener('pointerleave',resetPhoto);motion.addEventListener('change',resetPhoto);
  Promise.resolve().then(function(){return window.THREE?null:load('js/vendor/three.min.js');}).then(function(){return window.buildRoushanAvatar?null:load('js/avatar-model.js');}).then(init).catch(function(error){modelButton.textContent='3D unavailable';note.textContent='Depth portrait · move your mouse to explore';console.warn('3D likeness unavailable:',error.message);});
  function init(){
    var T=window.THREE,renderer=new T.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});
    renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.outputEncoding=T.sRGBEncoding;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.18;
    var canvas=renderer.domElement;canvas.tabIndex=0;canvas.setAttribute('role','img');canvas.setAttribute('aria-label','Approximate photo-based 3D likeness of Roushan Kumar. Drag or use arrow keys to rotate; plus and minus zoom; Home resets.');stage.append(canvas);
    var scene=new T.Scene(),camera=new T.PerspectiveCamera(33,1,.1,30);camera.position.set(0,1.65,4.25);camera.lookAt(0,1.60,0);
    scene.add(new T.HemisphereLight(0xece8ff,0x182236,1.0));
    function light(color,intensity,x,y,z){var l=new T.DirectionalLight(color,intensity);l.position.set(x,y,z);scene.add(l);}
    light(0xffeadd,1.5,-2,3,4);light(0xb49aff,1.3,-3,2,-2);light(0x66e2dc,1.2,3,2,-1);
    var targetYaw=0,yaw=0,targetPitch=0,pitch=0,distance=4.25,targetDistance=4.25,auto=false,inView=true,frame=0,last=0,model;
    var ui=document.createElement('div');ui.className='likeness-controls';ui.setAttribute('role','group');ui.setAttribute('aria-label','3D model controls');
    function button(label,action,title){var b=document.createElement('button');b.type='button';b.textContent=label;b.setAttribute('aria-label',title||label);b.addEventListener('click',action);ui.append(b);return b;}
    function zoom(delta){targetDistance=Math.max(2.8,Math.min(6,targetDistance+delta));request();}
    button('+',function(){zoom(-.4);},'Zoom in');button('−',function(){zoom(.4);},'Zoom out');
    var rotateButton=button('Rotate',function(){auto=!auto;rotateButton.setAttribute('aria-pressed',String(auto));request();});rotateButton.setAttribute('aria-pressed','false');
    function reset(){targetYaw=0;targetPitch=0;targetDistance=4.25;auto=false;rotateButton.setAttribute('aria-pressed','false');request();}
    button('Reset',reset);stage.append(ui);
    var caption=document.createElement('span');caption.className='likeness-caption';caption.textContent='Photo-based 3D interpretation';stage.append(caption);
    var download=document.createElement('a');download.className='likeness-download';download.href='assets/character/roushan-likeness.glb';download.download='Roushan-Kumar-3D-Likeness.glb';download.textContent='Download 3D model ↗';stage.append(download);
    function resize(){var width=stage.clientWidth||visual.clientWidth,height=stage.clientHeight||560;renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();request();}
    function request(){if(!frame&&inView&&!document.hidden&&mode==='model')frame=requestAnimationFrame(render);}
    window.requestLikenessFrame=request;
    function render(time){frame=0;if(!inView||document.hidden||mode!=='model'){last=0;return;}var dt=last?Math.min(64,time-last):16.7;last=time;var blend=motion.matches?1:1-Math.exp(-dt/90);if(auto&&!motion.matches)targetYaw+=dt*.00018;yaw+=(targetYaw-yaw)*blend;pitch+=(targetPitch-pitch)*blend;distance+=(targetDistance-distance)*blend;
      if(model){model.rotation.set(pitch,yaw,0);}camera.position.z=distance;camera.lookAt(0,1.60,0);renderer.render(scene,camera);
      if((auto&&!motion.matches)||Math.abs(targetYaw-yaw)+Math.abs(targetPitch-pitch)+Math.abs(targetDistance-distance)>.0005)request();else last=0;
    }
    var drag=null;
    canvas.addEventListener('pointerdown',function(e){if(e.button!==0)return;drag={x:e.clientX,y:e.clientY,yaw:targetYaw,pitch:targetPitch};auto=false;rotateButton.setAttribute('aria-pressed','false');canvas.setPointerCapture(e.pointerId);canvas.classList.add('is-dragging');canvas.focus({preventScroll:true});});
    canvas.addEventListener('pointermove',function(e){if(!drag)return;targetYaw=drag.yaw+(e.clientX-drag.x)*.012;targetPitch=Math.max(-.55,Math.min(.55,drag.pitch+(e.clientY-drag.y)*.007));request();});
    function end(){drag=null;canvas.classList.remove('is-dragging');}canvas.addEventListener('pointerup',end);canvas.addEventListener('pointercancel',end);canvas.addEventListener('lostpointercapture',end);
    canvas.addEventListener('keydown',function(e){var handled=true;if(e.key==='ArrowLeft')targetYaw-=.16;else if(e.key==='ArrowRight')targetYaw+=.16;else if(e.key==='ArrowUp')targetPitch=Math.max(-.55,targetPitch-.1);else if(e.key==='ArrowDown')targetPitch=Math.min(.55,targetPitch+.1);else if(e.key==='+'||e.key==='=')zoom(-.4);else if(e.key==='-')zoom(.4);else if(e.key==='Home')reset();else handled=false;if(handled){e.preventDefault();request();}});
    canvas.addEventListener('wheel',function(e){if(document.activeElement!==canvas)return;e.preventDefault();zoom(e.deltaY*.002);},{passive:false});
    if('ResizeObserver'in window)new ResizeObserver(resize).observe(stage);else addEventListener('resize',resize);
    if('IntersectionObserver'in window)new IntersectionObserver(function(entries){inView=entries[0].isIntersecting;if(inView)request();else{cancelAnimationFrame(frame);frame=0;last=0;}}).observe(visual);
    document.addEventListener('visibilitychange',function(){if(document.hidden){cancelAnimationFrame(frame);frame=0;last=0;}else request();});
    motion.addEventListener('change',function(){auto=false;rotateButton.setAttribute('aria-pressed','false');request();});
    function readTexture(src){return new Promise(function(resolve,reject){new T.TextureLoader().load(src,resolve,undefined,reject);});}
    function embeddedTexture(){
      return (window.ROUSHAN_FACE_TEXTURE?Promise.resolve():load('assets/character/roushan-face-data.js')).then(function(){
        if(!window.ROUSHAN_FACE_TEXTURE)throw new Error('Embedded face texture missing');
        return readTexture(window.ROUSHAN_FACE_TEXTURE);
      });
    }
    // Direct file previews cannot upload file:// images to WebGL. A local
    // script containing a data URI avoids that restriction without a server.
    var textureReady=location.protocol==='file:'?embeddedTexture():readTexture('assets/character/roushan-face.png').catch(embeddedTexture);
    textureReady.then(function(texture){texture.encoding=T.sRGBEncoding;texture.anisotropy=Math.min(renderer.capabilities.getMaxAnisotropy(),4);model=window.buildRoushanAvatar(T,texture);scene.add(model);window.portfolioLikeness={model:model,renderer:renderer,camera:camera,getState:function(){return{yaw:yaw,pitch:pitch,distance:distance,mode:mode,auto:auto};}};modelButton.disabled=false;setMode('model');resize();}).catch(function(error){modelButton.textContent='3D unavailable';note.textContent='Depth portrait · move your mouse to explore';console.warn('3D likeness texture failed:',error.message||error);});
  }
})();
