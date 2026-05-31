# Connect GitHub + Netlify (fixes Google Drive auto-upload)

Your project is already a **Git repo** on your Mac. Follow these steps to put it on GitHub and connect Netlify.

---

## Step 1 — Create a GitHub repository

1. Open [https://github.com/new](https://github.com/new)
2. Repository name: e.g. `for-you-my-love` (any name is fine)
3. Leave it **Empty** — do **not** add README, .gitignore, or license (you already have them)
4. Click **Create repository**

---

## Step 2 — Push your code from the Mac

Open **Terminal** and run (replace `YOUR_USERNAME` and `REPO_NAME`):

```bash
cd /Users/paoppk_/Desktop/ploypm

git remote add origin https://github.com/YOUR_USERNAME/REPO_NAME.git

git branch -M main

git push -u origin main
```

GitHub will ask you to sign in (browser or personal access token).

Your `.env` file is **not** uploaded (secrets stay on your Mac only).

---

## Step 3 — Connect Netlify to GitHub

1. [https://app.netlify.com](https://app.netlify.com) → your site (or **Add new site**)
2. **Import from Git** → **GitHub** → authorize → pick your repo
3. Build settings (should auto-detect from `netlify.toml`):
   - Build command: `npm run build`
   - Publish directory: `dist`
4. **Environment variables** — see **`docs/NETLIFY_ENV.md`** (required or admin shows “Supabase is not connected”):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `SUPABASE_URL` (same URL as above)
   - `SUPABASE_SERVICE_ROLE_KEY`
   - Optional Drive: `GOOGLE_SERVICE_ACCOUNT_JSON`, `GOOGLE_DRIVE_FOLDER_ID`
5. **Deploy site**, then **Trigger deploy** again whenever you change env vars

Every `git push` will redeploy automatically.

---

## Step 4 — Check Google Drive

After deploy finishes, open `https://your-site.netlify.app/admin`

You should see **green**: “Google Drive connected” (if all env vars are set).

---

## Daily workflow

```bash
cd /Users/paoppk_/Desktop/ploypm
# edit files...
git add .
git commit -m "Describe your change"
git push
```

Netlify rebuilds in ~1–2 minutes.
