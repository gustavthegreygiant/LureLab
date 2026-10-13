(() => {
const $ = s => document.querySelector(s), C = Calc, num = v => (v === '' || v == null ? NaN : +v);
const ld = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const sv = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { alert('Browser storage unavailable.'); } };
const f = (x, d = 2) => (Number.isFinite(x) ? (+x).toFixed(d) : '–');
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
$('#ver').textContent = 'v' + C.VERSION;

const RD = { resin: 'kristal6', mode: 'known', unit: 'mm', cav: '', L: '', W: '', H: '', D: '', basis: 'weight', ra: 100, rb: 33, densA: '', densB: '', mixDens: 1.1, method: 'allowance', shrink: '', waste: 5, inc: 0.5 };
const BD = { name: '', notes: '', rho: 1.025, volSrc: 'measured', volMode: 'volume', vol: '', L: '', W: '', H: '', woodType: 'meranti', woodDens: '', wood: '', resin: '', paint: '', hook: '', ring: '', wire: '', other: '', exLead: '', exBallast: '', completed: '', mode: 'float', margin: 2.5, rate: 1, offset: '', installed: '', leadInc: 0.5 };
const st = { resin: { ...RD, ...ld('ll.resin', {}) }, buoy: { ...BD, ...ld('ll.buoy', {}) }, cal: ld('ll.cal', []) };
const O = (...a) => a.map(x => [x, x]);
const isShape = s => s.mode !== 'known';

const FIELDS = {
  resin: [
    ['resin', 'Resin product', null, [[ 'kristal6', 'AMT Kristal 6' ]], 'Products are data in calc.js; add more there.'],
    ['mode', 'Mould volume source', null, [['known', 'Known / measured volume (best)'], ['block', 'Ideal block'], ['cyl', 'Ideal cylinder'], ['sphere', 'Ideal sphere']], 'Shapes are ideal geometry only. Irregular lure cavities need a water-fill measurement.'],
    ['cav', 'Cavity volume', 'ml', 0, 'Fill the cavity with water, pour into a measuring cylinder. 1 ml = 1 cm³.', s => !isShape(s)],
    ['unit', 'Dimension unit', null, [['mm', 'mm'], ['cm', 'cm']], '', isShape],
    ['L', 'Length', 'dim', 0, '', s => s.mode === 'block'], ['W', 'Width', 'dim', 0, '', s => s.mode === 'block'],
    ['D', 'Diameter', 'dim', 0, '', s => s.mode === 'cyl' || s.mode === 'sphere'], ['H', 'Height', 'dim', 0, '', s => s.mode === 'block' || s.mode === 'cyl'],
    ['basis', 'Ratio basis', null, [['', '— select —'], ['volume', 'By volume'], ['weight', 'By weight']], 'AMT gives Kristal 6 by WEIGHT only (no volume ratio). Do not mix by volume.'],
    ['ra', 'Ratio Part A', 'parts', 0, 'Kristal 6: 100:33 by weight (AMT TDS).'], ['rb', 'Ratio Part B', 'parts', 0],
    ['densA', 'Part A density', 'g/ml', 0, 'Needed only for by-weight ratios.', s => s.basis === 'weight'], ['densB', 'Part B density', 'g/ml', 0, '', s => s.basis === 'weight'],
    ['mixDens', 'Mixed density (optional)', 'g/ml', 0, 'AMT TDS: specific gravity 1.1 (mixed). Overrides A/B densities.', s => s.basis === 'weight'],
    ['method', 'Shrinkage method', null, [['allowance', 'Simple allowance: V × (1+s)'], ['correction', 'Correction: V ÷ (1−s)']], 'Only one is applied, never both.'],
    ['shrink', 'Shrinkage', '%', 0, 'AMT says only "negligible" (no figure). Enter your own allowance, 0 is allowed. Correction needs a real shrinkage figure.'],
    ['waste', 'Mixing / pouring waste', '%', 0, 'Resin left on cups, stirrers, sprue.'],
    ['inc', 'Round up to', null, [[0.1, '0.1 (g or ml)'], [0.5, '0.5'], [1, '1']], 'Always rounds UP.']],
  buoy: [
    ['name', 'Lure name', null, 'text'], ['notes', 'Notes', null, 'text'],
    ['rho', 'Water density (target)', 'g/cm³', 0, 'Sea water ≈ 1.025. Adjust for your water.'],
    ['volSrc', 'Volume source', null, [['measured', 'Measured displacement (preferred)'], ['dims', 'Rough box dimensions']], 'Displacement of the finished lure is the correct input. Volume and displacement are the same thing: never add them.'],
    ['volMode', 'Displacement reading', null, [['volume', 'Volume (ml/cm³) directly'], ['fresh_mass', 'Mass of displaced FRESH water'], ['salt_mass', 'Mass of displaced SALT water']], 'Volume is volume in any water. A mass reading is converted with that water’s density.', s => s.volSrc === 'measured'],
    ['vol', 'Displacement', 'cm³ or g', 0, 'Is it the bare body or the complete sealed lure with hardware? Only the complete lure is exact.', s => s.volSrc === 'measured'],
    ['L', 'Length', 'mm', 0, '', s => s.volSrc === 'dims'], ['W', 'Width', 'mm', 0, '', s => s.volSrc === 'dims'], ['H', 'Height', 'mm', 0, '', s => s.volSrc === 'dims'],
    ['woodType', 'Wood (approx. density)', null, Object.entries(C.WOODS).map(([k, v]) => [k, v[0] + (v[1] ? ' ≈' + v[1] : '')]), 'Approximate reference only; varies by piece and moisture.'],
    ['woodDens', 'Custom wood density', 'g/cm³', 0, 'Measured value overrides the preset.'],
    ['wood', 'Wood/body mass', 'g', 0, 'Blank: estimated from density × volume.'],
    ['resin', 'Cured resin coating', 'g'], ['paint', 'Paint + clearcoat', 'g'], ['hook', 'Hooks', 'g'], ['ring', 'Split rings', 'g'], ['wire', 'Screw-eye / through-wire', 'g'], ['other', 'Other hardware', 'g'], ['exLead', 'Existing lead', 'g'], ['exBallast', 'Other ballast', 'g'],
    ['completed', 'Completed lure mass (optional)', 'g', 0, 'If set, it replaces ALL component masses above (they are not added again).'],
    ['mode', 'Target behaviour', null, [['float', 'Steady float'], ['sink', 'Slow sink'], ['rise', 'Slow rise']], 'Ballast only sets the mass balance.'],
    ['margin', 'Float safety margin', 'g', 0, 'Positive buoyancy to cover material and measuring variation.', s => s.mode === 'float'],
    ['rate', 'Target speed (design goal)', 'cm/s', 0, 'A goal to test against. Mass alone cannot predict speed.', s => s.mode !== 'float'],
    ['offset', 'Submerged offset', 'g', 0, 'Advanced: grams below (sink) / above (rise) neutral. Blank = neutral.', s => s.mode !== 'float'],
    ['installed', 'Lead actually installed (new)', 'g', 0, 'Recalculates the real margin after testing.'],
    ['leadInc', 'Lead piece size', 'g', 0, 'Rounds to nearest whole piece.']]
};
const fieldHtml = (t, [id, label, unit, opts, tip]) => {
  const v = st[t][id], dim = unit === 'dim' ? st.resin.unit : unit;
  let inp;
  if (opts === 'text') inp = `<input data-t="${t}" data-id="${id}" value="${esc(v)}">`;
  else if (Array.isArray(opts)) inp = `<select data-t="${t}" data-id="${id}">${opts.map(o => `<option value="${esc(o[0])}" ${String(o[0]) === String(v) ? 'selected' : ''}>${esc(o[1])}</option>`).join('')}</select>`;
  else inp = `<input type="number" step="any" min="0" inputmode="decimal" data-t="${t}" data-id="${id}" value="${esc(v)}">`;
  return `<label data-f="${t}.${id}"><span>${label}</span><div>${inp}${dim ? `<b>${dim}</b>` : ''}</div>${tip ? `<i>${tip}</i>` : ''}</label>`;
};
function vis(t) { FIELDS[t].forEach(fd => { const el = document.querySelector(`[data-f="${t}.${fd[0]}"]`); if (el) el.classList.toggle('hide', !!(fd[5] && !fd[5](st[t]))); }); }

// ---------- compute ----------
function resinIn() {
  const r = st.resin, k = r.unit === 'cm' ? 10 : 1; let cav;
  if (r.mode === 'known') cav = num(r.cav); else cav = C.shapeVolume(r.mode, num(r.L) * k, num(r.W) * k, num(r.H) * k, num(r.D) * k);
  return { cavity: cav, method: r.method, shrink: num(r.shrink), waste: num(r.waste), basis: r.basis, a: num(r.ra), b: num(r.rb), densA: num(r.densA), densB: num(r.densB), mixDens: num(r.mixDens), inc: num(r.inc) };
}
function buoyIn() {
  const b = st.buoy, n = id => num(b[id]);
  return { rho: n('rho'), volSrc: b.volSrc, volMode: b.volMode, vol: n('vol'), L: n('L'), W: n('W'), H: n('H'), woodDens: n('woodDens') || C.WOODS[b.woodType][1] || NaN, wood: n('wood'), resin: n('resin'), paint: n('paint'), hook: n('hook'), ring: n('ring'), wire: n('wire'), other: n('other'), exLead: n('exLead'), exBallast: n('exBallast'), completed: n('completed'), mode: b.mode, margin: n('margin'), offset: n('offset'), installed: n('installed'), leadInc: n('leadInc') };
}
let last = { resin: null, buoy: null };
const row = (a, b) => `<div class="row"><span>${a}</span><b>${b}</b></div>`;
const steps = s => `<details><summary>How this was calculated</summary><ol class="steps">${s.map(x => `<li>${esc(x)}</li>`).join('')}</ol></details>`;

function showResin() {
  const r = C.resin(resinIn()); last.resin = r; let h = '';
  if (!r.ok) h = r.err.map(e => `<div class="warn">${esc(e)}</div>`).join('');
  else {
    h = row('Cavity volume (cured target)', f(r.cavity) + ' ml') + row('Total mixture to prepare', `<span class="big">${f(r.total)} ml</span>`);
    if (r.partsOk) {
      const u = r.unit, pa = r.A / (r.A + r.B) * 100;
      if (r.M != null) h += row('Total mixture mass', f(r.M) + ' g');
      h += row('Part A (calculated)', f(r.A, 3) + ' ' + u) + row('Part B (calculated)', f(r.B, 3) + ' ' + u);
      h += row('Practical: Part A (rounded up)', `<span class="big">${f(r.Ar, 2)} ${u}</span>`) + row('Practical: Part B (rounded up)', `<span class="big">${f(r.Br, 2)} ${u}</span>`);
      h += `<div class="bar"><div style="width:${pa}%;background:var(--a)">A ${f(pa, 0)}%</div><div style="width:${100 - pa}%;background:var(--g)">B ${f(100 - pa, 0)}%</div></div>`;
      h += `<div class="note">Rounding each part up slightly shifts the ratio. Small batches are sensitive to measuring error; follow the manufacturer's instructions.</div>`;
    } else h += `<div class="warn">Cannot split into Part A / Part B. Missing: ${r.missing.map(esc).join('; ')}.</div>`;
    h += steps(r.steps);
  }
  $('#resinRes').innerHTML = h;
  $('#resinAct').classList.toggle('hide', !(r.ok && r.partsOk));
}
function showBuoy() {
  const r = C.buoyancy(buoyIn()); last.buoy = r; let h = '';
  if (!r.ok) h = r.err.map(e => `<div class="warn">${esc(e)}</div>`).join('');
  else {
    const b = st.buoy;
    h = row('Displaced volume', f(r.V) + ' cm³') + row('Water displaced (max mass at neutral)', f(r.D) + ' g') + row('Baseline mass (excl. new lead)', f(r.base) + ' g');
    h += row('Lead for neutral buoyancy (reference)', f(r.neutralLead) + ' g');
    h += row('Target lead (' + { float: 'steady float', sink: 'slow sink', rise: 'slow rise' }[b.mode] + ')', `<span class="big">${f(r.need)} g</span>`);
    if (r.negative) h += `<div class="warn">${esc(r.msg)}</div>`;
    if (r.pieces != null) h += row(`Nearest ${b.leadInc} g pieces`, `${r.pieces} × ${b.leadInc} = ${f(r.achieved)} g (${r.diff >= 0 ? '+' : ''}${f(r.diff, 3)} g)`);
    h += row('Submerged margin at target lead', f(r.marginNeed) + ' g');
    if (r.marginNow != null) h += row('Margin with installed lead', `${f(r.marginNow)} g → fully submerged it ${r.marginNow > 0.0005 ? 'tends to rise' : r.marginNow < -0.0005 ? 'tends to sink' : 'is ≈ neutral'}`);
    if (b.mode !== 'float') h += `<div class="note">Target ${b.rate || '?'} cm/s is a test goal. Neutral buoyancy is not a speed: drag, attitude and shape decide the rate. Tune using the calibration table.</div>`;
    h += `<div class="note">Lead placement shifts centre of gravity, attitude and action. Adding lead adds mass, never displacement. If you measured the bare body, finished-lure volume and mass will differ: re-measure after sealing.</div>` + steps(r.steps);
  }
  $('#buoyRes').innerHTML = h;
  $('#buoyAct').classList.toggle('hide', !r.ok);
  calTable();
}
function calTable() {
  const rows = st.cal.map((c, i) => `<tr><td>${i + 1}</td><td>${f(c.mass)}</td><td>${f(c.lead)}</td><td>${f(c.speed)} cm/s</td><td>${esc(c.beh)}</td><td>${esc(c.note)}</td><td><button data-delcal="${i}">✕</button></td></tr>`).join('');
  $('#calBody').innerHTML = rows || '<tr><td colspan="7">No tests yet.</td></tr>';
}

function applyPreset() {
  const p = C.RESINS.find(r => r.id === st.resin.resin); if (!p || !p.verified) return;
  Object.assign(st.resin, { ra: p.ratioA ?? '', rb: p.ratioB ?? '', basis: p.basis ?? '', mixDens: p.mixDens ?? '', densA: p.densA ?? '', densB: p.densB ?? '' }); sv('ll.resin', st.resin);
}
if (st.resin.ra === '' && st.resin.rb === '' && st.resin.basis === '') applyPreset();
// ---------- history / share ----------
const summary = t => {
  const r = last[t]; if (!r || !r.ok) return '';
  if (t === 'resin') return `Resin (${C.RESINS[0].name}): cavity ${f(r.cavity)} ml → mix ${f(r.total)} ml` + (r.partsOk ? `; A ${f(r.Ar)} ${r.unit}, B ${f(r.Br)} ${r.unit}` : '');
  return `Lure ${st.buoy.name || '(unnamed)'}: displaces ${f(r.D)} g water, base ${f(r.base)} g → lead ${f(r.need)} g (${st.buoy.mode}); neutral ref ${f(r.neutralLead)} g`;
};
const logHist = t => { const h = ld('ll.hist', []); h.unshift({ t: Date.now(), tool: t, text: summary(t), data: st[t] }); sv('ll.hist', h.slice(0, 50)); alert('Logged to history.'); };
async function share(t) {
  const hash = '#s=' + btoa(unescape(encodeURIComponent(JSON.stringify({ t, d: st[t] }))));
  const url = location.href.split('#')[0] + hash, text = summary(t) + '\n' + url;
  try { if (navigator.share) { await navigator.share({ title: 'Lure Lab', text: summary(t), url }); return; } await navigator.clipboard.writeText(text); alert('Result and link copied to clipboard.'); }
  catch (e) { if (e.name !== 'AbortError') prompt('Copy this:', text); }
}
function loadHash() {
  if (!location.hash.startsWith('#s=')) return;
  try { const { t, d } = JSON.parse(decodeURIComponent(escape(atob(location.hash.slice(3))))); if (st[t] && typeof d === 'object') { st[t] = { ...(t === 'resin' ? RD : BD), ...d }; tab = t; } } catch { }
  history.replaceState(null, '', location.pathname);
}

// ---------- lures ----------
const lures = () => ld('ll.lures', []);
const validLure = l => l && typeof l.name === 'string' && l.buoy && typeof l.buoy === 'object' && Object.keys(l.buoy).every(k => k in BD) && Array.isArray(l.cal || []);
function saveLure() {
  const name = st.buoy.name || prompt('Lure name?'); if (!name) return; st.buoy.name = name;
  const L = lures(), r = last.buoy, ex = L.find(x => x.name === name), rec = { id: ex?.id || Date.now() + '', name, buoy: { ...st.buoy }, cal: [...st.cal], calcLead: r?.ok ? r.need : null, saved: Date.now() };
  if (ex) Object.assign(ex, rec); else L.unshift(rec);
  sv('ll.lures', L); alert('Saved "' + name + '".'); render();
}
function lureList() {
  const L = lures();
  return L.length ? `<table>${L.map(l => `<tr><td><b>${esc(l.name)}</b><br><small>lead ${f(l.calcLead)} g · installed ${esc(l.buoy.installed || '–')} g · ${l.cal.length} tests</small></td><td><button data-lure="load:${l.id}">Load</button> <button data-lure="dup:${l.id}">Copy</button> <button data-lure="del:${l.id}">Delete</button></td></tr>`).join('')}</table>` : '<p>No saved lures yet.</p>';
}
function histList() {
  const h = ld('ll.hist', []);
  return h.length ? `<table>${h.map(x => `<tr><td><small>${new Date(x.t).toLocaleString()}</small><br>${esc(x.text)}</td></tr>`).join('')}</table><div class="btns"><button id="clrHist">Clear history</button></div>` : '<p>No history yet.</p>';
}

// ---------- render ----------
let tab = 'home';
const TABS = [['home', 'Dashboard'], ['resin', 'Resin'], ['buoy', 'Buoyancy & Lead'], ['lures', 'Saved & History']];
function render() {
  $('#nav').innerHTML = TABS.map(([k, n]) => `<button data-tab="${k}" class="${k === tab ? 'on' : ''}">${n}</button>`).join('');
  const m = $('#main');
  if (tab === 'home') m.innerHTML = `<div class="dash"><div class="card" data-tab="resin"><h2>Tool 1</h2><div class="big">Resin Volume</div><p>Part A / Part B for your mould, with shrinkage and waste handled transparently.</p></div><div class="card" data-tab="buoy"><h2>Tool 2</h2><div class="big">Buoyancy & Lead</div><p>Ballast for steady float, slow sink or slow rise, then calibrate by testing.</p></div><div class="card" data-tab="lures"><h2>Library</h2><div class="big">Saved & History</div><p>${lures().length} lures saved. Import / export JSON.</p></div></div>
  <div class="card"><h2>Bench workflow</h2><ol><li>Carve and sand the body; measure mass and external volume.</li><li>Estimate coating and hardware masses.</li><li>Calculate preliminary ballast.</li><li>Temporarily fit ballast and hardware, then seal.</li><li>Test in salt water and adjust lead.</li><li>Record the final behaviour.</li></ol></div>`;
  else if (tab === 'resin') m.innerHTML = `<div class="grid"><div class="card"><h2>Inputs</h2><div class="note"><b>Verified from AMT TDS Rev 3 (29-06-23):</b> 100:33 by weight, SG 1.1, no volume ratio. <b>Not given:</b> a shrinkage number, so you set it. <b>Max 5 mm per layer</b>: thicker lure bodies must be poured in layers (heat/exotherm; pot life 40 min). Ideal shapes cannot represent a lure cavity.<br><button id="preset">Apply datasheet values</button></div>${FIELDS.resin.map(x => fieldHtml('resin', x)).join('')}<button id="rst">Reset</button></div><div class="card"><h2>Result</h2><div id="resinRes" class="res"></div><div id="resinAct" class="btns hide"><button class="pri" data-share="resin">Share result</button><button data-log="resin">Log to history</button></div></div></div>`;
  else if (tab === 'buoy') m.innerHTML = `<div class="grid"><div class="card"><h2>Lure & inputs</h2>${FIELDS.buoy.map(x => fieldHtml('buoy', x)).join('')}<button id="rst">Reset</button></div><div><div class="card"><h2>Result</h2><div id="buoyRes" class="res"></div><div id="buoyAct" class="btns hide"><button class="pri" data-share="buoy">Share result</button><button data-log="buoy">Log to history</button><button id="saveLure">Save lure</button></div></div>
  <div class="card" style="margin-top:16px"><h2>Test & calibration</h2><p class="note">Drop the sealed lure in salt water, time a fall/rise, and log it. Speed is not linear in lead: orientation and drag change.</p>
  <label><span>Distance</span><div><input id="cd" type="number" step="any" min="0"><b>cm</b></div></label><label><span>Time</span><div><input id="ct" type="number" step="any" min="0"><b>s</b></div></label><label><span>Behaviour</span><div><select id="cb"><option>sank</option><option>rose</option><option>floated</option><option>suspended</option></select></div></label><label><span>Notes</span><div><input id="cn"></div></label><button id="addCal" class="pri">Add test (uses current total mass)</button>
  <table style="margin-top:10px"><thead><tr><th>#</th><th>Mass g</th><th>Lead g</th><th>Speed</th><th>Seen</th><th>Notes</th><th></th></tr></thead><tbody id="calBody"></tbody></table></div></div></div>`;
  else m.innerHTML = `<div class="grid"><div class="card"><h2>Saved lures</h2>${lureList()}<div class="btns"><button id="exp">Export JSON</button><label class="btns" style="margin:0"><input type="file" id="imp" accept=".json" style="display:none"><button onclick="document.getElementById('imp').click()">Import JSON</button></label></div></div><div class="card"><h2>History</h2>${histList()}</div></div>`;
  if (FIELDS[tab]) { vis(tab); tab === 'resin' ? showResin() : showBuoy(); }
}
document.addEventListener('click', e => {
  const b = e.target.closest('button,.card[data-tab]'); if (!b) return;
  const d = b.dataset;
  if (d.tab) { tab = d.tab; render(); }
  else if (d.share) share(d.share); else if (d.log) logHist(d.log);
  else if (b.id === 'rst') { st[tab] = { ...(tab === 'resin' ? RD : BD) }; sv('ll.' + tab, st[tab]); render(); }
  else if (b.id === 'preset') { applyPreset(); render(); }
  else if (b.id === 'saveLure') saveLure();
  else if (b.id === 'addCal') {
    const sp = C.speed(num($('#cd').value), num($('#ct').value)), r = last.buoy;
    if (!Number.isFinite(sp)) return alert('Enter a distance and time greater than 0.');
    const lead = num(st.buoy.installed) || 0; st.cal.push({ mass: (r?.base ?? NaN) + lead, lead, speed: sp, beh: $('#cb').value, note: $('#cn').value }); sv('ll.cal', st.cal); calTable();
  } else if (d.delcal != null) { st.cal.splice(+d.delcal, 1); sv('ll.cal', st.cal); calTable(); }
  else if (d.lure) {
    const [a, id] = d.lure.split(':'), L = lures(), l = L.find(x => x.id === id); if (!l) return;
    if (a === 'load') { st.buoy = { ...BD, ...l.buoy }; st.cal = [...l.cal]; sv('ll.buoy', st.buoy); sv('ll.cal', st.cal); tab = 'buoy'; }
    if (a === 'dup') L.unshift({ ...l, id: Date.now() + '', name: l.name + ' copy' });
    if (a === 'del' && confirm('Delete ' + l.name + '?')) L.splice(L.indexOf(l), 1);
    sv('ll.lures', L); render();
  } else if (b.id === 'clrHist') { sv('ll.hist', []); render(); }
  else if (b.id === 'exp') { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(lures(), null, 2)], { type: 'application/json' })); a.download = 'lure-lab-lures.json'; a.click(); }
});
document.addEventListener('input', e => {
  const t = e.target.dataset.t; if (!t) return;
  st[t][e.target.dataset.id] = e.target.value;
  if (e.target.dataset.id === 'resin') { /* presets: unverified values stay blank */ }
  sv('ll.' + t, st[t]); vis(t); t === 'resin' ? showResin() : showBuoy();
});
document.addEventListener('change', e => {
  if (e.target.id !== 'imp') return;
  const rd = new FileReader();
  rd.onload = () => { try { const a = JSON.parse(rd.result); if (!Array.isArray(a) || !a.every(validLure)) throw 0; const L = lures(); a.forEach(l => L.unshift({ id: Date.now() + Math.random() + '', name: l.name, buoy: { ...BD, ...l.buoy }, cal: l.cal || [], calcLead: Number.isFinite(l.calcLead) ? l.calcLead : null, saved: Date.now() })); sv('ll.lures', L); render(); alert('Imported ' + a.length + ' lure(s).'); } catch { alert('Invalid file: expected an exported Lure Lab JSON list.'); } };
  rd.readAsText(e.target.files[0]);
});

