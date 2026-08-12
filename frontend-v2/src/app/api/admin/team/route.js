import { NextResponse } from 'next/server';
import { createClientServer } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';

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

export async function PUT(request) {
  try {
    const supabase = await createClientServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

    // Check if the current user is an admin
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized: Only admins can manage team members' }, { status: 403 });
    }

    const { userId, name, role, email } = await request.json();

    if (!userId || !name || !role || !email) {
      return NextResponse.json({ error: 'User ID, name, role, and email are required' }, { status: 400 });
    }

    // Prevent admin from demoting themselves
    if (userId === user.id && role !== 'admin') {
      return NextResponse.json({ error: 'You cannot demote yourself from Administrator.' }, { status: 400 });
    }

    // Update public.users table
    const { data: updatedUser, error: dbError } = await supabase
      .from('users')
      .update({ name, role, email })
      .eq('id', userId)
      .select()
      .single();

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    // Update auth.users using admin client if service role key is available
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
      );
      
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        email: email,
        user_metadata: { name, role }
      });
      
      if (authError) {
        console.error('Error updating user in Supabase Auth:', authError);
      }
    }

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const supabase = await createClientServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });

    // Check if the current user is an admin
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized: Only admins can manage team members' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Prevent admin from deleting themselves
    if (userId === user.id) {
      return NextResponse.json({ error: 'You cannot delete your own admin account.' }, { status: 400 });
    }

    // Use admin client to bypass RLS for cleanup operations
    const supabaseAdmin = process.env.SUPABASE_SERVICE_ROLE_KEY
      ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
      : supabase;

    // 1. Delete comments by this user
    const { error: commentsError } = await supabaseAdmin
      .from('comments')
      .delete()
      .eq('user_id', userId);
    if (commentsError) console.error('Error deleting comments:', commentsError);

    // 2. Reassign posts from this user to the current admin
    const { error: postsError } = await supabaseAdmin
      .from('posts')
      .update({ created_by: user.id })
      .eq('created_by', userId);
    if (postsError) console.error('Error reassigning posts:', postsError);

    // 3. Reassign projects created by this user
    const { error: projectsError } = await supabaseAdmin
      .from('projects')
      .update({ created_by: user.id })
      .eq('created_by', userId);
    if (projectsError) console.error('Error reassigning projects:', projectsError);

    // 4. Reassign clients created by this user
    const { error: clientsError } = await supabaseAdmin
      .from('clients')
      .update({ created_by: user.id })
      .eq('created_by', userId);
    if (clientsError) console.error('Error reassigning clients:', clientsError);

    // 5. Reassign audit_log entries
    const { error: auditError } = await supabaseAdmin
      .from('audit_log')
      .update({ user_id: user.id })
      .eq('user_id', userId);
    if (auditError) console.error('Error reassigning audit logs:', auditError);

    // 6. Delete from public.users table
    const { error: dbError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', userId);

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

    // Delete from auth.users using admin client
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (authError) {
        console.error('Error deleting user from Supabase Auth:', authError);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
