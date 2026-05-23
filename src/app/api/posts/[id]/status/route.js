import { NextResponse } from 'next/server';
import { createClientServer } from '@/lib/supabase-server';

export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const { status } = await request.json();
    const supabase = await createClientServer();

    if (!['draft', 'pending', 'approved', 'revision', 'rejected'].includes(status)) {
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

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
