# Fix “Supabase is not connected” on Netlify

Your `.env` file stays **on your Mac only** (not in Git). Netlify must get the same values in its dashboard, then **rebuild** the site.

---

## Step 1 — Copy values from Supabase

1. [Supabase](https://supabase.com) → your project → **Project Settings** → **API**
2. Copy:
   - **Project URL** → use for `VITE_SUPABASE_URL`
   - **anon public** key → use for `VITE_SUPABASE_ANON_KEY`

(Or copy both from your local `.env` file on your Mac.)

---

## Step 2 — Add them in Netlify

1. [Netlify](https://app.netlify.com) → your site → **Site configuration**
2. **Environment variables** → **Add a variable** → **Add a single variable**

Add **each** of these (for admin + gallery + Drive upload):

| Key | Value |
|-----|--------|
| `VITE_SUPABASE_URL` | `https://xxxxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOi...` (anon key) |
| `SUPABASE_URL` | **Same** as `VITE_SUPABASE_URL` |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key from Supabase API page (**secret**) |

For Google Analytics (optional), also add:

| Key | Value |
|-----|--------|
| `VITE_GA_MEASUREMENT_ID` | `G-XXXXXXXXXX` from GA4 → Admin → Data streams |

See **`docs/GOOGLE_ANALYTICS.md`** for setup steps.

For letter-open email alerts to **pao51613@gmail.com**, add:

| Key | Value |
|-----|--------|
| `RESEND_API_KEY` | `re_…` from [Resend](https://resend.com) |

See **`docs/LETTER_EMAIL_SETUP.md`**.

For Google Drive auto-upload (optional), also add:

| Key | Value |
|-----|--------|
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Full JSON from Google Cloud |
| `GOOGLE_DRIVE_FOLDER_ID` | Your Drive folder ID |

3. **Save**

---

## Step 3 — Redeploy (required)

Env vars are baked in at **build time**. Adding them is not enough without a **new** deploy.

1. **Deploys** → **Trigger deploy** → **Clear cache and deploy site**  
   (Do **not** only click “Retry” on an old deploy.)

2. Open the new deploy → **Deploy log** → confirm build **succeeded** (if vars are missing, the build will now **fail** with a clear error).

3. Wait until status is **Published**.

4. Open your site from the **Published deploy** link (not an old preview URL).

5. Go to `/admin` and hard refresh: **Cmd+Shift+R** (Mac) or **Ctrl+Shift+R** (Windows).

The yellow Supabase message should be **gone** and **Sign in** should work.

---

## Do you need GitHub?

**No.** GitHub only stores code. Secrets go in **Netlify only** (never commit `.env` to GitHub).

| Place | Supabase keys? |
|-------|----------------|
| GitHub | No |
| Netlify Environment variables | **Yes** |
| Your Mac `.env` | Yes (local dev only) |

---

## Checklist

- [ ] `VITE_SUPABASE_URL` set in Netlify  
- [ ] `VITE_SUPABASE_ANON_KEY` set in Netlify  
- [ ] New deploy finished after adding variables  
- [ ] Users exist in Supabase → **Authentication** → **Users** (Pao + Ploy)
