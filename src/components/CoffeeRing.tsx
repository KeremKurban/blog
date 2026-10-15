/**
 * A faint coffee-cup ring, the homepage's one decorative mark.
 * Drawn as two displaced strokes so the edge pools unevenly like a real stain.
 */
export function CoffeeRing({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 400" className={className} aria-hidden="true" focusable="false">
      <defs>
        <filter id="stain" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="3" seed="7" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="16" />
          <feGaussianBlur stdDeviation="0.9" />
        </filter>
        <filter id="pool" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="2" seed="3" result="grain" />
          <feDisplacementMap in="SourceGraphic" in2="grain" scale="6" />
          <feGaussianBlur stdDeviation="2.4" />
        </filter>
      </defs>
      <g filter="url(#stain)" fill="none" stroke="#e3ab6a">
        <circle cx="200" cy="200" r="150" strokeWidth="5" strokeOpacity="0.22" />
        <circle cx="203" cy="198" r="146" strokeWidth="1.5" strokeOpacity="0.16" />
      </g>
      <path
        d="M 82 268 A 150 150 0 0 0 296 330"
        filter="url(#pool)"
        fill="none"
        stroke="#b4793e"
        strokeWidth="12"
        strokeOpacity="0.14"
        strokeLinecap="round"
      />
    </svg>
  );
}
