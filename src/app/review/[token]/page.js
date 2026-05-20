import { createClientServer } from '@/lib/supabase-server';
import { notFound } from 'next/navigation';
import PostReviewActions from '@/components/PostReviewActions';
import PlatformPreview from '@/components/PlatformPreview';
import AutoRefresh from '@/components/AutoRefresh';

export default async function PublicReviewPage({ params }) {
  const { token } = await params;
  const supabase = await createClientServer();

  // Since it's public, we use the token to fetch
  const { data: post } = await supabase
    .from('posts')
    .select('*, projects(name), clients(company_name)')
    .eq('review_token', token)
    .single();

  if (!post) return notFound();

  // Fetch public comments
  const { data: comments } = await supabase
    .from('comments')
    .select('*, users(name)')
    .eq('post_id', post.id)
    .eq('is_internal', false)
    .order('created_at', { ascending: true });

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', padding: '40px 24px' }}>
      <AutoRefresh />
      <div className="fade-in" style={{ maxWidth: 800, margin: '0 auto' }}>
        
        <header style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40, justifyContent: 'center' }}>
          <div style={{ width: 32, height: 32, background: 'var(--accent)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 16 }}>
            📦
          </div>
          <span style={{ fontWeight: 600, fontSize: 18 }}>Review request from Agency</span>
        </header>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
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

          <PostReviewActions post={post} token={token} />

          <div className="card">
            <div className="card-body">
              <h3 style={{ fontSize: 14, fontWeight: 500, marginBottom: 16, color: 'var(--text-secondary)' }}>Comments ({comments?.length || 0})</h3>
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
