# Google Analytics (GA4)

## Step 1 — Create a GA4 property

1. Open [Google Analytics](https://analytics.google.com/)
2. **Admin** (gear) → **Create property** (or use an existing one)
3. **Admin** → **Data streams** → **Add stream** → **Web**
4. Enter your Netlify URL (e.g. `https://your-site.netlify.app`)
5. Copy the **Measurement ID** — it looks like `G-XXXXXXXXXX`

## Step 2 — Add to your Mac (local dev)

In your project folder, edit `.env` (create from `.env.example` if needed):

```
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

Restart the dev server after saving.

## Step 3 — Add to Netlify (live site)

1. [Netlify](https://app.netlify.com) → your site → **Site configuration** → **Environment variables**
2. Add:

| Key | Value |
|-----|--------|
| `VITE_GA_MEASUREMENT_ID` | `G-XXXXXXXXXX` |

3. **Deploys** → **Trigger deploy** → **Clear cache and deploy site**

(Vite bakes this in at build time — redeploy is required.)

## What gets tracked

- Home page and `/admin`
- Episode menu clicks (`#whats-new`, `#episode-australia`, `#letter`, etc.)

Analytics is **off** when `VITE_GA_MEASUREMENT_ID` is empty.

## Check it works

1. Open your live site in a browser
2. In GA4 → **Reports** → **Realtime** — you should see 1 active user within a minute

It can take 24–48 hours before full reports populate.
