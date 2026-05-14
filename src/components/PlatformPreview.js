export default function PlatformPreview({ platform, caption, hashtags, mediaUrl, mediaType }) {
  const hashtagList = hashtags ? hashtags.split(',').map(h => h.trim()) : [];
  const renderMedia = () => {
    if (mediaUrl) {
      if (mediaType === 'video') return <video src={mediaUrl} controls style={{width:'100%',height:'100%',objectFit:'cover'}} />;
      return <img src={mediaUrl} alt="Post media" style={{width:'100%',height:'100%',objectFit:'cover'}} />;
    }
    return <div style={{fontSize:48,opacity:0.2}}>{ {instagram:'📷',facebook:'📘',shorts:'🎬'}[platform] }</div>;
  };

  if (platform === 'shorts') {
    return (
      <div className="preview-frame preview-frame-shorts">
        <div style={{position:'relative',width:'100%',height:'100%',minHeight:400,background:'#111'}}>
          <div className="preview-media" style={{position:'absolute',inset:0}}>{renderMedia()}</div>
          <div style={{position:'absolute',bottom:0,left:0,right:0,padding:'60px 16px 16px',background:'linear-gradient(transparent,rgba(0,0,0,0.8))'}}>
            <div style={{fontSize:13,fontWeight:600,marginBottom:4}}>@creator</div>
            <div style={{fontSize:13,lineHeight:1.4}}>{caption}</div>
            {hashtagList.length > 0 && <div style={{fontSize:12,color:'#06b6d4',marginTop:4}}>{hashtagList.map(h => h.startsWith('#') ? h : `#${h}`).join(' ')}</div>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`preview-frame preview-frame-${platform}`}>
      <div className="preview-header">
        <div className="preview-avatar"></div>
        <div>
          <div className="preview-username">{platform === 'facebook' ? 'Brand Page' : '@brand_official'}</div>
          <div style={{fontSize:11,color:'var(--text-muted)'}}>Just now</div>
        </div>
      </div>
      <div className="preview-media" style={platform === 'instagram' ? {aspectRatio:'1/1'} : {aspectRatio:'1.91/1'}}>
        {renderMedia()}
      </div>
      <div className="preview-caption">
        <div>{caption}</div>
        {hashtagList.length > 0 && (
          <div className="preview-hashtags" style={{marginTop:8}}>
            {hashtagList.map(h => h.startsWith('#') ? h : `#${h}`).join(' ')}
          </div>
        )}
      </div>
    </div>
  );
}
