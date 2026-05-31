import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  createDriveMediaPost,
  createPhotoPost,
  createVideoFromDriveLink,
  deleteContentPost,
  fetchDbPosts,
  isUnlocked,
} from '../lib/content';
import { checkDriveSetup, uploadFileToGoogleDrive, type DriveSetupStatus } from '../lib/driveUpload';
import { formatSupabaseError } from '../lib/errors';
import { isSupabaseConfigured } from '../lib/supabase';
import type { MediaType, SiteContentItem } from '../types/content';
import { HeartIcon } from './HeartIcon';
import { MediaPlayer } from './MediaPlayer';

function defaultUnlockLocal(): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export function AdminDashboard() {
  const { email, signOut } = useAuth();
  const [posts, setPosts] = useState<SiteContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [mediaType, setMediaType] = useState<MediaType>('photo');
  const [description, setDescription] = useState('');
  const [unlockLocal, setUnlockLocal] = useState(defaultUnlockLocal);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [driveLink, setDriveLink] = useState('');
  const [driveReady, setDriveReady] = useState(false);
  const [driveSetup, setDriveSetup] = useState<DriveSetupStatus | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      setPosts(await fetchDbPosts());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPosts();
  }, [loadPosts]);

  useEffect(() => {
    void checkDriveSetup().then((status) => {
      setDriveSetup(status);
      setDriveReady(status.configured);
    });
  }, []);

  const onFileChange = (picked: File | null) => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(picked);
    setPreview(picked ? URL.createObjectURL(picked) : null);
    setDriveLink('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!description.trim()) {
      setError('Please add a description.');
      return;
    }
    if (!email) {
      setError('You must be signed in.');
      return;
    }

    const unlockAt = new Date(unlockLocal);
    if (Number.isNaN(unlockAt.getTime())) {
      setError('Please set a valid unlock date and time.');
      return;
    }

    const useDriveUpload = driveReady && file;
    const useDriveLink = mediaType === 'video' && driveLink.trim() && !file;
    const useSupabasePhoto = mediaType === 'photo' && file && !driveReady;

    if (mediaType === 'photo' && !file) {
      setError('Please choose a photo.');
      return;
    }

    if (mediaType === 'video' && !file && !driveLink.trim()) {
      setError(driveReady ? 'Choose a video file to upload to your Drive folder.' : 'Choose a video file or paste a Drive link.');
      return;
    }

    if (mediaType === 'video' && file && !driveReady) {
      setError('Automatic Drive upload is not set up yet. Paste a Drive share link, or follow docs/GOOGLE_DRIVE_SETUP.md');
      return;
    }

    setBusy(true);
    setUploadProgress(null);

    try {
      if (useDriveUpload && file) {
        setMessage('Uploading to your Google Drive folder…');
        setUploadProgress(0);
        const { fileId } = await uploadFileToGoogleDrive(file, setUploadProgress);
        await createDriveMediaPost({
          fileId,
          mediaType,
          description,
          unlockAt,
          uploadedByEmail: email,
        });
      } else if (useSupabasePhoto && file) {
        await createPhotoPost({ file, description, unlockAt, uploadedByEmail: email });
      } else if (useDriveLink) {
        await createVideoFromDriveLink({
          driveShareLink: driveLink,
          description,
          unlockAt,
          uploadedByEmail: email,
        });
      }

      setDescription('');
      setUnlockLocal(defaultUnlockLocal());
      onFileChange(null);
      setDriveLink('');
      setUploadProgress(null);

      const when =
        unlockAt.getTime() > Date.now()
          ? `Scheduled — unlocks ${unlockAt.toLocaleString()}`
          : 'Live now — appears first in What’s new';

      setMessage(`Added! ${when}${useDriveUpload ? ' Saved to your Google Drive folder.' : ''}`);
      await loadPosts();
    } catch (err) {
      setError(formatSupabaseError(err));
      setUploadProgress(null);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (post: SiteContentItem) => {
    if (!window.confirm('Remove this from the site?')) return;
    setBusy(true);
    setError('');
    try {
      await deleteContentPost(post);
      setMessage('Removed from the site (file may still be on Google Drive).');
      await loadPosts();
    } catch (err) {
      setError(formatSupabaseError(err));
    } finally {
      setBusy(false);
    }
  };

  const photoAccept = 'image/jpeg,image/png,image/webp,image/gif';
  const videoAccept = 'video/mp4,video/webm,video/quicktime';

  return (
    <div className="admin-page">
      <div className="admin-card admin-card--wide">
        <header className="admin-header">
          <div>
            <HeartIcon pulse size={24} />
            <h1 className="admin-card__title">Add content</h1>
            <p className="admin-card__lead">Signed in as {email}</p>
          </div>
          <button type="button" className="admin-btn admin-btn--ghost" onClick={() => void signOut()} disabled={busy}>
            Sign out
          </button>
        </header>

        {!isSupabaseConfigured && (
          <p className="admin-alert admin-alert--warn">
            Supabase env vars are missing. Add them in Netlify → Environment variables, then redeploy.
          </p>
        )}

        {driveReady ? (
          <p className="admin-alert admin-alert--success">
            Google Drive connected — photos and videos upload automatically to your shared folder.
          </p>
        ) : (
          <div className="admin-alert admin-alert--warn admin-setup">
            <p>
              <strong>Auto-upload to Google Drive is not ready yet.</strong> You can still paste a Drive link for videos
              below.
            </p>
            {driveSetup?.hint && <p className="admin-setup__hint">{driveSetup.hint}</p>}
            {driveSetup?.missing && driveSetup.missing.length > 0 && (
              <ul className="admin-setup__list">
                {driveSetup.missing.map((item) => (
                  <li key={item}>Add in Netlify: {item}</li>
                ))}
              </ul>
            )}
            <p className="admin-setup__hint">
              Full guide: <strong>docs/GOOGLE_DRIVE_SETUP.md</strong> in your project folder.
            </p>
          </div>
        )}

        <form className="admin-form admin-form--post" onSubmit={handleSubmit}>
          <div className="admin-type-toggle" role="group" aria-label="Media type">
            <button
              type="button"
              className={`admin-type-btn${mediaType === 'photo' ? ' admin-type-btn--active' : ''}`}
              onClick={() => {
                setMediaType('photo');
                onFileChange(null);
              }}
            >
              Photo
            </button>
            <button
              type="button"
              className={`admin-type-btn${mediaType === 'video' ? ' admin-type-btn--active' : ''}`}
              onClick={() => {
                setMediaType('video');
                onFileChange(null);
              }}
            >
              Video
            </button>
          </div>

          <label className="admin-upload">
            <span className="admin-upload__label">
              {mediaType === 'video' ? 'Video file' : 'Photo'}
              {driveReady ? ' → your Google Drive folder' : ''}
            </span>
            <input
              type="file"
              accept={mediaType === 'video' ? videoAccept : photoAccept}
              onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
            />
            <span className="admin-upload__box">
              {preview ? (
                mediaType === 'video' ? (
                  <video src={preview} className="admin-upload__preview" controls muted playsInline />
                ) : (
                  <img src={preview} alt="" className="admin-upload__preview" />
                )
              ) : (
                <span className="admin-upload__placeholder">
                  Tap to choose {mediaType === 'video' ? 'a video' : 'a photo'}
                  <small>
                    {driveReady
                      ? 'Any size — uploads to your Drive folder'
                      : mediaType === 'video'
                        ? 'Set up Drive above, or paste a link below'
                        : 'Photos under 15MB until Drive is connected'}
                  </small>
                </span>
              )}
            </span>
          </label>

          {uploadProgress !== null && (
            <div className="admin-progress" role="progressbar" aria-valuenow={uploadProgress} aria-valuemin={0} aria-valuemax={100}>
              <div className="admin-progress__bar" style={{ width: `${uploadProgress}%` }} />
              <span className="admin-progress__text">Uploading to Drive… {uploadProgress}%</span>
            </div>
          )}

          {mediaType === 'video' && (
            <div className="admin-drive">
              <label className="admin-field">
                <span>{driveReady ? 'Or paste Google Drive link instead' : 'Paste Google Drive link'}</span>
                <input
                  type="url"
                  value={driveLink}
                  onChange={(e) => {
                    setDriveLink(e.target.value);
                    if (e.target.value) onFileChange(null);
                  }}
                  placeholder="https://drive.google.com/file/d/…/view"
                />
              </label>
            </div>
          )}

          <label className="admin-field">
            <span>Description</span>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Caption she will read with this memory…"
              required
            />
          </label>

          <label className="admin-field">
            <span>Unlock date & time</span>
            <input
              type="datetime-local"
              value={unlockLocal}
              onChange={(e) => setUnlockLocal(e.target.value)}
              required
            />
            <small className="admin-field__hint">
              Future time = countdown on the site until it unlocks.
            </small>
          </label>

          {error && (
            <p className="admin-alert admin-alert--error" role="alert">
              {error}
            </p>
          )}
          {message && (
            <p className="admin-alert admin-alert--success" role="status">
              {message}
            </p>
          )}

          <button type="submit" className="admin-btn admin-btn--primary" disabled={busy}>
            {busy ? (uploadProgress !== null ? 'Uploading…' : 'Saving…') : 'Publish'}
          </button>
        </form>

        <section className="admin-list" aria-labelledby="admin-posts-heading">
          <h2 id="admin-posts-heading" className="admin-list__title">
            All uploads (newest first)
          </h2>
          {loading ? (
            <p className="admin-list__empty">Loading…</p>
          ) : posts.length === 0 ? (
            <p className="admin-list__empty">No uploads yet.</p>
          ) : (
            <ul className="admin-list__grid">
              {posts.map((post) => (
                <li key={post.id} className="admin-post">
                  {post.mediaType === 'video' ? (
                    <div className="admin-post__thumb admin-post__thumb--video">
                      <MediaPlayer item={post} className="admin-post__video" />
                    </div>
                  ) : (
                    <img src={post.src} alt="" className="admin-post__img" />
                  )}
                  <div className="admin-post__body">
                    <span className="admin-post__type">
                      {post.mediaType}
                      {post.mediaSource === 'drive' ? ' · Drive' : ''}
                    </span>
                    <p className="admin-post__text">{post.description}</p>
                    <p className="admin-post__meta">{post.uploadedByLabel}</p>
                    <p className="admin-post__meta">
                      {isUnlocked(post)
                        ? 'Unlocked'
                        : `Unlocks ${new Date(post.unlockAt).toLocaleString()}`}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="admin-btn admin-btn--danger"
                    onClick={() => void handleDelete(post)}
                    disabled={busy}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <p className="admin-back">
          <a href="/">View the public site →</a>
        </p>
      </div>
    </div>
  );
}
