import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getPagePath, initAnalytics, trackPageView } from '../lib/analytics';

/** Tracks GA4 page views for React Router and hash-based episode navigation. */
export function GoogleAnalytics() {
  const location = useLocation();

  useEffect(() => {
    initAnalytics();
    trackPageView(getPagePath());
  }, []);

  useEffect(() => {
    trackPageView(`${location.pathname}${location.search}${location.hash || window.location.hash}`);
  }, [location.pathname, location.search, location.hash]);

  useEffect(() => {
    const onHashChange = () => trackPageView(getPagePath());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  return null;
}
