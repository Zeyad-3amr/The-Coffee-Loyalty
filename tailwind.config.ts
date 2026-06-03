import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Warm espresso-tinted neutral — remaps the default `stone` scale used
        // across the app so the whole UI feels like coffee (deep espresso darks,
        // clean warm-cream lights) while amber stays the accent.
        stone: {
          50: "#faf7f2",
          100: "#f3ece3",
          200: "#e4d9ca",
          300: "#cabca9",
          400: "#a8967f",
          500: "#84725f",
          600: "#615345",
          700: "#473a2e",
          800: "#2f251c",
          900: "#211811",
          950: "#150e09",
        },
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        glow: {
          "0%, 100%": { boxShadow: "0 0 20px rgba(251, 146, 60, 0.2)" },
          "50%": { boxShadow: "0 0 40px rgba(251, 146, 60, 0.4)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "200% center" },
          "100%": { backgroundPosition: "-200% center" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
        spinSlow: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
      },
      animation: {
        fadeUp: "fadeUp 0.6s ease-out",
        glow: "glow 2s ease-in-out infinite",
        shimmer: "shimmer 2s infinite",
        float: "float 3s ease-in-out infinite",
        spinSlow: "spinSlow 8s linear infinite",
      },
    },
  },
  plugins: [],
};
export default config;
