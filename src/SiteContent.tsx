import { useEffect, useMemo, useState } from 'react';
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
import { archiveLetters, featuredLetter, fetchLetters } from './lib/letters';
import { UNCATEGORIZED_CATEGORY, uncategorizedPosts } from './lib/uncategorized';
import type { Category } from './types/category';
import type { SiteContentItem } from './types/content';
import type { Letter } from './types/letter';

export function SiteContent() {
  const { tapCount, spawnHeart, HeartLayer } = useClickHearts();
  const [categories, setCategories] = useState<Category[]>([]);
  const [posts, setPosts] = useState<SiteContentItem[]>([]);
  const [letters, setLetters] = useState<Letter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchCategories(), fetchDbPosts(), fetchLetters()]).then(([cats, all, allLetters]) => {
      if (cancelled) return;
      setCategories(cats);
      setPosts(all);
      setLetters(allLetters);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const whatsNew = useMemo(() => posts.slice(0, WHATS_NEW_COUNT), [posts]);
  const whatsNewLetter = useMemo(() => featuredLetter(letters), [letters]);
  const letterArchive = useMemo(() => archiveLetters(letters), [letters]);

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
      <SiteNav categories={navCategories} />
      <main>
        <WhatsNew items={whatsNew} featuredLetter={whatsNewLetter} loading={loading} />
        {categories.map((cat) => (
          <EpisodeSection key={cat.id} category={cat} items={postsByCategory.get(cat.id) ?? []} />
        ))}
        {legacyPosts.length > 0 && (
          <EpisodeSection category={UNCATEGORIZED_CATEGORY} items={legacyPosts} />
        )}
        <LetterArchive letters={letterArchive} loading={loading} />
      </main>
      <Footer />
    </div>
  );
}
