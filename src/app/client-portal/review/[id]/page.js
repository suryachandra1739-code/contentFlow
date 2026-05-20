import { createClientServer } from '@/lib/supabase-server';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import PostReviewActions from '@/components/PostReviewActions';
import PlatformPreview from '@/components/PlatformPreview';
import AutoRefresh from '@/components/AutoRefresh';

export default async function ClientPortalReviewPage({ params }) {
  const { id } = await params;
  const supabase = await createClientServer();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('users')
    .select('client_id')
    .eq('id', user.id)
    .single();

  const { data: post } = await supabase
    .from('posts')
    .select('*, projects(name)')
    .eq('id', id)
    .eq('client_id', profile.client_id)
    .single();

  if (!post) return notFound();

  // Also fetch public comments
  const { data: comments } = await supabase
    .from('comments')
    .select('*, users(name)')
    .eq('post_id', id)
    .eq('is_internal', false)
    .order('created_at', { ascending: true });

  return (
    <div className="fade-in" style={{ maxWidth: 1000, margin: '0 auto' }}>
      <AutoRefresh />
      <div style={{ marginBottom: 24 }}>
        <Link href="/client-portal" style={{ color: 'var(--text-muted)', fontSize: 14, textDecoration: 'none' }}>
          ← Back to overview
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 32 }}>
        {/* Media Side */}
        <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'var(--bg-card)' }}>
          <PlatformPreview 
            platform={post.platform} 
            caption={post.caption} 
            hashtags={post.hashtags} 
            mediaUrl={post.media_url} 
            mediaType={post.media_type} 
            aspectRatio={post.thumbnail_url || 'original'} 
          />
        </div>

        {/* Details Side */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div className="card">
            <div className="card-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', textTransform: 'capitalize', marginBottom: 4 }}>
                    {post.platform} • {post.projects?.name}
                  </div>
                  <h1 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-primary)' }}>Review Post</h1>
                </div>
                <span className={`badge badge-${post.status}`}>{post.status}</span>
              </div>
              
              <div style={{ padding: '16px', background: 'var(--bg-layer)', borderRadius: 'var(--radius)', fontSize: 14, color: 'var(--text-primary)', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
                {post.caption || 'No caption provided.'}
              </div>
            </div>
          </div>

          <PostReviewActions post={post} />

          <div className="card">
            <div className="card-body">
              <h3 style={{ fontSize: 14, fontWeight: 500, marginBottom: 16, color: 'var(--text-secondary)' }}>Comments</h3>
              {comments?.length === 0 ? (
                <div style={{ fontSize: 13, color: 'var(--text-muted)', fontStyle: 'italic' }}>No comments yet.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {comments.map(c => (
                    <div key={c.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <img 
                        src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(c.users?.name || 'Unknown')}&radius=50`} 
                        alt={c.users?.name || 'Unknown'} 
                        style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} 
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 2 }}>
                          <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text-primary)' }}>{c.users?.name || 'Unknown'}</span>
                          <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--mono)', fontSize: 11 }}>{new Date(c.created_at).toLocaleDateString()}</span>
                        </div>
                        <div style={{ color: 'var(--text-secondary)', fontSize: 13, lineHeight: 1.4 }}>{c.content}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
