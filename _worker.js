// LeadRescuePro Voice Bridge Worker
// Deploy: npx wrangler deploy _worker.js --name lrp-voice-bridge

// Where to forward requests — this is the tunnel URL back to the Hermes machine
const BACKEND_URL = 'http://127.0.0.1:8643'; // local for now, will be tunnel URL

// Password for accessing the interface
const PASSCODE = '4791';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': '*',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Health check
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Chat endpoint
    if (url.pathname === '/api/chat' && request.method === 'POST') {
      try {
        const body = await request.json();
        const message = body.message || '';

        // Forward to backend
        const backendResp = await fetch(BACKEND_URL + '/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message, session_id: 'cf_worker' }),
          timeout: 120000  // 2 min timeout
        });

        if (!backendResp.ok) {
          return new Response(JSON.stringify({ response: 'Backend unavailable. Please try again.' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const data = await backendResp.json();
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (e) {
        return new Response(JSON.stringify({ response: 'Connection failed. Is the server running?' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Serve static files
    return new Response('404 Not Found', { status: 404 });
  }
};
