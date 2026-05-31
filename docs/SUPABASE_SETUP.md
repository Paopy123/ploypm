# Admin login & photo posts (one-time setup)

The site uses **Supabase** (free) so only your two Gmail accounts can add photos and descriptions. Passwords are **not** stored in this codebase — you set them in Supabase.

## 1. Create a Supabase project

1. Go to [https://supabase.com](https://supabase.com) and sign up (free).
2. **New project** → pick a name and password for the database (save that DB password somewhere safe).
3. Wait until the project is ready.

## 2. Run the database script

1. In Supabase: **SQL Editor** → **New query**.
2. Copy everything from `supabase/schema.sql` in this repo and **Run**.

## 3. Storage bucket (if the SQL step didn’t create it)

1. **Storage** → **New bucket**
2. Name: `gallery-images`
3. Turn **Public bucket** ON → Create

## 4. Create the two admin users

1. **Authentication** → **Users** → **Add user** → **Create new user**
2. User 1:
   - Email: `pao51613@gmail.com`
   - Password: (the password you chose — use a strong one)
   - Auto Confirm User: **ON**
3. Repeat for `ploy.muennikorn@gmail.com`

Only these two emails can upload or delete posts (enforced by the database).

## 5. Connect the website

1. **Project Settings** → **API**
2. Copy **Project URL** and **anon public** key.
3. On your Mac, in the project folder, create `.env`:

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

4. **Netlify**: Site → **Environment variables** → add the same two names and values → **Redeploy**.

## 6. Fix “Could not add content” (run this SQL)

If **Publish** fails, open **SQL Editor** and run the entire file:

**`supabase/migration-v3-fix.sql`**

That updates columns, storage bucket, and permissions. Then try Publish again.

(Older projects: you can run `migration-v2.sql` first, then `migration-v3-fix.sql`.)

## 7. Use the admin page

1. Open `https://your-domain.com/admin`
2. Sign in with one of the two emails.
3. Choose **Photo** or **Video**, upload a file, add a description, set **unlock date & time**, click **Publish**.

- New posts appear first in **What’s new**; older photos stay in **Our memories**.
- Future unlock times show a **countdown** until the content reveals.
- Uploads show **Pao uploaded the content** or **Ploy uploaded the content**.

No redeploy needed for new uploads.

## Security tips

- Do not commit `.env` to GitHub.
- If you shared passwords in chat, change them in **Authentication → Users**.
- The public PIN gate is separate; `/admin` is only for you two.
