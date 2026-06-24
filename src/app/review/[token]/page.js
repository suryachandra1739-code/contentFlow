import { createClientServer } from '@/lib/supabase-server';
import { notFound } from 'next/navigation';
import PostReviewActions from '@/components/PostReviewActions';
import PlatformPreview from '@/components/PlatformPreview';
import AutoRefresh from '@/components/AutoRefresh';

export default async function PublicReviewPage({ params }) {
  const { token } = await params;
  const supabase = await createClientServer();

  // Fetch post details using token
  const { data: post } = await supabase
    .from('posts')
    .select('*, projects(name), clients(company_name)')
    .eq('review_token', token)
    .single();

  if (!post) return notFound();

  // Fetch comments
  const { data: comments } = await supabase
    .from('comments')
    .select('*, users(name, role)')
    .eq('post_id', post.id)
    .eq('is_internal', false)
    .order('created_at', { ascending: true });

  // Custom Glassmorphic Card Styling helper
  const glassCardStyle = {
    background: 'rgba(22, 22, 26, 0.45)',
    backdropFilter: 'blur(30px) saturate(180%)',
    WebkitBackdropFilter: 'blur(30px) saturate(180%)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '24px',
    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
    padding: '28px',
    position: 'relative',
    overflow: 'hidden'
  };

  // Mock calculations for metrics matching the reference style
  const platformName = post.platform || 'social';
  const reachText = platformName === 'linkedin' ? '12k - 18k' : platformName === 'youtube' ? '15k - 25k' : platformName === 'instagram' ? '8k - 12k' : '5k - 8k';
  const engagementText = '92%';

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#070709',
      backgroundImage: `
        radial-gradient(circle at 10% 20%, rgba(48, 164, 108, 0.08) 0%, transparent 40%),
        radial-gradient(circle at 90% 80%, rgba(245, 166, 35, 0.06) 0%, transparent 40%)
      `,
      padding: '60px 40px',
      position: 'relative',
      overflow: 'hidden',
      color: '#ededed'
    }}>
      {/* Realtime channel refreshing */}
      <AutoRefresh postId={post.id} />

      <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        
        {/* Header Section matching reference image style */}
        <header className="review-header-grid">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '8px' }}>
              <h1 style={{
                fontSize: '44px',
                fontWeight: '800',
                lineHeight: '1.05',
                letterSpacing: '-0.03em',
                color: '#ffffff',
                textTransform: 'uppercase'
              }}>
                Post<br />Review
              </h1>
              <span style={{
                border: '1px solid rgba(255, 255, 255, 0.25)',
                borderRadius: '999px',
                padding: '6px 16px',
                fontSize: '11px',
                fontWeight: '600',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                color: '#ffffff',
                alignSelf: 'start',
                marginTop: '4px'
              }}>
                Portal
              </span>
            </div>
            <div style={{ fontSize: '14px', color: '#88888b', fontWeight: '500' }}>
              Project: <span style={{ color: '#ffffff' }}>{post.projects?.name || 'General'}</span>
            </div>
            {(() => {
              const created = new Date(post.created_at);
              const expiry = new Date(created.getTime() + 7 * 24 * 60 * 60 * 1000);
              const diffMs = expiry - Date.now();
              
              if (diffMs > 0) {
                const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
                const diffHours = Math.floor((diffMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
                const label = diffDays > 0 ? `${diffDays}d ${diffHours}h remaining` : `${diffHours}h remaining`;
                const isUrgent = diffMs < 24 * 60 * 60 * 1000;
                
                return (
                  <div style={{
                    marginTop: '8px',
                    fontSize: '12px',
                    color: isUrgent ? '#ef4444' : '#88888b',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontWeight: '500'
                  }}>
                    ⏰ This review portal auto-deletes in {label}
                  </div>
                );
              }
              return null;
            })()}
          </div>
          <div style={{
            fontSize: '15px',
            lineHeight: '1.6',
            color: '#a1a1aa',
            maxWidth: '520px',
            alignSelf: 'end',
            borderLeft: '2px solid rgba(255, 255, 255, 0.1)',
            paddingLeft: '20px'
          }}>
            Review the social media post draft prepared by the agency. You can inspect the formatting, media layout, metrics recommendations, and approve or request adjustments.
          </div>
        </header>

        {/* Content Layout Grid */}
        <div className="review-content-grid">
          
          {/* Left Column: Preview of the Post */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div style={glassCardStyle}>
              {/* Glowing header accent line */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '3px',
                background: 'linear-gradient(90deg, #30a46c, #f5a623)'
              }} />
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <span style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  color: 'rgba(255, 255, 255, 0.4)'
                }}>
                  Interactive Preview ({post.platform})
                </span>
                <span className={`badge badge-${post.status}`} style={{
                  fontSize: '11px',
                  fontWeight: '600',
                  padding: '4px 12px',
                  textTransform: 'capitalize'
                }}>
                  {post.status}
                </span>
              </div>
              
              <div style={{
                background: 'rgba(0, 0, 0, 0.25)',
                borderRadius: '16px',
                overflow: 'hidden',
                border: '1px solid rgba(255, 255, 255, 0.05)'
              }}>
                <PlatformPreview 
                  platform={post.platform} 
                  caption={post.caption} 
                  hashtags={post.hashtags} 
                  mediaUrl={post.media_url} 
                  mediaType={post.media_type} 
                  aspectRatio={post.thumbnail_url || 'original'} 
                />
              </div>
            </div>

            {/* Caption Card */}
            <div style={glassCardStyle}>
              <h3 style={{ fontSize: '14px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(255,255,255,0.4)', marginBottom: '16px' }}>Caption Text</h3>
              <div style={{
                padding: '20px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                borderRadius: '14px',
                fontSize: '14px',
                color: '#e4e4e7',
                whiteSpace: 'pre-wrap',
                lineHeight: '1.6'
              }}>
                {post.caption || 'No caption text provided.'}
              </div>
            </div>
          </div>

          {/* Right Column: Actions, Metrics, & Comments */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            
            {/* Decision/Approval Actions Center */}
            <div style={{
              ...glassCardStyle,
              background: 'linear-gradient(135deg, rgba(22, 22, 26, 0.65) 0%, rgba(22, 22, 26, 0.35) 100%)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                <span style={{ fontSize: '18px' }}>⚡</span>
                <span style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  color: 'rgba(255, 255, 255, 0.4)'
                }}>
                  Decision Center
                </span>
              </div>
              <PostReviewActions post={post} token={token} />
            </div>

            {/* Comments List Feed */}
            <div style={glassCardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <span style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  color: 'rgba(255, 255, 255, 0.4)'
                }}>
                  Feedback Feed ({comments?.length || 0})
                </span>
                <span style={{ fontSize: '11px', color: '#30a46c', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#30a46c', display: 'inline-block' }}></span>
                  Realtime
                </span>
              </div>

              {comments?.length === 0 ? (
                <div style={{
                  padding: '24px',
                  textAlign: 'center',
                  color: 'rgba(255,255,255,0.25)',
                  fontSize: '13px',
                  fontStyle: 'italic',
                  background: 'rgba(255,255,255,0.01)',
                  borderRadius: '12px',
                  border: '1px dashed rgba(255,255,255,0.05)'
                }}>
                  No comments yet. Decisions and requests will appear here in real-time.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '350px', overflowY: 'auto', paddingRight: '4px' }}>
                  {comments.map(c => {
                    const getRoleDetails = (role) => {
                      const normalized = (role || 'client').toLowerCase();
                      if (normalized === 'admin') {
                        return {
                          label: 'Admin',
                          color: '#f87171',
                          bg: 'rgba(248,113,113,0.1)',
                          borderColor: '#ef4444',
                        };
                      } else if (normalized === 'team') {
                        return {
                          label: 'Team',
                          color: '#c084fc',
                          bg: 'rgba(192,132,252,0.1)',
                          borderColor: '#a855f7',
                        };
                      } else {
                        return {
                          label: 'Client',
                          color: '#60a5fa',
                          bg: 'rgba(96,165,250,0.1)',
                          borderColor: '#3b82f6',
                        };
                      }
                    };
                    const roleInfo = getRoleDetails(c.users?.role);

                    return (
                      <div key={c.id} style={{
                        display: 'flex',
                        gap: '12px',
                        alignItems: 'start',
                        padding: '14px',
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid rgba(255, 255, 255, 0.04)',
                        borderRadius: '12px'
                      }}>
                        <img 
                          src={`https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(c.users?.name || 'Unknown')}&radius=50`} 
                          alt={c.users?.name || 'Unknown'} 
                          style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', border: `2px solid ${roleInfo.borderColor}`, flexShrink: 0 }} 
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontWeight: '600', fontSize: '13px', color: '#ffffff' }}>{c.users?.name || 'Unknown'}</span>
                              <span style={{
                                padding: '1px 6px',
                                borderRadius: '4px',
                                fontSize: '9px',
                                fontWeight: '700',
                                textTransform: 'uppercase',
                                color: roleInfo.color,
                                background: roleInfo.bg
                              }}>{roleInfo.label}</span>
                            </div>
                            <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '10px' }}>{new Date(c.created_at).toLocaleDateString()}</span>
                          </div>
                          <div style={{ color: '#d4d4d8', fontSize: '13px', lineHeight: '1.4' }}>{c.content}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
