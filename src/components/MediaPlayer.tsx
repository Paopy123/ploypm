import { useCallback, useEffect, useRef, useState } from 'react';
import { driveOpenUrl } from '../lib/googleDrive';
import type { SiteContentItem } from '../types/content';

type MediaPlayerProps = {
  item: SiteContentItem;
  className?: string;
};

type VideoWithIosFullscreen = HTMLVideoElement & {
  webkitEnterFullscreen?: () => void;
  webkitRequestFullscreen?: () => void;
};

function enterNativeFullscreen(video: HTMLVideoElement): void {
  const el = video as VideoWithIosFullscreen;
  if (typeof el.webkitEnterFullscreen === 'function') {
    el.webkitEnterFullscreen();
    return;
  }
  if (typeof video.requestFullscreen === 'function') {
    void video.requestFullscreen();
    return;
  }
  if (typeof el.webkitRequestFullscreen === 'function') {
    el.webkitRequestFullscreen();
  }
}

export function MediaPlayer({ item, className = '' }: MediaPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [driveFullscreen, setDriveFullscreen] = useState(false);

  const closeDriveFullscreen = useCallback(() => setDriveFullscreen(false), []);

  useEffect(() => {
    if (!driveFullscreen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeDriveFullscreen();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [driveFullscreen, closeDriveFullscreen]);

  const handleNativeFullscreen = () => {
    const video = videoRef.current;
    if (video) enterNativeFullscreen(video);
  };

  const handleDriveFullscreen = () => {
    setDriveFullscreen(true);
  };

  const handleOpenInDrive = () => {
    if (item.driveFileId) {
      window.open(driveOpenUrl(item.driveFileId), '_blank', 'noopener,noreferrer');
    }
  };

  const fullscreenBtn = (onClick: () => void, label = 'Watch fullscreen') => (
    <button type="button" className="video-fullscreen-btn" onClick={onClick}>
      <span className="video-fullscreen-btn__icon" aria-hidden="true">
        ⛶
      </span>
      {label}
    </button>
  );

  if (item.mediaSource === 'drive' && item.mediaType === 'photo') {
    return (
      <img className={className} src={item.src} alt={item.description || 'Photo'} loading="lazy" />
    );
  }

  if (item.mediaSource === 'drive' && item.mediaType === 'video') {
    const embedSrc = item.src;

    return (
      <div className={`media-player ${className}`.trim()}>
        <div className="video-wrap video-wrap--drive">
          <div className="drive-video">
            <iframe
              src={embedSrc}
              title={item.description || 'Video'}
              allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
              allowFullScreen
              loading="lazy"
            />
          </div>
        </div>
        <div className="video-actions">
          {fullscreenBtn(handleDriveFullscreen)}
          {item.driveFileId && (
            <button type="button" className="video-fullscreen-btn video-fullscreen-btn--secondary" onClick={handleOpenInDrive}>
              Open in Google Drive
            </button>
          )}
        </div>

        {driveFullscreen && (
          <div
            className="video-fullscreen-modal"
            role="dialog"
            aria-modal="true"
            aria-label={item.description || 'Video fullscreen'}
          >
            <div className="video-fullscreen-modal__header">
              <p className="video-fullscreen-modal__title">{item.description || 'Video'}</p>
              <button type="button" className="video-fullscreen-modal__close" onClick={closeDriveFullscreen}>
                Close
              </button>
            </div>
            <div className="video-fullscreen-modal__frame">
              <iframe
                src={embedSrc}
                title={item.description || 'Video'}
                allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`media-player ${className}`.trim()}>
      <div className="video-wrap">
        <video ref={videoRef} className="media-player__video" controls playsInline preload="metadata" poster={item.poster} src={item.src}>
          Your browser does not support the video tag.
        </video>
      </div>
      {fullscreenBtn(handleNativeFullscreen)}
    </div>
  );
}
