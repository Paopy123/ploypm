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
import { hashFromSiteView, parseSiteHash, type SiteViewId } from './lib/siteView';
import { fetchSubSections, subSectionsForCategory } from './lib/subSections';
import { UNCATEGORIZED_CATEGORY, uncategorizedPosts } from './lib/uncategorized';
import type { Category } from './types/category';
import type { SiteContentItem } from './types/content';
import type { Letter } from './types/letter';
import type { SubSection } from './types/subSection';

export function SiteContent() {
  const { tapCount, spawnHeart, HeartLayer } = useClickHearts();
  const mainRef = useRef<HTMLElement>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subSections, setSubSections] = useState<SubSection[]>([]);
  const [posts, setPosts] = useState<SiteContentItem[]>([]);
  const [letters, setLetters] = useState<Letter[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<SiteViewId>(() => parseSiteHash(window.location.hash, [], []).view);
  const [activeSubSectionId, setActiveSubSectionId] = useState<string | null>(() =>
    parseSiteHash(window.location.hash, [], []).subSectionId,
  );

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchCategories(), fetchSubSections(), fetchDbPosts(), fetchLetters()]).then(
      ([cats, subs, all, allLetters]) => {
        if (cancelled) return;
        setCategories(cats);
        setSubSections(subs);
        setPosts(all);
        setLetters(allLetters);
        setLoading(false);
        const parsed = parseSiteHash(window.location.hash, cats, subs);
        setActiveView(parsed.view);
        setActiveSubSectionId(parsed.subSectionId);
      },
    );
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const onHashChange = () => {
      const parsed = parseSiteHash(window.location.hash, categories, subSections);
      setActiveView(parsed.view);
      setActiveSubSectionId(parsed.subSectionId);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, [categories, subSections]);

  const navigate = useCallback(
    (view: SiteViewId, subSectionId: string | null = null) => {
      let subId = subSectionId;
      if (view !== 'whats-new' && view !== 'letters' && view !== UNCATEGORIZED_CATEGORY.id && !subId) {
        const first = subSections.find((s) => s.category_id === view);
        subId = first?.id ?? null;
      }

      setActiveView(view);
      setActiveSubSectionId(subId);

      const hash = hashFromSiteView(view, subId, categories, subSections);
      if (window.location.hash !== hash) {
        window.history.replaceState(null, '', hash);
      }
      mainRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },
    [categories, subSections],
  );

  const navigateSubSection = useCallback(
    (subSectionId: string) => {
      const sub = subSections.find((s) => s.id === subSectionId);
      if (!sub) return;
      navigate(sub.category_id, subSectionId);
    },
    [navigate, subSections],
  );

  const whatsNew = useMemo(() => posts.slice(0, WHATS_NEW_COUNT), [posts]);
  const whatsNewLetter = useMemo(() => featuredLetter(letters), [letters]);
  const legacyPosts = useMemo(() => uncategorizedPosts(posts), [posts]);

  const navCategories = useMemo(() => {
    const items = [...categories];
    if (legacyPosts.length > 0) items.push(UNCATEGORIZED_CATEGORY);
    return items;
  }, [categories, legacyPosts.length]);

  const activeEpisode = useMemo(() => {
    if (activeView === 'whats-new' || activeView === 'letters') return null;

    let category: Category | null = null;
    let episodePosts: SiteContentItem[] = [];

    if (activeView === UNCATEGORIZED_CATEGORY.id) {
      category = UNCATEGORIZED_CATEGORY;
      episodePosts = legacyPosts;
    } else {
      const found = categories.find((c) => c.id === activeView);
      if (!found) return null;
      category = found;
      episodePosts = posts.filter((p) => p.categoryId === found.id);
    }

    const episodeSubs = subSectionsForCategory(subSections, category.id);
    const filtered =
      activeSubSectionId != null
        ? episodePosts.filter((p) => p.subSectionId === activeSubSectionId)
        : episodePosts;

    return {
      category,
      items: filtered,
      subSections: episodeSubs,
    };
  }, [activeView, activeSubSectionId, categories, legacyPosts, posts, subSections]);

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
      <SiteNav
        categories={navCategories}
        activeView={activeView}
        onNavigate={(view) => navigate(view)}
      />
      <main ref={mainRef} className="site-main">
        {activeView === 'whats-new' && (
          <WhatsNew items={whatsNew} featuredLetter={whatsNewLetter} loading={loading} />
        )}

        {activeEpisode ? (
          <EpisodeSection
            category={activeEpisode.category}
            items={activeEpisode.items}
            subSections={activeEpisode.subSections}
            activeSubSectionId={activeSubSectionId}
            onSubSectionChange={navigateSubSection}
          />
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
