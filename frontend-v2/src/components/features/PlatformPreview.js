/* Platform-specific post preview component */
export default function PlatformPreview({ platform, caption, hashtags, mediaUrl, mediaType, aspectRatio }) {
  const cleanCaption = (str) => {
    if (!str) return '';
    if (str.startsWith('Title: ')) {
      const nl2 = str.indexOf('\n\n');
      if (nl2 !== -1) return str.substring(nl2 + 2);
      const nl = str.indexOf('\n');
      if (nl !== -1) return str.substring(nl + 1);
    }
    return str;
  };

  const tags = hashtags ? hashtags.split(',').map(h => h.trim()).filter(Boolean) : [];
  const displayCaption = cleanCaption(caption);

  const getAspect = () => {
    if (aspectRatio === 'portrait')  return '9/16';
    if (aspectRatio === 'landscape') return '16/9';
    if (aspectRatio === 'square')    return '1/1';
    if (aspectRatio === 'original')  return 'auto';
    if (platform === 'shorts')    return '9/16';
    if (platform === 'facebook')  return '1.91/1';
    if (platform === 'linkedin')  return '1.91/1';
    if (platform === 'youtube')   return '16/9';
    return '1/1';
  };

  const aspect = getAspect();
  const isAuto = aspect === 'auto';

  const renderMedia = () => {
    if (!mediaUrl) {
      return (
        <div style={{
          width: '100%',
          height: isAuto ? 200 : '100%',
          background: 'linear-gradient(135deg, var(--bg-4) 0%, var(--bg-3) 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: 'var(--text-3)',
        }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
          </svg>
        </div>
      );
    }
    const style = { width: '100%', height: isAuto ? 'auto' : '100%', objectFit: isAuto ? 'contain' : 'cover', display: 'block' };
    return mediaType === 'video'
      ? <video src={mediaUrl} controls style={style} />
      : <img src={mediaUrl} alt="Preview" style={style} />;
  };

  // Instagram mock
  if (platform === 'instagram') {
    return (
      <div className="platform-preview-frame" style={{ maxWidth: 320 }}>
        <div style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)' }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-0)' }}>your_brand</div>
            <div style={{ fontSize: 11, color: 'var(--text-2)' }}>Sponsored</div>
          </div>
          <div style={{ marginLeft: 'auto', color: 'var(--text-3)' }}>···</div>
        </div>
        <div style={{ aspectRatio: aspect === 'auto' ? '1/1' : aspect, overflow: 'hidden' }}>
          {renderMedia()}
        </div>
        <div style={{ padding: '10px 12px' }}>
          <div style={{ display: 'flex', gap: 14, marginBottom: 8, color: 'var(--text-0)' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </div>
          {displayCaption && (
            <div style={{ fontSize: 13, color: 'var(--text-0)', lineHeight: 1.4, marginBottom: 6 }}>
              <strong>your_brand</strong> {displayCaption.slice(0, 120)}{displayCaption.length > 120 ? '…' : ''}
            </div>
          )}
          {tags.length > 0 && (
            <div style={{ fontSize: 12, color: '#4f8ef7' }}>{tags.slice(0, 5).join(' ')}</div>
          )}
        </div>
      </div>
    );
  }

  // YouTube / Shorts mock
  if (platform === 'youtube' || platform === 'shorts') {
    const isShort = platform === 'shorts';
    return (
      <div className="platform-preview-frame" style={{ maxWidth: isShort ? 220 : 320 }}>
        <div style={{ aspectRatio: isShort ? '9/16' : '16/9', overflow: 'hidden', position: 'relative', background: '#000' }}>
          {renderMedia()}
          <div style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: 11, padding: '2px 6px', borderRadius: 3 }}>0:30</div>
        </div>
        <div style={{ padding: '10px 12px', display: 'flex', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#ff0000', flexShrink: 0 }} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-0)', lineHeight: 1.3, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
              {displayCaption || 'Your video title here'}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-2)', marginTop: 4 }}>Your Channel · 1K views</div>
          </div>
        </div>
      </div>
    );
  }

  // Facebook mock
  if (platform === 'facebook') {
    return (
      <div className="platform-preview-frame" style={{ maxWidth: 320 }}>
        <div style={{ padding: '12px 14px', display: 'flex', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#4267b2', flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-0)' }}>Your Page</div>
            <div style={{ fontSize: 11, color: 'var(--text-2)' }}>Just now · 🌍</div>
          </div>
        </div>
        {displayCaption && (
          <div style={{ padding: '0 14px 12px', fontSize: 14, color: 'var(--text-0)', lineHeight: 1.5 }}>
            {displayCaption.slice(0, 160)}{displayCaption.length > 160 ? '…' : ''}
          </div>
        )}
        <div style={{ aspectRatio: '1.91/1', overflow: 'hidden' }}>{renderMedia()}</div>
        <div style={{ padding: '8px 14px', display: 'flex', gap: 20, borderTop: '1px solid var(--border-1)', marginTop: 8 }}>
          {['👍 Like', '💬 Comment', '↗ Share'].map(a => (
            <span key={a} style={{ fontSize: 13, color: 'var(--text-2)', fontWeight: 600 }}>{a}</span>
          ))}
        </div>
      </div>
    );
  }

  // LinkedIn / Twitter / Default mock
  return (
    <div className="platform-preview-frame" style={{ maxWidth: 320 }}>
      <div style={{ padding: '12px 14px', display: 'flex', gap: 10 }}>
        <div style={{ width: 40, height: 40, borderRadius: platform === 'twitter' ? '50%' : 'var(--r-sm)', background: platform === 'linkedin' ? '#0077b5' : '#1da1f2', flexShrink: 0 }} />
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-0)' }}>Your Brand</div>
          <div style={{ fontSize: 11, color: 'var(--text-2)' }}>@yourbrand</div>
        </div>
      </div>
      {displayCaption && (
        <div style={{ padding: '0 14px 12px', fontSize: 14, color: 'var(--text-0)', lineHeight: 1.5 }}>
          {displayCaption.slice(0, 280)}{displayCaption.length > 280 ? '…' : ''}
        </div>
      )}
      {tags.length > 0 && (
        <div style={{ padding: '0 14px 12px', fontSize: 13, color: platform === 'linkedin' ? '#0077b5' : '#1da1f2' }}>
          {tags.slice(0, 5).join(' ')}
        </div>
      )}
      {mediaUrl && (
        <div style={{ margin: '0 14px 12px', borderRadius: 'var(--r-md)', overflow: 'hidden', aspectRatio: aspect === 'auto' ? '16/9' : aspect }}>
          {renderMedia()}
        </div>
      )}
    </div>
  );
}
