(function(root){
  'use strict';
  const shards = [
    {id:'s01',x:0,z:11,name:'広場の一歩'}, {id:'s02',x:5,z:14,name:'南のこみち'},
    {id:'s03',x:12,z:8,name:'木かげの灯り'}, {id:'s04',x:19,z:6,name:'水辺のきらめき'},
    {id:'s05',x:12,z:-6,name:'東の曲がり角'}, {id:'s06',x:6,z:-15,name:'北の並木道'},
    {id:'s07',x:-6,z:-16,name:'風の通り道'}, {id:'s08',x:-14,z:-6,name:'西の広場'},
    {id:'s09',x:-20,z:6,name:'水辺の寄り道'}, {id:'s10',x:-9,z:15,name:'帰りのこみち'},
    {id:'s11',x:6,z:0,name:'噴水のとなり'}, {id:'s12',x:-6,z:1,name:'はじまりの輪'}
  ];
  const puzzles = [
    {id:'brook',name:'小川の回路',size:3,row:1,x:5,z:10,description:'曲がり角を回して、向こう岸まで。',path:[[0,1],[1,1],[1,0],[2,0],[2,1]]},
    {id:'grove',name:'木かげの回路',size:4,row:2,x:-10,z:-3,description:'少し遠回り。でも、道はつながる。',path:[[0,2],[1,2],[1,3],[2,3],[2,2],[2,1],[1,1],[1,0],[2,0],[3,0],[3,1],[3,2]]},
    {id:'sky',name:'星空の回路',size:5,row:2,x:9,z:-10,description:'街をめぐる長い光の道。',path:[[0,2],[1,2],[1,3],[0,3],[0,4],[1,4],[2,4],[2,3],[2,2],[2,1],[1,1],[1,0],[2,0],[3,0],[3,1],[4,1],[4,2]]}
  ];
  const dirs=[[0,-1],[1,0],[0,1],[-1,0]], configs={
    outfit:[{id:'blue',name:'空色のコート',color:'#346f87',need:0},{id:'green',name:'若葉のコート',color:'#438c71',need:4},{id:'plum',name:'すみれのコート',color:'#8970a4',need:8}],
    decor:[{id:'garden',name:'花の広場',need:0},{id:'flags',name:'風の広場',need:1},{id:'stars',name:'星の広場',need:2}],
    sky:[{id:'day',name:'昼の街',need:0},{id:'sunset',name:'夕暮れの街',need:1},{id:'night',name:'夜の街',need:3}]
  };
  const fresh=()=>({shards:[],solved:[],boards:{},outfit:'blue',decor:'garden',sky:'day',festival:false});
  function tiles(p){
    const board=Array.from({length:p.size*p.size},(_,i)=>({base:i%3===0?[1,3]:[0,1],solution:0}));
    p.path.forEach(([x,y],i)=>{
      const prev=i?p.path[i-1]:[-1,p.row],next=i<p.path.length-1?p.path[i+1]:[p.size,p.row];
      const ends=[prev,next].map(([nx,ny])=>dirs.findIndex(([dx,dy])=>x+dx===nx&&y+dy===ny)).sort();
      const base=(ends[1]-ends[0]===2)?[1,3]:[0,1];
      const rotation=[0,1,2,3].find(r=>base.map(d=>(d+r)%4).sort().join()===ends.join());
      board[y*p.size+x]={base,solution:rotation};
    });return board;
  }
  function initial(p){return tiles(p).map((t,i)=>(t.solution+1+i%3)%4);}
  function board(a,p){return a.boards[p.id] || initial(p);}
  function trace(p,rotations){
    const ts=tiles(p),n=p.size,connections=ts.map((t,i)=>t.base.map(d=>(d+rotations[i])%4)),seen=new Set(),queue=[];
    const start=p.row*n;if(connections[start].includes(3)){seen.add(start);queue.push(start);}
    while(queue.length){const i=queue.shift(),x=i%n,y=Math.floor(i/n);
      for(const d of connections[i]){const [dx,dy]=dirs[d],nx=x+dx,ny=y+dy;if(nx<0||nx>=n||ny<0||ny>=n)continue;
        const j=ny*n+nx;if(connections[j].includes((d+2)%4)&&!seen.has(j)){seen.add(j);queue.push(j);}}
    }
    const end=p.row*n+n-1;return {lit:[...seen],connected:seen.has(end)&&connections[end].includes(1)};
  }
  function available(a,group,id){const item=configs[group]?.find(c=>c.id===id);return !!item&&(group==='outfit'?a.shards.length:a.solved.length)>=item.need;}
  function sanitize(raw){
    const a=fresh();if(!raw||typeof raw!=='object')return a;
    a.shards=[...new Set(Array.isArray(raw.shards)?raw.shards:[])].filter(id=>shards.some(s=>s.id===id));
    a.solved=[...new Set(Array.isArray(raw.solved)?raw.solved:[])].filter(id=>puzzles.some(p=>p.id===id));
    for(const p of puzzles){const r=raw.boards?.[p.id];if(Array.isArray(r)&&r.length===p.size*p.size&&r.every(v=>Number.isInteger(v)&&v>=0&&v<=3))a.boards[p.id]=[...r];}
    for(const group of Object.keys(configs))if(available(a,group,raw[group]))a[group]=raw[group];
    a.festival=raw.festival===true;return a;
  }
  function collect(a,id){if(!shards.some(s=>s.id===id)||a.shards.includes(id))return false;a.shards.push(id);return true;}
  function turn(a,id,index){const p=puzzles.find(p=>p.id===id);if(!p||!Number.isInteger(index)||index<0||index>=p.size*p.size)return false;const r=[...board(a,p)];r[index]=(r[index]+1)%4;a.boards[id]=r;return true;}
  function hint(a,id){const p=puzzles.find(p=>p.id===id);if(!p)return null;const r=[...board(a,p)],ts=tiles(p);
    const i=p.path.map(([x,y])=>y*p.size+x).find(i=>ts[i].base.map(d=>(d+r[i])%4).sort().join()!==ts[i].base.map(d=>(d+ts[i].solution)%4).sort().join());
    if(i===undefined)return null;r[i]=ts[i].solution;a.boards[id]=r;return i;
  }
  function solve(a,id){const p=puzzles.find(p=>p.id===id);if(!p||!trace(p,board(a,p)).connected)return false;if(!a.solved.includes(id))a.solved.push(id);return true;}
  function festivalReady(s){return s.completed.length===8&&s.adventure.shards.length===12&&s.adventure.solved.length===3;}
  root.FQ_PLAY={shards,puzzles,configs,dirs,fresh,tiles,initial,board,trace,available,sanitize,collect,turn,hint,solve,festivalReady};
  if(typeof module!=='undefined'&&module.exports)module.exports=root.FQ_PLAY;
})(typeof globalThis!=='undefined'?globalThis:this);
