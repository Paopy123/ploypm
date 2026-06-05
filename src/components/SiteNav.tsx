import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { Category } from '../types/category';

type SiteNavProps = {
  categories: Category[];
};

export function SiteNav({ categories }: SiteNavProps) {
  const { isAdmin, signOut, loading } = useAuth();

  return (
    <nav className="site-nav" aria-label="Site menu">
      <ul className="site-nav__list">
        <li>
          <a href="#whats-new" className="site-nav__link">
            What&apos;s new
          </a>
        </li>
        {categories.map((cat) => (
          <li key={cat.id}>
            <a href={`#episode-${cat.slug}`} className="site-nav__link">
              {cat.name}
            </a>
          </li>
        ))}
        <li>
          <a href="#letter" className="site-nav__link">
            Letters
          </a>
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
