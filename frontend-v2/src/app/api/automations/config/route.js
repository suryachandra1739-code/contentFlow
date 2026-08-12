import { NextResponse } from 'next/server';

// Config is stored client-side in localStorage.
// This endpoint serves as a proxy for testing n8n webhook connectivity
// and as a future endpoint if we move to server-side config storage.

export async function POST(request) {
  try {
    const body = await request.json();
    const { action, webhookUrl } = body;

    if (action === 'test-connection') {
      if (!webhookUrl) {
        return NextResponse.json({ error: 'Webhook URL required' }, { status: 400 });
      }

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        // Try a GET request first (n8n webhooks respond to GET for testing)
        const response = await fetch(webhookUrl, {
          method: 'GET',
          signal: controller.signal,
        }).catch(() => null);

        clearTimeout(timeoutId);

        if (response) {
          return NextResponse.json({ 
            connected: true, 
            status: response.status,
            message: 'Successfully connected to n8n instance'
          });
        }

        return NextResponse.json({ 
          connected: false, 
          message: 'Could not reach n8n instance. Check your URL and make sure n8n is running.'
        });
      } catch {
        return NextResponse.json({ 
          connected: false, 
          message: 'Connection timed out. Is your n8n instance accessible from the internet?'
        });
      }
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
