export function createPlayWorld({THREE,scene,camera,avatar,mesh,box,cylinder,mat,materials,app,coat,sun,ambient,host,obstacles}){
  const P=window.FQ_PLAY,a=()=>app.state().adventure,shards=[],interactables=[],bursts=[],caseDecor=[];
  const gold=mat('#ffd079',{emissive:'#ffc052',emissiveIntensity:.65}),blue=mat('#72c5d3',{emissive:'#50b6d2',emissiveIntensity:.35});
  const labelHost=document.getElementById('location-labels'),guide=document.getElementById('guide-message');
  let targetId=P.shards.find(s=>!a().shards.includes(s.id))?.id,guideText='',lastStyle='';
  const setGuide=text=>{if(text!==guideText){guide.textContent=text;guideText=text;}};
  const ringGeo=new THREE.RingGeometry(.5,.65,24);
  for(const s of P.shards){
    const group=new THREE.Group();group.position.set(s.x,0,s.z);scene.add(group);
    const core=mesh(new THREE.OctahedronGeometry(.35),gold,0,1.05,0,group);
    const halo=mesh(new THREE.TorusGeometry(.55,.035,5,24),gold,0,1.05,0,group);halo.rotation.y=Math.PI/4;
    const ring=mesh(ringGeo,new THREE.MeshBasicMaterial({color:'#e1a643',side:THREE.DoubleSide}),0,.14,0,group);ring.rotation.x=-Math.PI/2;ring.castShadow=false;
    shards.push({...s,group,core,halo});
  }
  for(const p of P.puzzles){
    obstacles.push({x:p.x,z:p.z,w:1.5,d:1.3});
    const group=new THREE.Group();group.position.set(p.x,0,p.z);scene.add(group);
    cylinder(1.15,1.35,.2,materials.white,0,.2,0,16,group);
    box(1.5,.85,1.3,materials.ink,0,.7,0,group);
    const panel=box(1.6,.1,1.45,blue,0,1.18,0,group);panel.rotation.x=.15;
    for(let i=0;i<9;i++){const tile=box(.34,.06,.34,i%3===0?gold:materials.white,-.47+(i%3)*.47,1.28,-.46+Math.floor(i/3)*.46,group);tile.rotation.y=(i%2)*Math.PI/2;}
    const sign=mesh(new THREE.OctahedronGeometry(.48),blue,0,2.15,0,group);
    const ring=mesh(new THREE.RingGeometry(1.65,1.85,40),new THREE.MeshBasicMaterial({color:'#6aaebf',side:THREE.DoubleSide}),0,.135,0,group);ring.rotation.x=-Math.PI/2;ring.castShadow=false;
    const label=document.createElement('div');label.className='location-label puzzle-label';label.innerHTML=`<b>◇</b>${p.name}`;labelHost.appendChild(label);
    interactables.push({...p,kind:'puzzle',c:{number:'◇',place:p.name},group,sign,label});
  }
  // A small imaginary guide. Its reactions describe the game, never the value of people.
  const buddy=new THREE.Group();scene.add(buddy);
  cylinder(.22,.18,.48,gold,0,0,0,8,buddy);cylinder(.26,.26,.06,materials.ink,0,.28,0,8,buddy);cylinder(.26,.26,.05,materials.ink,0,-.28,0,8,buddy);
  mesh(new THREE.TorusGeometry(.14,.025,4,12),materials.ink,0,.42,0,buddy);
  for(const x of [-.09,.09])mesh(new THREE.SphereGeometry(.035,6,4),materials.ink,x,.035,-.2,buddy);
  buddy.position.set(avatar.position.x+1.15,1.8,avatar.position.z+.6);
  const pointer=mesh(new THREE.ConeGeometry(.22,.5,5),gold,0,3,0);pointer.rotation.z=Math.PI;
  const garden=new THREE.Group(),flags=new THREE.Group(),stars=new THREE.Group();scene.add(garden,flags,stars);
  const moon=mesh(new THREE.SphereGeometry(.9,16,12),new THREE.MeshBasicMaterial({color:'#fff0b6'}),-8,13,-20);moon.castShadow=false;
  for(let i=0;i<12;i++){
    const angle=i*Math.PI/6,x=Math.cos(angle)*3.25,z=Math.sin(angle)*3.25;
    cylinder(.05,.06,.4,materials.leaf,x,.4,z,5,garden);mesh(new THREE.IcosahedronGeometry(.2),i%2?gold:materials.white,x,.66,z,garden);
    const flag=mesh(new THREE.ConeGeometry(.28,.65,3),i%2?blue:gold,x,3.4,z,flags);flag.rotation.z=Math.PI;flag.rotation.y=-angle;
    mesh(new THREE.OctahedronGeometry(.23),gold,x,3.5+(i%2)*.5,z,stars);
  }
  // Each completed lesson adds festival decorations. No claim about a real service's effect.
  const sites=[[-13,-13],[0,-16],[13,-13],[16,0],[13,13],[0,16],[-13,13],[-16,0]];
  sites.forEach(([x,z],i)=>{
    const group=new THREE.Group();group.position.set(x,0,z);scene.add(group);
    for(let k=0;k<5;k++){
      const angle=(k/5)*Math.PI*2,r=2.2;
      const lantern=mesh(new THREE.IcosahedronGeometry(.2),i%2?blue:gold,Math.cos(angle)*r,2.8+(k%2)*.35,Math.sin(angle)*r,group);
      cylinder(.025,.025,.65,materials.ink,lantern.position.x,2.3,lantern.position.z,5,group);
    }caseDecor.push(group);
  });
  const festival=new THREE.Group();scene.add(festival);const festivalLights=[];
  for(let i=0;i<32;i++){
    const angle=i*2.399963,r=4+i%6*2.8,x=Math.cos(angle)*r,z=Math.sin(angle)*r;
    const group=new THREE.Group();group.position.set(x,4+i%5*.8,z);festival.add(group);
    cylinder(.2,.25,.55,i%3?gold:blue,0,0,0,8,group);cylinder(.23,.23,.04,materials.ink,0,.3,0,8,group);
    festivalLights.push(group);
  }
  function burst(x,z){
    if(app.state().motion)return;
    const group=new THREE.Group();group.position.set(x,1,z);scene.add(group);
    const material=new THREE.MeshBasicMaterial({color:'#ffd788',transparent:true}),geometry=new THREE.OctahedronGeometry(.07);
    for(let i=0;i<14;i++){const spark=mesh(geometry,material,0,0,0,group);spark.castShadow=false;const ang=i*Math.PI*2/14;spark.userData.velocity=new THREE.Vector3(Math.cos(ang)*1.3,.8+(i%3)*.5,Math.sin(ang)*1.3);}
    bursts.push({group,material,geometry,t:0});
  }
  const projected=new THREE.Vector3(),buddyTarget=new THREE.Vector3();
  function update(time,dt,position,quiet){
    const w=host.clientWidth,h=host.clientHeight;
    for(const s of shards){
      if(!s.group.visible)continue;
      s.core.position.y=1.05+(quiet?0:Math.sin(time*.003+s.x)*.13);s.core.rotation.y=quiet?0:time*.001;s.halo.position.y=s.core.position.y;
      if(Math.hypot(position.x-s.x,position.z-s.z)<1.1&&P.collect(a(),s.id)){
        s.group.visible=false;burst(s.x,s.z);app.save();window.dispatchEvent(new CustomEvent('fq:collected',{detail:s}));
        if(targetId===s.id)targetId=P.shards.filter(s=>!a().shards.includes(s.id)).sort((s,t)=>Math.hypot(position.x-s.x,position.z-s.z)-Math.hypot(position.x-t.x,position.z-t.z))[0]?.id;
      }
    }
    buddyTarget.set(position.x+1.05,1.85+(quiet?0:Math.sin(time*.002)*.12),position.z+.6);
    buddy.position.lerp(buddyTarget,quiet?1:1-Math.exp(-6*dt));buddy.rotation.y=avatar.rotation.y;
    for(const p of interactables){
      p.sign.rotation.y=quiet?0:time*.0007;
      p.sign.position.y=2.15+(quiet?0:Math.sin(time*.002+p.x)*.1);
      projected.set(p.x,3.1,p.z).project(camera);const x=(projected.x*.5+.5)*w,y=(-projected.y*.5+.5)*h;
      p.label.hidden=projected.z>1||projected.z<0||x<45||x>w-45||y<30||y>h-140||(x<(w<700?280:440)&&y<270)||(x>w-195&&y<280)||Math.hypot(position.x-p.x,position.z-p.z)>26;
      p.label.style.left=`${x}px`;p.label.style.top=`${y}px`;
    }
    const goal=P.shards.find(s=>s.id===targetId&&!a().shards.includes(s.id));
    pointer.visible=!!goal;
    if(goal){pointer.position.set(goal.x,2.8+(quiet?0:Math.sin(time*.003)*.12),goal.z);const distance=Math.round(Math.hypot(position.x-goal.x,position.z-goal.z));setGuide(`「${goal.name}」まで、あと ${distance} 歩くらい。金色の矢印を探そう！`);}
    else if(a().festival)setGuide('灯りのまつり、はじまり！ 好きな景色で街を歩こう。');
    else if(P.festivalReady(app.state()))setGuide('準備ができたよ！ 探検メモから、まつりを始めよう。');
    else if(a().solved.length<3)setGuide('かけら、全部見つけたね！ 青い台座のパズルにも寄ってみよう。');
    else setGuide('パズルもできたね。残りの学びを集めて、まつりの準備を進めよう！');
    for(let i=bursts.length-1;i>=0;i--){const b=bursts[i];b.t+=dt;b.material.opacity=Math.max(0,1-b.t/1.2);for(const child of b.group.children){child.position.addScaledVector(child.userData.velocity,dt);child.userData.velocity.y-=dt*1.3;}if(quiet||b.t>1.2){scene.remove(b.group);b.geometry.dispose();b.material.dispose();bursts.splice(i,1);}}
    if(festival.visible&&!quiet)festivalLights.forEach((light,i)=>light.position.y=4+i%5*.8+Math.sin(time*.0005+i)*.35);
  }
  function onState(){
    shards.forEach(s=>s.group.visible=!a().shards.includes(s.id));
    interactables.forEach(p=>p.label.classList.toggle('done',a().solved.includes(p.id)));
    const config=P.configs.outfit.find(c=>c.id===a().outfit);coat.color.set(config.color);
    garden.visible=a().decor==='garden';flags.visible=a().decor==='flags';stars.visible=a().decor==='stars';
    caseDecor.forEach((group,i)=>group.visible=app.state().completed.includes(window.FQ_DATA.cases[i].id));festival.visible=a().festival;
    if(lastStyle!==a().sky){
      const colors={day:['#badbe5','#fff8e8','#fff3d5',2.8,3.2],sunset:['#edb995','#ffdabb','#ffd2a0',2.6,2.5],night:['#17354f','#b6d7ff','#aac6ee',1.05,.9]}[a().sky];
      const night=a().sky==='night';materials.water.color.set(night?'#234358':a().sky==='sunset'?'#c2967c':'#83b8c8');
      materials.window.color.set(night?'#ffdca0':'#88bac7');materials.window.emissive.set(night?'#efb956':'#000000');materials.window.emissiveIntensity=night?.9:0;moon.visible=night;
      scene.background.set(colors[0]);scene.fog.color.set(colors[0]);ambient.color.set(colors[1]);sun.color.set(colors[2]);ambient.intensity=colors[3];sun.intensity=colors[4];document.getElementById('world-screen').dataset.sky=a().sky;lastStyle=a().sky;
    }
  }
  window.addEventListener('fq:guide',e=>{targetId=e.detail;});
  window.addEventListener('fq:spark',()=>burst(avatar.position.x,avatar.position.z));
  window.addEventListener('fq:festival',()=>burst(0,3));
  onState();return {update,onState,interactables};
}
