/* Eva Music extras: widget helpers, car mode, follow artists, themes, hum/voice search,
   karaoke, Eva Wrapped, playlist import, sleep timer. Loaded after the main page. */
(function(){
'use strict';
const X = () => window.__eva;
const NATIVE = !!(window.EvaNative && window.EvaNative.request);
const LS = {
  get(k, d){ try { const v = localStorage.getItem(k); return v === null ? d : v; } catch(e){ return d; } },
  set(k, v){ try { localStorage.setItem(k, v); } catch(e){} }
};
const J = (k, d) => { try { return JSON.parse(LS.get(k, '')) || d; } catch(e){ return d; } };
const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const toast = m => { try { X().toast(m); } catch(e){} };
const nreq = (m, a) => X().nreq(m, a);

/* ---------- icons (inline, small) ---------- */
const I = {
  car: '<path d="M5 16V11l1.6-4.2A2 2 0 0 1 8.5 5.5h7a2 2 0 0 1 1.9 1.3L19 11v5M5 16h14M5 16v2.5M19 16v2.5"/><circle cx="8" cy="13.5" r=".9"/><circle cx="16" cy="13.5" r=".9"/>',
  mic: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
  mix: '<path d="M4 7h4l8 10h4M4 17h4l2.5-3M13.5 10 16 7h4M18 5l2 2-2 2M18 15l2 2-2 2"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  star: '<path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.8 6.8 19.6l1-5.8L3.5 9.7l5.9-.8z"/>',
  moon: '<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z"/>',
  mic2: '<path d="M12 3a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3ZM5 11a7 7 0 0 0 14 0M12 18v3"/>',
  palette: '<path d="M12 3a9 9 0 1 0 0 18c1.2 0 1.8-.8 1.5-1.8-.3-1 .3-2 1.4-2H17a4 4 0 0 0 4-4C21 7 17 3 12 3Z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10" cy="7.5" r="1"/><circle cx="14.5" cy="7.5" r="1"/>',
  prev: '<path d="M6 5v14M19 5v14L9 12z"/>',
  next: '<path d="M18 5v14M5 5v14l10-7z"/>',
  play: '<path d="M7 4.5v15l12-7.5z"/>',
  pause: '<path d="M7 5h4v14H7zM13 5h4v14h-4z"/>',
  heart: '<path d="M12 20s-7.5-4.6-7.5-10A4.2 4.2 0 0 1 12 7.6 4.2 4.2 0 0 1 19.500 10c0 5.400-7.500 10-7.500 10Z"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  warn: '<path d="M12 8v5M12 17h.01"/><circle cx="12" cy="12" r="9"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15zM10 20a2 2 0 0 0 4 0"/>',
  share: '<path d="M12 15V4M8 8l4-4 4 4M5 12v7h14v-7"/>',
};
const svg = (n, sz, sw, fill) => `<svg width="${sz||22}" height="${sz||22}" viewBox="0 0 24 24" fill="${fill||'none'}" stroke="${fill?'none':'currentColor'}" stroke-width="${sw||2}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[n]||''}</svg>`;

/* ---------- styles ---------- */
const css = document.createElement('style');
css.textContent = `
html[data-bg=grey][data-scheme=dark]{--bg:#25272b;--s1:#2e3135;--s2:#373a3f;--s3:#41454a;--s4:#4f5459;--hdr-a:#43464b;--hdr-b:#2a2c30;--navbg:#2e3135;--sheetbg:#2b2e32;--wash2:#202225}
.xchips{display:flex;gap:8px;overflow-x:auto;padding:4px 16px 14px;scrollbar-width:none}
.xchips::-webkit-scrollbar{display:none}
.xchip{flex:none;display:flex;align-items:center;gap:8px;min-height:44px;padding:0 16px 0 12px;border-radius:99px;border:0;background:var(--s2);color:var(--ink);font:600 14px/1 inherit;font-family:inherit;cursor:pointer}
.xchip:active{transform:scale(.97)}
.xchip svg{color:var(--acc)}
.xo{position:fixed;inset:0;z-index:95;display:flex;flex-direction:column;background:var(--bg);color:var(--ink);font-family:inherit;animation:xin .22s ease-out;overflow:hidden}
@keyframes xin{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
.xo .xtop{display:flex;align-items:center;gap:12px;padding:calc(14px + env(safe-area-inset-top,0px)) 16px 8px}
.xo .xtop h2{flex:1;margin:0;font-size:26px;font-weight:700;letter-spacing:-.01em}
.xbtn{min-width:48px;height:48px;border-radius:24px;border:0;background:var(--s2);color:var(--ink);display:inline-grid;place-items:center;font:600 15px inherit;font-family:inherit;cursor:pointer;padding:0 18px}
.xbtn.sq{width:48px;padding:0}
.xbtn.pri{background:var(--acc);color:var(--on-acc,#000)}
.xbtn:disabled{opacity:.45}
.xbtn:focus-visible,.xchip:focus-visible,.xseg button:focus-visible,.xsw:focus-visible{outline:3px solid var(--acc);outline-offset:2px}
.xbody{flex:1;overflow-y:auto;padding:4px 16px calc(24px + env(safe-area-inset-bottom,0px))}
.xsub{margin:0 0 14px;color:var(--ink-2);font-size:14px;line-height:1.45}
.xseg{display:flex;gap:6px;padding:5px;background:var(--s2);border-radius:99px;margin:6px 0 16px}
.xseg button{flex:1;min-height:44px;border:0;border-radius:99px;background:transparent;color:var(--ink-2);font:600 14px inherit;font-family:inherit;cursor:pointer}
.xseg button.on{background:var(--acc);color:var(--on-acc,#000)}
.xcard{background:var(--s1);border-radius:24px;padding:16px;margin-bottom:12px}
.xlbl{font-size:13px;color:var(--ink-3);margin:18px 2px 8px}
.xrow{display:flex;align-items:center;gap:12px;padding:8px 0;min-height:56px}
.xrow img,.xrow .xph{width:48px;height:48px;border-radius:12px;object-fit:cover;background:var(--s3);flex:none}
.xrow .tx{flex:1;min-width:0}.xrow .tx b{display:block;font-size:15px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.xrow .tx span{display:block;font-size:12.5px;color:var(--ink-3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.xrow button.go{all:unset;flex:1;display:flex;align-items:center;gap:12px;cursor:pointer;min-width:0}
.xtext{width:100%;box-sizing:border-box;background:var(--s1);color:var(--ink);border:1.5px solid var(--s3);border-radius:20px;padding:14px 16px;font:15px/1.4 inherit;font-family:inherit;outline:none}
.xtext:focus{border-color:var(--acc)}
textarea.xtext{min-height:150px;resize:vertical}
.xbar{height:4px;border-radius:2px;background:var(--s3);overflow:hidden;margin-top:12px}.xbar i{display:block;height:100%;background:var(--acc);width:0;transition:width .2s}
.xsw{all:unset;position:relative;width:54px;height:32px;border-radius:16px;background:var(--s4);cursor:pointer;flex:none;transition:background .2s}
.xsw::after{content:"";position:absolute;top:4px;left:4px;width:24px;height:24px;border-radius:50%;background:#fff;transition:transform .2s}
.xsw[aria-checked=true]{background:var(--acc)}.xsw[aria-checked=true]::after{transform:translateX(22px)}
.xswatch{display:flex;flex-wrap:wrap;gap:12px}
.xswatch button{width:48px;height:48px;border-radius:50%;border:3px solid transparent;cursor:pointer;padding:0}
.xswatch button.on{border-color:var(--ink)}
.xswatch label{width:48px;height:48px;border-radius:50%;display:grid;place-items:center;background:conic-gradient(#f55,#fd5,#5f5,#5ff,#55f,#f5f,#f55);cursor:pointer;position:relative;overflow:hidden}
.xswatch label input{position:absolute;inset:0;opacity:0;width:100%;height:100%;cursor:pointer}
.xpv{display:flex;align-items:center;gap:12px;border-radius:24px;padding:14px;background:var(--s1);margin-top:6px}
.xpv .art{width:56px;height:56px;border-radius:14px;background:var(--acc)}
.xpv .ln{height:8px;border-radius:4px;background:var(--s3);margin:6px 0;width:60%}.xpv .ln.a{background:var(--acc);width:36%}
/* hum */
.xmic{position:relative;height:340px;margin:8px 0 16px;border-radius:32px;background:radial-gradient(circle at 50% 45%,var(--s2),var(--s1) 75%);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;overflow:hidden}
.xmic .ring{position:absolute;border-radius:50%;border:2px solid var(--acc);opacity:.25;transition:transform .12s,opacity .12s}
.xmic .big{position:relative;width:116px;height:116px;border-radius:50%;border:0;background:var(--acc);color:var(--on-acc,#000);display:grid;place-items:center;cursor:pointer}
.xmic .st{position:relative;font-size:17px;font-weight:600;text-align:center;padding:0 24px;min-height:44px}
.xwave{position:relative;display:flex;gap:5px;align-items:center;height:30px}.xwave i{width:5px;height:6px;border-radius:3px;background:var(--acc);transition:height .09s}
/* car */
.xcar{background:#000;color:#fff;padding:0}
.xcar .xcb{flex:1;display:flex;flex-direction:column;padding:calc(12px + env(safe-area-inset-top,0px)) 18px calc(16px + env(safe-area-inset-bottom,0px));gap:14px;min-height:0}
.xcar .info{display:flex;align-items:center;gap:16px;min-height:0}
.xcar .info img{width:96px;height:96px;border-radius:22px;object-fit:cover;background:#222;flex:none}
.xcar .info b{display:block;font-size:28px;line-height:1.12;font-weight:800;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
.xcar .info span{display:block;font-size:18px;color:#b9c0c6;margin-top:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.xcar .big3{flex:1;display:grid;grid-template-columns:1fr 1.35fr 1fr;gap:14px;min-height:150px}
.xcar .big3 button{border:0;border-radius:36px;background:#1d2024;color:#fff;display:grid;place-items:center;cursor:pointer}
.xcar .big3 button.play{background:var(--acc);color:var(--on-acc,#000)}
.xcar .big3 button:active{transform:scale(.96)}
.xcar .big3 svg{width:64px;height:64px}.xcar .big3 .play svg{width:84px;height:84px}
.xcar .two{display:grid;grid-template-columns:1fr 1fr;gap:14px;height:92px}
.xcar .two button{border:0;border-radius:30px;background:#1d2024;color:#fff;font:700 20px inherit;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:12px;cursor:pointer}
.xcar .two button.on{background:#e8506a}.xcar .two button.v{background:#2a2438;color:#e0cfff}
.xcar .two button.v.live{background:var(--acc);color:var(--on-acc,#000)}
.xcar .seek{height:6px;border-radius:3px;background:#2a2d31;overflow:hidden}.xcar .seek i{display:block;height:100%;background:var(--acc);width:0}
.xcar .cmd{font-size:16px;color:#b9c0c6;text-align:center;min-height:22px}
.xcar .auto{display:flex;align-items:center;justify-content:space-between;gap:12px;font-size:15px;color:#b9c0c6}
@media (orientation:landscape){.xcar .xcb{flex-direction:row;flex-wrap:wrap}.xcar .info{flex:1 1 40%}.xcar .big3{flex:1 1 55%}.xcar .two,.xcar .seek,.xcar .cmd,.xcar .auto{flex:1 1 100%}}
/* karaoke */
.xkar{background:linear-gradient(170deg,var(--kc,#3a1f5e),#0d0a14 72%);color:#fff}
.xkar .lines{flex:1;overflow:hidden;display:flex;flex-direction:column;justify-content:center;gap:20px;padding:0 24px;-webkit-mask-image:linear-gradient(transparent,#000 18%,#000 82%,transparent);mask-image:linear-gradient(transparent,#000 18%,#000 82%,transparent)}
.xkar .ln{font-size:26px;font-weight:700;line-height:1.2;color:rgba(255,255,255,.3);transition:color .25s,transform .25s;transform-origin:left}
.xkar .ln.on{font-size:32px;color:rgba(255,255,255,.5);transform:none}
.xkar .ln .w.d{color:var(--kw,#e9c2ff)}
.xkar .ctl{margin:0 16px calc(16px + env(safe-area-inset-bottom,0px));border-radius:28px;background:rgba(15,12,22,.86);padding:16px 18px}
.xkar input[type=range]{width:100%;accent-color:var(--kw,#e9c2ff);height:36px;margin:6px 0 0}
.xkar .tp{display:flex;justify-content:space-between;align-items:center;font-size:15px;font-weight:600}
.xkar .tp span{color:var(--kw,#e9c2ff)}
.xkar .fl{display:flex;justify-content:space-between;font-size:12px;opacity:.6}
/* wrapped */
.xwr{color:#fff;background:var(--wg,linear-gradient(160deg,#ff6b4a,#b0185a 55%,#2b0a3d))}
.xwr .bars{display:flex;gap:6px;padding:calc(14px + env(safe-area-inset-top,0px)) 18px 0}
.xwr .bars i{flex:1;height:4px;border-radius:2px;background:rgba(255,255,255,.3);overflow:hidden}.xwr .bars i b{display:block;height:100%;width:0;background:#fff}
.xwr .bars i.done b{width:100%}
.xwr .sl{flex:1;display:flex;flex-direction:column;justify-content:center;padding:0 28px;gap:10px;animation:xin .35s ease-out}
.xwr .k{font-size:15px;font-weight:700;letter-spacing:.04em;opacity:.9}
.xwr .h{font-size:clamp(40px,13vw,58px);font-weight:800;line-height:1;letter-spacing:-.02em}
.xwr .num{font-size:clamp(64px,24vw,104px);font-weight:800;line-height:.95;letter-spacing:-.03em;font-variant-numeric:tabular-nums}
.xwr .cv{width:min(58vw,240px);aspect-ratio:1;border-radius:28px;object-fit:cover;box-shadow:0 20px 50px rgba(0,0,0,.4);transform:rotate(-4deg);margin:10px 0}
.xwr .t{font-size:30px;font-weight:800;line-height:1.05}.xwr .s{font-size:17px;opacity:.85}
.xwr ol{list-style:none;margin:6px 0 0;padding:0;display:flex;flex-direction:column;gap:14px}.xwr ol li{display:flex;align-items:center;gap:14px;font-size:22px;font-weight:700}.xwr ol li img{width:56px;height:56px;border-radius:50%;object-fit:cover;background:rgba(0,0,0,.25)}.xwr ol li small{display:block;font-size:13px;font-weight:500;opacity:.8}
.xwr .tap{position:absolute;top:0;bottom:0;width:38%;z-index:2}.xwr .tap.l{left:0}.xwr .tap.r{right:0;width:62%}
.xwr .xtop,.xwr .foot{position:relative;z-index:3}
.xwr .foot{display:flex;gap:10px;padding:0 18px calc(18px + env(safe-area-inset-bottom,0px));z-index:3}
.xwr .foot .xbtn{background:rgba(0,0,0,.32);color:#fff}.xwr .foot .xbtn.pri{background:#fff;color:#2b0a3d;flex:1}
.xempty{text-align:center;color:var(--ink-2);padding:48px 24px;line-height:1.5}
`;
document.head.appendChild(css);

/* ---------- overlay plumbing ---------- */
let ov = null, onClose = null, tick = 0, raf = 0, ticker = 0;
function isOpen(){ return !!ov; }
function close(){
  if (!ov) return;
  cancelAnimationFrame(raf); clearInterval(tick); clearInterval(ticker); raf = tick = ticker = 0;
  try { if (NATIVE) EvaNative.stopListen(); } catch(e){}
  const el = ov; ov = null; el.remove();
  if (onClose){ const f = onClose; onClose = null; try { f(); } catch(e){} }
  try { X().refreshAll(); } catch(e){}
}
function show(cls, html, closer){
  if (ov) close();
  ov = document.createElement('div'); ov.className = 'xo ' + (cls || ''); ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true');
  ov.innerHTML = html; document.body.appendChild(ov); onClose = closer || null;
  const c = $('[data-xclose]', ov); if (c) { c.addEventListener('click', close); }
  try { c && c.focus(); } catch(e){}
  return ov;
}
const head = (title, extra) => `<div class="xtop"><h2>${title}</h2>${extra || ''}<button class="xbtn sq" data-xclose aria-label="Close">${svg('x', 22, 2.2)}</button></div>`;

/* ---------- helpers ---------- */
const cur = () => { const x = X(); return x.S.cur ? x.TR[x.S.cur] : null; };
const trTitle = t => t ? t.title : '';
const trArtist = t => t ? X().ART[t.ar].name : '';
const coverOf = t => t ? X().art(X().ALB[t.al]) : '';
function trRow(id, extra){
  const x = X(), t = x.TR[id]; if (!t) return '';
  return `<div class="xrow"><button class="go" data-xplay="${esc(id)}" aria-label="Play ${esc(t.title)}"><img src="${esc(x.art(x.ALB[t.al]))}" alt="" loading="lazy"><span class="tx"><b>${esc(t.title)}</b><span>${esc(x.ART[t.ar].name)}</span></span></button>${extra || ''}</div>`;
}
function wirePlay(root, list){
  $$('[data-xplay]', root).forEach(b => b.addEventListener('click', () => {
    const ids = list || $$('[data-xplay]', root).map(e => e.dataset.xplay);
    X().playTrack(b.dataset.xplay, ids, 'Eva');
    toast('Playing ' + trTitle(X().TR[b.dataset.xplay]));
  }));
}
async function search(q, n){
  const r = await X().api('/api/search?q=' + encodeURIComponent(q));
  return X().ingestAll((r.results || [])).slice(0, n || 8);
}

/* =========================================================
   9. Sleep timer (also used by the widget)
   ========================================================= */
let jsSleep = 0;
function sleepSet(min){
  clearTimeout(jsSleep);
  if (NATIVE){ try { EvaNative.sleep(min); } catch(e){} }
  else if (min > 0){ jsSleep = setTimeout(() => { try { X().audio.pause(); } catch(e){} }, min * 60000); }
  toast(min > 0 ? 'Music will stop in ' + min + ' min' : min < 0 ? 'Music will stop after this song' : 'Sleep timer off');
}
function sleepLeft(){ try { return NATIVE ? EvaNative.sleepLeft() : 0; } catch(e){ return 0; } }
function openSleep(){
  const left = sleepLeft();
  const opts = [[15, '15 minutes'], [30, '30 minutes'], [45, '45 minutes'], [60, '1 hour'], [-1, 'End of this song']];
  show('', head('Sleep timer') + `<div class="xbody"><p class="xsub">${left > 0 ? 'Stopping in about ' + left + ' min.' : left < 0 ? 'Stopping after this song.' : 'Stop the music by itself so you can fall asleep.'}</p>
    ${opts.map(([m, l]) => `<button class="xbtn" style="display:flex;width:100%;justify-content:space-between;margin-bottom:10px;min-height:56px" data-m="${m}">${l}</button>`).join('')}
    ${left ? '<button class="xbtn pri" style="width:100%;margin-top:6px;min-height:56px" data-m="0">Turn off timer</button>' : ''}
    <p class="xsub" style="margin-top:16px">The home screen widget has a moon button that starts a 30 minute timer.</p></div>`);
  $$('[data-m]', ov).forEach(b => b.addEventListener('click', () => { sleepSet(+b.dataset.m); close(); }));
}

/* =========================================================
   12. Themes
   ========================================================= */
const SW = ['#6d5bd0', '#e0475b', '#2f8f9d', '#4aa56a', '#e0a53a', '#e86fa6', '#3b82f6', '#9aa4ad'];
function openThemes(){
  const x = X(), S = x.S;
  const draw = () => {
    const src = S.dynColor ? 'cover' : 'pick';
    const bg = S.bgTone || (S.theme === 'light' ? 'light' : S.amoled ? 'black' : 'grey');
    const seg = (id, items, val) => `<div class="xseg" role="radiogroup" id="${id}">${items.map(([v, l]) => `<button role="radio" aria-checked="${v === val}" class="${v === val ? 'on' : ''}" data-v="${v}">${l}</button>`).join('')}</div>`;
    $('.xbody', ov).innerHTML = `
      <div class="xlbl">Colours</div>
      ${seg('s1', [['cover', 'Follow cover art'], ['pick', 'Pick a colour']], src)}
      ${src === 'pick' ? `<div class="xswatch" role="radiogroup" aria-label="Accent colour">${SW.map(c => `<button style="background:${c}" data-c="${c}" class="${(S.customHex || '').toLowerCase() === c && S.accent === 'custom' ? 'on' : ''}" aria-label="Colour ${c}"></button>`).join('')}<label title="Any colour"><input type="color" id="xcol" value="${esc(S.customHex || '#6d5bd0')}" aria-label="Choose any colour"></label></div>` : `<p class="xsub">Colours change with the cover art of the song that is playing.</p>`}
      <div class="xlbl">Background</div>
      ${seg('s2', [['black', 'Black'], ['grey', 'Grey'], ['light', 'Light']], bg)}
      <div class="xpv" aria-hidden="true"><div class="art"></div><div style="flex:1"><div class="ln"></div><div class="ln a"></div></div></div>`;
    $$('#s1 button', ov).forEach(b => b.onclick = () => { S.dynColor = b.dataset.v === 'cover'; if (!S.dynColor){ S.signature = false; if (S.accent !== 'custom') { S.accent = 'custom'; } } apply(); });
    $$('#s2 button', ov).forEach(b => b.onclick = () => {
      const v = b.dataset.v; S.bgTone = v;
      if (v === 'light'){ S.theme = 'light'; } else { S.theme = 'dark'; S.amoled = v === 'black'; }
      apply();
    });
    $$('[data-c]', ov).forEach(b => b.onclick = () => { S.accent = 'custom'; S.customHex = b.dataset.c; S.signature = false; apply(); });
    const col = $('#xcol', ov); if (col) col.oninput = () => { S.accent = 'custom'; S.customHex = col.value; S.signature = false; x.applyTheme(); x.reaccent(); x.saveSettings(); };
  };
  const apply = () => { x.applyTheme(); x.reaccent(); x.saveSettings(); draw(); };
  show('', head('Themes') + '<div class="xbody"></div>');
  draw();
}

/* =========================================================
   11. Follow artists + albums + new release alerts
   ========================================================= */
const fol = () => J('eva.follow', {});
const folSave = o => LS.set('eva.follow', JSON.stringify(o));
const news = () => J('eva.news', []);
function followBar(id){
  const a = X().ART[id]; if (!a) return '';
  const on = !!fol()[id];
  return `<div class="gut" style="margin-top:16px"><button class="xbtn ${on ? '' : 'pri'}" style="width:100%;min-height:52px;gap:10px;display:flex;align-items:center;justify-content:center" data-act="x" data-v="follow:${esc(id)}" aria-pressed="${on}">${on ? svg('check', 20, 2.4) + 'Following' : svg('bell', 20, 2) + 'Follow for new releases'}</button></div>`;
}
function albums(id){
  const x = X(), tr = x.artistTracks(id), m = new Map();
  tr.forEach(t => { const l = m.get(t.al) || []; l.push(t); m.set(t.al, l); });
  const list = [...m.entries()].filter(([al, l]) => al && x.ALB[al] && (l.length > 1 || x.ALB[al].title !== l[0].title));
  if (!list.length) return '';
  return `<div class="gut"><div class="sec-h"><h2 class="h2">Albums</h2><span class="sub">${list.length}</span></div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:14px;padding-bottom:24px">${list.map(([al, l]) => { const A = x.ALB[al]; return `<button data-act="x" data-v="album:${esc(al)}:${esc(id)}" style="all:unset;cursor:pointer;display:block" aria-label="Play album ${esc(A.title)}"><img src="${esc(x.art(A))}" alt="" style="width:100%;aspect-ratio:1;border-radius:18px;object-fit:cover;background:var(--s2)"><b style="display:block;font-size:14px;margin-top:8px;line-height:1.2">${esc(A.title)}</b><span style="font-size:12.5px;color:var(--ink-3)">${A.yr ? A.yr + ' · ' : ''}${l.length} song${l.length > 1 ? 's' : ''}</span></button>`; }).join('')}</div></div>`;
}
function toggleFollow(id){
  const x = X(), a = x.ART[id]; if (!a) return;
  const f = fol();
  if (f[id]){ delete f[id]; folSave(f); toast('Unfollowed ' + a.name); }
  else {
    f[id] = {name: a.name, seen: x.artistTracks(id).map(t => t.id), t: Date.now()}; folSave(f);
    toast('Following ' + a.name + '. You will get an alert for new songs.');
    if (NATIVE) { try { EvaNative.notify('Following ' + a.name, 'We will tell you when they release something new.'); } catch(e){} }
  }
  x.refresh('artist-' + id);
}
async function checkNew(force){
  const f = fol(), ids = Object.keys(f); if (!ids.length) return;
  const last = +LS.get('eva.newchk', 0);
  if (!force && Date.now() - last < 6 * 3600 * 1000) return;
  LS.set('eva.newchk', String(Date.now()));
  const x = X(); const found = [];
  for (const id of ids){
    try {
      const r = await x.api('/api/search?type=artist&q=' + encodeURIComponent(f[id].name));
      const fresh = x.ingestAll((r.results || []).filter(y => y.artistId === id || (y.artist || '').toLowerCase() === f[id].name.toLowerCase()));
      const seen = new Set(f[id].seen || []);
      const add = fresh.filter(t => !seen.has(t));
      if (!f[id].seen || !f[id].seen.length){ f[id].seen = fresh; continue; }
      if (add.length){ found.push(...add.map(t => ({id: t, artist: f[id].name, at: Date.now()}))); f[id].seen = [...seen, ...add]; }
    } catch(e){}
  }
  folSave(f);
  if (found.length){
    LS.set('eva.news', JSON.stringify([...found, ...news()].slice(0, 40)));
    const names = [...new Set(found.map(n => n.artist))];
    const msg = (names.length === 1 ? names[0] : names.length + ' artists you follow') + ' has new music';
    toast(msg);
    if (NATIVE) { try { EvaNative.notify('New music on Eva', msg); } catch(e){} }
  }
}
function openFollowing(){
  const x = X(), f = fol(), ids = Object.keys(f), nw = news().filter(n => x.TR[n.id]);
  show('', head('Following', `<button class="xbtn" data-chk>Check now</button>`) + `<div class="xbody">
    ${nw.length ? `<div class="xlbl">New for you</div><div class="xcard">${nw.slice(0, 8).map(n => trRow(n.id)).join('')}</div>` : ''}
    <div class="xlbl">Artists you follow</div>
    ${ids.length ? `<div class="xcard">${ids.map(id => `<div class="xrow"><button class="go" data-xart="${esc(id)}"><span class="xph" style="display:grid;place-items:center;color:var(--acc)">${svg('mic2', 22)}</span><span class="tx"><b>${esc(f[id].name)}</b><span>Tap to open artist page</span></span></button><button class="xbtn" data-xun="${esc(id)}" style="min-height:44px;padding:0 14px">Unfollow</button></div>`).join('')}</div>`
      : `<div class="xempty">You are not following anyone yet.<br>Open an artist page and tap Follow.</div>`}
    <p class="xsub">Alerts are checked each time you open Eva Music, at most every 6 hours.</p></div>`);
  wirePlay(ov, nw.slice(0, 8).map(n => n.id));
  $('[data-chk]', ov).onclick = async () => { toast('Checking…'); await checkNew(true); openFollowing(); };
  $$('[data-xun]', ov).forEach(b => b.onclick = () => { const o = fol(); delete o[b.dataset.xun]; folSave(o); openFollowing(); });
  $$('[data-xart]', ov).forEach(b => b.onclick = async () => {
    const id = b.dataset.xart;
    if (!x.ART[id]){ try { const r = await x.api('/api/search?type=artist&q=' + encodeURIComponent(f[id].name)); x.ingestAll(r.results || []); } catch(e){} }
    if (x.ART[id]){ close(); x.go('artist-' + id); } else toast('Could not find that artist right now');
  });
}

/* =========================================================
   13. Hum / sing / say to search  +  voice engine shared with car mode
   ========================================================= */
let voiceCb = null, webRec = null;
window.__evaVoice = (kind, text) => { if (voiceCb) voiceCb(kind, text); };
window.__evaLevel = v => { const r = $('.xmic .ring'); if (!r) return; const k = Math.max(0, Math.min(1, (v + 2) / 12)); $$('.xwave i').forEach((b, i) => { b.style.height = (6 + k * 24 * (0.5 + 0.5 * Math.sin(i * 1.7 + Date.now() / 120))) + 'px'; }); r.style.transform = 'scale(' + (1 + k * 0.22) + ')'; r.style.opacity = String(0.2 + k * 0.4); };
function listen(cb){
  voiceCb = cb;
  if (NATIVE){ try { EvaNative.listen(); } catch(e){ cb('error', 'Voice is not available'); } return; }
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR){ cb('error', 'Voice input needs the Android app'); return; }
  try {
    webRec = new SR(); webRec.interimResults = true; webRec.lang = navigator.language || 'en-IN';
    webRec.onstart = () => cb('ready', ''); webRec.onerror = e => cb('error', 'Could not listen (' + e.error + ')');
    webRec.onresult = e => { let t = ''; for (const r of e.results) t += r[0].transcript; cb(e.results[e.results.length - 1].isFinal ? 'final' : 'partial', t); };
    webRec.start();
  } catch(e){ cb('error', 'Could not start the microphone'); }
}
function stopListen(){ voiceCb = null; try { if (NATIVE) EvaNative.stopListen(); else if (webRec) webRec.stop(); } catch(e){} }

function openHum(){
  show('', head('Find a song') + `<div class="xbody"><p class="xsub">Sing, hum or say a few words. Eva listens for the words and finds songs that match.</p>
    <div class="xmic"><div class="ring" style="width:250px;height:250px"></div><div class="ring" style="width:196px;height:196px;opacity:.35"></div>
      <button class="big" id="xm" aria-label="Start listening">${svg('mic', 52, 2)}</button>
      <div class="st" id="xst" aria-live="polite">Tap the microphone</div>
      <div class="xwave">${'<i></i>'.repeat(9)}</div></div>
    <div style="display:flex;gap:8px"><input class="xtext" id="xq" placeholder="Or type a few words of the song" aria-label="Type words of the song" style="flex:1"><button class="xbtn pri" id="xgo" style="min-height:52px">Search</button></div>
    <div id="xres" style="margin-top:14px"></div>
    <p class="xsub" style="margin-top:12px">Works best when you sing the words. Humming with no words is not recognised yet.</p></div>`, () => stopListen());
  const st = $('#xst', ov), res = $('#xres', ov), q = $('#xq', ov);
  async function run(text){
    text = (text || '').trim(); if (!text) return;
    st.textContent = '“' + text + '”'; res.innerHTML = '<div class="xsub">Looking for matches…</div>';
    try {
      const ids = await search(text, 8);
      res.innerHTML = ids.length ? `<div class="xlbl" style="margin-top:0">Best guesses</div><div class="xcard">${ids.map((id, i) => trRow(id, i === 0 ? `<span style="color:var(--acc);font-weight:700;font-size:13px">Top match</span>` : '')).join('')}</div>` : '<div class="xempty">No songs found for that. Try singing a different line.</div>';
      wirePlay(res, ids);
    } catch(e){ res.innerHTML = '<div class="xempty">Could not search right now. Check your connection.</div>'; }
  }
  $('#xgo', ov).onclick = () => run(q.value);
  q.addEventListener('keydown', e => { if (e.key === 'Enter') run(q.value); });
  $('#xm', ov).onclick = () => {
    st.textContent = 'Starting…';
    listen((k, t) => {
      if (k === 'ready') st.textContent = 'Listening… sing now';
      else if (k === 'partial') st.textContent = '“' + t + '”';
      else if (k === 'final'){ q.value = t; if (t) run(t); else st.textContent = 'I did not catch that. Try again.'; }
      else if (k === 'perm') st.textContent = 'Allow the microphone, then tap again';
      else if (k === 'error') st.textContent = t;
    });
  };
}

/* =========================================================
   10. Car mode
   ========================================================= */
function openCar(){
  const x = X();
  show('xcar', `<div class="xcb">
    <div class="info"><img id="cimg" alt=""><div style="min-width:0;flex:1"><b id="ctt">Nothing playing</b><span id="cta"></span></div><button class="xbtn sq" data-xclose aria-label="Exit car mode" style="background:#1d2024;color:#fff;width:64px;height:64px;border-radius:32px">${svg('x', 28, 2.4)}</button></div>
    <div class="seek"><i id="csk"></i></div>
    <div class="big3"><button id="cprev" aria-label="Previous song">${svg('prev', 64, 2, 'currentColor')}</button><button class="play" id="cplay" aria-label="Play or pause"></button><button id="cnext" aria-label="Next song">${svg('next', 64, 2, 'currentColor')}</button></div>
    <div class="two"><button id="clike" aria-label="Like">${svg('heart', 34, 2)}Like</button><button class="v" id="cvoice" aria-label="Voice control">${svg('mic', 34, 2)}Say a command</button></div>
    <div class="cmd" id="ccmd" aria-live="polite">Say: next, previous, pause, play, like, or “play” and a song name.</div>
    <div class="auto"><span>Open car mode by itself when this phone joins the car Bluetooth</span><button class="xsw" id="cauto" role="switch" aria-checked="false" aria-label="Open car mode by itself in the car"></button></div></div>`);
  const sw = $('#cauto', ov);
  const autoOn = () => { try { return NATIVE ? EvaNative.carAutoOn() : LS.get('eva.carauto', '0') === '1'; } catch(e){ return false; } };
  sw.setAttribute('aria-checked', String(autoOn()));
  sw.onclick = () => { const v = !autoOn(); LS.set('eva.carauto', v ? '1' : '0'); try { if (NATIVE) EvaNative.carAuto(v); } catch(e){} sw.setAttribute('aria-checked', String(v)); toast(v ? 'Car mode will offer to open when you connect to your car' : 'Car mode auto-start off'); if (v && !NATIVE) toast('Needs the Android app'); };
  const cmd = $('#ccmd', ov);
  const sync = () => {
    const t = cur(), S = x.S;
    $('#ctt', ov).textContent = t ? t.title : 'Nothing playing'; $('#cta', ov).textContent = trArtist(t);
    const im = $('#cimg', ov); if (t && im.dataset.k !== t.id){ im.dataset.k = t.id; im.src = coverOf(t); }
    $('#cplay', ov).innerHTML = svg(S.playing ? 'pause' : 'play', 84, 2, 'currentColor');
    $('#clike', ov).classList.toggle('on', !!(t && x.isLiked(t.id)));
    const d = t ? t.dur || 1 : 1; $('#csk', ov).style.width = Math.min(100, (S.pos / d) * 100) + '%';
  };
  sync(); ticker = setInterval(sync, 500);
  $('#cprev', ov).onclick = () => x.prevTrack(); $('#cnext', ov).onclick = () => x.nextTrack(false); $('#cplay', ov).onclick = () => x.togglePlay();
  $('#clike', ov).onclick = () => { const t = cur(); if (t) { x.toggleLike(t.id); setTimeout(sync, 200); } };
  const vb = $('#cvoice', ov);
  const handle = async text => {
    const s = text.toLowerCase().trim(); cmd.textContent = '“' + text + '”';
    if (/\b(next|skip|agla|adutha)\b/.test(s)) x.nextTrack(false);
    else if (/\b(previous|back|last|pichla)\b/.test(s)) x.prevTrack();
    else if (/^(pause|stop)\b|\b(pause|stop) (the )?(music|song)\b/.test(s)) { if (x.S.playing) x.togglePlay(); }
    else if (/^(play|resume|continue)$/.test(s) || /\bresume\b/.test(s)) { if (!x.S.playing) x.togglePlay(); }
    else if (/\b(like|favourite|favorite)\b/.test(s)) { const t = cur(); if (t && !x.isLiked(t.id)) x.toggleLike(t.id); }
    else if (/^(play|put on)\s+(.+)/.test(s)) {
      const q = s.replace(/^(play|put on)\s+/, ''); cmd.textContent = 'Looking for “' + q + '”…';
      try { const ids = await search(q, 8); if (ids.length){ x.playTrack(ids[0], ids, 'Car mode'); cmd.textContent = 'Playing ' + trTitle(x.TR[ids[0]]); } else cmd.textContent = 'No song found for “' + q + '”'; } catch(e){ cmd.textContent = 'Could not search right now'; }
    } else cmd.textContent = 'Did not understand “' + text + '”. Try “next” or “play” and a song name.';
    setTimeout(sync, 300);
  };
  vb.onclick = () => {
    vb.classList.add('live'); cmd.textContent = 'Listening…';
    listen((k, t) => {
      if (k === 'final'){ vb.classList.remove('live'); if (t) handle(t); else cmd.textContent = 'I did not catch that.'; }
      else if (k === 'partial') cmd.textContent = '“' + t + '”';
      else if (k === 'perm'){ vb.classList.remove('live'); cmd.textContent = 'Allow the microphone, then tap again'; }
      else if (k === 'error'){ vb.classList.remove('live'); cmd.textContent = t; }
    });
  };
}

/* =========================================================
   14. Karaoke
   ========================================================= */
function openKaraoke(){
  const x = X(), t = cur();
  if (!t){ toast('Play a song first'); return; }
  const lvl0 = +LS.get('eva.vocal', 1);
  show('xkar', head(esc(t.title), '') .replace('<h2>', '<h2 style="font-size:20px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">') + `<div class="lines" id="klines"><div class="xsub" style="text-align:center">Loading words…</div></div>
    <div class="ctl"><div class="tp"><b>Lead vocal</b><span id="kv"></span></div><input type="range" id="kr" min="0" max="100" value="${Math.round(lvl0 * 100)}" aria-label="Lead vocal volume"><div class="fl"><span>Off</span><span>Full</span></div>
    <p class="xsub" style="margin:8px 0 0;font-size:12.5px" id="knote">${NATIVE ? 'Turning the vocal down also lowers sounds in the centre of the mix, so it works best on songs with clear vocals.' : 'Vocal control needs the Android app.'}</p></div>`);
  const kv = $('#kv', ov), kr = $('#kr', ov);
  const label = v => v === 0 ? 'Off' : v < .3 ? 'Quiet' : v < .7 ? 'Medium' : v < 1 ? 'Loud' : 'Full';
  const setV = () => { const v = kr.value / 100; kv.textContent = label(v); LS.set('eva.vocal', String(v)); try { if (NATIVE) EvaNative.setVocal(v); } catch(e){} };
  kr.oninput = setV; kv.textContent = label(lvl0);
  const hue = Math.round(((x.hslOf(x.ALB[t.al].pal[1]) || [270])[0]) || 270);
  ov.style.setProperty('--kc', `hsl(${hue} 45% 22%)`); ov.style.setProperty('--kw', `hsl(${hue} 100% 85%)`);
  let lines = null, shownFor = '', lastI = -2;
  const build = () => {
    const box = $('#klines', ov); if (!box) return;
    lines = x.LYRICS[t.id];
    if (lines && lines.length){
      box.innerHTML = lines.map((l, i) => `<div class="ln" data-i="${i}">${l[1].split(/\s+/).map(w => `<span class="w">${esc(w)} </span>`).join('')}</div>`).join('');
    } else if (x.LYR_PLAIN[t.id]){
      box.style.overflowY = 'auto'; box.style.justifyContent = 'flex-start';
      box.innerHTML = x.LYR_PLAIN[t.id].map(l => `<div class="ln on">${esc(l)}</div>`).join('') + '<div class="xsub">These words are not timed, so they do not light up.</div>';
    } else if (x.LYR_STATE[t.id] && x.LYR_STATE[t.id] !== 'loading'){
      box.innerHTML = '<div class="xempty">No words found for this song.</div>';
    }
  };
  x.fetchLyrics(t.id); build();
  const loop = () => {
    if (!ov) return;
    if (!lines) build();
    if (lines && lines.length){
      const ep = x.lyPos(); let i = -1;
      for (let k = 0; k < lines.length; k++){ if (lines[k][0] <= ep) i = k; else break; }
      const box = $('#klines', ov);
      if (i !== lastI){
        lastI = i;
        $$('.ln', box).forEach((el, k) => { el.classList.toggle('on', k === i); el.style.display = (k >= i - 1 && k <= i + 3) || i < 0 && k < 4 ? '' : 'none'; });
      }
      if (i >= 0){
        const start = lines[i][0], end = i + 1 < lines.length ? lines[i + 1][0] : start + 6, span = Math.max(.5, Math.min(end - start, 7) * .88);
        const ws = $$('.ln.on .w', box), n = ws.length;
        ws.forEach((w, j) => w.classList.toggle('d', ep >= start + span * j / n));
        $$('.ln:not(.on) .w.d', box).forEach(w => w.classList.remove('d'));
      }
    }
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
}

/* =========================================================
   15. Eva Wrapped
   ========================================================= */
// Listening log: every song you play for more than 20 seconds.
const LOG_KEY = 'eva.log';
let log = J(LOG_KEY, []), lcur = null, lsec = 0;
function langOf(title, artist, id){
  const s = (title || '') + ' ' + (artist || '');
  if (/[஀-௿]/.test(s)) return 'Tamil'; if (/[ഀ-ൿ]/.test(s)) return 'Malayalam'; if (/[ऀ-ॿ]/.test(s)) return 'Hindi';
  if (/[ఀ-౿]/.test(s)) return 'Telugu'; if (/[ಀ-೿]/.test(s)) return 'Kannada'; if (/[぀-ヿ]/.test(s)) return 'Japanese'; if (/[가-힯]/.test(s)) return 'Korean';
  try { const v = X().S.vlang && X().S.vlang[id]; if (v) return ({ta: 'Tamil', ml: 'Malayalam', hi: 'Hindi', te: 'Telugu', en: 'English'})[String(v).toLowerCase()] || String(v); } catch(e){}
  return 'English';
}
function logTick(){
  const x = X(); if (!x) return; const S = x.S;
  if (!S.cur || !S.playing){ return; }
  if (!lcur || lcur.id !== S.cur){
    const t = x.TR[S.cur]; if (!t) return;
    lcur = {id: S.cur, ts: Date.now(), sec: 0, title: t.title, artist: x.ART[t.ar].name, cover: x.art(x.ALB[t.al]), lang: langOf(t.title, x.ART[t.ar].name, S.cur), logged: false};
  }
  lcur.sec += 1;
  if (!lcur.logged && lcur.sec >= 20){ lcur.logged = true; log.push(lcur); if (log.length > 6000) log = log.slice(-6000); }
  if (lcur.logged && lcur.sec % 10 === 0) LS.set(LOG_KEY, JSON.stringify(log));
}
function wrapStats(){
  const year = new Date().getFullYear();
  const rows = log.filter(r => new Date(r.ts).getFullYear() === year);
  const byT = new Map(), byA = new Map(), byL = new Map(); let sec = 0;
  rows.forEach(r => {
    sec += r.sec;
    const t = byT.get(r.id) || {r, n: 0}; t.n++; byT.set(r.id, t);
    const a = byA.get(r.artist) || {name: r.artist, n: 0, cover: r.cover}; a.n++; byA.set(r.artist, a);
    byL.set(r.lang, (byL.get(r.lang) || 0) + r.sec);
  });
  const top = [...byT.values()].sort((a, b) => b.n - a.n)[0];
  const arts = [...byA.values()].sort((a, b) => b.n - a.n).slice(0, 3);
  const lang = [...byL.entries()].sort((a, b) => b[1] - a[1])[0];
  return {year, plays: rows.length, minutes: Math.round(sec / 60), top, arts, lang: lang ? lang[0] : '—', langShare: lang && sec ? Math.round(lang[1] / sec * 100) : 0};
}
function openWrapped(){
  const w = wrapStats();
  if (w.plays < 3){
    show('xwr', `<div class="xtop">${'<div style="flex:1"></div>'}<button class="xbtn sq" data-xclose aria-label="Close" style="background:rgba(0,0,0,.3);color:#fff">${svg('x', 22, 2.2)}</button></div><div class="sl"><div class="k">EVA WRAPPED ${w.year}</div><div class="h">Not enough songs yet</div><div class="s">Eva starts counting from now. Play a few songs and come back to see your top song, minutes and favourite language.</div></div>`);
    return;
  }
  const hues = ['#ff6b4a,#b0185a 55%,#2b0a3d', '#35d0ba,#1b6ca8 55%,#101a3d', '#f7b733,#d1495b 55%,#35153d'];
  const g = hues[(w.top ? w.top.r.title.length : 0) % hues.length];
  const slides = [
    `<div class="k">EVA WRAPPED ${w.year}</div><div class="h">You played</div><div class="num">${w.minutes.toLocaleString()}</div><div class="h" style="font-size:34px">minutes of music</div><div class="s">${w.plays.toLocaleString()} songs this year${w.minutes >= 60 ? ', about ' + Math.round(w.minutes / 60) + ' hours' : ''}.</div>`,
    `<div class="k">YOUR TOP SONG</div><img class="cv" src="${esc(w.top.r.cover)}" alt=""><div class="t">${esc(w.top.r.title)}</div><div class="s">${esc(w.top.r.artist)} · played ${w.top.n} time${w.top.n > 1 ? 's' : ''}</div>`,
    `<div class="k">YOUR TOP ARTISTS</div><ol>${w.arts.map((a, i) => `<li><img src="${esc(a.cover)}" alt=""><span>${esc(a.name)}<small>${a.n} play${a.n > 1 ? 's' : ''}</small></span></li>`).join('')}</ol>`,
    `<div class="k">YOUR FAVOURITE LANGUAGE</div><div class="num" style="font-size:clamp(54px,20vw,88px)">${esc(w.lang)}</div><div class="s">${w.langShare}% of your listening time.</div>`
  ];
  const text = `My Eva Wrapped ${w.year}: ${w.minutes.toLocaleString()} minutes, top song ${w.top.r.title} by ${w.top.r.artist}, top artist ${w.arts[0].name}, favourite language ${w.lang}.`;
  show('xwr', `<div class="bars">${slides.map(() => '<i><b></b></i>').join('')}</div><div class="xtop" style="padding-top:8px"><div style="flex:1"></div><button class="xbtn sq" data-xclose aria-label="Close" style="background:rgba(0,0,0,.3);color:#fff">${svg('x', 22, 2.2)}</button></div><div class="tap l" aria-hidden="true"></div><div class="tap r" aria-hidden="true"></div><div class="sl" id="wsl"></div><div class="foot"><button class="xbtn pri" id="wsh">${svg('share', 20, 2)}&nbsp;Share my Wrapped</button></div>`);
  ov.style.setProperty('--wg', `linear-gradient(160deg,${g})`);
  let i = 0, t0 = Date.now();
  const bars = $$('.bars i', ov);
  const go = n => { i = Math.max(0, Math.min(slides.length - 1, n)); t0 = Date.now(); const sl = $('#wsl', ov); sl.style.animation = 'none'; void sl.offsetWidth; sl.style.animation = ''; sl.innerHTML = slides[i]; bars.forEach((b, k) => { b.classList.toggle('done', k < i); $('b', b).style.width = k < i ? '100%' : '0'; }); };
  go(0);
  tick = setInterval(() => { if (!ov) return; const p = (Date.now() - t0) / 5500; const b = $('b', bars[i]); if (b) b.style.width = Math.min(100, p * 100) + '%'; if (p >= 1 && i < slides.length - 1) go(i + 1); }, 60);
  $('.tap.l', ov).onclick = () => go(i - 1); $('.tap.r', ov).onclick = () => go(i + 1);
  $('#wsh', ov).onclick = () => { if (NATIVE) { try { EvaNative.share(text); } catch(e){} } else if (navigator.share) navigator.share({text}).catch(() => {}); else { try { navigator.clipboard.writeText(text); toast('Copied to share'); } catch(e){ toast(text); } } };
}

/* =========================================================
   16. Import playlists
   ========================================================= */
function parseList(txt){
  return txt.split(/\r?\n/).map(l => l.replace(/^\s*\d+[\).\s-]+/, '').trim()).filter(Boolean).map(l => {
    let m = l.match(/^(.+?)\s+[-–—]\s+(.+)$/) || l.match(/^(.+?)\s+by\s+(.+)$/i) || l.match(/^(.+?)\s*[|;,]\s*(.+)$/);
    return m ? {title: m[1].trim(), artist: m[2].trim()} : {title: l, artist: ''};
  });
}
function openImport(){
  let mode = 'link', items = [], name = 'Imported playlist', busy = false;
  show('', head('Bring your playlists') + `<div class="xbody"><p class="xsub">Paste a playlist link or a list of song names and Eva Music finds the songs.</p>
    <div class="xseg" id="im"><button class="on" data-v="link">Playlist link</button><button data-v="list">Paste a song list</button></div>
    <div id="inp"></div><div id="out"></div></div>`);
  const inp = $('#inp', ov), out = $('#out', ov);
  const drawIn = () => {
    $$('#im button', ov).forEach(b => b.classList.toggle('on', b.dataset.v === mode));
    inp.innerHTML = mode === 'link'
      ? `<div style="display:flex;gap:8px"><input class="xtext" id="il" inputmode="url" placeholder="https://music.youtube.com/playlist?list=…" aria-label="Playlist link" style="flex:1"><button class="xbtn pri" id="ig" style="min-height:52px">Find songs</button></div><p class="xsub" style="margin-top:10px">YouTube, YouTube Music and public Spotify playlist links work.</p>`
      : `<textarea class="xtext" id="it" placeholder="One song per line\nTadban Tadban Sheru - DeeJay Hemant Raj\nPunchiri - Eechuu" aria-label="Song list"></textarea><button class="xbtn pri" id="ig" style="width:100%;min-height:52px;margin-top:10px">Find songs</button>`;
    $('#ig', ov).onclick = go;
  };
  $$('#im button', ov).forEach(b => b.onclick = () => { if (busy) return; mode = b.dataset.v; drawIn(); });
  const drawOut = (done) => {
    const ok = items.filter(i => i.pick != null).length;
    out.innerHTML = `<div class="xcard" style="margin-top:16px"><div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px"><input class="xtext" id="nm" value="${esc(name)}" aria-label="Playlist name" style="font-size:18px;font-weight:600;padding:8px 12px;flex:1"><span style="font-size:13px;color:var(--ink-3);white-space:nowrap">${ok} of ${items.length} matched</span></div>
      <div class="xbar"><i style="width:${items.length ? Math.round((items.filter(i => i.done).length / items.length) * 100) : 0}%"></i></div>
      <div style="margin-top:8px;max-height:46vh;overflow:auto">${items.map((it, n) => {
        const t = it.pick != null ? X().TR[it.cands[it.pick]] : null;
        return `<div class="xrow"><button class="go" data-n="${n}" aria-label="${t ? 'Try another version of ' + esc(it.title) : esc(it.title)}">${t ? `<img src="${esc(coverOf(t))}" alt="">` : `<span class="xph"></span>`}<span class="tx"><b>${esc(t ? t.title : it.title)}</b><span style="${it.done && !t ? 'color:#e0a53a' : ''}">${t ? esc(trArtist(t)) + (it.cands.length > 1 ? ' · tap for another version' : '') : it.done ? 'Not found' : 'Looking…'}</span></span></button><span style="color:${t ? '#7bd88f' : it.done ? '#e0a53a' : 'var(--ink-3)'}">${t ? svg('check', 22, 2.4) : it.done ? svg('warn', 22, 2.2) : ''}</span></div>`;
      }).join('')}</div></div>
      <button class="xbtn pri" id="sv" style="width:100%;min-height:56px;margin-top:4px" ${done && ok ? '' : 'disabled'}>Save as playlist</button>`;
    $('#nm', ov).oninput = e => { name = e.target.value; };
    $$('[data-n]', ov).forEach(b => b.onclick = () => { const it = items[+b.dataset.n]; if (it.cands && it.cands.length > 1){ it.pick = (it.pick + 1) % it.cands.length; drawOut(done); } });
    $('#sv', ov).onclick = save;
  };
  async function go(){
    if (busy) return; busy = true; items = []; out.innerHTML = '<div class="xsub" style="margin-top:16px">Reading the playlist…</div>';
    try {
      if (mode === 'link'){
        const u = ($('#il', ov).value || '').trim(); if (!u) throw new Error('Paste a playlist link first');
        const yt = u.match(/[?&]list=([A-Za-z0-9_-]+)/);
        if (yt){
          if (!NATIVE) throw new Error('YouTube playlist links need the Android app');
          const r = await nreq('ytplaylist', {list: yt[1]});
          name = r.name || name;
          const ids = X().ingestAll(r.songs || []);
          items = ids.map(id => ({title: X().TR[id].title, artist: '', cands: [id], pick: 0, done: true}));
          if (!items.length) throw new Error('No songs found. Make sure the playlist is public.');
          drawOut(true); busy = false; return;
        } else if (/spotify\.com|^spotify:/.test(u)){
          if (!NATIVE) throw new Error('Spotify links need the Android app');
          const r = await nreq('spotify', {url: u}); name = r.name || name;
          items = (r.tracks || []).map(t => ({title: t.title, artist: t.artist, cands: [], pick: null, done: false}));
        } else throw new Error('That does not look like a YouTube or Spotify playlist link');
      } else {
        items = parseList($('#it', ov).value || '').map(t => ({title: t.title, artist: t.artist, cands: [], pick: null, done: false}));
        if (!items.length) throw new Error('Type or paste at least one song name');
      }
      items = items.slice(0, 150); drawOut(false);
      let idx = 0, active = 0;
      await new Promise(res => {
        const pump = () => {
          while (active < 3 && idx < items.length){
            const it = items[idx++]; active++;
            search((it.title + ' ' + it.artist).trim(), 3).then(ids => { it.cands = ids; it.pick = ids.length ? 0 : null; }).catch(() => {}).then(() => { it.done = true; active--; if (ov) drawOut(false); if (idx >= items.length && active === 0) res(); else pump(); });
          }
        };
        pump();
      });
      if (ov) drawOut(true);
    } catch(e){ out.innerHTML = `<div class="xempty">${esc(e.message || 'Something went wrong')}</div>`; }
    busy = false;
  }
  async function save(){
    const x = X(), keep = items.filter(i => i.pick != null).map(i => i.cands[i.pick]); if (!keep.length) return;
    const btn = $('#sv', ov); btn.disabled = true; btn.textContent = 'Saving…';
    try {
      const r = await x.api('/api/library/playlists', {method: 'POST', body: {name: (name || 'Imported playlist').trim()}});
      const pid = r.playlist.id;
      for (const id of keep) await x.api('/api/library/playlists/' + pid + '/tracks', {method: 'POST', body: x.meta(id)});
      try { await x.loadLibrary(); } catch(e){}
      toast('Saved ' + keep.length + ' songs to “' + name + '”'); close();
    } catch(e){ btn.disabled = false; btn.textContent = 'Save as playlist'; toast(e.message || 'Could not save'); }
  }
  drawIn();
}

/* =========================================================
   entry points
   ========================================================= */
const CHIPS = [['car', 'Car mode', 'car'], ['mic', 'Find a song', 'hum'], ['mix', 'Import', 'import'], ['star', 'Wrapped', 'wrapped'], ['palette', 'Themes', 'themes']];
function chips(){
  return `<div class="xchips" role="toolbar" aria-label="Quick tools">${CHIPS.map(([ic, l, v]) => `<button class="xchip" data-act="x" data-v="${v}">${svg(ic, 20, 2)}${l}</button>`).join('')}</div>`;
}
function rows(){
  const row = (ic, t, s, v) => `<button class="set" data-s="${esc((t + ' ' + s).toLowerCase())}" data-act="x" data-v="${v}"><span class="tile t1">${svg(ic, 22, 2)}</span><span class="tx"><b>${t}</b><span>${s}</span></span></button>`;
  const n = Object.keys(fol()).length;
  return row('palette', 'Themes', 'Colours from cover art or your own, black, grey or light background', 'themes')
    + row('car', 'Car mode', 'Huge buttons and voice control. Can open by itself in your car', 'car')
    + row('bell', 'Following', n ? n + ' artist' + (n > 1 ? 's' : '') + ' · new release alerts' : 'Follow artists to get new release alerts', 'following')
    + row('mic', 'Find a song', 'Sing, hum or say a few words', 'hum')
    + row('mic2', 'Karaoke', 'Words light up in time. Turn the lead vocal down', 'karaoke')
    + row('star', 'Eva Wrapped', 'Your year in music', 'wrapped')
    + row('mix', 'Import playlists', 'Paste a link or a list of songs', 'import')
    + row('moon', 'Sleep timer', 'Stop the music by itself', 'sleep');
}
function open(v){
  if (!v) return;
  if (v.indexOf('follow:') === 0) return toggleFollow(v.slice(7));
  if (v.indexOf('album:') === 0){
    const [, al, ar] = v.split(':'); const x = X(); const ids = x.artistTracks(ar).filter(t => t.al === al).map(t => t.id);
    if (ids.length){ x.playTrack(ids[0], ids, x.ALB[al].title); toast('Playing ' + x.ALB[al].title); } return;
  }
  ({car: openCar, hum: openHum, karaoke: openKaraoke, wrapped: openWrapped, import: openImport, themes: openThemes, following: openFollowing, sleep: openSleep})[v] && ({car: openCar, hum: openHum, karaoke: openKaraoke, wrapped: openWrapped, import: openImport, themes: openThemes, following: openFollowing, sleep: openSleep})[v]();
}

window.evaX = { chips, rows, open, followBar, albums, close, isOpen, car: openCar, beforeTheme(){} };

/* background: count listening time for Wrapped, check new releases */
setInterval(logTick, 1000);
window.addEventListener('pagehide', () => LS.set(LOG_KEY, JSON.stringify(log)));
setTimeout(() => { try { checkNew(false); } catch(e){} }, 9000);
// First run: seed Wrapped with the history the app already has
setTimeout(() => { try {
  if (log.length || LS.get('eva.logseed', '')) return; LS.set('eva.logseed', '1');
  const h = X().getHist(); const x = X();
  h.forEach(r => { const ts = Date.parse(r.played_at); if (!ts) return; log.push({id: r.track_id, ts, sec: Math.round((r.ms_played || 0) / 1000) || r.duration_seconds || 180, title: r.title, artist: r.artist, cover: r.thumbnail_url || '', lang: langOf(r.title, r.artist, r.track_id), logged: true}); });
  LS.set(LOG_KEY, JSON.stringify(log));
} catch(e){} }, 4000);
})();
