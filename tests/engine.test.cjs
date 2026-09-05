const test=require('node:test'),assert=require('node:assert/strict'),D=require('../content.js'),E=require('../engine.js');
test('8 cases and 24 traceable questions have valid answer sets and feedback',()=>{
  assert.deepEqual(E.validate(D),[]);assert.equal(D.cases.length,8);assert.equal(E.stats(E.fresh(),D).total,24);
  for(const c of D.cases){assert.ok(c.slides.every(s=>s.file.endsWith('.pdf')&&s.pages.every(p=>Number.isInteger(p)&&p>0)));}
});
test('exhaust every possible answer subset for every question',()=>{
  for(const c of D.cases)for(const q of c.questions){
    let accepted=0;
    for(let bits=0;bits<(1<<q.options.length);bits++){
      const selected=q.options.filter((_,i)=>bits&(1<<i)).map(o=>o.id);
      if(E.grade(q,selected)){accepted++;assert.deepEqual(selected.slice().sort(),q.answer.slice().sort(),q.id);}
    }
    assert.equal(accepted,1,q.id);assert.equal(E.grade(q,[...q.answer,...q.answer]),false,q.id);assert.equal(E.grade(q,['unknown']),false,q.id);
  }
});
test('mistakes enter review and a later correct attempt replaces that result',()=>{
  const s=E.fresh(),q=D.cases[0].questions[0];E.record(s,q,['a']);
  assert.equal(E.weak(s,D).length,1);assert.equal(E.stats(s,D).correct,0);
  E.record(s,q,q.answer);assert.equal(E.weak(s,D).length,0);assert.equal(s.answers[q.id].attempts,2);assert.equal(E.stats(s,D).answered,1);
});
test('complete all cases, round-trip progress, and retain correct review after reload',()=>{
  const s=E.fresh();for(const c of D.cases){s.seen[c.id]=[0,1,2];for(const q of c.questions)E.record(s,q,q.answer);s.completed.push(c.id);}
  s.position={x:12.5,z:-8};s.motion=true;s.resume={id:D.cases[0].id,step:2};
  const restored=E.sanitize(JSON.parse(JSON.stringify(s)),D);assert.deepEqual(restored,s);assert.deepEqual(E.stats(restored,D),{answered:24,correct:24,total:24,completed:8,weak:0});
});
test('old, malformed, stale and forged save fields cannot become progress',()=>{
  for(const bad of [null,[],{},'x',{version:2},{...E.fresh(),contentVersion:'old'}])assert.deepEqual(E.sanitize(bad,D),E.fresh());
  const raw={...E.fresh(),completed:['fake','dignity','dignity'],seen:{dignity:[0,0,-1,3,'1']},answers:{d1:{selected:['fake'],correct:true},d2:{selected:['c'],correct:true,attempts:-1}},resume:{id:'fake',step:99},position:{x:1e10,z:-1e10}};
  const s=E.sanitize(raw,D);assert.deepEqual(s.completed,[]);assert.deepEqual(s.seen.dignity,[0]);assert.equal(s.answers.d1,undefined);assert.equal(s.answers.d2.correct,false);assert.equal(s.answers.d2.attempts,1);assert.equal(s.resume,null);assert.deepEqual(s.position,{x:24,z:-24});
});
test('empty or invalid answers are not recorded',()=>{
  const s=E.fresh(),q=D.cases[0].questions[0];assert.equal(E.record(s,q,[]),null);assert.equal(E.record(s,q,['x']),null);assert.equal(E.record(s,q,['a','b']),null);assert.deepEqual(s.answers,{});
});
test('movement blocks walls, slides along them, and stays inside the town',()=>{
  const o=[{x:2,z:0,w:2,d:2}];assert.deepEqual(E.move({x:.5,z:0},.3,.2,o),{x:.5,z:.2});
  assert.deepEqual(E.move({x:24,z:-24},.5,-.5,[]),{x:24,z:-24});
  assert.deepEqual(E.move({x:0,z:8},.1,-.1,o),{x:.1,z:7.9});
});
