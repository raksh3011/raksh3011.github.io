# Publishing (one-time, needs your OK because these create public pages)

Everything is built and tested locally. Run these in PowerShell from this folder.

## 1. AURAX hosted replay (public demo repo; the C++ source repo stays private)
```powershell
cd dist\aurax-demo
git init -b main; git add -A; git commit -m "AURAX hosted replay demo"
gh repo create raksh3011/aurax-demo --public --source . --push
gh api -X POST repos/raksh3011/aurax-demo/pages -f "source[branch]=main" -f "source[path]=/"
```
Live at https://raksh3011.github.io/aurax-demo/ in ~1 minute.

## 2. Portfolio at https://raksh3011.github.io/
```powershell
cd ..\..
git init -b main; git add -A; git commit -m "Portfolio"
gh repo create raksh3011/raksh3011.github.io --public --source . --push
```
(User sites are served automatically from the main branch.)

## 3. ORVMS live demo (Cloudflare)
D1 database `orvms` and the Worker secrets are already created in your Cloudflare account. One manual step is left:
open https://dash.cloudflare.com -> Workers & Pages once (this creates your workers.dev subdomain), then:
```powershell
git clone https://github.com/raksh3011/MSA; cd MSA
# in wrangler.toml set:  database_id = "231007c2-1c68-4ae1-b221-c624adc6326d"   (the [[d1_databases]] block)
npm ci; npm run build; npx wrangler deploy
```
Then set `orvms:` in `assets/os.js` (URLS) and `LIVE_URL` in `orvms/index.html` to the printed https://orvms.<subdomain>.workers.dev URL and push.
