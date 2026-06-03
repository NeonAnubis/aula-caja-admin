import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx,js,jsx,mdx}"],
  darkMode: "class",
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: { sm: "640px", md: "768px", lg: "1024px", xl: "1200px", "2xl": "1320px" }
    },
    extend: {
      colors: {
        ink: {
          DEFAULT: "#000000",
          50:  "#fafafa",
          100: "#f5f5f5",
          200: "#e5e5e5",
          300: "#d4d4d4",
          400: "#a3a3a3",
          500: "#737373",
          600: "#525252",
          700: "#404040",
          800: "#262626",
          900: "#171717",
          950: "#0a0a0a"
        },
        brand: {
          50:  "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
          950: "#172554"
        }
      },
      fontFamily: {
        sans: ['var(--font-inter)', '"Inter Fallback"', "system-ui", "sans-serif"],
        display: ['var(--font-inter)', "system-ui", "sans-serif"],
        mono: ['var(--font-mono)', "ui-monospace", "monospace"]
      },
      fontSize: { "2xs": ["0.6875rem", { lineHeight: "1rem" }] },
      letterSpacing: {
        tightest: "-0.04em",
        tighter2: "-0.02em"
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.125rem",
        "3xl": "1.5rem"
      },
      boxShadow: {
        soft: "0 1px 2px rgba(10,10,10,.04), 0 8px 24px rgba(10,10,10,.06)",
        glow: "0 0 0 1px rgba(37,99,235,.10), 0 16px 40px rgba(37,99,235,.18)",
        blue: "0 8px 30px rgba(37,99,235,.28)"
      },
      animation: {
        "fade-up": "fadeUp .8s ease-out both",
        "fade-in": "fadeIn .6s ease-out both",
        "float": "float 9s ease-in-out infinite",
        "marquee": "marquee 32s linear infinite",
        "ken-burns": "kenBurns 12s ease-out forwards"
      },
      keyframes: {
        fadeUp:    { "0%": { opacity: "0", transform: "translateY(16px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        fadeIn:    { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        float:     { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-12px)" } },
        marquee:   { "0%": { transform: "translateX(0)" }, "100%": { transform: "translateX(-50%)" } },
        kenBurns:  { "0%": { transform: "scale(1.02)" }, "100%": { transform: "scale(1.10)" } }
      }
    }
  },
  plugins: []
};

export default config;
