import { NextResponse } from 'next/server';
import { createClientServer } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const { status } = await request.json();
    const supabase = await createClientServer();

    if (!['draft', 'pending', 'approved', 'revision', 'rejected', 'published'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const updateData = { status };
    if (status === 'approved') updateData.approved_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('posts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    const { data: { user } } = await supabase.auth.getUser();
    let userName = 'Team Member';
    if (user) {
      const { data: uProfile } = await supabase
        .from('users')
        .select('name')
        .eq('id', user.id)
        .single();
      userName = uProfile?.name || user.email || 'Team Member';
    }

    await supabase.from('audit_log').insert({
      user_id: user?.id,
      user_name: userName,
      action: `post_status_${status}`,
      entity_type: 'post',
      entity_id: id,
      client_id: data.client_id,
    });

    // Auto-publish: When status is set to 'approved', automatically publish to connected social platforms
    if (status === 'approved' && data.client_id) {
      try {
        const serviceSupabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        const { data: connections } = await serviceSupabase
          .from('social_connections')
          .select('platform')
          .eq('client_id', data.client_id)
          .eq('token_valid', true);

        if (connections && connections.length > 0) {
          const platforms = {};
          connections.forEach(c => { platforms[c.platform] = true; });

          // Fire-and-forget: call the publish endpoint — don't await, don't block status update
          const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
          fetch(`${siteUrl}/api/posts/${id}/publish`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ platforms, auto: true }),
          }).catch((err) => {
            console.error('Auto-publish fire-and-forget failed:', err.message);
          });
        }
      } catch (autoPublishErr) {
        // Never block status update on publish errors
        console.error('Auto-publish setup error (non-blocking):', autoPublishErr.message);
      }
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

