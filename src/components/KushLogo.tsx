import { type SVGProps } from "react";

interface LogoProps extends SVGProps<SVGSVGElement> {
  variant?: "full" | "icon";
}

function LeafPath({ gradientId }: { gradientId: string }) {
  return (
    <g fill={`url(#${gradientId})`}>
      <path d="M24 6c-1.5 2.5-3.5 5-5 8-1.5 3-2 5.5-1 7.5s3 3.5 6 4.5V6z" />
      <path d="M24 6c1.5 2.5 3.5 5 5 8 1.5 3 2 5.5 1 7.5s-3 3.5-6 4.5V6z" />
      <path d="M19 14c-3 1-5.5 2.5-6 4s1.5 2 4 1 2.5-3 2-5z" />
      <path d="M29 14c3 1 5.5 2.5 6 4s-1.5 2-4 1-2.5-3-2-5z" />
      <path d="M16 20c-3.5 0-5.5 1-5.5 2.5s2 1.5 4.5 0.5 2-2 1-3z" />
      <path d="M32 20c3.5 0 5.5 1 5.5 2.5s-2 1.5-4.5 0.5-2-2-1-3z" />
      <path d="M21 25c-2 0.5-3.5 1.5-3 2.5s2.5 0.5 3.5-0.5 0.5-1.5-0.5-2z" />
      <path d="M27 25c2 0.5 3.5 1.5 3 2.5s-2.5 0.5-3.5-0.5-0.5-1.5 0.5-2z" />
      <rect x="23" y="24" width="2" height="8" rx="1" fill="#166534" />
    </g>
  );
}

function Sparkle({ cx, cy, scale = 1 }: { cx: number; cy: number; scale?: number }) {
  return (
    <g transform={`translate(${cx}, ${cy}) scale(${scale})`}>
      <path d="M0-6 L1-1 L6 0 L1 1 L0 6 L-1 1 L-6 0 L-1-1 Z" fill="#a3e635" opacity="0.6">
        <animate attributeName="opacity" values="0.6;0.2;0.6" dur="2s" repeatCount="indefinite" />
      </path>
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
    <svg viewBox="0 0 400 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <defs>
        <linearGradient id="bannerBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#022c22" />
          <stop offset="50%" stopColor="#065f46" />
          <stop offset="100%" stopColor="#022c22" />
        </linearGradient>
        <linearGradient id="leafGrad" x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="#4ade80" />
          <stop offset="100%" stopColor="#16a34a" />
        </linearGradient>
        <linearGradient id="kushTextGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#86efac" />
        </linearGradient>
        <linearGradient id="cloudTextGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#a3e635" />
          <stop offset="100%" stopColor="#4ade80" />
        </linearGradient>
        <filter id="titleGlow">
          <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#a3e635" floodOpacity="0.5" />
        </filter>
        <filter id="textGlow">
          <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#22c55e" floodOpacity="0.4" />
        </filter>
        <radialGradient id="backGlow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="rgba(52,211,153,0.12)" />
          <stop offset="100%" stopColor="rgba(52,211,153,0)" />
        </radialGradient>
      </defs>

      <rect x="4" y="4" width="392" height="92" rx="16" fill="url(#bannerBg)" stroke="rgba(52,211,153,0.25)" strokeWidth="1.5" />
      <rect x="4" y="4" width="392" height="92" rx="16" fill="url(#backGlow)" />

      <line x1="20" y1="12" x2="380" y2="12" stroke="rgba(74,222,128,0.15)" strokeWidth="1" />
      <line x1="20" y1="88" x2="380" y2="88" stroke="rgba(74,222,128,0.15)" strokeWidth="1" />

      <Sparkle cx={42} cy={22} scale={0.7} />
      <Sparkle cx={360} cy={78} scale={0.6} />
      <Sparkle cx={370} cy={22} scale={0.5} />

      <g transform="translate(4, 6) scale(1.1)">
        <LeafPath gradientId="leafGrad" />
      </g>

      <text x="130" y="40" fontFamily="'Bangers', system-ui, sans-serif" fontSize="28" fontWeight="400" fill="url(#kushTextGrad)" letterSpacing="5" filter="url(#textGlow)">
        KUSH
      </text>

      <text x="130" y="68" fontFamily="'Bangers', system-ui, sans-serif" fontSize="28" fontWeight="400" fill="url(#cloudTextGrad)" letterSpacing="8" filter="url(#titleGlow)">
        CLOUD
      </text>

      <g opacity="0.4">
        <rect x="98" y="34" width="5" height="5" rx="1" fill="#4ade80" transform="rotate(45 100 36)" />
        <rect x="98" y="60" width="5" height="5" rx="1" fill="#4ade80" transform="rotate(45 100 62)" />
      </g>

      <g opacity="0.15" transform="translate(350, 48) scale(0.5)">
        <LeafPath gradientId="leafGrad" />
      </g>
      <g opacity="0.10" transform="translate(370, 60) scale(0.35)">
        <LeafPath gradientId="leafGrad" />
      </g>

      <circle cx="324" cy="30" r="2" fill="#4ade80" opacity="0.5" />
      <circle cx="334" cy="26" r="1.5" fill="#86efac" opacity="0.4" />
      <circle cx="344" cy="32" r="2.5" fill="#22c55e" opacity="0.3" />
      <circle cx="330" cy="70" r="1.5" fill="#4ade80" opacity="0.4" />
      <circle cx="342" cy="68" r="2" fill="#86efac" opacity="0.3" />
    </svg>
  );
}
