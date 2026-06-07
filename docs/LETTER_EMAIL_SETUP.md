# Email when someone opens a letter

You get an email at **pao51613@gmail.com** every time someone taps **Open the letter** on the site.

Uses [Resend](https://resend.com) (free tier — 100 emails/day).

---

## Step 1 — Create a Resend account

1. Go to [https://resend.com/signup](https://resend.com/signup)
2. Sign up with **pao51613@gmail.com**
3. Verify your email

---

## Step 2 — Get an API key

1. Resend dashboard → **API Keys** → **Create API Key**
2. Copy the key (starts with `re_`)

---

## Step 3 — Add to Netlify

1. [Netlify](https://app.netlify.com) → your site → **Site configuration** → **Environment variables**
2. Add:

| Key | Value |
|-----|--------|
| `RESEND_API_KEY` | `re_xxxxxxxx` (your key) |

3. **Deploys** → **Trigger deploy** → **Clear cache and deploy site**

---

## Step 4 — Test

1. Open your live site (not admin)
2. Go to **Letters** or **What's new**
3. Tap **Open the letter**
4. Check **pao51613@gmail.com** inbox (and spam folder)

---

## Notes

- Without `RESEND_API_KEY`, letters still open — you just won't get email.
- On Resend free tier, emails send from `onboarding@resend.dev` until you add your own domain.
- Each time someone opens a letter, you get one email (including if they open it again later).

Optional: set `RESEND_FROM` in Netlify (e.g. `Ploypm <hello@yourdomain.com>`) after verifying a domain in Resend.
