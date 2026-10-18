/* Gift Hub engine — reads everything from config.js */
(() => {
  const C0 = window.GIFT_CONFIG;
  // Flat single-recipient config -> internal model (old multi-person configs still work)
  const C = C0.people ? C0 : { ...C0, people: { gift: {
    name: C0.name, avatar: C0.avatar, passcode: C0.passcode, lockTitle: C0.lockTitle, lockHint: C0.lockHint,
    wrongText: C0.wrongText, mascot: C0.mascot || {},
    events: [{ id: 'birthday', emoji: '🎂', title: 'Birthday', theme: C0.theme, intro: C0.intro,
      giftsTitle: C0.giftsTitle, giftsSubtitle: C0.giftsSubtitle, finale: C0.finale, boxes: C0.boxes }] } } };
  const $ = (s, r = document) => r.querySelector(s);

  /* ───────── helpers ───────── */
  function h(tag, props = {}, ...kids) {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(props)) {
      if (v === false || v == null) continue;
      if (k === 'class') e.className = v;
      else if (k === 'html') e.innerHTML = v;
      else if (k === 'style') e.style.cssText = v;
      else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
      else e.setAttribute(k, v);
    }
    kids.flat().forEach(c => {
      if (c === false || c == null) return;
      e.append(c.nodeType ? c : document.createTextNode(c));
    });
    return e;
  }
  // image with emoji fallback so missing files never break the page
  function pic(src, fb, cls = '') {
    if (!src) return h('span', { class: 'fb ' + cls }, fb);
    if (!/[./]/.test(src)) return h('span', { class: 'fb ' + cls }, src); // plain emoji
    const i = h('img', { src, alt: '', class: cls });
    i.onerror = () => i.replaceWith(h('span', { class: 'fb ' + cls }, fb));
    return i;
  }
  // Progress (opened boxes, redeemed coupons) is only remembered if config has rememberProgress: true
  const REMEMBER = !!C.rememberProgress;
  const store = {
    get(k) { if (!REMEMBER) return null; try { return localStorage.getItem('gifthub:' + k); } catch (e) { return null; } },
    set(k, v) { if (!REMEMBER) return; try { localStorage.setItem('gifthub:' + k, v); } catch (e) {} }
  };
  if (!REMEMBER) { try { Object.keys(localStorage).filter(k => k.startsWith('gifthub:')).forEach(k => localStorage.removeItem(k)); } catch (e) {} }
  const state = { pid: null, ei: null, screen: null, keyHandler: null, modalClose: null };
  const person = () => C.people[state.pid];
  const event = () => person().events[state.ei];

  function setTheme(t = {}) {
    const d = { ...{ p: '#c9172f', a: '#ff7597', bg: '#fff2f6', ink: '#8c1932' }, ...C.theme, ...t };
    const s = document.documentElement.style;
    s.setProperty('--p', d.p); s.setProperty('--a', d.a); s.setProperty('--bg', d.bg); s.setProperty('--ink', d.ink);
  }
  function show(node, name) {
    state.screen = name; state.keyHandler = null;
    const app = $('#app'); app.innerHTML = '';
    node.classList.add('screen'); app.append(node);
    requestAnimationFrame(() => node.classList.add('in'));
  }
  function toast(msg) {
    const t = $('#toast'); t.textContent = msg; t.classList.remove('hidden');
    clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.add('hidden'), 2600);
  }
  function confetti(n = 70) {
    const cols = ['#ff6b9d', '#ffd700', '#ff4db8', '#00bcd4', '#69f0ae', '#ff5722', '#b388ff'];
    for (let i = 0; i < n; i++) {
      const c = h('div', { class: 'confetti' });
      const sz = Math.random() * 9 + 7;
      c.style.cssText = `left:${Math.random() * 100}%;width:${sz}px;height:${sz}px;background:${cols[i % cols.length]};border-radius:${Math.random() > .5 ? '50%' : '3px'};--d:${Math.random() * 2.5 + 2}s;--dl:${Math.random() * 1.2}s`;
      document.body.append(c); setTimeout(() => c.remove(), 5200);
    }
  }
  const sparkleStars = (n = 10) => Array.from({ length: n }, (_, i) => {
    const cols = ['#26a69a', '#ff7043', '#ffb300', '#e91e63', '#ab47bc', '#42a5f5'];
    const s = h('span', { class: 'bgstar' }, i % 2 ? '★' : '✦');
    s.style.cssText = `top:${Math.random() * 92}%;left:${Math.random() * 94}%;color:${cols[i % cols.length]};font-size:${1 + Math.random() * .8}rem;animation-delay:${Math.random() * 2}s`;
    return s;
  });

  /* ───────── ambient background ───────── */
  (function ambient() {
    const bg = $('#bg-ambient');
    for (let i = 0; i < 14; i++) {
      const m = h('div', { class: 'mote' });
      const sz = Math.random() * 5 + 3;
      m.style.cssText = `width:${sz}px;height:${sz}px;left:${Math.random() * 100}%;bottom:${Math.random() * 25}%;--md:${Math.random() * 5 + 6}s;--mdl:-${Math.random() * 6}s`;
      bg.append(m);
    }
  })();

  /* ───────── opening curtains & countdown ───────── */
  function opening(done) {
    const cd = C.countdown;
    if (!cd || !cd.enabled) return done();
    const wrap = $('#curtains'); wrap.classList.remove('hidden');
    $('#cd-label').textContent = cd.label || '';
    let left = cd.seconds || 5;
    const num = $('#cd-num'); num.textContent = left;
    const iv = setInterval(() => {
      left--;
      if (left > 0) { num.textContent = left; num.classList.remove('pulse'); void num.offsetWidth; num.classList.add('pulse'); return; }
      clearInterval(iv);
      num.textContent = cd.endText || '🎉';
      setTimeout(() => {
        wrap.classList.add('open');
        done();
        setTimeout(() => wrap.classList.add('hidden'), 2400);
      }, 700);
    }, 1000);
  }

  /* ───────── screen: person picker ───────── */
  function pickerScreen() {
    setTheme();
    const ids = Object.keys(C.people);
    const cards = ids.map(id => {
      const p = C.people[id];
      return h('button', { class: 'person-card', onclick: () => choosePerson(id) },
        h('div', { class: 'avatar' }, pic(p.avatar, '🎁')),
        h('div', { class: 'pname' }, p.name),
        h('div', { class: 'pcount' }, `${p.events.length} surprise${p.events.length > 1 ? 's' : ''}`));
    });
    show(h('div', { class: 'center-screen' },
      ...sparkleStars(10),
      h('h1', { class: 'big-title' }, C.pickerTitle || "Who's opening a gift?"),
      h('p', { class: 'sub' }, C.pickerSubtitle || ''),
      h('div', { class: 'person-grid' }, cards)), 'picker');
  }
  function choosePerson(id) {
    state.pid = id;
    if (Object.keys(C.people).length > 1) { try { history.replaceState(null, '', '?to=' + encodeURIComponent(id)); } catch (e) {} }
    lockScreen();
  }

  /* ───────── screen: passcode ───────── */
  function lockScreen() {
    const P = person(); setTheme(P.events[0] && P.events[0].theme);
    const code = String(P.passcode), m = P.mascot || {};
    let typed = '', busy = false;
    const cameo = h('div', { class: 'cameo' }, pic(m.lock, '🧸'));
    const msg = h('p', { class: 'lock-msg' }, P.lockHint || `Enter the ${code.length}-digit passcode`);
    const bx = [...code].map(() => h('div', { class: 'pc-box' }));
    const card = h('div', { class: 'lock-card' });
    function paint() { bx.forEach((b, i) => { b.textContent = typed[i] ? '•' : ''; b.classList.toggle('active', i === typed.length); }); }
    function press(d) { if (busy || typed.length >= code.length) return; typed += d; paint(); if (typed.length === code.length) setTimeout(check, 220); }
    function del() { if (busy) return; typed = typed.slice(0, -1); paint(); }
    function check() {
      if (typed === code) { busy = true; confetti(60); afterUnlock(); return; }
      busy = true;
      cameo.replaceChildren(pic(m.wrong, '😵'));
      msg.textContent = P.wrongText || 'Wrong passcode! Try again 🥺';
      card.classList.remove('shake'); void card.offsetWidth; card.classList.add('shake');
      setTimeout(() => { typed = ''; busy = false; paint(); cameo.replaceChildren(pic(m.lock, '🧸')); msg.textContent = P.lockHint || ''; }, 1300);
    }
    const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(d => h('button', { class: 'key', onclick: () => press(d) }, d));
    keys.push(h('button', { class: 'key act', onclick: del }, '⌫'), h('button', { class: 'key', onclick: () => press('0') }, '0'),
      Object.keys(C.people).length > 1 ? h('button', { class: 'key act', onclick: pickerScreen, title: 'Switch person' }, '↩') : h('span'));
    card.append(
      h('div', { class: 'lock-left' }, ...sparkleStars(6), cameo),
      h('div', { class: 'lock-right' },
        h('h3', {}, P.lockTitle || 'Enter a passcode'), msg,
        h('div', { class: 'pc-boxes' }, bx), h('div', { class: 'keypad' }, keys)));
    show(card, 'lock'); paint();
    state.keyHandler = e => {
      if (e.key >= '0' && e.key <= '9') press(e.key);
      else if (e.key === 'Backspace') del();
    };
  }
  function afterUnlock() {
    const P = person();
    setTimeout(() => P.events.length > 1 ? eventsScreen() : introScreen(0), 450);
  }

  /* ───────── screen: events hub ───────── */
  function eventsScreen() {
    const P = person(); setTheme();
    const cards = P.events.map((ev, i) => {
      const locked = ev.unlockAt && new Date(ev.unlockAt) > new Date();
      const done = store.get(`done:${state.pid}:${ev.id}`);
      const c = h('button', { class: 'event-card' + (locked ? ' locked' : ''), style: `--ep:${(ev.theme && ev.theme.p) || '#c9172f'}`, onclick: () => {
        if (ev.unlockAt && new Date(ev.unlockAt) > new Date()) { toast(`🔒 Opens ${new Date(ev.unlockAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}`); return; }
        introScreen(i);
      } },
        h('div', { class: 'ev-emoji' }, locked ? '🔒' : ev.emoji || '🎁'),
        h('div', { class: 'ev-title' }, ev.title),
        h('div', { class: 'ev-date' }, locked ? 'Coming soon…' : ev.date || ''),
        done && h('div', { class: 'ev-done' }, '✓ opened'));
      return c;
    });
    show(h('div', { class: 'center-screen' }, ...sparkleStars(10),
      h('h1', { class: 'big-title' }, `Hi ${P.name}! 💖`),
      h('p', { class: 'sub' }, 'Pick a surprise to open'),
      h('div', { class: 'event-grid' }, cards),
      Object.keys(C.people).length > 1 && h('button', { class: 'link-btn', onclick: pickerScreen }, '↩ not you?')), 'events');
  }

  /* ───────── screen: intro (arched title + YES / NO) ───────── */
  function introScreen(ei) {
    state.ei = ei; const P = person(), ev = event(), m = P.mascot || {};
    setTheme(ev.theme);
    const I = { title: 'I have made something for you', prompt: 'Do you wanna see it ?', no: 'Are you sure? 🥺', excited: 'Are you really excited?', ...(ev.intro || {}) };
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg'); svg.setAttribute('viewBox', '0 0 1100 170'); svg.setAttribute('class', 'arch');
    svg.innerHTML = `<path id="arch" d="M 50,150 Q 550,20 1050,150" fill="none"/><text class="arch-text"><textPath id="arch-tp" href="#arch" startOffset="50%" text-anchor="middle"></textPath></text>`;
    const tp = svg.querySelector('#arch-tp'); tp.textContent = I.title;
    const gif = h('div', { class: 'dance' }, pic(m.dance, ev.emoji || '💃'));
    const prompt = h('h2', { class: 'prompt' }, I.prompt);
    const btns = h('div', { class: 'yn' });
    function pop(el) { el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); }
    function yes() { return h('button', { class: 'pill', onclick: stage1 }, 'YES'); }
    function stage1() { // "are you excited?"
      tp.textContent = I.excited; pop(svg); gif.replaceChildren(pic(m.excited, '🤩')); pop(gif);
      prompt.style.display = 'none'; btns.replaceChildren(h('button', { class: 'pill', onclick: go }, 'YES'), h('button', { class: 'pill', onclick: go }, 'YES'));
      pop(btns); confetti(30);
    }
    function no() { gif.replaceChildren(pic(m.pleading, '🥺')); pop(gif); prompt.textContent = I.no; pop(prompt); }
    function go() { confetti(70); setTimeout(giftsScreen, 350); }
    btns.append(yes(), h('button', { class: 'pill', onclick: no }, 'NO'));
    show(h('div', { class: 'gingham' }, h('div', { class: 'paper' }, ...sparkleStars(8), svg, gif, prompt, btns)), 'intro');
    pop(svg);
  }

  /* ───────── screen: gift boxes ───────── */
  const BOX_COLORS = ['#c9172f', '#d81b60', '#ef6c00', '#8e24aa', '#00897b', '#1e88e5', '#6d4c41', '#43a047'];
  function heartSVG() {
    return `<svg viewBox="0 0 260 220" class="heart-svg"><path d="M 30,85 C 30,135 130,185 130,185 C 130,185 230,135 230,85 L 230,115 C 230,165 130,212 130,212 C 130,212 30,165 30,115 Z" fill="rgba(0,0,0,.38)"/>
    <path d="M 130,180 C 130,180 30,130 30,80 C 30,42 60,25 90,25 C 112,25 125,40 130,52 C 135,40 148,25 170,25 C 200,25 230,42 230,80 C 230,130 130,180 130,180 Z" fill="var(--bx)"/>
    <path d="M 85,25 Q 110,95 140,175 L 122,176 Q 95,95 68,27 Z M 175,25 Q 150,95 120,175 L 138,176 Q 165,95 192,27 Z" fill="rgba(255,255,255,.2)"/>
    <g fill="none" stroke="#fff" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"><path d="M 130,95 C 105,72 78,82 84,102 C 89,116 112,110 130,98 C 148,110 171,116 176,102 C 182,82 155,72 130,95 Z"/><path d="M 126,102 Q 115,130 102,148 M 134,102 Q 145,130 158,148" stroke-width="3.5"/></g><circle cx="130" cy="97" r="7.5" fill="#fff"/></svg>`;
  }
  function giftsScreen() {
    const P = person(), ev = event(), m = P.mascot || {};
    setTheme(ev.theme);
    const opened = new Set(JSON.parse(store.get(`open:${state.pid}:${ev.id}`) || '[]'));
    const total = ev.boxes.length;
    const progress = h('div', { class: 'progress' });
    function upd() { progress.textContent = `${opened.size} / ${total} opened`; }
    const items = ev.boxes.map((b, i) => {
      const el = h('div', { class: 'mbox' + (opened.has(i) ? ' opened' : ''), style: `--bx:${b.color || BOX_COLORS[i % BOX_COLORS.length]};animation-delay:${-i * .5}s`,
        onclick: () => openBox(i, el) },
        h('div', { class: 'heart', html: heartSVG() }),
        h('div', { class: 'mlabel' }, opened.has(i) ? `✓ ${b.label || b.type}` : '?'));
      return el;
    });
    function openBox(i, el) {
      confetti(24);
      openGift(ev.boxes[i], () => {
        opened.add(i); store.set(`open:${state.pid}:${ev.id}`, JSON.stringify([...opened]));
        el.classList.add('opened'); $('.mlabel', el).textContent = `✓ ${ev.boxes[i].label || ev.boxes[i].type}`; upd();
        if (opened.size === total) {
          store.set(`done:${state.pid}:${ev.id}`, '1');
          setTimeout(() => { confetti(120); if (ev.finale) toast(ev.finale); }, 400);
        }
      });
    }
    const back = P.events.length > 1 && h('button', { class: 'back-btn', onclick: eventsScreen }, '← all surprises');
    show(h('div', { class: 'gifts' }, ...sparkleStars(10), back,
      h('div', { class: 'boxes' }, items),
      h('div', { class: 'cameo2' }, pic(m.gift, ev.emoji || '🎁')),
      h('h2', { class: 'g-title' }, ev.giftsTitle || 'Tap on the mystery box'),
      h('p', { class: 'g-sub' }, ev.giftsSubtitle || 'to unlock your gifts!'), progress), 'gifts');
    upd();
  }

  /* ───────── modal ───────── */
  function openGift(box, onOpened) {
    const body = $('#modal-body'); body.innerHTML = '';
    $('#modal-title').textContent = box.title || box.label || '';
    const cleanup = RENDER[box.type] ? RENDER[box.type](box, body) : (body.append(h('p', {}, `Unknown gift type: ${box.type}`)), null);
    state.modalClose = () => { if (typeof cleanup === 'function') cleanup(); body.innerHTML = ''; };
    $('#modal-card').dataset.type = box.type;
    $('#modal').classList.remove('hidden');
    state.onOpened = onOpened; if (onOpened) onOpened();
  }
  function closeModal() {
    if ($('#modal').classList.contains('hidden')) return;
    $('#modal').classList.add('hidden');
    if (state.modalClose) state.modalClose(); state.modalClose = null;
  }
  $('#modal-x').onclick = closeModal;
  $('#modal').addEventListener('click', e => { if (e.target.id === 'modal') closeModal(); });

  /* ───────── gift renderers ───────── */
  const RENDER = {};

  RENDER.gallery = (b, body) => {
    const track = h('div', { class: 'line-track' });
    (b.photos || []).forEach((p, i) => {
      const tilt = ['-3deg', '2.5deg', '-.5deg'][i % 3];
      const it = h('div', { class: 'hang', style: `--t:${tilt}`, onclick: e => { e.currentTarget.classList.add('sway'); confetti(14); setTimeout(() => e.currentTarget.classList.remove('sway'), 1100); } },
        h('div', { class: 'peg' }), h('div', { class: 'gframe' }, h('div', { class: 'gimg' }, pic(p.src, '🖼️')), h('div', { class: 'cap' }, p.caption || '')));
      track.append(it, h('div', { class: 'deco' }, i % 2 ? '🌺' : '🎀'));
    });
    const sc = d => track.scrollBy({ left: 240 * d, behavior: 'smooth' });
    body.append(h('div', { class: 'wire' }), track,
      h('div', { class: 'row-btns' }, h('button', { class: 'btn', onclick: () => sc(-1) }, '❮'), h('button', { class: 'btn', onclick: () => sc(1) }, '❯')),
      h('p', { class: 'hint' }, 'Tap a photo to see it sway 🌸'));
    const k = e => { if (e.key === 'ArrowRight') sc(1); if (e.key === 'ArrowLeft') sc(-1); };
    document.addEventListener('keydown', k); return () => document.removeEventListener('keydown', k);
  };

  RENDER.cake = (b, body) => {
    const n = b.candles || 7; let out = 0, wished = false;
    const xs = Array.from({ length: n }, (_, i) => n === 1 ? 200 : 125 + i * (150 / (n - 1)));
    const candles = xs.map((x, i) => `<g class="candle" data-i="${i}" transform="translate(${x},${92 + Math.abs(i - (n - 1) / 2) * 2})"><rect x="-5" y="0" width="10" height="42" rx="2" fill="#c9172f" stroke="#8c1932"/><line y2="-6" stroke="#222" stroke-width="2"/><g class="flame"><path d="M0,-30 C7,-18 7,-4 0,-2 C-7,-4 -7,-18 0,-30Z" fill="#ffca28"/><path d="M0,-22 C4,-14 4,-4 0,-3 C-4,-4 -4,-14 0,-22Z" fill="#ff7043"/></g></g>`).join('');
    const wrap = h('div', { class: 'cake-wrap', html: `<svg viewBox="0 0 400 300" class="cake-svg">
      <rect x="55" y="180" width="290" height="90" rx="16" fill="#eee5dc" stroke="#d7c8bb"/><path d="M55,196 q20,26 40,0 t40,0 t40,0 t40,0 t40,0 t40,0 t30,0 V180 H55Z" fill="#fff"/>
      <rect x="105" y="125" width="190" height="62" rx="14" fill="#f3ebe3" stroke="#d7c8bb"/><path d="M105,140 q24,26 48,0 t48,0 t48,0 t46,0 V125 H105Z" fill="#fff"/>
      <path d="M62,236 Q200,262 338,236" stroke="#c9172f" stroke-width="7" fill="none" stroke-linecap="round"/>${candles}</svg>` });
    const banner = h('div', { class: 'wish hidden' }, h('p', {}, '🎉 ' + (b.wish || 'Happy birthday! May all your wishes come true! 💖')),
      h('button', { class: 'btn', onclick: reset }, '🕯️ Relight'));
    const hint = h('p', { class: 'hint' }, '🕯️ Tap each candle to blow it out — or press Space for all at once');
    function blow(el) { const f = el.querySelector('.flame'); if (f.classList.contains('off')) return; f.classList.add('off'); out++; if (out >= n) setTimeout(wish, 300); }
    function wish() { if (wished) return; wished = true; wrap.querySelectorAll('.flame').forEach(f => f.classList.add('off')); out = n; confetti(110); banner.classList.remove('hidden'); hint.style.display = 'none'; }
    function reset() { wished = false; out = 0; wrap.querySelectorAll('.flame').forEach(f => f.classList.remove('off')); banner.classList.add('hidden'); hint.style.display = ''; }
    wrap.querySelectorAll('.candle').forEach(c => c.addEventListener('click', e => { e.stopPropagation(); blow(c); }));
    wrap.addEventListener('click', wish);
    body.append(wrap, hint, banner);
    const k = e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); wish(); } };
    document.addEventListener('keydown', k); return () => document.removeEventListener('keydown', k);
  };

  RENDER.letter = (b, body) => {
    const secs = [{ cls: 'l-head', text: b.headline || '' }, ...(b.paragraphs || []).map(t => ({ cls: 'l-para', text: t })), { cls: 'l-para l-close', text: b.closing || '' }].filter(s => s.text);
    const els = secs.map(s => h('p', { class: s.cls })); let timer, typing = true, si = 0, ci = 0;
    const cursor = h('span', { class: 'cursor' });
    function instant() { clearTimeout(timer); typing = false; secs.forEach((s, i) => { els[i].innerHTML = ''; s.text.split('\n').forEach((ln, j) => { if (j) els[i].append(h('br')); els[i].append(ln); }); }); cursor.remove(); }
    function step() {
      if (!typing) return;
      if (si >= secs.length) { typing = false; setTimeout(() => cursor.remove(), 1500); return; }
      const chars = Array.from(secs[si].text);
      if (ci < chars.length) {
        const ch = chars[ci++]; ch === '\n' ? els[si].append(h('br')) : els[si].append(ch); els[si].append(cursor);
        timer = setTimeout(step, '.!?'.includes(ch) ? 110 : ch === ',' ? 50 : 17);
      } else { si++; ci = 0; timer = setTimeout(step, 150); }
    }
    body.append(h('div', { class: 'letter', onclick: () => typing && instant() },
      b.photo && h('div', { class: 'l-photo' }, h('div', { class: 'gimg big' }, pic(b.photo, '🖼️')), h('div', { class: 'bow' }, '🎀')),
      h('div', { class: 'l-text' }, els)),
      h('p', { class: 'hint' }, 'Tap the letter to reveal it instantly'));
    timer = setTimeout(step, 400); return () => { typing = false; clearTimeout(timer); };
  };

  RENDER.quiz = (b, body) => {
    let qi = 0, score = 0; const Q = b.questions || [];
    const box = h('div', { class: 'quiz' }); body.append(box);
    function render() {
      box.innerHTML = '';
      if (qi >= Q.length) {
        const r = b.results || []; const msg = r.length ? r[Math.min(r.length - 1, Math.floor(score / Q.length * (r.length - .001)))] : '';
        box.append(h('div', { class: 'score' }, `${score} / ${Q.length}`), h('p', { class: 'big-msg' }, msg), h('button', { class: 'btn', onclick: () => { qi = 0; score = 0; render(); } }, '↻ Again'));
        if (score === Q.length) confetti(90); return;
      }
      const q = Q[qi]; const fb = h('p', { class: 'fbk' });
      box.append(h('div', { class: 'qn' }, `Question ${qi + 1} of ${Q.length}`), h('h4', {}, q.q),
        h('div', { class: 'opts' }, q.options.map((o, i) => h('button', { class: 'opt', onclick: e => {
          if (box.dataset.lock) return; box.dataset.lock = 1;
          const ok = i === q.answer; if (ok) score++;
          e.currentTarget.classList.add(ok ? 'good' : 'bad');
          if (!ok) box.querySelectorAll('.opt')[q.answer].classList.add('good');
          fb.textContent = (ok ? '✅ ' : '💭 ') + (q.explain || '');
          setTimeout(() => { delete box.dataset.lock; qi++; render(); }, 1500);
        } }, o))), fb);
    }
    render();
  };

  RENDER.scratch = (b, body) => {
    const W = 320, H = 170;
    const canvas = h('canvas', { width: W, height: H, class: 'scr-canvas' });
    const prize = h('div', { class: 'prize' }, h('div', {}, b.prize || '🎁 Surprise!'));
    body.append(h('p', { class: 'hint' }, b.note || 'Scratch to reveal!'), h('div', { class: 'scr-wrap' }, prize, canvas));
    const g = canvas.getContext('2d');
    const gr = g.createLinearGradient(0, 0, W, H); gr.addColorStop(0, '#cfd8dc'); gr.addColorStop(.5, '#eceff1'); gr.addColorStop(1, '#b0bec5');
    g.fillStyle = gr; g.fillRect(0, 0, W, H); g.fillStyle = '#78909c'; g.font = '700 22px Poppins,sans-serif'; g.textAlign = 'center'; g.fillText('✨ SCRATCH HERE ✨', W / 2, H / 2 + 8);
    g.globalCompositeOperation = 'destination-out'; let down = false, done = false, cnt = 0;
    const pos = e => { const r = canvas.getBoundingClientRect(); const t = e.touches ? e.touches[0] : e; return [(t.clientX - r.left) * W / r.width, (t.clientY - r.top) * H / r.height]; };
    function scratch(e) {
      if (!down || done) return; e.preventDefault(); const [x, y] = pos(e);
      g.beginPath(); g.arc(x, y, 17, 0, 7); g.fill();
      if (++cnt % 12 === 0) {
        const d = g.getImageData(0, 0, W, H).data; let c = 0; for (let i = 3; i < d.length; i += 16) if (d[i] === 0) c++;
        if (c / (d.length / 16) > .45) { done = true; canvas.style.transition = 'opacity .6s'; canvas.style.opacity = 0; confetti(90); }
      }
    }
    ['mousedown', 'touchstart'].forEach(ev => canvas.addEventListener(ev, e => { down = true; scratch(e); }, { passive: false }));
    ['mousemove', 'touchmove'].forEach(ev => canvas.addEventListener(ev, scratch, { passive: false }));
    ['mouseup', 'mouseleave', 'touchend'].forEach(ev => canvas.addEventListener(ev, () => down = false));
  };

  RENDER.reasons = (b, body) => {
    const R = [...(b.reasons || [])]; let pool = [...R], n = 0;
    const card = h('div', { class: 'reason' }, 'Tap the jar to pull a reason 💌');
    const cnt = h('p', { class: 'hint' }, `0 / ${R.length}`);
    body.append(h('button', { class: 'jar', onclick: () => {
      if (!pool.length) pool = [...R], n = 0;
      const i = Math.floor(Math.random() * pool.length); card.textContent = pool.splice(i, 1)[0]; n++;
      card.classList.remove('pop'); void card.offsetWidth; card.classList.add('pop'); cnt.textContent = `${n} / ${R.length}`; if (n === R.length) confetti(60);
    } }, '🫙'), card, cnt);
  };

  RENDER.timeline = (b, body) => {
    body.append(h('div', { class: 'tl' }, (b.items || []).map((it, i) => h('div', { class: 'tl-item', style: `animation-delay:${i * .15}s` },
      h('div', { class: 'tl-dot' }), h('div', { class: 'tl-date' }, it.date || ''), h('div', { class: 'tl-title' }, it.title || ''), h('div', { class: 'tl-text' }, it.text || '')))));
  };

  RENDER.match = (b, body) => {
    const items = b.items || ['💖', '🌹', '🍫', '🎬', '✈️', '🎶'];
    let deck = [...items, ...items].map((v, i) => ({ v, i })).sort(() => Math.random() - .5);
    let first = null, lock = false, moves = 0, found = 0;
    const info = h('p', { class: 'hint' }, 'Moves: 0');
    const grid = h('div', { class: 'mgrid' });
    deck.forEach(d => {
      const c = h('button', { class: 'mcard' }, h('div', { class: 'mface front' }, '?'), h('div', { class: 'mface back' }, pic(d.v, '❓')));
      c.onclick = () => {
        if (lock || c.classList.contains('flip') || c.classList.contains('ok')) return;
        c.classList.add('flip');
        if (!first) { first = { c, v: d.v }; return; }
        moves++; info.textContent = 'Moves: ' + moves;
        if (first.v === d.v) { first.c.classList.add('ok'); c.classList.add('ok'); first = null; if (++found === items.length) { confetti(100); info.textContent = `🎉 Done in ${moves} moves!`; } }
        else { lock = true; const a = first.c; first = null; setTimeout(() => { a.classList.remove('flip'); c.classList.remove('flip'); lock = false; }, 800); }
      };
      grid.append(c);
    });
    body.append(grid, info);
  };

  RENDER.coupons = (b, body) => {
    const key = `coupon:${state.pid}:${event().id}:`;
    body.append(h('div', { class: 'coupons' }, (b.items || []).map((it, i) => {
      const c = h('div', { class: 'coupon' + (store.get(key + i) ? ' used' : '') },
        h('div', { class: 'c-title' }, it.title), h('div', { class: 'c-text' }, it.text || ''),
        h('button', { class: 'btn small', onclick: () => { c.classList.add('used'); store.set(key + i, '1'); confetti(30); } }, 'Redeem'));
      return c;
    })));
  };

  RENDER.wishes = (b, body) => {
    body.append(h('div', { class: 'wishes' }, (b.wishes || []).map((w, i) => h('div', { class: 'note', style: `--t:${(i % 2 ? 1 : -1) * (1 + (i % 3))}deg;animation-delay:${i * .12}s` },
      h('p', {}, w.text), h('div', { class: 'from' }, '— ' + w.from)))));
  };

  RENDER.certificate = (b, body) => {
    body.append(h('div', { class: 'cert' }, h('div', { class: 'cert-in' },
      h('div', { class: 'cert-seal' }, '🏅'), h('h3', {}, b.heading || 'Certificate'), h('p', { class: 'c-small' }, 'proudly presented to'),
      h('div', { class: 'cert-name' }, b.recipient || person().name), h('p', { class: 'c-text2' }, b.text || ''),
      h('div', { class: 'cert-sign' }, b.signedBy || ''))));
    setTimeout(() => confetti(60), 300);
  };

  RENDER.media = (b, body) => {
    const m = b.kind === 'video' ? h('video', { src: b.src, controls: true, class: 'media' }) : h('audio', { src: b.src, controls: true, class: 'media' });
    body.append(h('div', { class: 'media-wrap' }, h('div', { class: 'media-ico' }, b.kind === 'video' ? '🎬' : '🎧'), m, h('p', { class: 'hint' }, b.caption || '')));
    return () => m.pause && m.pause();
  };

  RENDER.message = (b, body) => {
    body.append(h('div', { class: 'msg' }, h('div', { class: 'msg-ico' }, b.icon || '🎁'), h('p', {}, b.text || '')));
  };

  /* ───────── global keys / hearts ───────── */
  window.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
    else if ($('#modal').classList.contains('hidden') && state.keyHandler) state.keyHandler(e);
  });
  let lastTrail = 0;
  document.addEventListener('mousemove', e => {
    const now = Date.now(); if (now - lastTrail < 130 || !$('#curtains').classList.contains('hidden')) return; lastTrail = now;
    const t = h('div', { class: 'trail' }, ['💖', '💗', '💕', '✨', '🌸'][Math.floor(Math.random() * 5)]);
    t.style.left = e.clientX - 10 + 'px'; t.style.top = e.clientY - 10 + 'px'; document.body.append(t); setTimeout(() => t.remove(), 800);
  });

  /* ───────── start ───────── */
  document.title = C.siteTitle || document.title;
  function start() {
    const ids = Object.keys(C.people);
    const want = new URLSearchParams(location.search).get('to');
    if (want && C.people[want]) choosePerson(want);
    else if (ids.length === 1) choosePerson(ids[0]);
    else pickerScreen();
  }
  opening(start);
  // show something behind the curtains while counting down
  if (C.countdown && C.countdown.enabled) $('#app').innerHTML = '';
})();
