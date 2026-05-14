import { createClientServer } from '@/lib/supabase-server';
import { notFound } from 'next/navigation';
import PostReviewActions from '@/components/PostReviewActions';

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
      <div className="fade-in" style={{ maxWidth: 800, margin: '0 auto' }}>
        
        <header style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 40, justifyContent: 'center' }}>
          <div style={{ width: 32, height: 32, background: 'var(--accent)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 16 }}>
            📦
          </div>
          <span style={{ fontWeight: 600, fontSize: 18 }}>Review request from Agency</span>
        </header>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Media Side */}
          <div className="card" style={{ padding: 0, overflow: 'hidden', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
            {post.media_type === 'video' ? (
              <video 
                src={post.media_url} 
                controls 
                preload="metadata"
                style={{ width: '100%', maxHeight: '60vh', objectFit: 'contain' }} 
              />
            ) : (
              <img 
                src={post.media_url} 
                alt={post.caption} 
                style={{ width: '100%', maxHeight: '60vh', objectFit: 'contain' }} 
              />
            )}
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
        </div>
      </div>
    </div>
  );
}
