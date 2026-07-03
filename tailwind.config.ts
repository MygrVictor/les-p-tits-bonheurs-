import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#E77B79",
        "primary-hover": "#D96B69",
        blush: {
          50: "#fff7f8",
          100: "#fdecef",
          200: "#f9d3dc",
          300: "#f2c4ce",
          400: "#e79eb0",
          500: "#d97895",
          600: "#bc5475",
          700: "#98435e",
        },
        ink: "#1f1a1c",
      },
      boxShadow: {
        soft: "0 20px 60px rgba(185, 108, 133, 0.12)",
      },
      fontFamily: {
        serif: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-33.3333%)" },
        },
        "marquee-band": {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-33.3333%)" },
        },
        "marquee-band-rtl": {
          "0%": { transform: "translateX(-33.3333%)" },
          "100%": { transform: "translateX(0%)" },
        },
        "slide-in-right": {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0%)" },
        },
      },
      animation: {
        marquee: "marquee 45s linear infinite",
        "marquee-band": "marquee-band 20s linear infinite",
        "marquee-band-rtl": "marquee-band-rtl 20s linear infinite",
        "slide-in-right":
          "slide-in-right 0.28s cubic-bezier(0.32,0,0.67,0) forwards",
      },
    },
  },
  plugins: [],
};

export default config;
