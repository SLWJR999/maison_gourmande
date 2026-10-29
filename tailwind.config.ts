import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        mauve: {
          DEFAULT: "#76518F",
          50: "#F7F3FA",
          100: "#EDE3F3",
          200: "#DCC9E7",
          300: "#C4A7D5",
          400: "#A47DB9",
          500: "#8A5E9F",
          600: "#76518F",
          700: "#5C3C72",
          800: "#422B52",
          900: "#2C1C37",
        },
        cream: {
          DEFAULT: "#FAF6F0",
          deep: "#F3EBDF",
        },
        brown: {
          DEFAULT: "#5B4035",
          soft: "#7A6258",
          light: "#A08A7E",
        },
        ochre: {
          DEFAULT: "#C68B4A",
          light: "#F4E4CC",
        },
        rose: "#F2D9DD",
      },
      fontFamily: {
        display: ["Fraunces", "Georgia", "serif"],
        sans: ["Manrope", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 14px 40px -24px rgba(66, 43, 82, 0.28)",
        card: "0 10px 30px -18px rgba(91, 64, 53, 0.25)",
        float: "0 24px 70px -32px rgba(66, 43, 82, 0.45)",
      },
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.75rem",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(18px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "float-slow": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
        "spin-slow": {
          to: { transform: "rotate(360deg)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.7s cubic-bezier(0.22, 1, 0.36, 1) both",
        "fade-in": "fade-in 0.5s ease both",
        "float-slow": "float-slow 6s ease-in-out infinite",
        marquee: "marquee 32s linear infinite",
        shimmer: "shimmer 2.4s linear infinite",
        "spin-slow": "spin-slow 22s linear infinite",
      },
      backgroundImage: {
        "grain": "radial-gradient(rgba(91,64,53,0.08) 0.7px, transparent 0.7px)",
      },
      backgroundSize: {
        grain: "9px 9px",
      },
    },
  },
  plugins: [],
};

export default config;
