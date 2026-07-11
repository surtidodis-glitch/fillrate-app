import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./context/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Paleta del dashboard: navy casi negro + acento índigo,
        // más los 4 colores semánticos de clasificación.
        base: {
          DEFAULT: "#0a0e17",
          surface: "#0f1420",
          surface2: "#131a29",
          border: "#1f2937",
        },
        accent: {
          DEFAULT: "#6366f1",
          soft: "#818cf8",
        },
        clasif: {
          overfilled: "#38bdf8",
          completa: "#34d399",
          basico: "#fbbf24",
          undersized: "#f87171",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
