/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        slate: { 50:"#f8fafc",100:"#f1f5f9",200:"#e2e8f0",300:"#cbd5e1",400:"#94a3b8",500:"#64748b",600:"#475569",700:"#334155",800:"#1e293b",900:"#0f172a",950:"#020617" },
        frost: { 50:"#f0f4ff",100:"#e0e8ff",200:"#c7d4fe",300:"#a4bcfd",400:"#8098f9",500:"#6172f3",600:"#444ce7",700:"#3538cd",800:"#2d31a6",900:"#2b2f83",950:"#1a1c4a" },
        electric: { 50:"#ecfeff",100:"#cffafe",200:"#a5f3fc",300:"#67e8f9",400:"#22d3ee",500:"#06b6d4",600:"#0891b2",700:"#0e7490",800:"#155e75",900:"#164e63",950:"#083344" },
      },
      fontFamily: { serif:["Lora","Georgia","serif"], sans:["Inter","system-ui","sans-serif"], mono:["JetBrains Mono","monospace"] },
    },
  },
  plugins: [],
};
