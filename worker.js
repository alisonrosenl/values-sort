/**
 * Cloudflare Worker — Kit.com subscription proxy
 *
 * Paste this into the Cloudflare Workers dashboard editor and deploy.
 * Then add KIT_API_KEY and KIT_FORM_ID as Secret variables
 * (Settings → Variables → Secret variables).
 */

const ALLOWED_ORIGIN = 'https://values.alisonrose.nl';

addEventListener('fetch', (event) => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const origin = request.headers.get('Origin') || '';
  const allowed = origin === ALLOWED_ORIGIN || origin.startsWith('http://localhost');
  const corsOrigin = allowed ? origin : ALLOWED_ORIGIN;

  const corsHeaders = {
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response('Invalid JSON', { status: 400, headers: corsHeaders });
  }

  const { email, firstName, resultsUrl } = body;

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return new Response('Invalid email', { status: 400, headers: corsHeaders });
  }

  const kitResponse = await fetch(
    `https://api.kit.com/v3/forms/${KIT_FORM_ID}/subscribe`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: KIT_API_KEY,
        email,
        first_name: firstName || '',
        fields: { results_url: resultsUrl || '' },
      }),
    }
  );

  return new Response(kitResponse.body, {
    status: kitResponse.status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders },
  });
}
