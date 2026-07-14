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
        fundo: "var(--fundo)", 
        grafite: "var(--grafite)",
        grafite2: "var(--grafite2)",
        asfalto: "var(--asfalto)",
        papel: "var(--papel)",
        nevoa: "var(--nevoa)",
        nevoaClara: "var(--nevoaClara)",
        
        // Cores táticas
        verdeSinal: "var(--verdeSinal)",
        ambarSinal: "var(--ambarSinal)",
        vermelhoSinal: "var(--vermelhoSinal)",
        
        // Novas Cores Premium
        cyanReal: "var(--cyanReal)",
        azulMercosul: "var(--azulMercosul)",
        roxoPremium: "var(--roxoPremium)",
        azulNeon: "var(--azulNeon)",
        
        // Borders e highlights
        borda: "var(--borda)",
        bordaGlow: "var(--bordaGlow)",
        surface: "var(--surface)",
      },
      backgroundImage: {
        "rad-gradient": "radial-gradient(circle at top right, rgba(43, 88, 255, 0.15), transparent 40%), radial-gradient(circle at bottom left, rgba(123, 97, 255, 0.15), transparent 40%)",
        "mesh-pattern": "url('/mesh.svg')",
        "mercosul-bg": "linear-gradient(to bottom, var(--azulMercosul) 25%, #ffffff 25%)",
        "glass-gradient": "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)",
        "hero-glow": "radial-gradient(ellipse 70% 50% at 50% -10%, rgba(0,229,115,0.15) 0%, rgba(9,10,15,0) 100%)",
        "card-glow-verde": "radial-gradient(circle at top left, rgba(0,229,115,0.08) 0%, transparent 70%)",
        "card-glow-ambar": "radial-gradient(circle at top left, rgba(255,185,0,0.08) 0%, transparent 70%)",
        "card-glow-vermelho": "radial-gradient(circle at top left, rgba(255,51,85,0.08) 0%, transparent 70%)",
        "terminal-stripes": "repeating-linear-gradient(0deg, rgba(0,0,0,0.1) 0px, rgba(0,0,0,0.1) 1px, transparent 1px, transparent 2px)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "sans-serif"],
        display: ["var(--font-display)", "sans-serif"],
        mono: ["var(--font-jetbrains)", "monospace"],
      },
      animation: {
        pulseRing: "pulseRing 2.5s cubic-bezier(0.215, 0.61, 0.355, 1) infinite",
        shimmer: "shimmer 2.5s infinite linear",
        scanlines: "scanlines 8s linear infinite",
        "fade-up": "fadeUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "float": "float 6s ease-in-out infinite",
        "glowPulse": "glowPulse 3s ease-in-out infinite",
        "road-move": "roadMove 2s linear infinite",
        "radar-spin": "radarSpin 4s linear infinite",
        "traffic-light": "trafficLight 6s infinite",
        "slide-in-left": "slideInLeft 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "fade-in": "fadeIn 0.25s ease forwards",
        "scale-in": "scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "blob-float": "blobFloat 14s ease-in-out infinite",
        "welcome-card-in": "welcomeCardIn 0.9s cubic-bezier(0.16, 1, 0.3, 1) forwards",
      },
      keyframes: {
        pulseRing: {
          "0%": { transform: "scale(0.8)", opacity: "0.8" },
          "100%": { transform: "scale(2.2)", opacity: "0" },
        },
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        scanlines: {
          "0%": { backgroundPosition: "0 0" },
          "100%": { backgroundPosition: "0 100%" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        glowPulse: {
          "0%, 100%": { opacity: "0.5" },
          "50%": { opacity: "1" },
        },
        roadMove: {
          "0%": { backgroundPosition: "0 0" },
          "100%": { backgroundPosition: "0 100px" },
        },
        radarSpin: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        trafficLight: {
          "0%, 30%": { color: "var(--verdeSinal)", textShadow: "0 0 10px var(--verdeSinal)" },
          "33%, 60%": { color: "var(--ambarSinal)", textShadow: "0 0 10px var(--ambarSinal)" },
          "66%, 100%": { color: "var(--vermelhoSinal)", textShadow: "0 0 10px var(--vermelhoSinal)" },
        },
        slideInLeft: {
          "0%": { transform: "translateX(-100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        blobFloat: {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "33%": { transform: "translate(30px, -20px) scale(1.08)" },
          "66%": { transform: "translate(-20px, 25px) scale(0.95)" },
        },
        welcomeCardIn: {
          "0%": { opacity: "0", transform: "translateY(40px) scale(0.85) rotate(-6deg)" },
          "60%": { opacity: "1", transform: "translateY(-6px) scale(1.02) rotate(1deg)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1) rotate(0deg)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
