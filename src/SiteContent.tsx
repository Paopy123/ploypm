import { useClickHearts } from './components/ClickHearts';
import { Footer } from './components/Footer';
import { Gallery } from './components/Gallery';
import { WhatsNew } from './components/WhatsNew';
import { HeartCounter } from './components/HeartCounter';
import { Hero } from './components/Hero';
import { Letter } from './components/Letter';
import { VideoSection } from './components/VideoSection';

export function SiteContent() {
  const { tapCount, spawnHeart, HeartLayer } = useClickHearts();

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
      <main>
        <WhatsNew />
        <VideoSection />
        <Gallery />
        <Letter />
      </main>
      <Footer />
    </div>
  );
}
