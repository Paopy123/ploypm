# Auto-upload to your Google Drive folder

When this is set up, **Pao** and **Ploy** can pick a photo or video in `/admin` and it uploads **automatically** into **your** Google Drive folder (any file size). The website only stores a link in Supabase — not the video file.

---

## Part 1 — Google Cloud (15 min, one time)

1. Go to [Google Cloud Console](https://console.cloud.google.com/) → create or pick a project.
2. **APIs & Services** → **Library** → search **Google Drive API** → **Enable**.
3. **APIs & Services** → **Credentials** → **Create credentials** → **Service account**.
4. Name it e.g. `love-site-uploader` → **Create** → skip optional roles → **Done**.
5. Click the new service account → **Keys** → **Add key** → **JSON** → download the file.  
   Keep this file private (never commit to GitHub).

6. Open the JSON file and copy the **`client_email`** (looks like `something@project.iam.gserviceaccount.com`).

---

## Part 2 — Your Drive folder

1. In [Google Drive](https://drive.google.com), create a folder e.g. `For You My Love uploads`.
2. Right-click the folder → **Share**.
3. Paste the **service account email** from step 1 → role **Editor** → **Send** (ignore “notify” if asked).

4. Open the folder in the browser. The URL looks like:  
   `https://drive.google.com/drive/folders/1ABCdefXYZ123`  
   The part after `/folders/` is your **`GOOGLE_DRIVE_FOLDER_ID`**.

---

## Part 3 — Netlify environment variables

Netlify → your site → **Site configuration** → **Environment variables** → add:

| Variable | Value |
|----------|--------|
| `GOOGLE_SERVICE_ACCOUNT_JSON` | Paste the **entire** contents of the JSON key file (one line is OK) |
| `GOOGLE_DRIVE_FOLDER_ID` | The folder ID from Part 2 |
| `SUPABASE_URL` | Same as `VITE_SUPABASE_URL` (e.g. `https://xxxxx.supabase.co`) |
| `SUPABASE_SERVICE_ROLE_KEY` | From Supabase → **Project Settings** → **API** → **service_role** (secret) |

You should already have `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

**Important:** Deploy from Git or run `npm run build` on Netlify — do **not** only drag the `dist` folder, or the upload function will be missing.

After saving variables: **Deploys** → **Trigger deploy** → **Clear cache and deploy**.

### If JSON is hard to paste

Use these instead of `GOOGLE_SERVICE_ACCOUNT_JSON`:

| Variable | Value |
|----------|--------|
| `GOOGLE_CLIENT_EMAIL` | `client_email` from the JSON file |
| `GOOGLE_PRIVATE_KEY` | `private_key` from JSON (paste with `\n` for line breaks) |

---

## Part 4 — Database

In Supabase **SQL Editor**, run (if you have not already):

- `supabase/migration-v3-fix.sql`
- `supabase/migration-v4-drive.sql`

---

## How to use

1. Open `https://your-site.com/admin` and sign in as Pao or Ploy.
2. If setup worked, you’ll see: **“Google Drive connected”**.
3. Choose Photo or Video → pick file → description → unlock time → **Publish**.
4. Watch the progress bar — the file lands in your Drive folder and appears on the site.

---

## Troubleshooting

| Problem | Fix |
|--------|-----|
| “Google Drive is not configured on the server” | Add Netlify env vars and redeploy |
| “Only Pao and Ploy can upload” | Sign in with an allowed Gmail |
| “Permission denied” on upload | Share the folder with the service account email as **Editor** |
| Upload works but video won’t play | Re-publish; sharing is set to “anyone with link” automatically after upload |
| No “Google Drive connected” banner | Check `SUPABASE_SERVICE_ROLE_KEY` and redeploy |

---

## Without auto-upload

You can still upload files to Drive manually and paste the share link (older flow). Auto-upload is optional but recommended.
