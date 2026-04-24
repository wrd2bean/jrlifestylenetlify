/**
 * Decorative dice + cards background. Absolute, non-interactive.
 * Pure SVG so it ships zero asset weight and scales perfectly.
 */
export function DecorBg({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    >
      {/* Dice — top right */}
      <svg
        viewBox="0 0 200 200"
        className="absolute -right-10 top-10 h-72 w-72 rotate-12 text-bone opacity-[0.06]"
        fill="currentColor"
      >
        <g transform="translate(20 20) rotate(-8 80 80)">
          <rect x="0" y="0" width="160" height="160" rx="22" stroke="currentColor" strokeWidth="6" fill="none" />
          <circle cx="40" cy="40" r="10" />
          <circle cx="120" cy="40" r="10" />
          <circle cx="80" cy="80" r="10" />
          <circle cx="40" cy="120" r="10" />
          <circle cx="120" cy="120" r="10" />
        </g>
      </svg>

      {/* Dice — bottom left */}
      <svg
        viewBox="0 0 200 200"
        className="absolute -left-12 bottom-10 h-64 w-64 -rotate-12 text-blood opacity-[0.08]"
        fill="currentColor"
      >
        <g transform="translate(20 20) rotate(14 80 80)">
          <rect x="0" y="0" width="160" height="160" rx="22" stroke="currentColor" strokeWidth="6" fill="none" />
          <circle cx="40" cy="40" r="10" />
          <circle cx="120" cy="120" r="10" />
          <circle cx="80" cy="80" r="10" />
        </g>
      </svg>

      {/* Playing card — center right, faint */}
      <svg
        viewBox="0 0 120 170"
        className="absolute right-1/4 top-1/3 h-56 w-40 rotate-[18deg] text-bone opacity-[0.05]"
        fill="currentColor"
      >
        <rect x="3" y="3" width="114" height="164" rx="10" stroke="currentColor" strokeWidth="3" fill="none" />
        <text x="14" y="32" fontFamily="serif" fontWeight="700" fontSize="24">A</text>
        <path d="M60 50 L80 90 L70 90 L70 110 L50 110 L50 90 L40 90 Z" />
        <text x="106" y="158" fontFamily="serif" fontWeight="700" fontSize="24" textAnchor="end" transform="rotate(180 106 152)">A</text>
      </svg>

      {/* Playing card — left, smaller */}
      <svg
        viewBox="0 0 120 170"
        className="absolute left-1/4 bottom-1/4 h-44 w-32 -rotate-[22deg] text-bone opacity-[0.04]"
        fill="currentColor"
      >
        <rect x="3" y="3" width="114" height="164" rx="10" stroke="currentColor" strokeWidth="3" fill="none" />
        <text x="14" y="32" fontFamily="serif" fontWeight="700" fontSize="22">K</text>
        <path d="M60 60 L74 76 L74 94 L60 110 L46 94 L46 76 Z" />
      </svg>

      {/* Sparkles */}
      <svg className="absolute right-20 top-1/2 h-8 w-8 text-bone opacity-30" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0 L13.5 10.5 L24 12 L13.5 13.5 L12 24 L10.5 13.5 L0 12 L10.5 10.5 Z" />
      </svg>
      <svg className="absolute left-1/3 top-20 h-5 w-5 text-bone opacity-30" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0 L13.5 10.5 L24 12 L13.5 13.5 L12 24 L10.5 13.5 L0 12 L10.5 10.5 Z" />
      </svg>
    </div>
  );
}