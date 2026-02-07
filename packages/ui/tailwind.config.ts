import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Sora", "ui-sans-serif", "system-ui"],
        mono: ["\"IBM Plex Mono\"", "ui-monospace", "SFMono-Regular"],
      },
      colors: {
        ink: {
          950: "#0b0c10",
          900: "#111318",
          800: "#1a1f2b",
          700: "#262d3e",
          600: "#334055",
        },
        mint: {
          400: "#6ee7b7",
          500: "#34d399",
        },
        coral: {
          400: "#fb7185",
          500: "#f43f5e",
        },
        sand: {
          100: "#f6f2ea",
          200: "#eee6d7",
        },
      },
      boxShadow: {
        glow: "0 0 40px rgba(52, 211, 153, 0.25)",
        "glow-sm": "0 0 20px rgba(52, 211, 153, 0.15)",
        card: "0 20px 60px rgba(15, 23, 42, 0.3)",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out both",
        "slide-up": "slideUp 0.4s ease-out both",
        "scale-in": "scaleIn 0.3s ease-out both",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        scaleIn: {
          from: { opacity: "0", transform: "scale(0.95)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
