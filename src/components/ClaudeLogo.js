'use client';

/**
 * ContentFlow Custom Brand Logo Component.
 * An ultra-modern, minimalist geometric abstract emblem representing "ContentFlow" (C and F).
 * Styled with overlapping golden-orange gradients in a clean, professional rounded container.
 */
export default function ClaudeLogo({ size = 36, style = {} }) {
  return (
    <div
      className="logo-container"
      style={{
        width: size,
        height: size,
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        position: 'relative',
        background: 'linear-gradient(135deg, rgba(224, 92, 54, 0.12) 0%, rgba(224, 92, 54, 0.04) 100%)',
        border: '1px solid rgba(224, 92, 54, 0.25)',
        boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        ...style
      }}
    >
      <svg
        viewBox="0 0 100 100"
        width={size * 0.55}
        height={size * 0.55}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: 'block', overflow: 'visible' }}
      >
        <defs>
          <linearGradient id="cf-grad-minimal" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f97316" />
            <stop offset="100%" stopColor="#e05c36" />
          </linearGradient>
        </defs>
        
        {/* Sleek interlinking curves representing Content & Flow */}
        <path
          d="M 32 36 
             C 32 24, 48 18, 64 26 
             C 80 34, 80 50, 64 58 
             C 48 66, 32 66, 24 50"
          stroke="url(#cf-grad-minimal)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        <path
          d="M 40 76 
             C 52 84, 68 84, 76 70 
             C 84 56, 80 44, 66 38"
          stroke="url(#cf-grad-minimal)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.75"
        />
        
        {/* Bright luminous focal point */}
        <circle cx="64" cy="42" r="5" fill="#ffffff" />
      </svg>
    </div>
  );
}
