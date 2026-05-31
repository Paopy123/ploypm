import { ADMIN_EMAILS } from '../content';

const UPLOADER_NAMES: Record<string, string> = {
  'ploy.muennikorn@gmail.com': 'Ploy',
  'pao51613@gmail.com': 'Pao',
};

export function getUploaderName(email: string | null | undefined): string | null {
  if (!email) return null;
  const key = email.trim().toLowerCase();
  if (key in UPLOADER_NAMES) return UPLOADER_NAMES[key];
  if (ADMIN_EMAILS.some((e) => e === key)) return key.split('@')[0];
  return null;
}

export function getUploaderCredit(email: string | null | undefined): string | null {
  const name = getUploaderName(email);
  if (!name) return null;
  return `${name} uploaded the content`;
}
