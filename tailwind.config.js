/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--bg-color)",
        surface: "var(--bg-color)",
        "surface-dim": "var(--bg-color)",
        "surface-bright": "var(--surface-container-high)",
        "surface-container-lowest": "var(--surface-container-lowest)",
        "surface-container-low": "var(--surface-container-low)",
        "surface-container": "var(--surface-container)",
        "surface-container-high": "var(--surface-container-high)",
        "surface-container-highest": "var(--surface-container-highest)",
        "on-surface": "var(--text-color)",
        "on-surface-variant": "var(--on-surface-variant)",
        primary: "var(--primary-color)",
        "on-primary": "#002a78",
        "primary-container": "var(--primary-container)",
        "on-primary-container": "var(--on-primary-container)",
        secondary: "#6bd8cb", // AI Teal
        "on-secondary": "#003732",
        "secondary-container": "#29a195",
        "on-secondary-container": "#00302b",
        tertiary: "#ffb95f", // Wallet Amber
        "on-tertiary": "#472a00",
        "tertiary-container": "#996100",
        "on-tertiary-container": "#ffeedd",
        "on-background": "var(--text-color)",
        "outline-variant": "var(--outline-variant, #434655)"
      },
      fontFamily: {
        sans: ["'IBM Plex Sans'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"]
      },
      borderRadius: {
        sm: "0.25rem",      // 4px
        DEFAULT: "0.5rem",   // 8px
        md: "0.75rem",       // 12px
        lg: "1rem",          // 16px
        xl: "1.5rem",        // 24px
        full: "9999px"
      },
      spacing: {
        base: "0.25rem",     // 4px
        xs: "0.5rem",        // 8px
        sm: "1rem",          // 16px
        md: "1.5rem",        // 24px
        lg: "2.5rem",        // 40px
        xl: "4rem",          // 64px
        "container-max": "1280px",
        gutter: "24px"
      }
    },
  },
  plugins: [],
}
