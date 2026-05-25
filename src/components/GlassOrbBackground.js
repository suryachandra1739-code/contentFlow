'use client';

export default function GlassOrbBackground() {
  return (
    <div className="glass-bg-container">
      {/* 
        Beautiful, diffusing, organic ambient light sources.
        By placing these deep in the full-screen background layer (z-index: -1),
        we prevent any layout overflow clipping, ensuring they look perfectly natural 
        like atmospheric light beams drifting behind the grid.
      */}
      <div className="ambient-glow-1" />
      <div className="ambient-glow-2" />
      
      {/* CSS-based continuous grid background */}
      <div className="glass-grid-overlay" />
    </div>
  );
}
