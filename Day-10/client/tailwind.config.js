/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ink: { 50: "#f7f6f4", 100: "#edeae5", 200: "#dbd5cb", 300: "#c4baa9", 400: "#ab9c87", 500: "#9a8973", 600: "#8d7a67", 700: "#766556", 800: "#615449", 900: "#50463d", 950: "#2b2420" },
        parchment: { 50: "#fdfcfa", 100: "#f9f6f0", 200: "#f3ede0", 300: "#e8ddc8", 400: "#d9c8a8", 500: "#ccb58e", 600: "#b89c73", 700: "#9c805e", 800: "#806a50", 900: "#695743", 950: "#382d22" },
        highlight: { 50: "#fff9e6", 100: "#ffefb3", 200: "#ffe580", 300: "#ffdb4d", 400: "#ffd11a", 500: "#e6b800", 600: "#b38f00", 700: "#806600", 800: "#4d3d00", 900: "#1a1400", 950: "#0d0a00" },
      },
      fontFamily: {
        serif: ["Lora", "Georgia", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
