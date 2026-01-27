/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#f0f9ff",
          100: "#e0f2fe",
          500: "#0ea5e9",
          600: "#0284c7",
          700: "#0369a1",
        },
        // Modern High-Tech Electric Accents
        electric: {
          cyan: "#06b6d4",
          purple: "#a855f7",
          neon: "#00ff88",
          blue: "#3b82f6",
          indigo: "#6366f1",
        },
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
      },
      backgroundImage: {
        "grid-slate-100":
          "linear-gradient(to right, rgb(241 245 249 / 0.5) 1px, transparent 1px), linear-gradient(to bottom, rgb(241 245 249 / 0.5) 1px, transparent 1px)",
        "grid-slate-800":
          "linear-gradient(to right, rgb(30 41 59 / 0.5) 1px, transparent 1px), linear-gradient(to bottom, rgb(30 41 59 / 0.5) 1px, transparent 1px)",
        // Glassmorphism gradients
        glass: "linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))",
        "glass-dark": "linear-gradient(135deg, rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.1))",
        // Electric gradients
        "electric-gradient": "linear-gradient(135deg, #06b6d4 0%, #a855f7 50%, #3b82f6 100%)",
        "neon-gradient": "linear-gradient(135deg, #00ff88 0%, #06b6d4 100%)",
      },
      backgroundSize: {
        grid: "20px 20px",
      },
      backdropBlur: {
        xs: "2px",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-in-out",
        "slide-up": "slideUp 0.5s ease-out",
        glow: "glow 2s ease-in-out infinite alternate",
        float: "float 6s ease-in-out infinite",
        shimmer: "shimmer 2s linear infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        glow: {
          "0%": { boxShadow: "0 0 5px rgba(6, 182, 212, 0.5), 0 0 10px rgba(6, 182, 212, 0.3)" },
          "100%": {
            boxShadow: "0 0 20px rgba(6, 182, 212, 0.8), 0 0 30px rgba(168, 85, 247, 0.5)",
          },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-20px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-1000px 0" },
          "100%": { backgroundPosition: "1000px 0" },
        },
      },
      // Fluid typography utilities using clamp()
      fontSize: {
        "fluid-xs": "clamp(0.75rem, 0.5vw + 0.5rem, 0.875rem)", // 12px - 14px
        "fluid-sm": "clamp(0.875rem, 0.75vw + 0.5rem, 1rem)", // 14px - 16px
        "fluid-base": "clamp(1rem, 1vw + 0.5rem, 1.125rem)", // 16px - 18px
        "fluid-lg": "clamp(1.125rem, 1.25vw + 0.5rem, 1.25rem)", // 18px - 20px
        "fluid-xl": "clamp(1.25rem, 1.5vw + 0.5rem, 1.5rem)", // 20px - 24px
        "fluid-2xl": "clamp(1.5rem, 2vw + 0.5rem, 2rem)", // 24px - 32px
        "fluid-3xl": "clamp(1.875rem, 3vw + 0.5rem, 2.5rem)", // 30px - 40px
        "fluid-4xl": "clamp(2.25rem, 4vw + 0.5rem, 3rem)", // 36px - 48px
        "fluid-5xl": "clamp(2.5rem, 5vw + 0.5rem, 3.75rem)", // 40px - 60px
        "fluid-6xl": "clamp(3rem, 6vw + 0.5rem, 4.5rem)", // 48px - 72px
        "fluid-7xl": "clamp(3.5rem, 7vw + 0.5rem, 5rem)", // 56px - 80px
      },
    },
  },
  plugins: [],
};
