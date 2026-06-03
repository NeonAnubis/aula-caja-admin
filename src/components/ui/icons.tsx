import * as React from "react";

const Svg = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  />
);

export const ArrowRight = (p: React.SVGProps<SVGSVGElement>) => (
  <Svg {...p}><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></Svg>
);
export const Mail = (p: React.SVGProps<SVGSVGElement>) => (
  <Svg {...p}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></Svg>
);
export const Lock = (p: React.SVGProps<SVGSVGElement>) => (
  <Svg {...p}><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></Svg>
);
export const User = (p: React.SVGProps<SVGSVGElement>) => (
  <Svg {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></Svg>
);
export const Shield = (p: React.SVGProps<SVGSVGElement>) => (
  <Svg {...p}><path d="M12 3 4 6v6c0 5 3.5 8.5 8 9 4.5-.5 8-4 8-9V6l-8-3Z" /><path d="m9 12 2 2 4-4" /></Svg>
);
export const Zap = (p: React.SVGProps<SVGSVGElement>) => (
  <Svg {...p}><path d="M13 2 3 14h8l-1 8 10-12h-8l1-8Z" /></Svg>
);
export const Layout = (p: React.SVGProps<SVGSVGElement>) => (
  <Svg {...p}><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18" /><path d="M9 9v12" /></Svg>
);
export const Sparkles = (p: React.SVGProps<SVGSVGElement>) => (
  <Svg {...p}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6.5 6.5l2.5 2.5M15 15l2.5 2.5M17.5 6.5 15 9M9 15l-2.5 2.5" /></Svg>
);
export const Check = (p: React.SVGProps<SVGSVGElement>) => (
  <Svg {...p}><path d="m5 12 5 5 9-12" /></Svg>
);
export const Google = (p: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...p}>
    <path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.9h5.4a4.6 4.6 0 0 1-2 3v2.5h3.3c1.9-1.8 3-4.4 3-7.4Z"/>
    <path fill="#34A853" d="M12 22c2.7 0 5-.9 6.7-2.4l-3.3-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3v2.6A10 10 0 0 0 12 22Z"/>
    <path fill="#FBBC05" d="M6.4 14a6 6 0 0 1 0-3.9V7.5H3a10 10 0 0 0 0 9.1L6.4 14Z"/>
    <path fill="#EA4335" d="M12 5.9c1.5 0 2.8.5 3.8 1.5l2.9-2.9A10 10 0 0 0 3 7.5l3.4 2.6c.8-2.4 3-4.2 5.6-4.2Z"/>
  </svg>
);
export const Github = (p: React.SVGProps<SVGSVGElement>) => (
  <Svg {...p}><path d="M9 19c-4.3 1.4-4.3-2.5-6-3m12 5v-3.5a3 3 0 0 0-1-2.3c3.3-.4 6.5-1.6 6.5-7a5.4 5.4 0 0 0-1.5-3.8 5 5 0 0 0-.1-3.8s-1.2-.4-4 1.5a13.4 13.4 0 0 0-7 0c-2.8-1.9-4-1.5-4-1.5a5 5 0 0 0-.1 3.8 5.4 5.4 0 0 0-1.5 3.8c0 5.3 3.2 6.6 6.5 7a3 3 0 0 0-.9 2.3V21" /></Svg>
);
export const Eye = (p: React.SVGProps<SVGSVGElement>) => (
  <Svg {...p}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" /><circle cx="12" cy="12" r="3" /></Svg>
);
export const EyeOff = (p: React.SVGProps<SVGSVGElement>) => (
  <Svg {...p}><path d="M9.9 4.2a10 10 0 0 1 12.1 7.8 17 17 0 0 1-2.4 3.7M6.6 6.6A17 17 0 0 0 2 12s4 8 11 8a10 10 0 0 0 5.4-1.6"/><path d="m1 1 22 22"/><path d="M9 9a3 3 0 0 0 4.2 4.2"/></Svg>
);
export const LogOut = (p: React.SVGProps<SVGSVGElement>) => (
  <Svg {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5" /><path d="M21 12H9" /></Svg>
);
export const Sun = (p: React.SVGProps<SVGSVGElement>) => (
  <Svg {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5" /></Svg>
);
