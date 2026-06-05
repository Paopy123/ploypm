import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { SiteViewId } from '../lib/siteView';
import type { Category } from '../types/category';

type SiteNavProps = {
  categories: Category[];
  activeView: SiteViewId;
  onNavigate: (view: SiteViewId) => void;
};

export function SiteNav({ categories, activeView, onNavigate }: SiteNavProps) {
  const { isAdmin, signOut, loading } = useAuth();

  const linkClass = (view: SiteViewId) =>
    `site-nav__link${activeView === view ? ' site-nav__link--active' : ''}`;

  return (
    <nav className="site-nav" aria-label="Site menu">
      <ul className="site-nav__list">
        <li>
          <button type="button" className={linkClass('whats-new')} onClick={() => onNavigate('whats-new')}>
            What&apos;s new
          </button>
        </li>
        {categories.map((cat) => (
          <li key={cat.id}>
            <button type="button" className={linkClass(cat.id)} onClick={() => onNavigate(cat.id)}>
              {cat.name}
            </button>
          </li>
        ))}
        <li>
          <button type="button" className={linkClass('letters')} onClick={() => onNavigate('letters')}>
            Letters
          </button>
        </li>
        {!loading && (
          <li className="site-nav__auth">
            {isAdmin ? (
              <>
                <Link to="/admin" className="site-nav__link site-nav__link--admin">
                  Admin
                </Link>
                <button type="button" className="site-nav__link site-nav__link--btn" onClick={() => void signOut()}>
                  Sign out
                </button>
              </>
            ) : (
              <Link to="/admin" className="site-nav__link">
                Sign in
              </Link>
            )}
          </li>
        )}
      </ul>
    </nav>
  );
}
