import { useState } from 'react';
import { signInAdmin } from '../lib/auth';
import { isSupabaseConfigured } from '../lib/supabase';
import { HeartIcon } from './HeartIcon';

export function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await signInAdmin(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign in. Check your email and password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-card admin-card--narrow">
        <HeartIcon pulse size={28} />
        <h1 className="admin-card__title">Sign in</h1>
        <p className="admin-card__lead">Use your approved Gmail to add photos and descriptions.</p>

        {!isSupabaseConfigured && (
          <div className="admin-alert admin-alert--warn admin-setup">
            <p>
              <strong>Supabase is not connected on this deploy.</strong> You do <strong>not</strong> add keys in
              GitHub — only in <strong>Netlify → Environment variables</strong>, then redeploy.
            </p>
            {typeof __SUPABASE_CONFIGURED_AT_BUILD__ !== 'undefined' &&
              !__SUPABASE_CONFIGURED_AT_BUILD__ && (
                <p className="admin-setup__hint">
                  This build was created <strong>without</strong> those variables. Add them in Netlify, then use{' '}
                  <strong>Deploys → Trigger deploy → Clear cache and deploy site</strong> (not only “Retry”).
                </p>
              )}
            <ul className="admin-setup__list">
              <li>
                <code>VITE_SUPABASE_URL</code> (must start with https://)
              </li>
              <li>
                <code>VITE_SUPABASE_ANON_KEY</code> (long eyJ… key, not service_role)
              </li>
            </ul>
            <p className="admin-setup__hint">
              Scopes: include <strong>Production</strong>. No quotes around values. Then hard-refresh this page
              (Cmd+Shift+R).
            </p>
          </div>
        )}

        <form className="admin-form" onSubmit={handleSubmit}>
          <label className="admin-field">
            <span>Email</span>
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@gmail.com"
            />
          </label>
          <label className="admin-field">
            <span>Password</span>
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </label>
          {error && (
            <p className="admin-alert admin-alert--error" role="alert">
              {error}
            </p>
          )}
          <button type="submit" className="admin-btn admin-btn--primary" disabled={submitting || !isSupabaseConfigured}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="admin-back">
          <a href="/">← Back to the site</a>
        </p>
      </div>
    </div>
  );
}
