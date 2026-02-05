import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Sora", "ui-sans-serif", "system-ui"],
        mono: ["\"IBM Plex Mono\"", "ui-monospace", "SFMono-Regular"]
      },
      colors: {
        ink: {
          950: "#0b0c10",
          900: "#111318",
          800: "#1a1f2b",
          700: "#262d3e",
          600: "#334055"
        },
        mint: {
          400: "#6ee7b7",
          500: "#34d399"
        },
        coral: {
          400: "#fb7185",
          500: "#f43f5e"
        },
        sand: {
          100: "#f6f2ea",
          200: "#eee6d7"
        }
      },
      boxShadow: {
        glow: "0 0 40px rgba(52, 211, 153, 0.25)",
        card: "0 20px 60px rgba(15, 23, 42, 0.3)"
      }
    }
  },
  plugins: []
} satisfies Config;
