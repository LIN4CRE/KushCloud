import { type SVGProps } from "react";

interface LogoProps extends SVGProps<SVGSVGElement> {
  variant?: "full" | "icon";
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
        <path d="M24 14c-2 3-3.5 6-3 9s2 5 3 6c1-1 2.5-3 3-6s-1-6-3-9z" fill="url(#leafGradIcon)" />
        <path d="M21 18c-3 0-5 2-5 3s2 1 4 0 2-2 1-3z" fill="url(#leafGradIcon)" />
        <path d="M27 18c3 0 5 2 5 3s-2 1-4 0-2-2-1-3z" fill="url(#leafGradIcon)" />
        <path d="M20 22c-3 1-4 3-3 3s3 0 4-1 1-2-1-2z" fill="url(#leafGradIcon)" />
        <path d="M28 22c3 1 4 3 3 3s-3 0-4-1-1-2 1-2z" fill="url(#leafGradIcon)" />
        <circle cx="24" cy="24" r="3" fill="#a3e635" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 200 60" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <defs>
        <linearGradient id="leafGrad1" x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stopColor="#4ade80" />
          <stop offset="100%" stopColor="#22c55e" />
        </linearGradient>
        <linearGradient id="cloudGrad1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.15)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.05)" />
        </linearGradient>
        <filter id="cloudGlow">
          <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#a3e635" floodOpacity="0.5" />
        </filter>
      </defs>
      <ellipse cx="38" cy="35" rx="28" ry="10" fill="url(#cloudGrad1)" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
      <ellipse cx="32" cy="30" rx="14" ry="8" fill="url(#cloudGrad1)" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
      <ellipse cx="44" cy="32" rx="12" ry="7" fill="url(#cloudGrad1)" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
      <path d="M28 24l-2 4-4 1 3 3-1 4 4-2 4 2-1-4 3-3-4-1-2-4z" fill="url(#leafGrad1)" opacity="0.9" />
      <path d="M34 22l-2 3-3 1 2 2-1 3 3-1 3 1-1-3 2-2-3-1-2-3z" fill="url(#leafGrad1)" opacity="0.7" />
      <path d="M30 28l-1 2-2 1 1 1-1 2 2-1 2 1-1-2 1-1-2-1-1-2z" fill="#a3e635" opacity="0.9" />
      <text x="68" y="38" fontFamily="system-ui, -apple-system, sans-serif" fontSize="22" fontWeight="700" fill="white" letterSpacing="3">KUSH</text>
      <text x="68" y="38" fontFamily="system-ui, -apple-system, sans-serif" fontSize="22" fontWeight="700" fill="#a3e635" letterSpacing="3" opacity="0.9" filter="url(#cloudGlow)">
        <tspan dx="54">CLOUD</tspan>
      </text>
    </svg>
  );
}
