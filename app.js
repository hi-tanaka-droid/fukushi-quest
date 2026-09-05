(function () {
  'use strict';
  const D = window.FQ_DATA, E = window.FQ_ENGINE, KEY = 'fukushi_quest_v4';
  const $ = id => document.getElementById(id);
  const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let state = E.fresh(), page = 'world', current = null, step = 0, selected = [], result = null, reviewQueue = [], reviewIndex = 0, reviewing = false, toastTimer;
  try { state = E.sanitize(JSON.parse(localStorage.getItem(KEY)), D); } catch { $('storage-alert').hidden = false; }
  const preferQuiet = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (preferQuiet) state.motion = true;
  const cById = id => D.cases.find(c => c.id === id);
  const seen = c => state.seen[c.id] || [];
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); $('storage-alert').hidden = true; }
    catch { $('storage-alert').hidden = false; }
    sync();
  }
  function sync() {
    $('weak-count').textContent = E.weak(state, D).length;
    $('world-count').innerHTML = `${state.completed.length} <small>/ 8</small>`;
    $('world-pips').innerHTML = D.cases.map(c => `<span class="${state.completed.includes(c.id) ? 'done' : ''}"></span>`).join('');
    $('continue-btn').textContent = state.completed.length === 8 ? '8つの灯りを振り返る ↗' : state.resume ? '途中の相談を続ける ↗' : state.completed.length ? '次の相談へ ↗' : '最初の相談へ ↗';
    $('motion-setting').checked = state.motion;
    window.dispatchEvent(new CustomEvent('fq:state'));
  }
  function toast(message) { clearTimeout(toastTimer); $('toast').textContent = message; $('toast').classList.add('on'); toastTimer = setTimeout(() => $('toast').classList.remove('on'), 3500); }
  function switchPage(name) {
    page = name; $('world-screen').hidden = name !== 'world'; $('page-screen').hidden = name === 'world';
    document.querySelectorAll('.topbar nav button').forEach(b => { if (b.dataset.action === name) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
    if ($('help-dialog').open) $('help-dialog').close();
    window.scrollTo(0, 0); window.dispatchEvent(new CustomEvent('fq:page'));
  }
  function focusPage() { const h = $('page-screen').querySelector('h1'); if (h) { h.tabIndex = -1; h.focus({preventScroll:true}); } }
  const title = (label, heading, description) => `<div class="page-title"><div><p class="eyebrow">${esc(label)}</p><h1>${esc(heading)}</h1><p class="muted">${esc(description)}</p></div><button class="secondary" data-action="world">街に戻る ↗</button></div>`;
  const sourceLink = id => { const s = D.sources[id]; return `<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.title)} ↗</a>`; };
  function sources(c, q) {
    const refs = [...new Set(q ? q.refs : c.refs)];
    return `<details class="sources"><summary>この問いの根拠・元スライド</summary><p>出題用の人物・会話は創作。事実確認の問いは、提示した手がかりに基づきます。</p><ul>${c.slides.map(s => `<li>${esc(s.file)} ／ PDF ${s.pages.join('・')}ページ</li>`).join('')}${refs.map(r => `<li>${sourceLink(r)}</li>`).join('')}</ul><p>ページ番号はPDFの先頭からの通し番号。制度の公式資料は2026年9月5日に確認。</p></details>`;
  }
  function renderMap() {
    reviewing = false; switchPage('map');
    $('page-screen').innerHTML = title('FIELD GUIDE / 01—08', '旅の地図', '気になる場所から始められます。ひとつの場所で、手がかり3枚と問い3つ。') +
      `<div class="intro-band"><div class="counter">${state.completed.length} / 8</div><p><strong>まちの灯りを、ひとつずつ。</strong>8つの視点を集めて、暮らしの見え方を広げよう。時間制限やゲームオーバーはありません。</p></div><div class="grid-map">${D.cases.map(c => `<button class="quest-card ${c.color}" data-action="case" data-id="${c.id}"><span class="card-top"><span class="quest-number">${c.number}</span><span class="seal" aria-hidden="true">${c.mark}</span></span><span class="eyebrow">${esc(c.place)}</span><h2>${esc(c.title)}</h2><small>${esc(c.theme)}</small><span class="card-status"><span class="${state.completed.includes(c.id) ? 'checked' : ''}">${state.completed.includes(c.id) ? '✓ 灯りをともした' : seen(c).length ? '手がかり ' + seen(c).length + ' / 3' : 'まだ訪れていない'}</span><span aria-hidden="true">↗</span></span></button>`).join('')}</div>`;
    if (state.completed.length === 8) $('page-screen').insertAdjacentHTML('beforeend', `<div class="intro-band"><p><strong>8つの灯りが、ともりました。</strong>まなびの書で全体をつなぎ、迷った問いをもう一度確かめられます。</p><button class="primary" data-action="notebook">まなびの書</button></div>`);
    focusPage();
  }
  function clueHTML(c) {
    return `<aside class="case-file" aria-label="事例と手がかり"><div class="cover"><p class="eyebrow">CASE FILE / 架空の事例</p><p class="goal">${esc(c.goal)}</p><p>${esc(c.intro)}</p></div>${c.clues.map((cl, i) => `<details class="clue" data-clue="${i}"><summary><span class="clue-tag">${esc(cl.label)}</span>${esc(cl.title)}<span class="clue-tick">${seen(c).includes(i) ? '✓' : '＋'}</span></summary><div class="clue-body"><p>${esc(cl.text)}</p>${cl.table ? `<table><thead><tr>${cl.table.headers.map(h => `<th scope="col">${esc(h)}</th>`).join('')}</tr></thead><tbody>${cl.table.rows.map(r => `<tr>${r.map(v => `<td>${esc(v)}</td>`).join('')}</tr>`).join('')}</tbody></table>` : ''}${cl.ref ? sourceLink(cl.ref) : ''}</div></details>`).join('')}</aside>`;
  }
  function openCase(id, resumeStep = 0) {
    const c = cById(id); if (!c) return;
    current = c; reviewing = false; step = seen(c).length === 3 ? Math.max(0, Math.min(3, resumeStep)) : 0;
    // A saved step may never bypass the explanations for preceding questions.
    if (step > 1 && !c.questions.slice(0, step - 1).every(q => state.answers[q.id])) step = 1;
    selected = []; result = step ? state.answers[c.questions[step - 1].id] || null : null;
    if (result) selected = [...result.selected];
    state.resume = {id, step}; save(); switchPage('case');
    $('page-screen').innerHTML = `<div class="breadcrumb"><button data-action="map">← 旅の地図</button><span>社会福祉原論A / ${c.number}</span></div><header class="case-head ${c.color}"><span class="seal" aria-hidden="true">${c.mark}</span><div><p class="eyebrow">${esc(c.place)} · ${esc(c.theme)}</p><h1>${esc(c.title)}</h1></div></header><div class="case-layout">${clueHTML(c)}<section class="study" id="study" aria-label="問いと解説"></section></div>`;
    $('page-screen').querySelectorAll('[data-clue]').forEach(el => el.addEventListener('toggle', () => {
      if (!el.open || current !== c) return;
      const n = Number(el.dataset.clue);
      if (!seen(c).includes(n)) { state.seen[c.id] = [...seen(c), n]; el.querySelector('.clue-tick').textContent = '✓'; save(); if (!step) renderStudy(); }
    }));
    renderStudy(); focusPage();
  }
  function questionHTML(c, q, label) {
    return `<div class="question-box"><div class="step-label"><span>${esc(label)}</span><span>${q.kind === 'multi' ? '2つ選ぶ' : '1つ選ぶ'}</span></div><h2 id="question-title">${esc(q.title)}</h2><p class="prompt">${esc(q.prompt)}</p><div class="choices" role="group" aria-labelledby="question-title">${q.options.map((o, i) => `<button class="choice ${result && q.answer.includes(o.id) ? 'answer-right' : result && selected.includes(o.id) ? 'answer-wrong' : ''}" data-action="answer" data-id="${o.id}" aria-pressed="${selected.includes(o.id)}" ${result ? 'disabled' : ''}><span class="letter" aria-hidden="true">${'ABCD'[i]}</span><span>${esc(o.text)}${result && q.answer.includes(o.id) ? '　✓ 根拠に対応' : ''}</span></button>`).join('')}</div>${!result ? `<div class="question-actions"><details class="hint"><summary>考えるヒント</summary><p>${esc(q.hint)}</p></details><button class="primary" data-action="check" ${selected.length === (q.kind === 'multi' ? 2 : 1) ? '' : 'disabled'}>解説を確かめる →</button></div>` : `<div class="feedback ${result.correct ? '' : 'rethink'}" id="feedback" role="status"><h3 tabindex="-1">${result.correct ? '根拠がつながりました。' : '手がかりを、もう一度。'}</h3><p>${esc(q.explanation)}</p><p class="correct-answer">対応する選択肢：${q.answer.map(id => 'ABCD'[q.options.findIndex(o => o.id === id)]).join('・')}</p><details class="option-notes"><summary>すべての選択肢の解説</summary><ul>${q.options.map((o, i) => `<li><strong>${'ABCD'[i]}.</strong> ${esc(o.why)}</li>`).join('')}</ul></details></div><div class="question-actions"><button class="secondary" data-action="retry">もう一度考える</button><button class="primary" data-action="next">${reviewing ? reviewIndex + 1 === reviewQueue.length ? '復習を終える' : '次の問いへ →' : step === 3 ? '街に灯りをともす →' : '次の問いへ →'}</button></div>`}${sources(c, q)}</div>`;
  }
  function renderStudy() {
    if (reviewing) return renderReviewQuestion();
    if (!step) {
      const count = seen(current).length;
      $('study').innerHTML = `<div class="checkpoint"><p class="eyebrow">FIRST, LISTEN.</p><h2>まずは、3つの手がかり。</h2><p>カードをひらいて、記録・本人の声・概念を確かめよう。問いを考えている間も、いつでも読み返せます。</p><p class="clue-status" aria-live="polite">見つけた手がかり ${count} / 3</p><button class="primary" data-action="start" ${count === 3 ? '' : 'disabled'}>3つの問いに進む →</button></div>${sources(current)}`;
    } else $('study').innerHTML = `<div class="stepper" aria-label="問い ${step} / 3">${[1,2,3].map(i => `<span class="${i < step ? 'done' : i === step ? 'active' : ''}"></span>`).join('')}</div>${questionHTML(current, current.questions[step - 1], `問い ${step} / 3`)}`;
  }
  function focusStudy(selector = '#question-title') { const el = $('page-screen').querySelector(selector); if (el) { el.tabIndex = -1; el.focus({preventScroll:true}); el.scrollIntoView({block:'nearest', behavior:'instant'}); } }
  function complete() {
    if (!current.questions.every(q => state.answers[q.id])) return;
    const firstTime = !state.completed.includes(current.id);
    if (firstTime) state.completed.push(current.id);
    state.resume = null; save();
    const all = state.completed.length === 8;
    $('study').innerHTML = `<div class="complete-box"><p class="eyebrow">${all ? 'ALL 8 LIGHTS CONNECTED' : 'A LIGHT FOR THE TOWN'}</p><div class="finish-emblem" aria-hidden="true">✧</div><h2>${all ? '8つの灯りが、ともりました。' : '街に、ひとつの灯り。'}</h2><p class="lesson">${esc(current.lesson)}</p><p>次に確かめたいこと：<br>${esc(current.next)}</p><p>${all ? '暮らしを一つのものさしだけで判断せず、声と記録、権利と制度をつないで考える。集めた視点は「まなびの書」に残りました。' : `集めた視点 ${state.completed.length} / 8。答えに迷った問いは、あとから復習できます。`}</p><div class="buttons"><button class="primary" data-action="world">3Dの街へ ↗</button><button class="secondary" data-action="${all ? 'notebook' : 'continue'}">${all ? 'まなびの書をひらく' : '次の相談へ'}</button></div></div>${sources(current)}`;
    focusStudy('.complete-box h2');
    if (firstTime) toast(`灯り ${state.completed.length} / 8 · ${current.theme}`);
  }
  function notebook() {
    reviewing = false; switchPage('notebook');
    const stats = E.stats(state, D);
    $('page-screen').innerHTML = title('THE BOOK OF PERSPECTIVES', 'まなびの書', `解説を開いた問い ${stats.answered} / 24。調べた記録と根拠を、ここで読み返せます。`) + `<div class="toolbar"><button data-action="sources">教材と確認資料</button><button data-action="review">迷った問いを復習（${stats.weak}）</button></div>` + D.cases.map(c => {
      const answered = c.questions.filter(q => state.answers[q.id]);
      return `<section class="note-section"><p class="eyebrow">${c.number} / ${esc(c.theme)}</p><h2>${esc(c.title)}</h2>${state.completed.includes(c.id) ? `<p>${esc(c.lesson)}</p>` : ''}${answered.length ? answered.map(q => `<details class="note-row"><summary><span class="tag ${state.answers[q.id].correct ? '' : 'weak'}">${state.answers[q.id].correct ? '✓ 根拠を確認' : 'もう一度考える'}</span>${esc(q.title)}</summary><p>${esc(q.prompt)}</p><p><strong>対応する選択肢</strong><br>${q.answer.map(id => esc(q.options.find(o => o.id === id).text)).join('<br>')}</p><p>${esc(q.explanation)}</p>${sources(c,q)}</details>`).join('') : '<p class="muted">まだ開いた解説はありません。</p>'}<button class="link-button" data-action="case" data-id="${c.id}">この場所を訪ねる →</button></section>`;
    }).join(''); focusPage();
  }
  function review() {
    reviewing = false; switchPage('review'); const weak = E.weak(state, D);
    $('page-screen').innerHTML = title('TRY ANOTHER LOOK', '迷った問いを、もう一度。', '選び直すたびに記録が更新されます。回数や速さは評価しません。') + (weak.length ? `<div class="empty"><h2>復習できる問いが ${weak.length} 問あります。</h2><p>手がかりを読み返しながら、自分のペースで確かめられます。</p><button class="primary" data-action="begin-review">復習を始める →</button></div>` : `<div class="empty"><h2>今、復習に残っている問いはありません。</h2><p>${E.stats(state,D).answered ? 'まなびの書から、これまでの解説を読み返せます。' : '相談先で問いを解くと、迷った問いがここに残ります。'}</p><button class="primary" data-action="${E.stats(state,D).answered ? 'notebook' : 'map'}">${E.stats(state,D).answered ? 'まなびの書へ' : '旅の地図へ'} →</button></div>`); focusPage();
  }
  function renderReviewQuestion() {
    const item = reviewQueue[reviewIndex]; if (!item) { reviewing = false; review(); toast('今回の復習を終えました。'); return; }
    current = cById(item.caseId); const q = current.questions.find(v => v.id === item.questionId);
    $('page-screen').innerHTML = title('REVIEW', '視点を集め直そう。', `今回の復習 ${reviewIndex + 1} / ${reviewQueue.length}`) + `<div class="review-box"><p class="review-case">${current.number} / ${esc(current.title)}</p><details class="sources"><summary>事例と3枚の手がかりを読み返す</summary><p>${esc(current.intro)}</p>${current.clues.map(cl => `<p><strong>${esc(cl.title)}</strong><br>${esc(cl.text)}</p>`).join('')}</details>${questionHTML(current,q,`復習 ${reviewIndex + 1} / ${reviewQueue.length}`)}</div>`;
  }
  function showSources() {
    reviewing = false; switchPage('sources');
    $('page-screen').innerHTML = title('SOURCE NOTES', '教材と確認資料', '社会福祉原論Aの元スライドに対応。PDFの図・写真・学生の記述は転載していません。') + `<section class="note-section"><h2>このゲームで扱う範囲</h2><p>人物・会話・街・数値の練習データは創作です。現実の制度に関する説明は公的資料で照合しました。制度の金額、統計ランキング、原因を一つに断定する説明、歴史上の「最初」の断定は出題しません。</p><p>授業全体を網羅する試験問題集ではありません。ゲームの正誤は、示した記録・目的・概念との対応を確かめるものです。</p><p>公式資料の確認日：2026年9月5日。外部リンクの閲覧には通信が必要です。</p></section><div class="source-list">${D.cases.map(c => `<section class="source-item"><h2>${c.number} ${esc(c.theme)}</h2><p>${c.slides.map(s => `${esc(s.file)} ／ PDF ${s.pages.join('・')}ページ`).join('<br>')}</p>${c.refs.map(r => `<p>${sourceLink(r)}</p>`).join('')}</section>`).join('')}</div><p class="sources">ページはPDFの先頭から数えた番号。配布形態により、スライド内の番号とは異なります。ゲームの記録はこの端末内に保存され、サーバーへ送信されません。</p>`; focusPage();
  }
  function activeQuestion() { return reviewing ? current.questions.find(q => q.id === reviewQueue[reviewIndex].questionId) : current?.questions[step - 1]; }
  document.addEventListener('click', event => {
    const b = event.target.closest('[data-action]'); if (!b || b.disabled) return;
    const action = b.dataset.action;
    if (action === 'world') { reviewing = false; switchPage('world'); $('world-canvas').focus({preventScroll:true}); }
    else if (action === 'map') renderMap();
    else if (action === 'notebook') notebook();
    else if (action === 'review') review();
    else if (action === 'help') { $('help-dialog').showModal(); window.dispatchEvent(new CustomEvent('fq:page')); }
    else if (action === 'sources') showSources();
    else if (action === 'case') openCase(b.dataset.id);
    else if (action === 'continue') {
      if (state.resume) openCase(state.resume.id,state.resume.step);
      else { const next = D.cases.find(c => !state.completed.includes(c.id)); if (next) openCase(next.id); else notebook(); }
    } else if (action === 'start' && current && seen(current).length === 3) {
      step = 1; result = null; selected = []; state.resume = {id:current.id,step}; save(); renderStudy(); focusStudy();
    } else if (action === 'answer' && !result) {
      const q = activeQuestion(); if (!q || !q.options.some(o => o.id === b.dataset.id)) return;
      if (q.kind === 'single') selected = [b.dataset.id];
      else if (selected.includes(b.dataset.id)) selected = selected.filter(id => id !== b.dataset.id);
      else if (selected.length < 2) selected.push(b.dataset.id);
      else { toast('2つ選べます。入れ替えるときは、選んだ項目をもう一度押してください。'); return; }
      document.querySelectorAll('[data-action="answer"]').forEach(el => el.setAttribute('aria-pressed',selected.includes(el.dataset.id)));
      document.querySelector('[data-action="check"]').disabled = selected.length !== (q.kind === 'multi' ? 2 : 1);
    } else if (action === 'check' && !result) {
      const q = activeQuestion(); if (!q || selected.length !== (q.kind === 'multi' ? 2 : 1)) return;
      result = E.record(state,q,selected); save(); renderStudy(); focusStudy('#feedback h3');
    } else if (action === 'retry') { result = null; selected = []; renderStudy(); focusStudy(); }
    else if (action === 'next' && result) {
      if (reviewing) { reviewIndex++; selected = []; result = null; renderReviewQuestion(); focusStudy(); }
      else if (step === 3) complete();
      else { step++; selected = []; result = null; state.resume = {id:current.id,step}; save(); renderStudy(); focusStudy(); }
    } else if (action === 'begin-review') {
      reviewQueue = E.weak(state,D); reviewIndex = 0; selected = []; result = null; reviewing = true; renderReviewQuestion(); focusStudy();
    }
  });
  $('motion-setting').addEventListener('change', e => { state.motion = e.target.checked; save(); });
  const worldFallback = () => { $('world-loading').hidden = true; $('world-fallback').hidden = false; };
  let worldStarted = false;
  window.FQ_APP = {
    state: () => state,
    isWorld: () => page === 'world' && !$('help-dialog').open && !document.hidden,
    openCase,
    save,
    pageName: () => page,
    openPage: (name,html) => { reviewing=false; switchPage(name); $('page-screen').innerHTML=html; focusPage(); },
    goWorld: () => { reviewing=false; switchPage('world'); $('world-canvas').focus({preventScroll:true}); },
    setPosition: p => { state.position = {x:p.x,z:p.z}; save(); },
    toast,
    worldReady: () => { worldStarted = true; $('world-loading').hidden = true; $('world-fallback').hidden = true; },
    worldFailed: worldFallback
  };
  setTimeout(() => { if (!worldStarted) worldFallback(); }, 15000);
  sync(); window.dispatchEvent(new CustomEvent('fq:ready'));
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    navigator.serviceWorker.register('./sw.js').then(async registration => {
      const setOffline = () => { $('offline-status').textContent = registration.active ? 'オフライン用データ：保存済み（外部の確認資料を除く）' : 'オフライン用データ：保存中'; };
      setOffline(); if (registration.installing) registration.installing.addEventListener('statechange',setOffline);
      await navigator.serviceWorker.ready; setOffline();
    }).catch(() => { $('offline-status').textContent = 'オフライン用データ：保存できませんでした。通信中は遊べます。'; });
  } else $('offline-status').textContent = 'この環境ではオフライン機能を利用できません。';
})();
