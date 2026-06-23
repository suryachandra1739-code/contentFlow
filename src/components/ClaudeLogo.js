'use client';

/**
 * FLOW Brand Logo Component.
 * Renders the FLOW logo image with configurable size.
 */
export default function ClaudeLogo({ size = 36, style = {} }) {
  return (
    <img
      src="/logo.jpg"
      alt="FLOW"
      style={{
        width: size,
        height: size,
        borderRadius: '8px',
        objectFit: 'contain',
        flexShrink: 0,
        ...style
      }}
    />
  );
}
