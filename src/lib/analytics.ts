const GA_ID = (import.meta.env.VITE_GA_MEASUREMENT_ID ?? '').trim();

let initialized = false;

export function isAnalyticsEnabled(): boolean {
  return Boolean(GA_ID && /^G-[A-Z0-9]+$/i.test(GA_ID));
}

export function getPagePath(): string {
  if (typeof window === 'undefined') return '/';
  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}

export function initAnalytics(): void {
  if (!isAnalyticsEnabled() || initialized || typeof window === 'undefined') return;
  initialized = true;

  window.dataLayer = window.dataLayer ?? [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer!.push(args);
  };

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);

  window.gtag('js', new Date());
  window.gtag('config', GA_ID, { send_page_view: false });
}

export function trackPageView(path = getPagePath(), title?: string): void {
  if (!isAnalyticsEnabled()) return;

  initAnalytics();
  if (!window.gtag) return;

  window.gtag('event', 'page_view', {
    page_path: path,
    page_title: title ?? document.title,
  });
}
