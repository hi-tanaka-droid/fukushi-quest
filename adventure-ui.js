(function(){
  'use strict';
  const A=window.FQ_APP,P=window.FQ_PLAY,$=id=>document.getElementById(id);
  let tab='missions',puzzleId=null,message='',lastHint=null;
  const state=()=>A.state(),a=()=>state().adventure;
  function header(text,sub){return `<div class="page-title"><div><p class="eyebrow">探検・パズル</p><h1>${text}</h1><p class="muted">${sub}</p></div><button class="secondary" data-action="world">3Dの街へ ↗</button></div>`;}
  function updateHUD(){
    $('shard-count').textContent=`${a().shards.length} / 12`;$('puzzle-count').textContent=`${a().solved.length} / 3`;
  }
  function hub(){
    puzzleId=null;
    const tabs=`<div class="toolbar ad-tabs" role="group" aria-label="探検メモの内容">${[['missions','寄り道パズル'],['collection','かけら図鑑'],['style','着替え・街づくり']].map(([id,name])=>`<button data-action="ad-tab" data-id="${id}" aria-pressed="${tab===id}">${name}</button>`).join('')}</div>`;
    const hero=`<section class="ad-hero"><div class="ad-buddy" aria-hidden="true"><span>✧</span></div><div><p class="eyebrow">案内灯のランプより</p><h2>${P.festivalReady(state())?'全部そろった！街の灯りを見に行こう。':'かけらを集め、パズルを解こう。'}</h2><p>光のかけら12個・パズル3つ・8か所の学習をすべて終えると、街に灯りが浮かぶ演出を見られるよ。</p><div class="ad-meters"><span>✦ かけら <b>${a().shards.length}/12</b></span><span>◇ 回路 <b>${a().solved.length}/3</b></span><span>✧ 学び <b>${state().completed.length}/8</b></span></div>${P.festivalReady(state())?'<button class="primary" data-action="ad-festival">街に浮かぶ灯りを見る ✧</button>':'<button class="secondary" data-action="ad-guide" data-id="next">かけらを探しに行く →</button>'}</div></section>`;
    let body='';
    if(tab==='missions')body=`<div class="ad-puzzles">${P.puzzles.map((p,i)=>`<article class="ad-puzzle-card"><div class="ad-puzzle-art art-${i}" aria-hidden="true">${['⌁','⌘','✧'][i]}</div><div><p class="eyebrow">寄り道 ${i+1} / ${p.size} × ${p.size}</p><h2>${p.name}</h2><p>${p.description}</p><p class="ad-reward">${a().solved.includes(p.id)?'✓ 光がつながった':'ごほうび：街づくりの選択肢が増える'}</p><div class="buttons"><button class="primary" data-action="ad-puzzle" data-id="${p.id}">${a().solved.includes(p.id)?'もう一度遊ぶ':'タイルをつなぐ'} →</button><button class="link-button" data-action="ad-travel" data-id="${p.id}">街で見に行く</button></div></div></article>`).join('')}</div><p class="ad-footnote">タイルのパズルは、自由に遊べる寄り道です。授業の確認問題は「旅の地図」から開けます。</p>`;
    if(tab==='collection')body=`<div class="ad-collection">${P.shards.map((s,i)=>`<button class="ad-shard ${a().shards.includes(s.id)?'found':''}" data-action="ad-guide" data-id="${s.id}"><span class="shard-art" aria-hidden="true">${a().shards.includes(s.id)?'✦':'◇'}</span><small>NO. ${String(i+1).padStart(2,'0')}</small><strong>${s.name}</strong><span>${a().shards.includes(s.id)?'✓ 見つけた':'道しるべをつける ↗'}</span></button>`).join('')}</div>`;
    if(tab==='style')body=`<div class="ad-style">${[['outfit','旅のコート','かけら'],['decor','広場の飾り','回路'],['sky','空の色','回路']].map(([group,name,unit])=>`<section class="note-section"><h2>${name}</h2><div class="ad-style-options">${P.configs[group].map((item,i)=>`<button class="ad-style-choice ${a()[group]===item.id?'selected':''}" data-action="ad-style" data-group="${group}" data-id="${item.id}" ${P.available(a(),group,item.id)?'':'disabled'} aria-pressed="${a()[group]===item.id}"><span class="style-swatch ${group}-${item.id}" ${item.color?`style="--swatch:${item.color}"`:''} aria-hidden="true">${group==='outfit'?'◡':group==='decor'?['✿','⚑','✧'][i]:['☀','◒','☾'][i]}</span><strong>${item.name}</strong><small>${a()[group]===item.id?'使用中':P.available(a(),group,item.id)?'選べます':`${unit} ${item.need}${group==='outfit'?'個':'つ'}で使える`}</small></button>`).join('')}</div></section>`).join('')}</div><button class="primary" data-action="world">選んだ街へ戻る ↗</button>`;
    A.openPage('adventure',header('探検メモ','寄り道も、学びも。好きな順番で。')+hero+tabs+body);
  }
  function puzzle(id){
    const p=P.puzzles.find(p=>p.id===id);if(!p)return;
    puzzleId=id;message='';lastHint=null;
    A.openPage('adventure',`<div class="breadcrumb"><button data-action="adventure">← 探検メモ</button><span>寄り道パズル</span></div>${header(p.name,'タイルを押すと90度回転。左の入口から右の出口へ、光の道をつなごう。')}<div class="puzzle-layout"><section class="puzzle-panel"><div class="puzzle-legend"><span>入口 →</span><strong>${p.size} × ${p.size}</strong><span>→ 出口</span></div><div class="puzzle-frame"><div class="puzzle-port inlet" style="--row:${(p.row+.5)/p.size*100}%">→</div><div id="tile-grid" class="tile-grid" style="--size:${p.size}" role="group" aria-label="回転できる光のタイル"></div><div class="puzzle-port outlet" style="--row:${(p.row+.5)/p.size*100}%">→</div></div><p class="puzzle-tip">金色のタイルには、入口から光が届いているよ。</p><div class="puzzle-controls"><button class="primary" data-action="ad-check">つながりを確かめる ✧</button><button class="secondary" data-action="ad-hint">1枚の向きを見る</button><button class="link-button" data-action="ad-reset">最初の配置に戻す</button></div><div id="puzzle-result" aria-live="polite"></div></section><aside class="puzzle-aside"><div class="ad-buddy small" aria-hidden="true"><span>✧</span></div><h2>少し回して、見てみよう。</h2><p>光が途切れるところから考えてみて。遠回りしても、出口につながればOK。</p><p>何度でもやり直せるよ。ヒントを使っても、ごほうびは同じ。</p><div class="puzzle-reward"><span>つながった回路</span><strong>${a().solved.length} / 3</strong><p>1つで風の飾りと夕暮れ、2つで星の飾り、3つで夜の空が使える。</p></div></aside></div>`);
    drawBoard();
  }
  function drawBoard(focusIndex=null){
    const p=P.puzzles.find(p=>p.id===puzzleId);if(!p||!$('tile-grid'))return;
    const rotations=P.board(a(),p),ts=P.tiles(p),power=P.trace(p,rotations),names=['上','右','下','左'];
    $('tile-grid').innerHTML=ts.map((t,i)=>{
      const ends=t.base.map(d=>(d+rotations[i])%4),paths=t.base.map(d=>`M50 50 L${[50,100,50,0][d]} ${[0,50,100,50][d]}`).join(' ');
      return `<button class="light-tile ${power.lit.includes(i)?'lit':''} ${lastHint===i?'hinted':''}" data-action="ad-turn" data-index="${i}" aria-label="${Math.floor(i/p.size)+1}行${i%p.size+1}列、${ends.map(d=>names[d]).join('と')}につながるタイルを回す"><svg viewBox="0 0 100 100" aria-hidden="true"><g transform="rotate(${rotations[i]*90} 50 50)"><path class="pipe-shadow" d="${paths}"/><path class="pipe" d="${paths}"/><circle cx="50" cy="50" r="9"/></g></svg></button>`;
    }).join('');
    document.querySelector('.outlet').classList.toggle('lit',power.connected);
    $('puzzle-result').innerHTML=message;
    if(focusIndex!==null)$('tile-grid').querySelector(`[data-index="${focusIndex}"]`)?.focus({preventScroll:true});
  }
  document.addEventListener('click',event=>{
    const el=event.target.closest('[data-action]');if(!el||el.disabled)return;const action=el.dataset.action;
    if(action==='adventure')hub();
    else if(action==='ad-tab'){tab=el.dataset.id;hub();}
    else if(action==='ad-puzzle')puzzle(el.dataset.id);
    else if(action==='ad-turn'){const index=Number(el.dataset.index);P.turn(a(),puzzleId,index);lastHint=null;message='';A.save();drawBoard(index);}
    else if(action==='ad-hint'){lastHint=P.hint(a(),puzzleId);message=`<p class="puzzle-note">${lastHint===null?'道の向きはそろっているよ。つながりを確かめよう。':'輪で囲んだ1枚を回したよ。ここから前後につなげてみよう。'}</p>`;A.save();drawBoard();}
    else if(action==='ad-check'){
      if(P.solve(a(),puzzleId)){A.save();message=`<div class="puzzle-success"><span aria-hidden="true">✧</span><div><h2>光が、つながった！</h2><p>回路 ${a().solved.length} / 3。街づくりで新しい景色を選ぼう。</p><button class="primary" data-action="ad-style-hub">ごほうびを見に行く →</button></div></div>`;window.dispatchEvent(new CustomEvent('fq:spark'));}
      else {const p=P.puzzles.find(p=>p.id===puzzleId);message=`<p class="puzzle-note">まだ出口まで届いていないみたい。${P.trace(p,P.board(a(),p)).lit.length?'金色と青色の境目を見てみよう。':'まず、入口のすぐ右のタイルを回してみよう。'}</p>`;}
      drawBoard();$('puzzle-result').scrollIntoView({block:'nearest'});
    } else if(action==='ad-reset'){const p=P.puzzles.find(p=>p.id===puzzleId);a().boards[p.id]=P.initial(p);message='';lastHint=null;A.save();drawBoard();}
    else if(action==='ad-style-hub'){tab='style';hub();}
    else if(action==='ad-style'){
      if(P.available(a(),el.dataset.group,el.dataset.id)){const y=window.scrollY,group=el.dataset.group,id=el.dataset.id;a()[group]=id;A.save();hub();window.scrollTo(0,y);document.querySelector(`[data-action="ad-style"][data-group="${group}"][data-id="${id}"]`)?.focus({preventScroll:true});A.toast('街に戻ると、選んだ景色になるよ。');}
    } else if(action==='ad-guide'){
      const requested=P.shards.find(s=>s.id===el.dataset.id);
      const target=requested&&!a().shards.includes(requested.id)?requested:P.shards.find(s=>!a().shards.includes(s.id));
      A.goWorld();if(target)window.dispatchEvent(new CustomEvent('fq:guide',{detail:target.id}));else A.toast('12個すべて見つけたね！ 次は光の回路をつないでみよう。');
    } else if(action==='ad-travel'){
      const p=P.puzzles.find(p=>p.id===el.dataset.id);if(p){A.goWorld();window.dispatchEvent(new CustomEvent('fq:travel',{detail:{x:p.x,z:p.z+2}}));}
    } else if(action==='ad-festival'&&P.festivalReady(state())){
      a().festival=true;a().sky='night';A.save();A.goWorld();window.dispatchEvent(new CustomEvent('fq:festival'));A.toast('街の上に灯りが浮かんだよ。広場を見てみよう。');
    }
  });
  window.addEventListener('fq:state',updateHUD);
  window.addEventListener('fq:puzzle',e=>puzzle(e.detail));
  window.addEventListener('fq:collected',e=>{
    const count=a().shards.length;
    A.toast(`✦ ${e.detail.name}！ かけら ${count} / 12${count===4?' · 若葉のコートが使えるよ':count===8?' · すみれのコートが使えるよ':count===12?' · 全部見つけた！':''}`);
  });
  updateHUD();
})();
