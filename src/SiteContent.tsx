import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useClickHearts } from './components/ClickHearts';
import { EpisodeSection } from './components/EpisodeSection';
import { Footer } from './components/Footer';
import { HeartCounter } from './components/HeartCounter';
import { Hero } from './components/Hero';
import { LetterArchive } from './components/LetterArchive';
import { SiteNav } from './components/SiteNav';
import { WhatsNew } from './components/WhatsNew';
import { fetchCategories } from './lib/categories';
import { fetchDbPosts, WHATS_NEW_COUNT } from './lib/content';
import { featuredLetter, fetchLetters } from './lib/letters';
import { hashFromView, viewFromHash, type SiteViewId } from './lib/siteView';
import { UNCATEGORIZED_CATEGORY, uncategorizedPosts } from './lib/uncategorized';
import type { Category } from './types/category';
import type { SiteContentItem } from './types/content';
import type { Letter } from './types/letter';

export function SiteContent() {
  const { tapCount, spawnHeart, HeartLayer } = useClickHearts();
  const mainRef = useRef<HTMLElement>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [posts, setPosts] = useState<SiteContentItem[]>([]);
  const [letters, setLetters] = useState<Letter[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<SiteViewId>(() =>
    viewFromHash(window.location.hash, []),
  );

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchCategories(), fetchDbPosts(), fetchLetters()]).then(([cats, all, allLetters]) => {
      if (cancelled) return;
      setCategories(cats);
      setPosts(all);
      setLetters(allLetters);
      setLoading(false);
      setActiveView(viewFromHash(window.location.hash, cats));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const onHashChange = () => setActiveView(viewFromHash(window.location.hash, categories));
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [categories]);

  const navigate = useCallback(
    (view: SiteViewId) => {
      setActiveView(view);
      const hash = hashFromView(view, categories);
      if (window.location.hash !== hash) {
        window.history.replaceState(null, '', hash);
      }
      mainRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },
    [categories],
  );

  const whatsNew = useMemo(() => posts.slice(0, WHATS_NEW_COUNT), [posts]);
  const whatsNewLetter = useMemo(() => featuredLetter(letters), [letters]);

  const legacyPosts = useMemo(() => uncategorizedPosts(posts), [posts]);

  const navCategories = useMemo(() => {
    const items = [...categories];
    if (legacyPosts.length > 0) items.push(UNCATEGORIZED_CATEGORY);
    return items;
  }, [categories, legacyPosts.length]);

  const postsByCategory = useMemo(() => {
    const map = new Map<string, SiteContentItem[]>();
    for (const cat of categories) {
      map.set(cat.id, posts.filter((p) => p.categoryId === cat.id));
    }
    return map;
  }, [categories, posts]);

  const activeEpisode = useMemo(() => {
    if (activeView === 'whats-new' || activeView === 'letters') return null;
    if (activeView === UNCATEGORIZED_CATEGORY.id) {
      return { category: UNCATEGORIZED_CATEGORY, items: legacyPosts };
    }
    const cat = categories.find((c) => c.id === activeView);
    if (!cat) return null;
    return { category: cat, items: postsByCategory.get(cat.id) ?? [] };
  }, [activeView, categories, legacyPosts, postsByCategory]);

  const handlePageClick = (e: { clientX: number; clientY: number; target: EventTarget | null }) => {
    const target = e.target as HTMLElement;
    if (target.closest('button, a, video, input, textarea, select')) return;
    spawnHeart(e.clientX, e.clientY);
  };

  return (
    <div className="page page--revealed" onClick={handlePageClick} role="presentation">
      <HeartCounter count={tapCount} />
      {HeartLayer}
      <Hero />
      <SiteNav categories={navCategories} activeView={activeView} onNavigate={navigate} />
      <main ref={mainRef} className="site-main">
        {activeView === 'whats-new' && (
          <WhatsNew items={whatsNew} featuredLetter={whatsNewLetter} loading={loading} />
        )}

        {activeEpisode ? (
          <EpisodeSection category={activeEpisode.category} items={activeEpisode.items} />
        ) : (
          activeView !== 'whats-new' &&
          activeView !== 'letters' &&
          !loading && (
            <section className="section section--wide">
              <p className="gallery-loading">This section is not available yet.</p>
            </section>
          )
        )}

        {activeView === 'letters' && (
          <LetterArchive letters={letters} loading={loading} includeFeatured />
        )}
      </main>
      <Footer />
    </div>
  );
}
