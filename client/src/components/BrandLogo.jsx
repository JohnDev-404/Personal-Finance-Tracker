/**
 * FinTrack brand — inline SVG, no external files.
 *
 *   <BrandLogo size={44} />              // icon + wordmark
 *   <BrandLogo size={32} showText={false} />  // icon only (collapsed sidebar)
 */
export default function BrandLogo({ size = 40, showText = true, className = '' }) {
  // Wordmark scales proportionally to the icon
  const fontSize = Math.round(size * 0.72);
  const gap = Math.round(size * 0.28);

  return (
    <span
      className={`inline-flex items-center ${className}`}
      style={{ gap: `${gap}px` }}
    >
      {/* ============ ICON ============ */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        aria-hidden="true"
        style={{ flexShrink: 0 }}
      >
        {/* Dark rounded square background */}
        <rect
          x="1"
          y="1"
          width="46"
          height="46"
          rx="12"
          fill="#050a08"
          stroke="#0d9e6b"
          strokeWidth="1.5"
        />

        {/* Chart bars */}
        <rect x="11" y="28" width="5.5" height="10" rx="2" fill="#0d9e6b" />
        <rect x="20" y="22" width="5.5" height="16" rx="2" fill="#10b981" />
        <rect x="29" y="16" width="5.5" height="22" rx="2" fill="#34d399" />

        {/* Ascending trend line */}
        <path
          d="M10 24 L 20 16 L 26 20 L 36 10"
          stroke="#34d399"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />

        {/* End node */}
        <circle cx="36" cy="10" r="2.6" fill="#34d399" />
      </svg>

      {/* ============ WORDMARK ============ */}
      {showText && (
        <span
          className="font-display font-bold leading-none tracking-tight"
          style={{ fontSize: `${fontSize}px` }}
        >
          <span className="text-white">Fin</span>
          <span className="text-emerald-400">Track</span>
        </span>
      )}
    </span>
  );
}