// ---------- PWA: install + update ----------
let dip; addEventListener('beforeinstallprompt', e => { e.preventDefault(); dip = e; $('#inst').classList.remove('hide'); });
$('#inst').onclick = async () => { if (!dip) return; dip.prompt(); await dip.userChoice; dip = null; $('#inst').classList.add('hide'); };
addEventListener('appinstalled', () => $('#inst').classList.add('hide'));
if ('serviceWorker' in navigator) {
  let reg, reloading;
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (!reloading) { reloading = 1; location.reload(); } });
  navigator.serviceWorker.register('sw.js').then(r => { reg = r; r.addEventListener('updatefound', () => { const w = r.installing; w.addEventListener('statechange', () => { if (w.state === 'installed' && navigator.serviceWorker.controller) { $('#upd').textContent = '⟳ Update ready: apply'; $('#upd').classList.add('pri'); } }); }); });
  $('#upd').onclick = async () => {
    if (reg?.waiting) return reg.waiting.postMessage('skip');
    $('#upd').textContent = 'Checking…'; try { await reg.update(); } catch { }
    setTimeout(() => { if (!reg.waiting && !reg.installing) { $('#upd').textContent = '✓ Up to date'; setTimeout(() => $('#upd').textContent = '⟳ Check for update', 2500); } }, 1500);
  };
} else $('#upd').classList.add('hide');
loadHash(); render();
})();
