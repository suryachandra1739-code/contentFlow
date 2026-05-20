import { NextResponse } from 'next/server';
import { createClientServer } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const supabase = await createClientServer();
    
    // Fetch all users except clients
    const { data: teamMembers, error: teamError } = await supabase
      .from('users')
      .select('*')
      .in('role', ['admin', 'team'])
      .order('created_at', { ascending: false });

    if (teamError) {
      return NextResponse.json({ error: teamError.message }, { status: 500 });
    }

    // Fetch post counts
    const { data: posts } = await supabase.from('posts').select('created_by');
    
    const postCounts = posts?.reduce((acc, post) => {
      acc[post.created_by] = (acc[post.created_by] || 0) + 1;
      return acc;
    }, {}) || {};

    return NextResponse.json({ teamMembers: teamMembers || [], postCounts });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
