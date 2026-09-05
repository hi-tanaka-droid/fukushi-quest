(function(root){
  'use strict';
  const P=root.FQ_PLAY||(typeof require==='function'?require('./adventure.js'):null);
  function fresh(){return {version:4,contentVersion:'2026-09-05-r1',completed:[],seen:{},answers:{},resume:null,position:{x:0,z:8},motion:false,adventure:P.fresh()};}
  function grade(q,selected){return Array.isArray(selected)&&selected.length===new Set(selected).size&&selected.length===q.answer.length&&q.answer.every(id=>selected.includes(id));}
  function sanitize(raw,data){
    const s=fresh();if(!raw||raw.version!==4||raw.contentVersion!==data.contentVersion)return s;
    const ids=new Set(data.cases.map(c=>c.id));
    s.completed=[...new Set(Array.isArray(raw.completed)?raw.completed:[])].filter(id=>ids.has(id));
    for(const c of data.cases){
      s.seen[c.id]=[...new Set(Array.isArray(raw.seen?.[c.id])?raw.seen[c.id]:[])].filter(n=>Number.isInteger(n)&&n>=0&&n<c.clues.length);
      for(const q of c.questions){
        const a=raw.answers?.[q.id];if(!a||!Array.isArray(a.selected)||!a.selected.length)continue;
        const selected=[...new Set(a.selected)].filter(id=>q.options.some(o=>o.id===id));
        if(selected.length!==a.selected.length||(q.kind==='single'&&selected.length!==1))continue;
        s.answers[q.id]={selected,correct:grade(q,selected),attempts:Math.min(999,Math.max(1,Number.isInteger(a.attempts)?a.attempts:1))};
      }
    }
    s.completed=s.completed.filter(id=>data.cases.find(c=>c.id===id).questions.every(q=>s.answers[q.id]));
    if(ids.has(raw.resume?.id)&&Number.isInteger(raw.resume?.step)&&raw.resume.step>=0&&raw.resume.step<=3)s.resume={id:raw.resume.id,step:raw.resume.step};
    if(Number.isFinite(raw.position?.x)&&Number.isFinite(raw.position?.z))s.position={x:Math.max(-24,Math.min(24,raw.position.x)),z:Math.max(-24,Math.min(24,raw.position.z))};
    s.motion=raw.motion===true;s.adventure=P.sanitize(raw.adventure);if(!P.festivalReady(s))s.adventure.festival=false;return s;
  }
  function record(s,q,selected){
    if(!selected.length||(q.kind==='single'&&selected.length!==1)||selected.some(id=>!q.options.some(o=>o.id===id)))return null;
    const result={selected:[...selected],correct:grade(q,selected),attempts:(s.answers[q.id]?.attempts||0)+1};s.answers[q.id]=result;return result;
  }
  function weak(s,data){return data.cases.flatMap(c=>c.questions.filter(q=>s.answers[q.id]?.correct===false).map(q=>({caseId:c.id,questionId:q.id})));}
  function stats(s,data){const a=data.cases.flatMap(c=>c.questions).map(q=>s.answers[q.id]);return {answered:a.filter(Boolean).length,correct:a.filter(v=>v?.correct).length,total:a.length,completed:s.completed.length,weak:weak(s,data).length};}
  function move(p,dx,dz,obstacles){
    const radius=.38,blocked=(x,z)=>Math.abs(x)>24||Math.abs(z)>24||obstacles.some(b=>x>b.x-b.w/2-radius&&x<b.x+b.w/2+radius&&z>b.z-b.d/2-radius&&z<b.z+b.d/2+radius);
    let x=p.x,z=p.z;if(!blocked(x+dx,z))x+=dx;if(!blocked(x,z+dz))z+=dz;return {x,z};
  }
  function validate(data){
    const errors=[],cids=new Set(),qids=new Set();
    for(const c of data.cases){
      if(cids.has(c.id))errors.push('duplicate case '+c.id);cids.add(c.id);
      if(c.clues.length!==3||c.questions.length!==3||!c.slides.length)errors.push('structure '+c.id);
      for(const q of c.questions){
        if(qids.has(q.id))errors.push('duplicate question '+q.id);qids.add(q.id);
        const ids=q.options.map(o=>o.id);
        if(new Set(ids).size!==ids.length||!q.answer.length||q.answer.some(a=>!ids.includes(a))||new Set(q.answer).size!==q.answer.length)errors.push('answer '+q.id);
        if(q.kind==='single'&&q.answer.length!==1||q.kind==='multi'&&q.answer.length!==2)errors.push('kind '+q.id);
        if(!q.explanation||!q.hint||q.options.some(o=>!o.why))errors.push('feedback '+q.id);
        for(const ref of [...q.refs,...c.refs])if(!data.sources[ref])errors.push('source '+q.id);
      }
    }return errors;
  }
  root.FQ_ENGINE={fresh,sanitize,grade,record,weak,stats,move,validate};
  if(typeof module!=='undefined'&&module.exports)module.exports=root.FQ_ENGINE;
})(typeof globalThis!=='undefined'?globalThis:this);
