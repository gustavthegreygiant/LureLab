/* Lure Lab calculation core. Pure functions, no DOM. Units: mm, cm3/ml, g, g/cm3. */
(function (root) {
const VERSION = '1.0.0', FRESH = 0.998;
const pos = v => Number.isFinite(v) && v > 0;
const n0 = v => (Number.isFinite(v) ? v : 0);
const ceilTo = (x, inc) => (inc > 0 ? Math.ceil(x / inc - 1e-9) * inc : x);
// Add resins here. null = NOT verified; user must supply from the datasheet.
const RESINS = [{ id: 'kristal6', name: 'AMT Kristal 6', ratioA: null, ratioB: null, basis: null,
  densA: null, densB: null, mixDens: null, shrink: null, verified: false }];
const WOODS = { balsa: ['Balsa', 0.16], cedar: ['Cedar', 0.38], pine: ['Pine', 0.50], meranti: ['Meranti', 0.55], custom: ['Custom', null] };

function shapeVolume(s, L, W, H, D) { // returns cm3 from mm inputs
  if (s === 'block') return L * W * H / 1000;
  if (s === 'cyl') return Math.PI * (D / 2) ** 2 * H / 1000;
  if (s === 'sphere') return 4 / 3 * Math.PI * (D / 2) ** 3 / 1000;
  return NaN;
}

function resin(i) {
  const err = [], steps = [];
  if (!pos(i.cavity)) err.push('Enter a cavity volume greater than 0 ml.');
  if (!Number.isFinite(i.shrink) || i.shrink < 0) err.push('Enter a shrinkage figure (0 if none). Not assumed for Kristal 6.');
  const waste = n0(i.waste);
  if (i.method === 'correction' && i.shrink >= 100) err.push('Actual shrinkage must be below 100%.');
  if (err.length) return { ok: false, err };
  let vol;
  if (i.method === 'correction') {
    vol = i.cavity / (1 - i.shrink / 100);
    steps.push(`Corrected volume = ${i.cavity} ÷ (1 − ${i.shrink / 100}) = ${vol.toFixed(3)} ml (allowance method NOT also applied)`);
  } else {
    vol = i.cavity * (1 + i.shrink / 100);
    steps.push(`With shrinkage allowance = ${i.cavity} × (1 + ${i.shrink / 100}) = ${vol.toFixed(3)} ml`);
  }
  const total = vol * (1 + waste / 100);
  steps.push(`Total mix = ${vol.toFixed(3)} × (1 + ${waste / 100}) = ${total.toFixed(3)} ml`);
  const out = { ok: true, cavity: i.cavity, total, steps, partsOk: false, missing: [], err: [] };
  const a = i.a, b = i.b;
  if (!pos(a) || !pos(b)) out.missing.push('mixing ratio (Part A : Part B)');
  if (i.basis !== 'volume' && i.basis !== 'weight') out.missing.push('ratio basis (by volume or by weight)');
  if (out.missing.length) return out;
  const fa = a / (a + b), fb = b / (a + b);
  const inc = i.inc > 0 ? i.inc : 0.1;
  if (i.basis === 'volume') {
    out.unit = 'ml'; out.A = total * fa; out.B = total * fb; out.M = null;
    steps.push(`Volume ratio ${a}:${b} → A = ${total.toFixed(3)} × ${a}/${a + b}, B = ${total.toFixed(3)} × ${b}/${a + b}`);
  } else {
    let M;
    if (pos(i.mixDens)) { M = total * i.mixDens; steps.push(`Mix mass = ${total.toFixed(3)} ml × ${i.mixDens} g/ml = ${M.toFixed(3)} g`); }
    else if (pos(i.densA) && pos(i.densB)) {
      M = total / (fa / i.densA + fb / i.densB);
      steps.push(`Mix mass = volume ÷ (fA/ρA + fB/ρB) = ${M.toFixed(3)} g (assumes volumes add)`);
    } else { out.missing.push('Part A and Part B densities (or a measured mixture density) to convert volume to mass'); return out; }
    out.unit = 'g'; out.M = M; out.A = M * fa; out.B = M * fb;
    steps.push(`Weight ratio ${a}:${b} → A = ${M.toFixed(3)} × ${a}/${a + b}, B = ${M.toFixed(3)} × ${b}/${a + b}`);
  }
  out.partsOk = true; out.inc = inc; out.Ar = ceilTo(out.A, inc); out.Br = ceilTo(out.B, inc);
  return out;
}

function buoyancy(i) {
  const err = [], steps = [];
  const rho = i.rho;
  if (!pos(rho) || rho < 0.9 || rho > 1.1) err.push('Water density must be 0.9–1.1 g/cm³ (sea water ≈ 1.025).');
  let V;
  if (i.volSrc === 'dims') { V = i.L * i.W * i.H / 1000; steps.push('Volume from bounding box (rough, overestimates a carved shape).'); }
  else if (i.volMode === 'fresh_mass') { V = i.vol / FRESH; steps.push(`Volume = displaced fresh-water mass ${i.vol} g ÷ ${FRESH} = ${V.toFixed(3)} cm³`); }
  else if (i.volMode === 'salt_mass') { V = i.vol / rho; steps.push(`Volume = displaced salt-water mass ${i.vol} g ÷ ${rho} = ${V.toFixed(3)} cm³`); }
  else { V = i.vol; steps.push(`Volume entered directly = ${V} cm³`); }
  if (!pos(V)) err.push('Enter the lure displacement volume (cm³/ml) or dimensions.');
  let base, comp = null;
  if (pos(i.completed)) {
    base = i.completed;
    steps.push(`Completed-lure mass ${base} g used as baseline; individual component masses ignored (no double-counting).`);
  } else {
    let wood = i.wood, est = false;
    if (!pos(wood) && pos(i.woodDens) && pos(V)) { wood = V * i.woodDens; est = true; }
    if (!pos(wood)) err.push('Enter wood/body mass (or a wood density to estimate it), or a completed-lure mass.');
    comp = n0(wood) + n0(i.resin) + n0(i.paint) + n0(i.hook) + n0(i.ring) + n0(i.wire) + n0(i.other) + n0(i.exLead) + n0(i.exBallast);
    base = comp;
    steps.push(`Baseline mass = sum of components = ${base.toFixed(3)} g${est ? ' (wood mass ESTIMATED from approximate density)' : ''}`);
  }
  if (err.length) return { ok: false, err };
  const D = rho * V;
  steps.push(`Displaced-water mass = ${rho} × ${V.toFixed(3)} = ${D.toFixed(3)} g (maximum mass at neutral buoyancy)`);
  const neutralLead = D - base;
  steps.push(`Lead for neutral = ${D.toFixed(3)} − ${base.toFixed(3)} = ${neutralLead.toFixed(3)} g`);
  const m = n0(i.margin), off = n0(i.offset);
  let target, label;
  if (i.mode === 'sink') { target = neutralLead + off; label = `sink: neutral + ${off} g downward offset`; }
  else if (i.mode === 'rise') { target = neutralLead - off; label = `rise: neutral − ${off} g upward offset`; }
  else { target = neutralLead - m; label = `float: neutral − ${m} g safety margin`; }
  steps.push(`Target lead (${label}) = ${target.toFixed(3)} g`);
  const need = Math.max(0, target), negative = target < 0;
  const o = { ok: true, V, D, base, neutralLead, target, need, negative, steps, err: [], rho };
  if (negative) o.msg = `Calculated lead is ${target.toFixed(2)} g (negative): no lead is needed. The lure is already heavier than this target allows; remove weight or increase displaced volume. Adding lead never adds volume.`;
  o.marginNeed = D - (base + need);
  if (pos(i.leadInc)) { const n = Math.round(need / i.leadInc); o.pieces = n; o.achieved = n * i.leadInc; o.diff = o.achieved - need; }
  if (Number.isFinite(i.installed)) { o.installedTotal = base + i.installed; o.marginNow = D - o.installedTotal; }
  o.behaviour = (m => Math.abs(m) < 1e-9 ? 'neutral' : m > 0 ? 'rises/floats' : 'sinks')(o.marginNow ?? o.marginNeed);
  return o;
}
const speed = (dist, t) => (pos(dist) && pos(t) ? dist / t : NaN);
const api = { VERSION, FRESH, RESINS, WOODS, shapeVolume, resin, buoyancy, speed, ceilTo };
if (typeof module !== 'undefined') module.exports = api; else root.Calc = api;
})(this);
