import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: ["selector", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        surface: {
          DEFAULT: "var(--surface)",
          muted: "var(--surface-muted)",
        },
        foreground: {
          DEFAULT: "var(--foreground)",
          muted: "var(--foreground-muted)",
        },
        border: "var(--border)",
        primary: {
          DEFAULT: "var(--primary)",
          hover: "var(--primary-hover)",
          foreground: "var(--primary-foreground)",
        },
        success: "var(--success)",
        warning: "var(--warning)",
        danger: "var(--danger)",
        "focus-ring": "var(--focus-ring)",
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(15, 11, 23, 0.06)",
        popover: "0 8px 24px rgba(15, 11, 23, 0.12)",
      },
      borderRadius: {
        sm: "6px",
        md: "8px",
        lg: "12px",
      },
    },
  },
  plugins: [],
};

export default config;
