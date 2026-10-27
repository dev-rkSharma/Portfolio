/* A photo-textured, approximate 3D bust. Back and side geometry are inferred. */
(function(){
  'use strict';
  window.buildRoushanAvatar=function(T,face){
    var root=new T.Group();root.name='Roushan_photo_based_3D_likeness';
    var currentParent=root;
    root.userData.description='Approximate photo-textured bust; side and back geometry are artistic interpretations.';
    function mat(color,rough,metal){return new T.MeshStandardMaterial({color:new T.Color(color).convertSRGBToLinear(),roughness:rough===undefined?.75:rough,metalness:metal||0});}
    var skin=mat(0xae7861),hair=mat(0x11131a,.7),shirt=mat(0x151e33,.95),black=mat(0x11151d,.35),metal=mat(0xa2a6ac,.28,.75),pad=mat(0x242730,.95);
    function mesh(geometry,material,x,y,z,sx,sy,sz,parent){var m=new T.Mesh(geometry,material);m.position.set(x||0,y||0,z||0);if(sx!==undefined)m.scale.set(sx,sy,sz);m.castShadow=true;m.receiveShadow=true;(parent||currentParent).add(m);return m;}
    function ell(material,x,y,z,sx,sy,sz,parent){return mesh(new T.SphereGeometry(1,48,32),material,x,y,z,sx,sy,sz,parent);}
    function tube(points,r,material,parent){var curve=new T.CatmullRomCurve3(points.map(function(p){return new T.Vector3(p[0],p[1],p[2]);}));return mesh(new T.TubeGeometry(curve,48,r,10,false),material,0,0,0,undefined,undefined,undefined,parent);}
    // Closed torso and shoulders, with the navy T-shirt seen in the photograph.
    var profile=[[.36,.06],[.47,.12],[.53,.44],[.58,.82],[.63,1.12],[.55,1.34],[.34,1.46],[.16,1.48]].map(function(p){return new T.Vector2(p[0],.75+(p[1]-.06)*.50);});
    var torso=mesh(new T.LatheGeometry(profile,64),shirt);torso.scale.z=.57;
    mesh(new T.CircleGeometry(.36,48),shirt,0,.75,0,1,.57,1).rotation.x=Math.PI/2;
    [-1,1].forEach(function(s){var sleeve=ell(shirt,s*.46,1.28,0,.22,.18,.245);sleeve.rotation.z=s*.24;});
    mesh(new T.CylinderGeometry(.155,.19,.22,40),skin,0,1.53,.015);
    var collar=mesh(new T.TorusGeometry(.18,.035,12,48),mat(0x0c1221),0,1.455,.025);collar.rotation.x=Math.PI/2;collar.scale.y=.78;
    var headGroup=new T.Group();headGroup.name='Head_and_identity';root.add(headGroup);headGroup.scale.setScalar(1.08);headGroup.position.y=-1.96*.08;currentParent=headGroup;
    ell(skin,0,1.96,0,.335,.435,.30);
    // Narrow the chin and give the back of the head a complete volume.
    // Keep the facial surface continuous so the identity texture is unobstructed.
    [-1,1].forEach(function(s){ell(skin,s*.332,1.96,0,.061,.115,.052);ell(mat(0x885c4e),s*.359,1.96,.025,.018,.072,.025);});
    // Curved photographic face with geometric nose, cheek, and brow relief.
    var geo=new T.PlaneGeometry(.575,.70,64,72),position=geo.attributes.position;
    for(var i=0;i<position.count;i++){
      var x=position.getX(i),y=position.getY(i),nx=x/.335,ny=y/.435;
      var z=.30*Math.sqrt(Math.max(.03,1-nx*nx-ny*ny))+.035;
      z+=.072*Math.exp(-Math.pow(x/.056,2)-Math.pow((y+.015)/.12,2));
      z+=.016*Math.exp(-Math.pow((Math.abs(x)-.14)/.065,2)-Math.pow((y+.04)/.1,2));
      position.setZ(i,z);
    }
    geo.computeVertexNormals();
    var faceMat=new T.MeshBasicMaterial({map:face,transparent:true,depthWrite:false,side:T.FrontSide});
    var faceMesh=mesh(geo,faceMat,0,1.965,.014);faceMesh.name='Photographic_face_with_sculpted_relief';faceMesh.renderOrder=2;
    // Back and sides of hair, with a swept, layered crown.
    var cap=mesh(new T.SphereGeometry(1,64,32,0,Math.PI*2,0,1.05),hair,0,1.98,-.025,.35,.45,.315);
    cap.rotation.z=-.035;
    mesh(new T.SphereGeometry(1,48,32,Math.PI,Math.PI,0,Math.PI*.72),hair,0,1.99,-.015,.344,.435,.31);
    for(var row=0;row<5;row++)for(var col=0;col<7;col++){
      var hx=-.27+col*.083, hz=-.18+row*.073;
      var hy=2.31+.085*Math.sqrt(Math.max(0,1-Math.pow(hx/.36,2)-Math.pow(hz/.36,2)));
      var lock=ell(hair,hx,hy,hz,.083,.03,.12);lock.rotation.z=-.24;lock.rotation.y=-.37;
    }
    [-1,1].forEach(function(s){ell(hair,s*.302,2.13,-.01,.047,.16,.22);});
    // Silver glasses, with closed temple arms extending around both ears.
    var glasses=new T.Group();glasses.name='Silver_rectangular_glasses';headGroup.add(glasses);
    function frame(cx){var w=.245,h=.16,r=.033,z=.335,cy=2.045;
      var shape=new T.Shape();shape.moveTo(cx-w/2+r,cy-h/2);shape.lineTo(cx+w/2-r,cy-h/2);shape.quadraticCurveTo(cx+w/2,cy-h/2,cx+w/2,cy-h/2+r);shape.lineTo(cx+w/2,cy+h/2-r);shape.quadraticCurveTo(cx+w/2,cy+h/2,cx+w/2-r,cy+h/2);shape.lineTo(cx-w/2+r,cy+h/2);shape.quadraticCurveTo(cx-w/2,cy+h/2,cx-w/2,cy+h/2-r);shape.lineTo(cx-w/2,cy-h/2+r);shape.quadraticCurveTo(cx-w/2,cy-h/2,cx-w/2+r,cy-h/2);
      var pts=shape.getPoints(40).map(function(p){return [p.x,p.y,z-.11*Math.pow(Math.abs(p.x)/.34,2)];});pts.push(pts[0]);tube(pts,.008,metal,glasses);
    }
    frame(-.143);frame(.143);tube([[-.023,2.07,.339],[0,2.08,.352],[.023,2.07,.339]],.008,metal,glasses);
    [-1,1].forEach(function(s){tube([[s*.269,2.09,.266],[s*.346,2.075,.10],[s*.35,2.015,-.06]],.008,metal,glasses);});
    // Headphones rest around the neck, including a complete padded headband.
    currentParent=root;
    var headphones=new T.Group();headphones.name='Over_ear_headphones';root.add(headphones);
    var band=[];for(var j=0;j<=32;j++){var a=Math.PI*j/32;band.push([Math.cos(a)*.35,1.48-Math.sin(a)*.21,-.10-Math.sin(a)*.10]);}
    tube(band,.039,black,headphones);tube(band.map(function(p){return [p[0],p[1]+.018,p[2]+.023];}),.023,pad,headphones);
    [-1,1].forEach(function(s){var cup=ell(black,s*.30,1.34,.255,.105,.185,.095,headphones);cup.rotation.z=s*.24;var cushion=ell(pad,s*.255,1.34,.27,.052,.15,.083,headphones);cushion.rotation.z=s*.24;ell(mat(0x535966,.4,.65),s*.375,1.35,.255,.022,.13,.065,headphones);});
    // A discreet studio plinth makes the bust readable from every angle.
    mesh(new T.CylinderGeometry(.40,.44,.08,64),mat(0x202333,.4,.4),0,.71,0);
    var rim=mesh(new T.TorusGeometry(.405,.008,8,80),new T.MeshStandardMaterial({color:0xb49aff,emissive:0x544078,emissiveIntensity:.65,roughness:.35}),0,.75,0);rim.rotation.x=Math.PI/2;
    root.traverse(function(o){if(o.isMesh){o.geometry.computeVertexNormals();o.name=o.name||'Likeness_detail';}});
    return root;
  };
})();
