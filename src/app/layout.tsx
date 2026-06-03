import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap"
});
const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap"
});

export const metadata: Metadata = {
  title: {
    default: "Plume . the modern platform",
    template: "%s . Plume"
  },
  description:
    "Plume is a clean, modern platform built on Next.js, Supabase and Prisma. Launch the work that matters.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  openGraph: {
    type: "website",
    title: "Plume . the modern platform",
    description:
      "Launch faster with a polished Next.js + Supabase foundation. Auth, dashboard and design system included.",
    siteName: "Plume"
  },
  twitter: {
    card: "summary_large_image",
    title: "Plume",
    description: "The modern Next.js + Supabase platform."
  },
  icons: { icon: "/favicon.svg" }
};

export const viewport: Viewport = {
  themeColor: "#0a0a0f",
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${mono.variable}`}
    >
      <head>
        <link
          rel="icon"
          href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%237c3aed' d='M12 2 4 7v10l8 5 8-5V7z'/%3E%3C/svg%3E"
        />
      </head>
      <body className="min-h-screen bg-white text-ink-900 antialiased">
        {children}
      </body>
    </html>
  );
}
