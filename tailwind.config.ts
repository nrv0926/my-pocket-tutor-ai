import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          50:  "#D8F3DC",
          100: "#B7E4C7",
          200: "#C8E6D0",
          300: "#E4F0E8",
          400: "#52B788",
          500: "#2D6A4F",
          600: "#1B4D3E",
          700: "#143A2F",
        },
        teal: {
          400: "#3A7D7C",
          600: "#264653",
          700: "#1B3A4B",
        },
        cream: {
          50:  "#F7FAF8",
          100: "#EFF6F1",
          200: "#E4F0E8",
          300: "#C8E6D0",
        },
        ink: {
          DEFAULT: "#1B2E25",
          soft:   "#3D5A4A",
          muted:  "#6B8F76",
        },
        navy: "#1A2E3B",
        sand: "#c8a96a",
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "serif"],
        sans:  ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      boxShadow: {
        card: "0 1px 2px rgba(20,30,25,.04), 0 4px 14px rgba(20,30,25,.06)",
        soft: "0 6px 18px rgba(20,30,25,.08), 0 2px 6px rgba(20,30,25,.05)",
        lift: "0 14px 44px rgba(45,106,79,.10), 0 8px 16px rgba(20,30,25,.06)",
        glow: "0 4px 18px rgba(45,106,79,.28)",
      },
      keyframes: {
        floaty: {
          "0%,100%": { transform: "translateY(0)" },
          "50%":     { transform: "translateY(-6px)" },
        },
        fadeUp: {
          from: { opacity: "0", transform: "translateY(20px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        floaty: "floaty 3s ease-in-out infinite",
        fadeUp: "fadeUp .6s ease forwards",
      },
    },
  },
  plugins: [],
};

export default config;
