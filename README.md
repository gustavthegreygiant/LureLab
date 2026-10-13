# Lure Lab v1.0.0
Resin volume + lure buoyancy/lead calculator. Static PWA, no backend.

**Run locally:** `npx serve .` (or `python3 -m http.server`) then open the URL. (Service worker needs http://localhost or https.)
**Deploy:** push this folder to a GitHub repo → Settings → Pages → deploy from branch. Relative paths work in a project sub-path.
**Release an update:** bump `VERSION` in `calc.js` and `V` in `sw.js`; users tap "Check for update".
**Tests:** `node test.js`

## You must supply / verify
- Kristal 6: verified from AMT TDS Rev 3 (100:33 by weight, SG 1.1). Shrinkage has no published number (only "negligible"): you set the allowance. Max 5 mm per layer.
- Wood densities are approximate; measure your own piece.
- Measure finished-lure displacement and test in your water density.
