# Deploying Resolva Bank to Hostinger

This app uses two parallel build modes:

| Mode | Command | Output | Used by |
|---|---|---|---|
| **SSR (Cloudflare Workers)** | `npm run build` | `dist/` | Lovable preview & Lovable Publish |
| **Static SPA** | `npm run build:static` | `dist-static/` | **Hostinger** & any static host |

The static build runs the app entirely in the browser. Auth, database, file uploads, and edge functions all still work — they call Lovable Cloud directly over HTTPS.

---

## One-time Hostinger setup

### 1. Connect GitHub

1. In Lovable: **Connectors → GitHub → Connect project** (creates a repo).
2. In Hostinger hPanel: **Websites → Manage → Git** → connect the same repo, branch `main`.
3. Set **Repository path**: `/public_html` (or your domain's docroot).

### 2. Add a build hook

Hostinger's Git integration only pulls files — it doesn't run `npm install`/`npm run build`. Two options:

**Option A (simplest): build locally, commit `dist-static/`**

```bash
npm install
npm run build:static
# then commit & push the dist-static folder
```
Then in Hostinger Git settings, set the deploy path to `/public_html` and use the deploy script:
```sh
#!/bin/sh
rsync -a --delete dist-static/ /home/<your-user>/public_html/
```

**Option B (auto-build on push): GitHub Actions → FTP**

Add `.github/workflows/deploy.yml` (template at the bottom of this file) that builds and pushes `dist-static/` to Hostinger via FTP.

### 3. Point your domain

If your domain is already on Hostinger, it's automatic — just make sure the website's docroot is `/public_html` and the Git deploy lands files there.

---

## Local build & manual upload (fastest first deploy)

```bash
npm install
npm run build:static
```

Then in Hostinger **File Manager**:
1. Open `/public_html`.
2. Delete any existing `index.html` / old files.
3. Upload **everything inside `dist-static/`** (not the folder itself — the contents).
4. Make sure `.htaccess` is uploaded (it's hidden — enable "Show hidden files" in File Manager).
5. Visit your domain — done.

---

## Why `.htaccess` matters

TanStack Router is client-side. Without the SPA fallback rule, refreshing `/dashboard` or any deep link returns 404. The included `.htaccess` rewrites all unknown paths to `index.html` so the router can handle them.

---

## Environment variables

The Supabase URL and publishable key are baked into the bundle at build time from `.env`:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
```

These are **safe to ship publicly** (they're public anon keys protected by Row Level Security). No server-side env vars are needed because there's no server.

---

## GitHub Actions auto-deploy (Option B)

Save as `.github/workflows/deploy.yml`. Set secrets `FTP_HOST`, `FTP_USER`, `FTP_PASSWORD` in your GitHub repo settings (get FTP credentials from Hostinger → **Files → FTP Accounts**).

```yaml
name: Deploy to Hostinger
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build:static
      - name: Upload to Hostinger
        uses: SamKirkland/FTP-Deploy-Action@v4.3.5
        with:
          server: ${{ secrets.FTP_HOST }}
          username: ${{ secrets.FTP_USER }}
          password: ${{ secrets.FTP_PASSWORD }}
          local-dir: ./dist-static/
          server-dir: /public_html/
```

---

## Troubleshooting

- **Blank page** → open browser DevTools → Console. Most likely `.env` wasn't set during build, so Supabase init throws. Re-run `npm run build:static` after confirming `.env` exists.
- **404 on refresh** → `.htaccess` didn't upload. Re-upload it (it's a hidden file).
- **Mixed-content errors** → make sure your Hostinger SSL is active (free Let's Encrypt cert in hPanel → SSL).
- **Old version still showing** → hard refresh (Ctrl+Shift+R). The `.htaccess` sets `no-cache` on HTML so this should be rare.