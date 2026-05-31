import { createClient } from '@supabase/supabase-js';
import { google } from 'googleapis';

const ADMIN_EMAILS = ['pao51613@gmail.com', 'ploy.muennikorn@gmail.com'];

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

function jsonResponse(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...extraHeaders },
  });
}

function getServiceAccountCredentials() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      /* try alternate env vars below */
    }
  }

  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;
  if (clientEmail && privateKey) {
    return {
      client_email: clientEmail,
      private_key: privateKey.replace(/\\n/g, '\n'),
    };
  }

  return null;
}

function getSetupStatus() {
  const missing = [];

  if (!getServiceAccountCredentials()) {
    missing.push('GOOGLE_SERVICE_ACCOUNT_JSON (or GOOGLE_CLIENT_EMAIL + GOOGLE_PRIVATE_KEY)');
  }
  if (!process.env.GOOGLE_DRIVE_FOLDER_ID) {
    missing.push('GOOGLE_DRIVE_FOLDER_ID');
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  if (!supabaseUrl) missing.push('SUPABASE_URL');
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY');

  return {
    configured: missing.length === 0,
    missing,
  };
}

async function getDriveClient() {
  const credentials = getServiceAccountCredentials();
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  if (!credentials || !folderId) {
    throw new Error('Google Drive is not configured on the server.');
  }

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/drive.file'],
  });

  const drive = google.drive({ version: 'v3', auth });
  return { drive, folderId };
}

async function verifyAdmin(req) {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    throw new Error('Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Netlify → Environment variables, then redeploy.');
  }

  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) throw new Error('Missing sign-in. Sign out and sign in again.');

  const supabase = createClient(supabaseUrl, serviceKey);
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user?.email) throw new Error('Invalid session. Sign in again.');

  const email = data.user.email.toLowerCase();
  if (!ADMIN_EMAILS.includes(email)) {
    throw new Error('Only Pao and Ploy can upload to Drive.');
  }

  return data.user;
}

async function startResumableUpload({ fileName, mimeType, fileSize }) {
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
  const credentials = getServiceAccountCredentials();

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/drive.file'],
  });
  const client = await auth.getClient();
  const accessToken = await client.getAccessToken();
  if (!accessToken.token) throw new Error('Could not authenticate with Google. Check your service account JSON.');

  const metadata = {
    name: fileName || 'upload',
    parents: [folderId],
  };

  const init = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken.token}`,
      'Content-Type': 'application/json; charset=UTF-8',
      'X-Upload-Content-Type': mimeType || 'application/octet-stream',
      'X-Upload-Content-Length': String(fileSize),
    },
    body: JSON.stringify(metadata),
  });

  if (!init.ok) {
    const errText = await init.text();
    if (errText.includes('storageQuota') || errText.includes('403')) {
      throw new Error(
        'Google blocked the upload. Share your Drive folder with the service account email as Editor (see docs/GOOGLE_DRIVE_SETUP.md).',
      );
    }
    throw new Error(`Drive upload failed to start: ${errText.slice(0, 240)}`);
  }

  const uploadUrl = init.headers.get('Location');
  if (!uploadUrl) throw new Error('Drive did not return an upload URL.');

  return { uploadUrl };
}

async function makeFilePublic(fileId) {
  const { drive } = await getDriveClient();
  await drive.permissions.create({
    fileId,
    requestBody: { role: 'reader', type: 'anyone' },
  });
}

export default async (req) => {
  const origin = req.headers.get('origin') || '*';
  const headers = corsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405, headers);
  }

  let body = {};
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body.' }, 400, headers);
  }

  const action = body?.action;

  if (action === 'status') {
    return jsonResponse(getSetupStatus(), 200, headers);
  }

  try {
    await verifyAdmin(req);

    if (action === 'start') {
      const { fileName, mimeType, fileSize } = body;
      if (!fileSize || fileSize <= 0) {
        return jsonResponse({ error: 'Invalid file size.' }, 400, headers);
      }
      const result = await startResumableUpload({ fileName, mimeType, fileSize });
      return jsonResponse(result, 200, headers);
    }

    if (action === 'share') {
      const { fileId } = body;
      if (!fileId) return jsonResponse({ error: 'Missing fileId.' }, 400, headers);
      await makeFilePublic(fileId);
      return jsonResponse(
        {
          fileId,
          embedUrl: `https://drive.google.com/file/d/${fileId}/preview`,
        },
        200,
        headers,
      );
    }

    return jsonResponse({ error: 'Unknown action.' }, 400, headers);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Upload failed.';
    return jsonResponse({ error: message }, 400, headers);
  }
};
