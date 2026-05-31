# For You, My Love

A single-page personal gift site — cinematic intro video, photo gallery, and a love letter.

## Quick start

```bash
npm install
npm run dev
```

Open the local URL, then add your media (see below).

## Customize (under 5 minutes)

1. **Media** — Add files to `public/media/`:
   - `intro.mp4`
   - `photo-1.jpg` … `photo-4.jpg`

2. **Copy & PIN** — Edit `src/content.ts`:
   - Title, subtitle, and letter text
   - `PIN_CODE` (8 digits) and gate messages
   - Photo alt text if you like

3. **Build for sharing**:

```bash
npm run build
npm run preview
```

Deploy the `dist/` folder to any static host (Netlify, Vercel, GitHub Pages, etc.). No backend required.

## Admin — add photos & descriptions

1. Complete **one-time** setup: [docs/SUPABASE_SETUP.md](docs/SUPABASE_SETUP.md) (free Supabase account).
2. Open **`https://your-domain.com/admin`** (or **Update** in the footer).
3. Sign in with `pao51613@gmail.com` or `ploy.muennikorn@gmail.com` (passwords are set in Supabase, not in this repo).
4. Upload a photo, write a description, click **Add post** — it appears on the live gallery immediately.

## Privacy

No analytics or tracking. Supabase is used only for admin login and gallery posts. Google Fonts load from Google (optional to self-host later).
