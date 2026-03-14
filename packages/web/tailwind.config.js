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
          DEFAULT: "var(--primary)",
          hover: "var(--primary-hover)",
          light: "var(--primary-light)",
          foreground: "var(--primary-foreground)",
          600: "var(--color-teal-600)",
          700: "var(--color-teal-700)",
          800: "var(--color-teal-700)",
        },
        "electric-cyan": "var(--color-teal-500)",
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        teal: {
          50: "var(--color-teal-50)",
          100: "var(--color-teal-100)",
          500: "var(--color-teal-500)",
          600: "var(--color-teal-600)",
          700: "var(--color-teal-700)",
        },
        blue: {
          50: "var(--color-blue-50)",
          100: "var(--color-blue-100)",
          400: "var(--color-blue-400)",
          500: "var(--color-blue-500)",
          600: "var(--color-blue-600)",
        },
        neutral: {
          10: "var(--color-neutral-10)",
          20: "var(--color-neutral-20)",
          30: "var(--color-neutral-30)",
          40: "var(--color-neutral-40)",
          50: "var(--color-neutral-50)",
          100: "var(--color-neutral-100)",
          200: "var(--color-neutral-200)",
          300: "var(--color-neutral-300)",
          400: "var(--color-neutral-400)",
        },
        success: "var(--status-success)",
        warning: "var(--status-warning)",
        error: "var(--status-error)",
        background: "var(--bg)",
        foreground: "var(--text)",
        card: {
          DEFAULT: "var(--surface)",
          muted: "var(--surface-muted)",
          elevated: "var(--surface-elevated)",
        },
        muted: {
          DEFAULT: "var(--text-muted)",
          foreground: "var(--text-subtle)",
        },
        accent: {
          DEFAULT: "var(--primary)",
          highlight: "var(--highlight)",
        },
        border: {
          DEFAULT: "var(--border)",
          muted: "var(--border-muted)",
          light: "var(--border)",
        },
        ring: "var(--color-teal-500)",
        "background-light": "var(--color-neutral-400)",
        "text-main": "var(--text)",
        "text-secondary": "var(--text-muted)",
      },
      backgroundImage: {
        "grid-quiet":
          "linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px)",
        glass: "linear-gradient(135deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.01))",
        "teal-gradient":
          "linear-gradient(135deg, var(--color-teal-500) 0%, var(--color-teal-700) 100%)",
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
