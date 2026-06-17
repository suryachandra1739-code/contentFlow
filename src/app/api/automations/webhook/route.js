import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { webhookUrl, caption, hashtags, imageUrl, platforms } = body;

    if (!webhookUrl) {
      return NextResponse.json({ error: 'n8n webhook URL is required' }, { status: 400 });
    }

    // Forward the post data to the n8n webhook
    const n8nPayload = {
      caption: caption || '',
      hashtags: hashtags || '',
      image_url: imageUrl || '',
      platforms: platforms || { instagram: true, facebook: true, twitter: false, linkedin: false },
      timestamp: new Date().toISOString(),
      source: 'contentflow'
    };

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(n8nPayload),
      signal: AbortSignal.timeout(15000), // 15s timeout
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      return NextResponse.json({ 
        error: `n8n webhook returned ${response.status}`, 
        details: errorText 
      }, { status: 502 });
    }

    let result;
    try {
      result = await response.json();
    } catch {
      result = { success: true, message: 'Webhook accepted' };
    }

    return NextResponse.json({ 
      success: true, 
      result,
      timestamp: new Date().toISOString() 
    });

  } catch (error) {
    if (error.name === 'TimeoutError' || error.name === 'AbortError') {
      return NextResponse.json({ error: 'n8n webhook timed out. Is your n8n instance running?' }, { status: 504 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Test webhook connectivity
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const webhookUrl = searchParams.get('url');

  if (!webhookUrl) {
    return NextResponse.json({ error: 'Webhook URL required' }, { status: 400 });
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(webhookUrl, {
      method: 'HEAD',
      signal: controller.signal,
    }).catch(() => null);

    clearTimeout(timeoutId);

    if (response && (response.ok || response.status === 405)) {
      // 405 = Method Not Allowed is expected for HEAD on webhook endpoints
      return NextResponse.json({ connected: true, status: response.status });
    }

    return NextResponse.json({ connected: false, status: response?.status || 0 });
  } catch {
    return NextResponse.json({ connected: false, error: 'Connection failed' });
  }
}
