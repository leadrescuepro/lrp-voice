// Cloudflare Pages Functions — API route
// This sits in /functions/api/chat.js
// Frontend at index.html calls this

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  
  // CORS
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': '*',
  };
  
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // The tunnel URL — this is set via env variable WRANGLER would inject
  // For now, using the current tunnel. I'll update this to be configurable.
  const TUNNEL_URL = context.env.TUNNEL_URL || 'http://127.0.0.1:8643';

  try {
    const body = await request.json();
    const message = body.message || '';

    const resp = await fetch(`${TUNNEL_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, session_id: 'cf_' + (body.session_id || 'anon') }),
      signal: AbortSignal.timeout(120000)
    });

    if (!resp.ok) {
      return new Response(JSON.stringify({ response: '⚠️ Backend offline. The server may be sleeping. Try again in a moment.' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const data = await resp.json();
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (e) {
    return new Response(JSON.stringify({ response: '⚠️ Could not reach the voice engine. The server may be offline.' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}
