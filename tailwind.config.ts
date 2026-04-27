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
        // Calm, parent-friendly palette
        cream: {
          50: "#fbf9f3",
          100: "#f5f2ea",
          200: "#efeadd",
          300: "#e3ddcd",
        },
        ink: {
          DEFAULT: "#19231f",
          soft: "#3a4a43",
          muted: "#6b766f",
        },
        forest: {
          50: "#e8f0eb",
          100: "#d9e7df",
          500: "#1f4f3f",
          600: "#173d30",
          700: "#0f2c22",
        },
        sand: "#c8a96a",
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      boxShadow: {
        card: "0 1px 2px rgba(20,30,25,.04), 0 1px 3px rgba(20,30,25,.06)",
        soft: "0 6px 18px rgba(20,30,25,.08), 0 2px 6px rgba(20,30,25,.05)",
        lift: "0 22px 50px rgba(20,30,25,.12), 0 8px 16px rgba(20,30,25,.06)",
      },
    },
  },
  plugins: [],
};

export default config;
