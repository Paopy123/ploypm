import { driveEmbedUrl } from './googleDrive';
import { isSupabaseConfigured, supabase } from './supabase';

export type DriveSetupStatus = {
  configured: boolean;
  missing: string[];
  hint?: string;
};

function driveFunctionUrl(): string {
  const custom = import.meta.env.VITE_DRIVE_UPLOAD_URL as string | undefined;
  if (custom) return custom;
  return '/.netlify/functions/drive-upload';
}

async function getAccessToken(): Promise<string> {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session?.access_token) {
    throw new Error('Your session expired. Sign out, sign in again, then upload.');
  }
  return data.session.access_token;
}

export async function checkDriveSetup(): Promise<DriveSetupStatus> {
  if (!isSupabaseConfigured) {
    return {
      configured: false,
      missing: ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'],
      hint: 'Add Supabase keys in Netlify → Environment variables, then redeploy.',
    };
  }

  try {
    const res = await fetch(driveFunctionUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'status' }),
    });

    if (res.status === 404) {
      return {
        configured: false,
        missing: ['Netlify upload function'],
        hint: 'Redeploy the site on Netlify (latest code includes netlify/functions). Drag-and-drop deploy must include the whole project, not only the dist folder.',
      };
    }

    if (!res.ok) {
      const text = await res.text();
      return {
        configured: false,
        missing: ['Server error'],
        hint: text.slice(0, 200) || `Upload server returned ${res.status}.`,
      };
    }

    const data = (await res.json()) as DriveSetupStatus;
    if (!data.configured && (!data.missing || data.missing.length === 0)) {
      return {
        configured: false,
        missing: ['Google Drive env vars on Netlify'],
        hint: 'Follow docs/GOOGLE_DRIVE_SETUP.md — add variables, then redeploy.',
      };
    }

    if (!data.configured) {
      return {
        ...data,
        hint:
          data.hint ||
          'Netlify → Site configuration → Environment variables → add the missing items → Deploys → Trigger deploy.',
      };
    }

    return data;
  } catch {
    return {
      configured: false,
      missing: ['Cannot reach Netlify functions'],
      hint: 'Are you on the live Netlify URL? Local npm run dev does not run upload functions — use netlify dev or deploy first.',
    };
  }
}

export async function isDriveAutoUploadConfigured(): Promise<boolean> {
  const status = await checkDriveSetup();
  return status.configured;
}

function uploadToGoogle(uploadUrl: string, file: File, onProgress?: (percent: number) => void): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', uploadUrl);
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status < 200 || xhr.status >= 300) {
        reject(new Error(`Drive upload failed (${xhr.status}).`));
        return;
      }
      try {
        const data = JSON.parse(xhr.responseText) as { id?: string };
        if (!data.id) {
          reject(new Error('Drive upload succeeded but file ID was missing.'));
          return;
        }
        resolve(data.id);
      } catch {
        reject(new Error('Could not read Drive response after upload.'));
      }
    };

    xhr.onerror = () => reject(new Error('Network error during Drive upload.'));
    xhr.send(file);
  });
}

export async function uploadFileToGoogleDrive(
  file: File,
  onProgress?: (percent: number) => void,
): Promise<{ fileId: string; embedUrl: string }> {
  const token = await getAccessToken();

  const startRes = await fetch(driveFunctionUrl(), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'start',
      fileName: file.name,
      mimeType: file.type || 'application/octet-stream',
      fileSize: file.size,
    }),
  });

  const startData = (await startRes.json()) as { uploadUrl?: string; error?: string };
  if (!startRes.ok || !startData.uploadUrl) {
    throw new Error(startData.error || 'Could not start Drive upload.');
  }

  const fileId = await uploadToGoogle(startData.uploadUrl, file, onProgress);

  const shareRes = await fetch(driveFunctionUrl(), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action: 'share', fileId }),
  });

  const shareData = (await shareRes.json()) as { fileId?: string; embedUrl?: string; error?: string };
  if (!shareRes.ok) {
    throw new Error(shareData.error || 'Uploaded to Drive but could not set sharing.');
  }

  return {
    fileId: shareData.fileId || fileId,
    embedUrl: shareData.embedUrl || driveEmbedUrl(fileId),
  };
}
