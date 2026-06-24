import { createClientServer } from '@/lib/supabase-server';
import { notFound } from 'next/navigation';
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

  // Fetch comments
  const { data: comments } = await supabase
    .from('comments')
    .select('*, users(name, role)')
    .eq('post_id', id)
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
      position: 'relative',
      overflow: 'hidden',
      paddingBottom: '60px'
    }}>
      {/* Realtime channel refreshing */}
      <AutoRefresh postId={post.id} />

      {/* Floating sharp foliage cube background asset in center-left background */}
      <div style={{
        position: 'absolute',
        top: '30%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '600px',
        height: '600px',
        backgroundImage: "url('/images/post-driftwood.jpg')",
        backgroundSize: 'contain',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        opacity: 0.22,
        zIndex: 0,
        pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        
        {/* Back Link */}
        <div style={{ marginBottom: '24px' }}>
          <Link href="/client-portal" style={{
            color: 'var(--text-muted)',
            fontSize: '14px',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'color 0.2s'
          }}
          onMouseEnter={(e) => e.target.style.color = '#ffffff'}
          onMouseLeave={(e) => e.target.style.color = 'var(--text-muted)'}>
            ← Back to overview
          </Link>
        </div>

        {/* Header Section matching reference image style */}
        <header style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1.5fr',
          gap: '40px',
          alignItems: 'start',
          marginBottom: '40px'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '8px' }}>
              <h1 style={{
                fontSize: '36px',
                fontWeight: '800',
                lineHeight: '1.1',
                letterSpacing: '-0.03em',
                color: '#ffffff',
                textTransform: 'uppercase'
              }}>
                Post<br />Review
              </h1>
              <span style={{
                border: '1px solid rgba(255, 255, 255, 0.25)',
                borderRadius: '999px',
                padding: '4px 12px',
                fontSize: '10px',
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
            <div style={{ fontSize: '13px', color: '#88888b', fontWeight: '500' }}>
              Project: <span style={{ color: '#ffffff' }}>{post.projects?.name || 'General'}</span>
            </div>
          </div>
          <div style={{
            fontSize: '14px',
            lineHeight: '1.6',
            color: '#a1a1aa',
            maxWidth: '520px',
            alignSelf: 'end',
            borderLeft: '2px solid rgba(255, 255, 255, 0.1)',
            paddingLeft: '20px'
          }}>
            Inspect this social media post draft. Verify its branding, copy, and visual formatting before taking action.
          </div>
        </header>

        {/* Content Layout Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1.2fr 1fr',
          gap: '32px',
          alignItems: 'start'
        }}>
          
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
              <h3 style={{ fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(255,255,255,0.4)', marginBottom: '16px' }}>Caption Text</h3>
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
              <PostReviewActions post={post} />
            </div>

            {/* Premium Metrics Card */}
            <div style={glassCardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <span style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  color: 'rgba(255, 255, 255, 0.4)'
                }}>
                  Optimization Insights
                </span>
                <span style={{
                  fontSize: '11px',
                  color: '#f5a623',
                  background: 'rgba(245, 166, 35, 0.1)',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  fontWeight: '500'
                }}>
                  AI Assisted
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* 1. Expected Reach Widget */}
                <div style={{
                  padding: '16px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '14px',
                  border: '1px solid rgba(255, 255, 255, 0.05)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '13px', color: '#a1a1aa' }}>Expected Reach</span>
                    <span style={{ fontSize: '14px', fontWeight: '700', color: '#30a46c' }}>{reachText}</span>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '999px', overflow: 'hidden' }}>
                    <div style={{ width: '75%', height: '100%', background: 'linear-gradient(90deg, #30a46c, #a3e635)', borderRadius: '999px' }}></div>
                  </div>
                </div>

                {/* 2. Engagement Projection Widget */}
                <div style={{
                  padding: '16px',
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '14px',
                  border: '1px solid rgba(255, 255, 255, 0.05)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '13px', color: '#a1a1aa' }}>Engagement Index</span>
                    <span style={{ fontSize: '16px', fontWeight: '800', color: '#f5a623' }}>{engagementText}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#71717a' }}>Excellent platform alignment</div>
                </div>

                {/* 3. Recommendations list widget */}
                <div>
                  <div style={{ fontSize: '12px', color: '#a1a1aa', fontWeight: '500', marginBottom: '10px' }}>Optimization Suggestions</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 14px',
                      background: 'rgba(48, 164, 108, 0.05)',
                      borderRadius: '8px',
                      border: '1px solid rgba(48, 164, 108, 0.1)',
                      fontSize: '12px'
                    }}>
                      <span style={{ color: '#e4e4e7' }}>Add high-relevance tags</span>
                      <span style={{ color: '#30a46c', fontWeight: '600' }}>+3.5%</span>
                    </div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 14px',
                      background: 'rgba(245, 166, 35, 0.05)',
                      borderRadius: '8px',
                      border: '1px solid rgba(245, 166, 35, 0.1)',
                      fontSize: '12px'
                    }}>
                      <span style={{ color: '#e4e4e7' }}>Optimize post timing</span>
                      <span style={{ color: '#f5a623', fontWeight: '600' }}>+5.2%</span>
                    </div>
                  </div>
                </div>
              </div>
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
