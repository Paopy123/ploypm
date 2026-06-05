import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { createCategory, deleteCategory, fetchCategories } from '../lib/categories';
import {
  createFromDriveLink,
  createPhotoPost,
  deleteContentPost,
  fetchDbPosts,
  isUnlocked,
} from '../lib/content';
import { formatSupabaseError } from '../lib/errors';
import { isSupabaseConfigured } from '../lib/supabase';
import type { Category } from '../types/category';
import type { MediaType, SiteContentItem } from '../types/content';
import { HeartIcon } from './HeartIcon';
import { MediaPlayer } from './MediaPlayer';

const MAX_PHOTO_MB = 15;

function defaultUnlockLocal(): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

type AdminTab = 'upload' | 'episodes' | 'posts';

export function AdminDashboard() {
  const { email, signOut } = useAuth();
  const [tab, setTab] = useState<AdminTab>('upload');
  const [categories, setCategories] = useState<Category[]>([]);
  const [posts, setPosts] = useState<SiteContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [mediaType, setMediaType] = useState<MediaType>('photo');
  const [photoMode, setPhotoMode] = useState<'file' | 'link'>('file');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  const [unlockLocal, setUnlockLocal] = useState(defaultUnlockLocal);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [driveLink, setDriveLink] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [newEpisodeName, setNewEpisodeName] = useState('');

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [cats, allPosts] = await Promise.all([fetchCategories(), fetchDbPosts()]);
      setCategories(cats);
      setPosts(allPosts);
      setCategoryId((prev) => prev || cats[0]?.id || '');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const onFileChange = (picked: File | null) => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(picked);
    setPreview(picked ? URL.createObjectURL(picked) : null);
    if (picked) setDriveLink('');
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
    if (!categoryId) {
      setError('Choose an episode category, or create one in the Episodes tab.');
      return;
    }

    const unlockAt = new Date(unlockLocal);
    if (Number.isNaN(unlockAt.getTime())) {
      setError('Please set a valid unlock date and time.');
      return;
    }

    if (mediaType === 'photo') {
      if (photoMode === 'file' && !file) {
        setError('Choose a photo (under 15MB) or switch to Google Drive link.');
        return;
      }
      if (photoMode === 'link' && !driveLink.trim()) {
        setError('Paste a Google Drive link for the photo.');
        return;
      }
    } else if (!driveLink.trim()) {
      setError('Paste your Google Drive share link for the video.');
      return;
    }

    setBusy(true);

    try {
      if (mediaType === 'photo') {
        if (photoMode === 'file' && file) {
          await createPhotoPost({ file, description, unlockAt, uploadedByEmail: email, categoryId });
        } else {
          await createFromDriveLink({
            driveShareLink: driveLink,
            mediaType: 'photo',
            description,
            unlockAt,
            uploadedByEmail: email,
            categoryId,
          });
        }
      } else {
        await createFromDriveLink({
          driveShareLink: driveLink,
          mediaType: 'video',
          description,
          unlockAt,
          uploadedByEmail: email,
          categoryId,
        });
      }

      setDescription('');
      setUnlockLocal(defaultUnlockLocal());
      onFileChange(null);
      setDriveLink('');

      const when =
        unlockAt.getTime() > Date.now()
          ? `Scheduled — unlocks ${unlockAt.toLocaleString()}`
          : 'Live now — appears first in What’s new';

      setMessage(`Added! ${when}`);
      await loadAll();
    } catch (err) {
      setError(formatSupabaseError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleCreateEpisode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    if (!newEpisodeName.trim()) {
      setError('Enter a name for the episode (e.g. Australia).');
      return;
    }
    setBusy(true);
    try {
      const cat = await createCategory(newEpisodeName);
      setNewEpisodeName('');
      setCategoryId(cat.id);
      setMessage(`Episode “${cat.name}” added to the menu bar.`);
      await loadAll();
    } catch (err) {
      setError(formatSupabaseError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteEpisode = async (cat: Category) => {
    if (!window.confirm(`Remove “${cat.name}” from the menu? Posts in this episode stay on the site but lose their category.`)) {
      return;
    }
    setBusy(true);
    setError('');
    try {
      await deleteCategory(cat.id);
      setMessage(`Removed episode “${cat.name}”.`);
      await loadAll();
    } catch (err) {
      setError(formatSupabaseError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleDeletePost = async (post: SiteContentItem) => {
    if (!window.confirm('Remove this from the site?')) return;
    setBusy(true);
    setError('');
    try {
      await deleteContentPost(post);
      setMessage('Removed from the site.');
      await loadAll();
    } catch (err) {
      setError(formatSupabaseError(err));
    } finally {
      setBusy(false);
    }
  };

  const photoAccept = 'image/jpeg,image/png,image/webp,image/gif';

  return (
    <div className="admin-page">
      <div className="admin-card admin-card--wide">
        <header className="admin-header">
          <div>
            <HeartIcon pulse size={24} />
            <h1 className="admin-card__title">Admin</h1>
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

        <div className="admin-tabs" role="tablist" aria-label="Admin sections">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'upload'}
            className={`admin-tab${tab === 'upload' ? ' admin-tab--active' : ''}`}
            onClick={() => setTab('upload')}
          >
            Add content
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'episodes'}
            className={`admin-tab${tab === 'episodes' ? ' admin-tab--active' : ''}`}
            onClick={() => setTab('episodes')}
          >
            Episodes (menu)
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'posts'}
            className={`admin-tab${tab === 'posts' ? ' admin-tab--active' : ''}`}
            onClick={() => setTab('posts')}
          >
            All uploads
          </button>
        </div>

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

        {tab === 'upload' && (
          <form className="admin-form admin-form--post" onSubmit={handleSubmit}>
            {categories.length === 0 ? (
              <p className="admin-alert admin-alert--warn">
                Create an episode first (e.g. &quot;Australia&quot;) in the <strong>Episodes</strong> tab — it becomes a menu
                item on the site.
              </p>
            ) : (
              <label className="admin-field">
                <span>Episode category</span>
                <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <div className="admin-type-toggle" role="group" aria-label="Media type">
              <button
                type="button"
                className={`admin-type-btn${mediaType === 'photo' ? ' admin-type-btn--active' : ''}`}
                onClick={() => {
                  setMediaType('photo');
                  onFileChange(null);
                  setDriveLink('');
                  setPhotoMode('file');
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
                  setDriveLink('');
                }}
              >
                Video
              </button>
            </div>

            {mediaType === 'photo' && (
              <div className="admin-type-toggle" role="group" aria-label="Photo source">
                <button
                  type="button"
                  className={`admin-type-btn${photoMode === 'file' ? ' admin-type-btn--active' : ''}`}
                  onClick={() => {
                    setPhotoMode('file');
                    setDriveLink('');
                  }}
                >
                  Upload file
                </button>
                <button
                  type="button"
                  className={`admin-type-btn${photoMode === 'link' ? ' admin-type-btn--active' : ''}`}
                  onClick={() => {
                    setPhotoMode('link');
                    onFileChange(null);
                  }}
                >
                  Drive link
                </button>
              </div>
            )}

            {mediaType === 'video' && (
              <p className="admin-field__hint admin-drive-hint">
                Videos use a Google Drive link only. Upload to Drive → Share → Anyone with the link → paste below.
              </p>
            )}

            {(mediaType === 'video' || (mediaType === 'photo' && photoMode === 'link')) && (
              <label className="admin-field admin-field--drive">
                <span>Google Drive share link</span>
                <input
                  type="text"
                  inputMode="url"
                  autoComplete="off"
                  spellCheck={false}
                  value={driveLink}
                  onChange={(e) => setDriveLink(e.target.value)}
                  placeholder="https://drive.google.com/file/d/…/view?usp=sharing"
                />
              </label>
            )}

            {mediaType === 'photo' && photoMode === 'file' && (
              <div className="admin-upload">
                <span className="admin-upload__label">Photo (max {MAX_PHOTO_MB}MB)</span>
                {preview ? (
                  <div className="admin-upload__preview-wrap">
                    <img src={preview} alt="" className="admin-upload__preview" />
                    <button type="button" className="admin-btn admin-btn--ghost admin-upload__clear" onClick={() => onFileChange(null)}>
                      Remove file
                    </button>
                  </div>
                ) : (
                  <div className="admin-upload__box">
                    <input
                      ref={fileInputRef}
                      className="admin-upload__file-input"
                      type="file"
                      accept={photoAccept}
                      onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
                    />
                    <button type="button" className="admin-upload__picker" onClick={() => fileInputRef.current?.click()}>
                      <span className="admin-upload__placeholder">
                        Tap to choose a photo
                        <small>Under {MAX_PHOTO_MB}MB — or use Drive link for larger images</small>
                      </span>
                    </button>
                  </div>
                )}
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
              <input type="datetime-local" value={unlockLocal} onChange={(e) => setUnlockLocal(e.target.value)} required />
              <small className="admin-field__hint">Future time = countdown on the site until it unlocks.</small>
            </label>

            <button type="submit" className="admin-btn admin-btn--primary" disabled={busy || categories.length === 0}>
              {busy ? 'Saving…' : 'Publish'}
            </button>
          </form>
        )}

        {tab === 'episodes' && (
          <section className="admin-episodes" aria-labelledby="admin-episodes-heading">
            <h2 id="admin-episodes-heading" className="admin-list__title">
              Menu bar episodes
            </h2>
            <p className="admin-field__hint">
              Each episode becomes a bullet in the site menu (e.g. Australia). Upload photos and videos into that episode —
              no coding needed.
            </p>

            <form className="admin-form admin-episodes__form" onSubmit={handleCreateEpisode}>
              <label className="admin-field">
                <span>New episode name</span>
                <input
                  type="text"
                  value={newEpisodeName}
                  onChange={(e) => setNewEpisodeName(e.target.value)}
                  placeholder="Australia"
                />
              </label>
              <button type="submit" className="admin-btn admin-btn--primary" disabled={busy}>
                Add to menu
              </button>
            </form>

            {loading ? (
              <p className="admin-list__empty">Loading…</p>
            ) : categories.length === 0 ? (
              <p className="admin-list__empty">No episodes yet. Add one above.</p>
            ) : (
              <ul className="admin-episodes__list">
                {categories.map((cat) => (
                  <li key={cat.id} className="admin-episodes__item">
                    <div>
                      <strong>{cat.name}</strong>
                      <span className="admin-episodes__slug">#{`episode-${cat.slug}`}</span>
                    </div>
                    <button
                      type="button"
                      className="admin-btn admin-btn--danger"
                      onClick={() => void handleDeleteEpisode(cat)}
                      disabled={busy}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {tab === 'posts' && (
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
                        {post.categoryName ? ` · ${post.categoryName}` : ''}
                      </span>
                      <p className="admin-post__text">{post.description}</p>
                      <p className="admin-post__meta">{post.uploadedByLabel}</p>
                      <p className="admin-post__meta">
                        {isUnlocked(post) ? 'Unlocked' : `Unlocks ${new Date(post.unlockAt).toLocaleString()}`}
                      </p>
                    </div>
                    <button type="button" className="admin-btn admin-btn--danger" onClick={() => void handleDeletePost(post)} disabled={busy}>
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        <p className="admin-back">
          <a href="/">View the public site →</a>
        </p>
      </div>
    </div>
  );
}
