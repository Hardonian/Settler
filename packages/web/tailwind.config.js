/**
 * Tailwind CSS Configuration — Settler Design System
 *
 * This config maps Tailwind utilities to canonical design tokens.
 * See design-system/css-tokens.css for the single source of truth.
 *
 * IMPORTANT: Do NOT add ad-hoc colors or values here.
 * All new tokens should be added to css-tokens.css first.
 */

const path = require("path");
const fs = require("fs");

module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          50: "var(--color-primary-50)",
          100: "var(--color-primary-100)",
          200: "var(--color-primary-200)",
          300: "var(--color-primary-300)",
          400: "var(--color-primary-400)",
          500: "var(--color-primary-500)",
          600: "var(--color-primary-600)",
          700: "var(--color-primary-700)",
          800: "var(--color-primary-800)",
          900: "var(--color-primary-900)",
        },
        electric: {
          cyan: "var(--color-electric-cyan)",
          purple: "var(--color-electric-purple)",
          neon: "var(--color-electric-neon)",
          blue: "var(--color-electric-blue)",
          indigo: "var(--color-electric-indigo)",
        },
        neutral: {
          white: "var(--color-neutral-white)",
          black: "var(--color-neutral-black)",
          50: "var(--color-neutral-gray-50)",
          100: "var(--color-neutral-gray-100)",
          200: "var(--color-neutral-gray-200)",
          300: "var(--color-neutral-gray-300)",
          400: "var(--color-neutral-gray-400)",
          500: "var(--color-neutral-gray-500)",
          600: "var(--color-neutral-gray-600)",
          700: "var(--color-neutral-gray-700)",
          800: "var(--color-neutral-gray-800)",
          900: "var(--color-neutral-gray-900)",
        },
        success: {
          500: "var(--color-success-500)",
        },
        warning: {
          500: "var(--color-warning-500)",
        },
        error: {
          500: "var(--color-error-500)",
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
        glass: "linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))",
        "glass-dark": "linear-gradient(135deg, rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.1))",
        "electric-gradient":
          "linear-gradient(135deg, var(--color-electric-cyan) 0%, var(--color-electric-purple) 50%, var(--color-electric-blue) 100%)",
        "neon-gradient":
          "linear-gradient(135deg, var(--color-electric-neon) 0%, var(--color-electric-cyan) 100%)",
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
          "0%": {
            boxShadow: "0 0 5px var(--color-electric-cyan), 0 0 10px var(--color-electric-cyan)",
          },
          "100%": {
            boxShadow: "0 0 20px var(--color-electric-cyan), 0 0 30px var(--color-electric-purple)",
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
