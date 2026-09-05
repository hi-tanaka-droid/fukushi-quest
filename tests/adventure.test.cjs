const test=require('node:test'),assert=require('node:assert/strict'),P=require('../adventure.js'),E=require('../engine.js'),D=require('../content.js');
test('all three circuits start unsolved and have a connected intended solution',()=>{
  for(const p of P.puzzles){const a=P.fresh();assert.equal(P.trace(p,P.initial(p)).connected,false,p.id);assert.equal(P.solve(a,p.id),false);
    const ts=P.tiles(p);assert.ok(ts.every(t=>Number.isInteger(t.solution)));
    a.boards[p.id]=ts.map(t=>t.solution);assert.equal(P.trace(p,a.boards[p.id]).connected,true,p.id);assert.equal(P.solve(a,p.id),true);assert.equal(P.solve(a,p.id),true);assert.deepEqual(a.solved,[p.id]);
  }
});
test('hints lead to a solution without removing the earned decoration unlock',()=>{
  const a=P.fresh();for(const p of P.puzzles){let steps=0;while(P.hint(a,p.id)!==null){steps++;assert.ok(steps<=p.path.length);}
    assert.equal(P.solve(a,p.id),true);a.boards[p.id]=P.initial(p);
  }assert.equal(a.solved.length,3);assert.equal(P.available(a,'sky','night'),true);
});
test('every tile returns to the same state after four rotations',()=>{
  for(const p of P.puzzles){const a=P.fresh();for(let i=0;i<p.size*p.size;i++){const before=[...P.board(a,p)];for(let k=0;k<4;k++)assert.equal(P.turn(a,p.id,i),true);assert.deepEqual(P.board(a,p),before);}}
});
test('a port with no inlet connection cannot power an outlet',()=>{
  const p=P.puzzles[0],rot=P.tiles(p).map(t=>t.solution);rot[p.row*p.size]=(rot[p.row*p.size]+1)%4;
  assert.equal(P.trace(p,rot).connected,false);
});
test('shards are collected once and only valid identifiers can unlock outfits',()=>{
  const a=P.fresh();assert.equal(P.collect(a,'unknown'),false);for(const s of P.shards){assert.equal(P.collect(a,s.id),true);assert.equal(P.collect(a,s.id),false);}assert.equal(a.shards.length,12);assert.equal(P.available(a,'outfit','plum'),true);
  assert.equal(P.available(P.fresh(),'sky','night'),false);assert.equal(P.available(P.fresh(),'decor','stars'),false);
});
test('malformed adventure saves are filtered; previous learning saves remain intact',()=>{
  const a=P.sanitize({shards:['s01','s01','unknown'],solved:['brook','fake'],boards:{brook:[9]},outfit:'plum',sky:'night',decor:'flags'});
  assert.deepEqual(a.shards,['s01']);assert.deepEqual(a.solved,['brook']);assert.deepEqual(a.boards,{});assert.equal(a.outfit,'blue');assert.equal(a.sky,'day');assert.equal(a.decor,'flags');
  const s=E.fresh();delete s.adventure;for(const q of D.cases[0].questions)E.record(s,q,q.answer);s.completed=['dignity'];
  const upgraded=E.sanitize(s,D);assert.deepEqual(upgraded.completed,['dignity']);assert.equal(E.stats(upgraded,D).answered,3);assert.deepEqual(upgraded.adventure,P.fresh());
});
test('festival requires all three types of progress and survives a valid save',()=>{
  const s=E.fresh();s.adventure.festival=true;assert.equal(E.sanitize(s,D).adventure.festival,false);
  for(const c of D.cases){for(const q of c.questions)E.record(s,q,q.answer);s.completed.push(c.id);}
  for(const shard of P.shards)P.collect(s.adventure,shard.id);assert.equal(P.festivalReady(s),false);
  for(const p of P.puzzles){s.adventure.boards[p.id]=P.tiles(p).map(t=>t.solution);P.solve(s.adventure,p.id);}
  assert.equal(P.festivalReady(s),true);assert.equal(E.sanitize(s,D).adventure.festival,true);
});
