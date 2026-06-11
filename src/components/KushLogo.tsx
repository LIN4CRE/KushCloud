import { type SVGProps } from "react";

interface LogoProps extends SVGProps<SVGSVGElement> {
  variant?: "full" | "icon";
}

function LeafPath({ gradientId }: { gradientId: string }) {
  return (
    <g fill={`url(#${gradientId})`}>
      {/* Main leaf - symmetrical cannabis leaf shape with 7 leaflets */}
      <path d="M24 6c-1.5 2.5-3.5 5-5 8-1.5 3-2 5.5-1 7.5s3 3.5 6 4.5V6z" />
      <path d="M24 6c1.5 2.5 3.5 5 5 8 1.5 3 2 5.5 1 7.5s-3 3.5-6 4.5V6z" />
      {/* Left side leaflets */}
      <path d="M19 14c-3 1-5.5 2.5-6 4s1.5 2 4 1 2.5-3 2-5z" />
      <path d="M29 14c3 1 5.5 2.5 6 4s-1.5 2-4 1-2.5-3-2-5z" />
      <path d="M16 20c-3.5 0-5.5 1-5.5 2.5s2 1.5 4.5 0.5 2-2 1-3z" />
      <path d="M32 20c3.5 0 5.5 1 5.5 2.5s-2 1.5-4.5 0.5-2-2-1-3z" />
      {/* Top leaflets */}
      <path d="M21 25c-2 0.5-3.5 1.5-3 2.5s2.5 0.5 3.5-0.5 0.5-1.5-0.5-2z" />
      <path d="M27 25c2 0.5 3.5 1.5 3 2.5s-2.5 0.5-3.5-0.5-0.5-1.5 0.5-2z" />
      {/* Stem */}
      <rect x="23" y="24" width="2" height="8" rx="1" fill="#166534" />
    </g>
  );
}

export function KushLogo({ variant = "full", ...props }: LogoProps) {
  if (variant === "icon") {
    return (
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
        <defs>
          <linearGradient id="leafGradIcon" x1="0.5" y1="0" x2="0.5" y2="1">
            <stop offset="0%" stopColor="#4ade80" />
            <stop offset="100%" stopColor="#22c55e" />
          </linearGradient>
        </defs>
        <circle cx="24" cy="24" r="22" fill="#022c22" stroke="#22c55e" strokeWidth="1.5" />
        <LeafPath gradientId="leafGradIcon" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 240 60" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <defs>
        <linearGradient id="leafGrad" x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="#4ade80" />
          <stop offset="100%" stopColor="#22c55e" />
        </linearGradient>
        <linearGradient id="cloudShine" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.18)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.04)" />
        </linearGradient>
        <filter id="glow">
          <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#a3e635" floodOpacity="0.6" />
        </filter>
      </defs>
      {/* Cloud backdrop */}
      <ellipse cx="40" cy="34" rx="30" ry="11" fill="url(#cloudShine)" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
      <ellipse cx="32" cy="29" rx="16" ry="9" fill="url(#cloudShine)" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
      <ellipse cx="48" cy="31" rx="13" ry="8" fill="url(#cloudShine)" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
      {/* Leaf icon */}
      <g transform="translate(-6, 2) scale(0.85)">
        <LeafPath gradientId="leafGrad" />
      </g>
      {/* KUSH text */}
      <text x="77" y="29" fontFamily="system-ui, -apple-system, sans-serif" fontSize="20" fontWeight="800" fill="white" letterSpacing="4">KUSH</text>
      {/* CLOUD text with emerald glow */}
      <text x="77" y="47" fontFamily="system-ui, -apple-system, sans-serif" fontSize="20" fontWeight="800" fill="#a3e635" letterSpacing="6" filter="url(#glow)">CLOUD</text>
    </svg>
  );
}
