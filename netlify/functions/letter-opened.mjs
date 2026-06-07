const NOTIFY_TO = 'pao51613@gmail.com';

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
}

function jsonResponse(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...extraHeaders },
  });
}

function formatTime() {
  try {
    return new Date().toLocaleString('en-AU', {
      timeZone: 'Australia/Sydney',
      dateStyle: 'full',
      timeStyle: 'short',
    });
  } catch {
    return new Date().toISOString();
  }
}

async function sendViaResend(apiKey, { letterTitle, letterId }) {
  const title = String(letterTitle || 'Untitled letter').slice(0, 120);
  const when = formatTime();

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM || 'Ploypm <onboarding@resend.dev>',
      to: [NOTIFY_TO],
      subject: `Someone opened your letter: ${title}`,
      html: `
        <div style="font-family: Georgia, serif; color: #3d1822; line-height: 1.6;">
          <p>Hi Pao,</p>
          <p>Someone just opened a letter on your site.</p>
          <p><strong>Letter:</strong> ${title}</p>
          <p><strong>Time:</strong> ${when}</p>
          ${letterId ? `<p style="color:#7a5c62;font-size:12px;">ID: ${String(letterId).slice(0, 36)}</p>` : ''}
        </div>
      `,
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(detail || `Resend error ${res.status}`);
  }
}

export default async (req) => {
  const origin = req.headers.get('origin') || '*';

  if (req.method === 'OPTIONS') {
    return new Response('', { status: 204, headers: corsHeaders(origin) });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405, corsHeaders(origin));
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('RESEND_API_KEY is not set');
    return jsonResponse({ error: 'Email notifications are not configured yet.' }, 503, corsHeaders(origin));
  }

  let payload;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON' }, 400, corsHeaders(origin));
  }

  const letterTitle = typeof payload?.letterTitle === 'string' ? payload.letterTitle : '';
  const letterId = typeof payload?.letterId === 'string' ? payload.letterId : '';

  try {
    await sendViaResend(apiKey, { letterTitle, letterId });
    return jsonResponse({ ok: true }, 200, corsHeaders(origin));
  } catch (err) {
    console.error('Letter notify failed:', err);
    return jsonResponse({ error: 'Could not send email.' }, 502, corsHeaders(origin));
  }
};
