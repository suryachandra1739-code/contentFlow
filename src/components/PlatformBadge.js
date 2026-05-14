export default function PlatformBadge({ platform }) {
  const icons = { instagram: '📷', facebook: '📘', shorts: '🎬' };
  const labels = { instagram: 'Instagram', facebook: 'Facebook', shorts: 'Shorts' };
  return (
    <span className={`platform-badge platform-${platform}`}>
      {icons[platform]} {labels[platform]}
    </span>
  );
}
