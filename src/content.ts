/**
 * Edit everything here — swap media in /public/media/ and update the letter below.
 */

/** Only these Gmail accounts can sign in at /admin (passwords are set in Supabase, not here) */
export const ADMIN_EMAILS = ['pao51613@gmail.com', 'ploy.muennikorn@gmail.com'] as const;

/** 8-digit code required before the site loads (edit here) */
export const PIN_CODE = '25154009';
export const PIN_LENGTH = 8;

export const PIN_GATE_TITLE = 'For You, My Love';
export const PIN_GATE_SUBTITLE = 'Enter the code only you would know';

export const SITE_TITLE = 'For You, My Love';
export const SITE_SUBTITLE = 'Something made just for you';
export const HERO_HINT = 'Tap anywhere';

/** Path to your intro video (place intro.mp4 in public/media/) */
export const VIDEO_PATH = '/media/intro.mp4';

/** Gallery images — photo-1.jpg … photo-4.jpg in public/media/ */
export const PHOTOS = [
  { src: '/media/photo-1.jpg', alt: 'A moment together' },
  { src: '/media/photo-2.jpg', alt: 'Another cherished memory' },
  { src: '/media/photo-3.jpg', alt: 'Us, smiling' },
  { src: '/media/photo-4.jpg', alt: 'One more I love' },
] as const;

/** Poster frame for the video — uses the first photo */
export const VIDEO_POSTER = PHOTOS[0].src;

/** Love letter — line breaks are preserved */
export const LETTER_MESSAGE = `My dearest,

I made this little corner of the internet just for you — because some feelings deserve more than a text, and because you deserve to feel how deeply you are loved.

Every photo here is a piece of us. Every second of that video is a heartbeat I wanted you to hear. And this letter… well, it's the part I couldn't fit into pictures.

Thank you for being you. Thank you for choosing me. I fall in love with you again every day, and I always will.

Forever yours,
With all my heart`;

export const LETTER_BUTTON_LABEL = 'Open the letter';
export const FOOTER_TEXT = 'made with ♥ just for you.';
