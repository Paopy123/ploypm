# Videos on Google Drive (over 20MB)

Videos are **not** uploaded to Supabase storage. They stay on your Google Drive — only the link is saved in the database.

## Steps

1. Upload the video to [Google Drive](https://drive.google.com) (any size).
2. Right-click the file → **Share**.
3. Under **General access**, choose **Anyone with the link** (Viewer).
4. Copy the link (looks like `https://drive.google.com/file/d/XXXX/view?usp=sharing`).
5. On your site, go to **`/admin`** → **Video (Google Drive)**.
6. Paste the link, add a description, set unlock time → **Publish**.

## If the video does not play on the site

- Sharing must be **Anyone with the link**, not “Restricted”.
- Use the normal **file** link, not a folder link.
- Very large files may take a moment to load in Google’s player.

## Database

Run **`supabase/migration-v4-drive.sql`** once in Supabase SQL Editor (adds `media_source` and `drive_file_id` columns).
