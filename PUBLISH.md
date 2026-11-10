# Publishing notes

Everything is static and hosted free on GitHub Pages.

* **Portfolio**: this folder is the `raksh3011/raksh3011.github.io` repo (push to `main`).
* **AURAX replay demo**: `dist/aurax-demo` is the public `raksh3011/aurax-demo` repo (replay UI + recorded logs only; the C++ source repo stays private). Rebuild with `python tools/build_aurax_static.py <stage_dir> dist/aurax-new`, then sync into `dist/aurax-demo` and push.
* **FloatChat demo**: `floatchat/` (data from `tools/export_static.py` in the FloatChat repo).
* **ORVMS demo**: `orvms/app/` is `npm run build:static` from the MSA repo (the real API runs in the browser; no Cloudflare account needed). The full Worker + D1 deployment is optional (`wrangler deploy`).
