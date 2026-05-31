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
          <p className="admin-alert admin-alert--warn">
            Supabase is not connected yet. Add <code>VITE_SUPABASE_URL</code> and{' '}
            <code>VITE_SUPABASE_ANON_KEY</code> (see <code>docs/SUPABASE_SETUP.md</code>).
          </p>
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
