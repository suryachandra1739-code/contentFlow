export default function PlatformPreview({ platform, caption, hashtags, mediaUrl, mediaType, aspectRatio }) {
  const cleanCaption = (str) => {
    if (!str) return '';
    if (str.startsWith('Title: ')) {
      const doubleNewline = str.indexOf('\n\n');
      if (doubleNewline !== -1) {
        return str.substring(doubleNewline + 2);
      }
      const singleNewline = str.indexOf('\n');
      if (singleNewline !== -1) {
        return str.substring(singleNewline + 1);
      }
    }
    return str;
  };

  const hashtagList = hashtags ? hashtags.split(',').map(h => h.trim()) : [];
  const displayCaption = cleanCaption(caption);
  
  // Resolve the aspect ratio for the media container
  const getAspectRatio = () => {
    if (aspectRatio === 'portrait') return '9/16';
    if (aspectRatio === 'landscape') return '16/9';
    if (aspectRatio === 'square') return '1/1';
    if (aspectRatio === 'original') return 'auto';
    // Defaults per platform when no override is set
    if (platform === 'shorts') return '9/16';
    if (platform === 'facebook') return '1.91/1';
    return '1/1'; // instagram default
  };

  const resolvedAspect = getAspectRatio();
  const isAuto = resolvedAspect === 'auto';

  const renderMedia = () => {
    if (mediaUrl) {
      if (mediaType === 'video') {
        return (
          <video 
            src={mediaUrl} 
            controls 
            style={{
              width: '100%',
              height: isAuto ? 'auto' : '100%',
              objectFit: isAuto ? 'contain' : 'cover',
              display: 'block'
            }} 
          />
        );
      }
      return (
        <img 
          src={mediaUrl} 
          alt="Post media" 
          style={{
            width: '100%',
            height: isAuto ? 'auto' : '100%',
            objectFit: isAuto ? 'contain' : 'cover',
            display: 'block'
          }} 
        />
      );
    }
    const emojiMap = { instagram: '📷', facebook: '📘', shorts: '🎬' };
    return (
      <div style={{
        fontSize: 48,
        opacity: 0.2,
        height: isAuto ? 200 : '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%'
      }}>
        {emojiMap[platform] || '📷'}
      </div>
    );
  };

  // For YouTube Shorts preview layout
  if (platform === 'shorts') {
    return (
      <div className="preview-frame preview-frame-shorts">
        <div style={{
          position: 'relative',
          width: '100%',
          aspectRatio: resolvedAspect,
          background: '#111',
          overflow: 'hidden'
        }}>
          <div className="preview-media" style={{
            position: isAuto ? 'relative' : 'absolute',
            inset: isAuto ? 'auto' : 0,
            width: '100%',
            height: isAuto ? 'auto' : '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {renderMedia()}
          </div>
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '60px 16px 16px',
            background: 'linear-gradient(transparent, rgba(0,0,0,0.85))',
            zIndex: 2
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, color: '#fff' }}>@creator</div>
            <div style={{ fontSize: 13, lineHeight: 1.4, color: '#fff' }}>{displayCaption}</div>
            {hashtagList.length > 0 && (
              <div style={{ fontSize: 12, color: '#06b6d4', marginTop: 4 }}>
                {hashtagList.map(h => h.startsWith('#') ? h : `#${h}`).join(' ')}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // For Instagram/Facebook standard post feed layouts
  return (
    <div className={`preview-frame preview-frame-${platform}`}>
      <div className="preview-header">
        <div className="preview-avatar"></div>
        <div>
          <div className="preview-username">{platform === 'facebook' ? 'Brand Page' : '@brand_official'}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Just now</div>
        </div>
      </div>
      <div className="preview-media" style={{
        position: 'relative',
        aspectRatio: resolvedAspect,
        overflow: 'hidden',
        width: '100%',
        background: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {renderMedia()}
      </div>
      <div className="preview-caption">
        <div>{displayCaption}</div>
        {hashtagList.length > 0 && (
          <div className="preview-hashtags" style={{ marginTop: 8 }}>
            {hashtagList.map(h => h.startsWith('#') ? h : `#${h}`).join(' ')}
          </div>
        )}
      </div>
    </div>
  );
}

