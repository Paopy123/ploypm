import { useEffect, useMemo, useState } from 'react';
import { useClickHearts } from './components/ClickHearts';
import { EpisodeSection } from './components/EpisodeSection';
import { Footer } from './components/Footer';
import { HeartCounter } from './components/HeartCounter';
import { Hero } from './components/Hero';
import { Letter } from './components/Letter';
import { SiteNav } from './components/SiteNav';
import { WhatsNew } from './components/WhatsNew';
import { fetchCategories } from './lib/categories';
import { fetchDbPosts, WHATS_NEW_COUNT } from './lib/content';
import type { Category } from './types/category';
import type { SiteContentItem } from './types/content';

export function SiteContent() {
  const { tapCount, spawnHeart, HeartLayer } = useClickHearts();
  const [categories, setCategories] = useState<Category[]>([]);
  const [posts, setPosts] = useState<SiteContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchCategories(), fetchDbPosts()]).then(([cats, all]) => {
      if (cancelled) return;
      setCategories(cats);
      setPosts(all);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const whatsNew = useMemo(() => posts.slice(0, WHATS_NEW_COUNT), [posts]);

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
      <SiteNav categories={categories} />
      <main>
        <WhatsNew items={whatsNew} loading={loading} />
        {categories.map((cat) => (
          <EpisodeSection key={cat.id} category={cat} items={postsByCategory.get(cat.id) ?? []} />
        ))}
        <Letter />
      </main>
      <Footer />
    </div>
  );
}
