import * as THREE from './vendor/three.module.min.js';
import {createPlayWorld} from './world-play.js';

if (!window.FQ_APP) await new Promise(resolve => window.addEventListener('fq:ready', resolve, {once:true}));
const app = window.FQ_APP;
try { startWorld(); } catch (error) { console.error('3D initialization failed', error); app.worldFailed(); }

function startWorld() {
  const host = document.getElementById('world-canvas');
  const renderer = new THREE.WebGLRenderer({antialias:true, alpha:false, powerPreference:'low-power'});
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  host.appendChild(renderer.domElement);
  renderer.domElement.setAttribute('aria-hidden','true');
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#badbe5');
  scene.fog = new THREE.Fog('#badbe5', 70, 160);
  const camera = new THREE.PerspectiveCamera(43, 1, .1, 200);
  const ambient = new THREE.HemisphereLight('#fff8e8', '#7eaaa8', 2.8); scene.add(ambient);
  const sun = new THREE.DirectionalLight('#fff3d5', 3.2); sun.position.set(-22,38,18); sun.castShadow = true;
  sun.shadow.mapSize.set(1024,1024); Object.assign(sun.shadow.camera,{left:-36,right:36,top:36,bottom:-36,near:1,far:95}); sun.shadow.bias = -.0005; sun.shadow.normalBias = .04; scene.add(sun);
  const mat = (color, extra = {}) => new THREE.MeshStandardMaterial({color,roughness:.85,...extra});
  const materials = {grass:mat('#9bbf9e'), edge:mat('#719a8b'), path:mat('#e9dfbf'), ink:mat('#325365'), trunk:mat('#92795f'), leaf:mat('#5c9b86'), leaf2:mat('#8fba8a'), white:mat('#f6efdf'), window:mat('#88bac7',{roughness:.3}), roof:mat('#537784'), gold:mat('#efbb60'), water:mat('#83b8c8',{roughness:.35}), stone:mat('#cfdbce')};
  const obstacles = [];
  function mesh(geometry, material, x=0,y=0,z=0, parent=scene) { const m = new THREE.Mesh(geometry,material); m.position.set(x,y,z); m.castShadow=true; m.receiveShadow=true; parent.add(m); return m; }
  const box = (w,h,d,m,x,y,z,parent) => mesh(new THREE.BoxGeometry(w,h,d),m,x,y,z,parent);
  const cylinder = (rt,rb,h,m,x,y,z,segments=12,parent=scene) => mesh(new THREE.CylinderGeometry(rt,rb,h,segments),m,x,y,z,parent);
  const plane = (w,d,m,x,y,z) => { const p = mesh(new THREE.PlaneGeometry(w,d),m,x,y,z); p.rotation.x=-Math.PI/2;p.castShadow=false;return p; };
  plane(300,300,materials.water,0,-1.5,0);
  box(52,1.6,52,materials.edge,0,-.9,0);
  box(51,.2,51,materials.grass,0,0,0);
  plane(8,47,materials.path,0,.112,0); plane(47,8,materials.path,0,.115,0);
  for (const sign of [-1,1]) { plane(3.7,31,materials.path,sign*15,.118,0); plane(31,3.7,materials.path,0,.12,sign*15); }
  cylinder(5.2,5.2,.12,materials.stone,0,.16,0,48);
  // A shared lantern is a landmark and progress display, never a measure of people.
  cylinder(2.05,2.35,.35,materials.ink,0,.35,0,16);
  cylinder(1.75,1.75,.5,materials.white,0,.65,0,16);
  cylinder(1.6,1.6,.09,materials.water,0,.94,0,32);
  cylinder(.15,.3,2.1,materials.ink,0,1.9,0);
  const centralLight = mesh(new THREE.IcosahedronGeometry(.85,1),mat('#f3c873',{emissive:'#c08026',emissiveIntensity:.15}),0,3.2,0);
  obstacles.push({x:0,z:0,w:4.4,d:4.4});
  const palette = ['#e7bd69','#94bace','#91c5af','#b8acd5'];
  const coordinates = [[-13,-13],[0,-16],[13,-13],[16,0],[13,13],[0,16],[-13,13],[-16,0]];
  const nodes = [], labelHost = document.getElementById('location-labels');
  function building(x,z,index) {
    const body = mat(['#ece3d0','#d8e5df','#e1e3eb','#efe1d3'][index%4]);
    const roof = mat(['#688a8d','#8a88a4','#7b9c85','#7196a8'][index%4]);
    const height = 2.5 + (index%3)*.45;
    box(5,height,3.7,body,x,height/2+.2,z);
    box(5.5,.38,4.2,roof,x,height+.38,z);
    box(5.25,.08,4,materials.white,x,height+.12,z);
    box(1.0,1.9,.09,materials.ink,x,.2+.95,z+1.9);
    for (const dx of [-1.6,1.6]) {
      box(.95,1.15,.12,materials.white,x+dx,1.65,z+1.9);
      box(.72,.88,.13,materials.window,x+dx,1.65,z+1.98);
      box(.85,.14,.5,materials.white,x+dx,1,z+2.1);
    }
    box(1.6,.1,1.1,roof,x,2.25,z+2.25);
    box(.9,.12,.55,materials.stone,x,.19,z+2.2);
    cylinder(.2,.2,.8,materials.ink,x+1.8,height+.8,z-.8,8);
    obstacles.push({x,z,w:5.3,d:4});
  }
  window.FQ_DATA.cases.forEach((c,i) => {
    const [x,z] = coordinates[i], len = Math.hypot(x,z), bx = x+x/len*4.8, bz = z+z/len*4.8;
    building(bx,bz,i);
    const color = palette[i%4];
    const ringMat = mat(color,{emissive:color,emissiveIntensity:.12,side:THREE.DoubleSide});
    const ring = mesh(new THREE.RingGeometry(1.35,1.65,48),ringMat,x,.15,z); ring.rotation.x=-Math.PI/2;ring.castShadow=false;
    const pillar = new THREE.Group(); pillar.position.set(x,0,z); scene.add(pillar);
    cylinder(.28,.4,1.35,materials.ink,0,.8,0,10,pillar);
    const lanternMat = mat(color,{emissive:color,emissiveIntensity:.35});
    const lantern = mesh(new THREE.OctahedronGeometry(.48),lanternMat,0,1.85,0,pillar);
    cylinder(.5,.5,.1,materials.white,0,1.3,0,12,pillar);
    const arch = new THREE.TorusGeometry(.62,.04,6,24,Math.PI);
    mesh(arch,materials.ink,0,1.9,0,pillar);
    const label = document.createElement('div'); label.className='location-label'; label.innerHTML=`<b>${c.number}</b>${c.theme}`; labelHost.appendChild(label);
    const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(0,1.07,0),new THREE.Vector3(x*.5,1.12,z*.5),new THREE.Vector3(x,.2,z));
    const link = mesh(new THREE.TubeGeometry(curve,24,.045,5,false),mat('#f4d586',{emissive:'#ecb640',emissiveIntensity:.7}));link.visible=false;link.castShadow=false;
    nodes.push({id:c.id,c,x,z,ring,lantern,lanternMat,label,link});
  });
  function tree(x,z,size=1) {
    cylinder(.12*size,.2*size,1.65*size,materials.trunk,x,.2+.75*size,z,6);
    mesh(new THREE.IcosahedronGeometry(1.15*size,1),materials.leaf,x,2*size,z);
    mesh(new THREE.IcosahedronGeometry(.85*size,0),materials.leaf2,x+.25,2.65*size,z);
    obstacles.push({x,z,w:.6*size,d:.6*size});
  }
  [[-23,-19],[-21,-6],[-23,6],[-22,21],[-7,-23],[7,-23],[23,-20],[23,-6],[23,7],[22,22],[-8,23],[8,23],[-8,-8],[8,-8],[-8,8],[8,8],[-6,19],[6,-19]].forEach(([x,z],i)=>tree(x,z,.8+(i%3)*.15));
  // Park furniture and flower beds use geometric forms, with no borrowed images.
  for (const [x,z] of [[-7,-4],[7,4],[-5,7],[5,-7]]) {
    box(2,.18,.65,materials.trunk,x,.65,z);box(2,.65,.15,materials.trunk,x,1,z-.35);
    for (const dx of [-.7,.7]) box(.13,.65,.6,materials.ink,x+dx,.35,z);
    obstacles.push({x,z,w:2.1,d:.9});
  }
  for (let i=0;i<28;i++) {
    const angle=i*2.399963, r=5.8+(i%4)*.38,x=Math.cos(angle)*r,z=Math.sin(angle)*r;
    if(Math.abs(x)<4.2||Math.abs(z)<4.2)continue;
    cylinder(.06,.06,.38,materials.leaf,x,.3,z,5);
    mesh(new THREE.IcosahedronGeometry(.17,0),i%2?materials.gold:materials.white,x,.55,z);
  }
  for (const sign of [-1,1]) for (let i=-24;i<=24;i+=4) {
    box(.14,.55,.14,materials.white,sign*25,.4,i);box(.14,.55,.14,materials.white,i,.4,sign*25);
    if(i<24){box(.12,.12,4,materials.white,sign*25,.55,i+2);box(4,.12,.12,materials.white,i+2,.55,sign*25);}
  }
  const avatar = new THREE.Group(); scene.add(avatar);
  const coat = mat('#346f87'), boots = materials.ink;
  const torso = mesh(new THREE.CapsuleGeometry(.29,.43,4,8),coat,0,.91,0,avatar);
  mesh(new THREE.SphereGeometry(.27,12,8),materials.white,0,1.58,0,avatar);
  cylinder(.3,.32,.16,materials.gold,0,1.76,0,12,avatar);
  cylinder(.37,.37,.05,materials.gold,0,1.69,0,12,avatar);
  box(.37,.45,.17,materials.gold,0,1.02,.27,avatar);
  const legs = [-1,1].map(sign=>mesh(new THREE.CapsuleGeometry(.11,.27,3,6),boots,sign*.15,.34,0,avatar));
  const arms = [-1,1].map(sign=>mesh(new THREE.CapsuleGeometry(.09,.3,3,6),coat,sign*.37,.98,0,avatar));
  const shadow = mesh(new THREE.CircleGeometry(.48,24),new THREE.MeshBasicMaterial({color:'#386269',transparent:true,opacity:.2,depthWrite:false}),0,.14,0,avatar);shadow.rotation.x=-Math.PI/2;shadow.castShadow=false;
  let position = {...app.state().position};
  if (obstacles.some(o=>Math.abs(position.x-o.x)<o.w/2+.4&&Math.abs(position.z-o.z)<o.d/2+.4)) position={x:0,z:8};
  avatar.position.set(position.x,.12,position.z);
  let yaw=.48, targetYaw=.48, elevation=.85, targetElevation=.85, distance=40, targetDistance=40, walkTime=0, last=0, raf=0, dirty=false, saveClock=0, nearest=null, drag=null, moved=false;
  let run=false,jumpHeight=0,jumpSpeed=0;
  const playWorld=createPlayWorld({THREE,scene,camera,avatar,mesh,box,cylinder,mat,materials,app,coat,sun,ambient,host,obstacles});
  if(obstacles.some(o=>Math.abs(position.x-o.x)<o.w/2+.4&&Math.abs(position.z-o.z)<o.d/2+.4)){position={x:0,z:8};avatar.position.set(0,.12,8);}
  const keys = new Set(), touches = new Set(), target = new THREE.Vector3();
  const nearbyName=document.getElementById('nearby-name'), interact=document.getElementById('interact');
  function release() {keys.clear();touches.clear();drag=null;}
  function persist() {if(dirty){dirty=false;app.setPosition(position);}}
  function interactWith(){if(nearest){persist();release();if(nearest.kind==='puzzle')window.dispatchEvent(new CustomEvent('fq:puzzle',{detail:nearest.id}));else app.openCase(nearest.id);}}
  function jump(){if(app.isWorld()&&jumpHeight===0)jumpSpeed=7.2;}
  window.addEventListener('keydown',e=>{
    if(!app.isWorld()||e.altKey||e.ctrlKey||e.metaKey)return;
    if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d','W','A','S','D'].includes(e.key)){keys.add(e.key.toLowerCase());e.preventDefault();}
    if(e.key==='Shift'){keys.add('shift');e.preventDefault();}
    if(e.code==='Space'&&!e.repeat&&e.target===host){e.preventDefault();jump();}
    if(e.key.toLowerCase()==='e'&&!e.repeat&&nearest){e.preventDefault();interactWith();}
  });
  window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
  window.addEventListener('blur',()=>{release();persist();});
  window.addEventListener('pagehide',persist);
  interact.addEventListener('click',interactWith);
  document.getElementById('run-toggle').addEventListener('click',e=>{run=!run;e.currentTarget.setAttribute('aria-pressed',run);});
  document.getElementById('jump-button').addEventListener('click',jump);
  window.addEventListener('fq:travel',e=>{const p=e.detail;if(!Number.isFinite(p?.x)||!Number.isFinite(p?.z))return;position={x:Math.max(-24,Math.min(24,p.x)),z:Math.max(-24,Math.min(24,p.z))};avatar.position.set(position.x,.12,position.z);release();dirty=true;persist();wake();});
  window.addEventListener('fq:festival',()=>{position={x:0,z:8};avatar.position.set(0,.12,8);targetDistance=host.clientWidth<700?53:49;release();dirty=true;persist();wake();});
  function tapMove(direction) {
    if(!app.isWorld())return;
    const horizontal=direction==='right'?1:direction==='left'?-1:0,forward=direction==='up'?1:direction==='down'?-1:0;
    const speed=run?.85:.5;
    const dx=(horizontal*Math.cos(yaw)-forward*Math.sin(yaw))*speed,dz=(-horizontal*Math.sin(yaw)-forward*Math.cos(yaw))*speed;
    position=window.FQ_ENGINE.move(position,dx,dz,obstacles);avatar.position.set(position.x,.12,position.z);avatar.rotation.y=Math.atan2(-dx,-dz);dirty=true;persist();wake();
  }
  document.querySelectorAll('[data-move]').forEach(b=>{
    let pressedAt=null;
    b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);pressedAt={...position};touches.add(b.dataset.move);});
    b.addEventListener('pointerup',()=>{touches.delete(b.dataset.move);if(pressedAt&&Math.hypot(position.x-pressedAt.x,position.z-pressedAt.z)<.18)tapMove(b.dataset.move);pressedAt=null;});
    for(const type of ['pointercancel','lostpointercapture'])b.addEventListener(type,()=>{touches.delete(b.dataset.move);pressedAt=null;});
    b.addEventListener('click',e=>{if(e.detail===0)tapMove(b.dataset.move);});
  });
  host.addEventListener('pointerdown',e=>{if(e.button!==0||!app.isWorld())return;host.focus({preventScroll:true});host.setPointerCapture(e.pointerId);drag={x:e.clientX,y:e.clientY,id:e.pointerId};});
  host.addEventListener('pointermove',e=>{
    if(!drag||drag.id!==e.pointerId||app.state().motion)return;
    targetYaw-=(e.clientX-drag.x)*.007;targetElevation=Math.max(.45,Math.min(1.2,targetElevation+(e.clientY-drag.y)*.005));drag={x:e.clientX,y:e.clientY,id:e.pointerId};
  });
  for(const type of ['pointerup','pointercancel','lostpointercapture'])host.addEventListener(type,()=>drag=null);
  host.addEventListener('wheel',e=>{if(!app.isWorld())return;e.preventDefault();targetDistance=Math.max(25,Math.min(75,targetDistance+e.deltaY*.025));},{passive:false});
  document.getElementById('camera-reset').addEventListener('click',()=>{targetYaw=.48;targetElevation=.85;targetDistance=host.clientWidth<700?48:40;});
  function resize(){
    const w=host.clientWidth,h=host.clientHeight;if(!w||!h)return;
    renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();
    if(w<700&&distance===40)distance=targetDistance=48;
    wake();
  }
  new ResizeObserver(resize).observe(host);
  const projected = new THREE.Vector3();
  function draw(time,dt) {
    const quiet=app.state().motion;
    let horizontal=(keys.has('d')||keys.has('arrowright')||touches.has('right')?1:0)-(keys.has('a')||keys.has('arrowleft')||touches.has('left')?1:0);
    let forward=(keys.has('w')||keys.has('arrowup')||touches.has('up')?1:0)-(keys.has('s')||keys.has('arrowdown')||touches.has('down')?1:0);
    const moving=horizontal!==0||forward!==0;
    if(moving){
      const len=Math.hypot(horizontal,forward);horizontal/=len;forward/=len;
      const speed=run||keys.has('shift')?8.5:5.8;
      const dx=(horizontal*Math.cos(yaw)-forward*Math.sin(yaw))*speed*dt, dz=(-horizontal*Math.sin(yaw)-forward*Math.cos(yaw))*speed*dt;
      const next=window.FQ_ENGINE.move(position,dx,dz,obstacles);position=next;avatar.position.set(next.x,.12,next.z);avatar.rotation.y=Math.atan2(-dx,-dz);
      walkTime+=dt*10;dirty=true;moved=true;
    } else if(moved){persist();moved=false;}
    saveClock+=dt;if(saveClock>2){persist();saveClock=0;}
    if(jumpSpeed!==0||jumpHeight>0){jumpHeight=Math.max(0,jumpHeight+jumpSpeed*dt);jumpSpeed-=18*dt;if(jumpHeight===0)jumpSpeed=0;}
    avatar.position.y=.12+jumpHeight;shadow.position.y=.14-jumpHeight;
    legs.forEach((leg,i)=>leg.rotation.x=moving&&!quiet?Math.sin(walkTime+i*Math.PI)*.52:0);
    arms.forEach((arm,i)=>arm.rotation.x=moving&&!quiet?-Math.sin(walkTime+i*Math.PI)*.4:0);
    torso.position.y=moving&&!quiet?.91+Math.sin(walkTime*2)*.025:.91;
    const damping=quiet?1:1-Math.exp(-7*dt);
    if(quiet){targetYaw=.48;targetElevation=.85;}
    yaw+=(targetYaw-yaw)*damping;elevation+=(targetElevation-elevation)*damping;distance+=(targetDistance-distance)*damping;
    const follow=host.clientWidth<700?.82:.64;
    target.set(position.x*follow,0,position.z*follow);
    camera.position.set(target.x+Math.sin(yaw)*Math.cos(elevation)*distance,Math.sin(elevation)*distance,target.z+Math.cos(yaw)*Math.cos(elevation)*distance);camera.lookAt(target);
    document.querySelector('.world-compass span').style.transform=`rotate(${Math.atan2(Math.sin(yaw),Math.cos(yaw)*Math.sin(elevation))}rad)`;
    centralLight.rotation.y=quiet?0:time*.00025;
    let best=null,bestDistance=3.1;
    const w=host.clientWidth,h=host.clientHeight;
    nodes.forEach((node,i)=>{
      const dist=Math.hypot(position.x-node.x,position.z-node.z);
      if(dist<bestDistance){best=node;bestDistance=dist;}
      node.lantern.position.y=1.85+(quiet?0:Math.sin(time*.0018+i)*.13);node.lantern.rotation.y=quiet?0:time*.0005;
      projected.set(node.x,3.25,node.z).project(camera);
      const x=(projected.x*.5+.5)*w,y=(-projected.y*.5+.5)*h;
      // Keep labels outside the title and status overlays; the map lists all sites.
      const overTitle=x<(w<700?285:425)&&y<255,overStatus=x>w-190&&y<180;
      node.label.hidden=projected.z>1||projected.z<0||x<45||x>w-45||y<25||y>h-135||overTitle||overStatus||dist>(w<700?18:30);
      node.label.style.left=`${x}px`;node.label.style.top=`${y}px`;
      node.ring.scale.setScalar(dist<3.1?1.08:1);
    });
    for(const node of playWorld.interactables){const dist=Math.hypot(position.x-node.x,position.z-node.z);if(dist<bestDistance){best=node;bestDistance=dist;}}
    if(nearest!==best){nearest=best;interact.disabled=!best;nearbyName.textContent=best?`${best.c.number} ${best.c.place}`:'光の輪に近づいて、相談をひらく';}
    playWorld.update(time,dt,position,quiet);
    // Place nearby labels first and prevent overlap with other labels or controls.
    const blocked=[...document.querySelectorAll('.world-heading,.world-progress,#guide-bubble,#nearby,.play-actions,.world-bottom')].map(el=>el.getBoundingClientRect());
    const labels=[...nodes,...playWorld.interactables].filter(n=>!n.label.hidden).sort((a,b)=>Math.hypot(position.x-a.x,position.z-a.z)-Math.hypot(position.x-b.x,position.z-b.z));
    const labelRects=labels.map(n=>({node:n,rect:n.label.getBoundingClientRect()}));
    for(const {node,rect} of labelRects){if(blocked.some(b=>rect.left<b.right+5&&rect.right>b.left-5&&rect.top<b.bottom+5&&rect.bottom>b.top-5))node.label.hidden=true;else blocked.push(rect);}
    renderer.render(scene,camera);
  }
  function frame(time){raf=0;if(!app.isWorld()){last=0;return;}const dt=last?Math.min((time-last)/1000,.04):.016;last=time;draw(time,dt);raf=requestAnimationFrame(frame);}
  function wake(){if(app.isWorld()&&!raf)raf=requestAnimationFrame(frame);}
  function updateState(){
    const completed=app.state().completed;
    nodes.forEach(n=>{const done=completed.includes(n.id);n.link.visible=done;n.label.classList.toggle('done',done);n.lanternMat.color.set(done?'#ffe4a1':palette[(Number(n.c.number)-1)%4]);n.lanternMat.emissiveIntensity=done?.8:.35;});
    centralLight.material.emissiveIntensity=.15+completed.length*.1;
    playWorld.onState();
    wake();
  }
  window.addEventListener('fq:state',updateState);
  window.addEventListener('fq:page',()=>{release();persist();wake();});
  document.addEventListener('visibilitychange',()=>{release();persist();wake();});
  document.getElementById('help-dialog').addEventListener('close',wake);
  renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();cancelAnimationFrame(raf);raf=0;app.worldFailed();});
  resize();updateState();app.worldReady();wake();
}
