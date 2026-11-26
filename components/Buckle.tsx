// The nav's logo: a plain satin-nickel buckle on the belt. The frame is open on the right,
// with a short prong on its left bar, and a metal keeper bar wraps the belt beside it. Both
// are as tall as the belt and the inside is left empty, so the real belt shows through
// rather than a drawing of one.
//
// Drawn in belt pixels: the viewBox is as tall as the nav (54), and the SVG is scaled to
// the nav's height.

export const BUCKLE_H = 54;

export function Buckle({ className }: { className?: string }) {
  // The frame's three bars, as one stroke with rounded ends.
  const frame = "M50 3.2 H10.5 Q6.2 3.2 6.2 7.5 V46.5 Q6.2 50.8 10.5 50.8 H50";
  return (
    <svg className={className} viewBox={`0 0 73 ${BUCKLE_H}`} aria-hidden="true" focusable="false">
      <defs>
        {/* Satin nickel, lit from above. */}
        <linearGradient id="bk-bar" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2={BUCKLE_H}>
          <stop offset="0" stopColor="#e6e3dc" />
          <stop offset=".1" stopColor="#c9c5bd" />
          <stop offset=".5" stopColor="#b7b3aa" />
          <stop offset=".9" stopColor="#a29e95" />
          <stop offset="1" stopColor="#8d897f" />
        </linearGradient>
        <linearGradient id="bk-side" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#ddd9d1" />
          <stop offset=".45" stopColor="#c4c0b7" />
          <stop offset="1" stopColor="#97938a" />
        </linearGradient>
        <linearGradient id="bk-pin" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ece9e3" />
          <stop offset=".55" stopColor="#bdb9b0" />
          <stop offset="1" stopColor="#8f8b82" />
        </linearGradient>
        <linearGradient id="bk-glint" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset=".5" stopColor="#fff" stopOpacity=".9" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        {/* The metal parts only, so the glint never lights up the belt. */}
        <mask id="bk-metal">
          <path d={frame} fill="none" stroke="#fff" strokeWidth="5.6" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="7.5" y="24" width="10" height="6" rx="3" fill="#fff" />
          <rect x="62" y="0.6" width="9" height={BUCKLE_H - 1.2} rx="2" fill="#fff" />
        </mask>
      </defs>

      {/* Frame: the bar, a soft dark edge under it, and a thin sheen along its top face. */}
      <path d={frame} fill="none" stroke="rgba(60,50,40,.35)" strokeWidth="6.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d={frame} fill="none" stroke="url(#bk-bar)" strokeWidth="5.6" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M48.5 2.2 H10.5 Q5.2 2.2 5.2 7.5 V46.5"
        fill="none"
        stroke="rgba(255,255,255,.55)"
        strokeWidth=".8"
        strokeLinecap="round"
      />

      {/* The prong: a short rounded pin on the left bar. */}
      <rect x="7.5" y="24" width="10" height="6" rx="3" fill="url(#bk-pin)" stroke="rgba(60,50,40,.35)" strokeWidth=".5" />

      {/* The keeper: a metal bar wrapped around the belt. */}
      <rect x="62" y="0.6" width="9" height={BUCKLE_H - 1.2} rx="2" fill="url(#bk-side)" stroke="rgba(60,50,40,.35)" strokeWidth=".6" />
      <rect x="63.2" y="1.6" width="1.2" height={BUCKLE_H - 3.2} rx=".6" fill="rgba(255,255,255,.45)" />

      {/* A glint, swept across the metal on hover (see .mark in page.module.css). */}
      <g mask="url(#bk-metal)">
        <rect data-glint="" x="-14" y="-6" width="14" height={BUCKLE_H + 12} fill="url(#bk-glint)" />
      </g>
    </svg>
  );
}
