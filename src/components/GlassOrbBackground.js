'use client';
import { useEffect, useRef } from 'react';

export default function GlassOrbBackground() {
  const containerRef = useRef(null);
  const sphereRef = useRef(null);
  const logoRef = useRef(null);

  useEffect(() => {
    // The 3D Glass Orb is hidden via CSS overlays, so we bypass registering the heavy mousemove event listener.
    // This dramatically reduces CPU repaints and ensures 120fps scrolling and hover responses across the site.
    return () => {};
  }, []);

  return (
    <div className="glass-bg-container">
      {/* Curved organic grid background */}
      <svg className="glass-grid-overlay" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="curved-grid" width="120" height="120" patternUnits="userSpaceOnUse">
            <path d="M 0 60 L 45 60" stroke="var(--grid-line-color)" strokeWidth="1" fill="none" />
            <path d="M 75 60 L 120 60" stroke="var(--grid-line-color)" strokeWidth="1" fill="none" />
            <path d="M 60 0 L 60 45" stroke="var(--grid-line-color)" strokeWidth="1" fill="none" />
            <path d="M 60 75 L 60 120" stroke="var(--grid-line-color)" strokeWidth="1" fill="none" />
            
            <path d="M 45 60 Q 60 60 60 45" stroke="var(--grid-line-color)" strokeWidth="1" fill="none" />
            <path d="M 75 60 Q 60 60 60 45" stroke="var(--grid-line-color)" strokeWidth="1" fill="none" />
            <path d="M 45 60 Q 60 60 60 75" stroke="var(--grid-line-color)" strokeWidth="1" fill="none" />
            <path d="M 75 60 Q 60 60 60 75" stroke="var(--grid-line-color)" strokeWidth="1" fill="none" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#curved-grid)" />
      </svg>

      {/* Floating Interactive 3D Glass Orb */}
      <div 
        ref={containerRef} 
        className="glass-orb-container"
        style={{
          transformStyle: 'preserve-3d',
          perspective: '1000px',
        }}
      >
        <div ref={sphereRef} className="glass-orb-sphere">
          <div ref={logoRef} className="glass-orb-logo-container">
            <span className="glass-orb-logo">{'//'}</span>
          </div>
        </div>
        <div className="glass-orb-glow" />
      </div>
    </div>
  );
}
