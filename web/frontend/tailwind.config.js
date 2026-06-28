/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Neutral tokens are driven by CSS variables so they flip in dark mode.
        // Light values (set in index.css :root) match the original palette exactly.
        cream: {
          DEFAULT: "rgb(var(--bg) / <alpha-value>)", // page background
          50: "#fbf8f1", // STATIC: used as light text on colored buttons/badges
          100: "rgb(var(--cream-100) / <alpha-value>)",
          200: "rgb(var(--cream-200) / <alpha-value>)",
        },
        surface: "rgb(var(--surface) / <alpha-value>)", // cards
        panel: "rgb(var(--panel) / <alpha-value>)", // mini-cards / chips
        forest: {
          950: "#102316",
          900: "#173a23",
          800: "#1d4429",
          700: "#27583a",
          600: "#327a48",
          500: "#3f9457",
          400: "#6bb583",
          tint: "rgb(var(--forest-tint) / <alpha-value>)", // icon-circle bg
        },
        gold: {
          700: "#8a6a1f",
          600: "#a9842f",
          500: "#c2992f",
          400: "#d4b257",
          200: "rgb(var(--gold-200) / <alpha-value>)",
          100: "rgb(var(--gold-100) / <alpha-value>)",
        },
        ink: {
          DEFAULT: "rgb(var(--ink) / <alpha-value>)",
          soft: "rgb(var(--ink-soft) / <alpha-value>)",
          muted: "rgb(var(--ink-muted) / <alpha-value>)",
        },
        line: "rgb(var(--line) / <alpha-value>)",
        pos: "#2f8a4e",
        neg: "#c0503f",
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', "system-ui", "sans-serif"],
        display: ["Fraunces", "Georgia", "serif"],
      },
      boxShadow: {
        card: "0 8px 24px rgba(40,50,30,0.06)",
        cardhover: "0 14px 30px rgba(40,50,30,0.11)",
        glow: "0 10px 22px rgba(23,58,35,0.22)",
      },
      borderRadius: {
        xl2: "20px",
      },
    },
  },
  plugins: [],
};
