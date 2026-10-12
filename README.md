# Lure Lab v1.0.0
Resin volume + lure buoyancy/lead calculator. Static PWA, no backend.

**Run locally:** `npx serve .` (or `python3 -m http.server`) then open the URL. (Service worker needs http://localhost or https.)
**Deploy:** push this folder to a GitHub repo → Settings → Pages → deploy from branch. Relative paths work in a project sub-path.
**Release an update:** bump `VERSION` in `calc.js` and `V` in `sw.js`; users tap "Check for update".
**Tests:** `node test.js`

## You must supply / verify
- Kristal 6: mix ratio, ratio basis (weight/volume), Part A/B densities (if by weight), shrinkage. Nothing is pre-filled.
- Wood densities are approximate; measure your own piece.
- Measure finished-lure displacement and test in your water density.
