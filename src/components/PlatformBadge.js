export default function PlatformBadge({ platform }) {
  const normPlatform = platform?.toLowerCase();

  const logos = {
    instagram: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ display: 'block' }}>
        <defs>
          <linearGradient id="ig-grad" x1="12%" y1="128%" x2="88%" y2="-28%">
            <stop offset="0%" stopColor="#f09433" />
            <stop offset="25%" stopColor="#e6683c" />
            <stop offset="50%" stopColor="#dc2743" />
            <stop offset="75%" stopColor="#cc2366" />
            <stop offset="100%" stopColor="#bc1888" />
          </linearGradient>
        </defs>
        <rect x="2" y="2" width="20" height="20" rx="5" fill="url(#ig-grad)" />
        <rect x="5" y="5" width="14" height="14" rx="3.5" stroke="white" strokeWidth="1.8" />
        <circle cx="12" cy="12" r="3" stroke="white" strokeWidth="1.8" />
        <circle cx="16.5" cy="7.5" r="1" fill="white" />
      </svg>
    ),
    facebook: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ display: 'block' }}>
        <circle cx="12" cy="12" r="10" fill="#1877F2" />
        <path d="M14 12.5H12.2V18H9.9v-5.5H8.7v-2H9.9V9.1c0-1.7 1-2.6 2.6-2.6.8 0 1.5.1 1.7.1v2h-1.2c-.8 0-1 .4-1 1V10.5h2.2l-.2 2z" fill="white" />
      </svg>
    ),
    shorts: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ display: 'block' }}>
        <rect x="2" y="2" width="20" height="20" rx="5" fill="#FF0000" />
        <path d="M17.77 10.32c-.77-.44-1.2-.44-1.2-.44l.88-.53A2.85 2.85 0 0 0 16.2 5.3a2.75 2.75 0 0 0-3.69 1l-3.37 5.72s-.41.72-.41.72l-.88.53a2.85 2.85 0 0 0 1.25 4.06c1.3.75 3 .29 3.69-1l3.37-5.72s.41-.72.41-.72l.21-.27z" fill="white" />
        <path d="M10.5 9v6l4.5-3-4.5-3z" fill="#FF0000" />
      </svg>
    ),
    linkedin: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ display: 'block' }}>
        <rect x="2" y="2" width="20" height="20" rx="3" fill="#0A66C2" />
        <path d="M8.5 10.5v5M8.5 8v.01M11 15.5v-3c0-1.1.9-2 2-2s2 .9 2 2v3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    youtube: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ display: 'block' }}>
        <rect x="2" y="4.5" width="20" height="15" rx="4" fill="#FF0000" />
        <path d="M10 9v6l5-3-5-3z" fill="white" />
      </svg>
    )
  };

  return (
    <span
      className={`platform-badge platform-${normPlatform}`}
      style={{
        padding: '3px',
        borderRadius: '6px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'transparent',
        border: 'none',
        verticalAlign: 'middle'
      }}
      title={platform}
    >
      {logos[normPlatform] || <span>{platform}</span>}
    </span>
  );
}

