import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        purpleShop: {
          DEFAULT: "#6B1FA2",
          dark: "#3B0A57",
          light: "#B57EDC",
          paper: "#F5F5F7",
          ink: "#111111",
        },
      },
      boxShadow: {
        label: "0 18px 50px rgba(17, 17, 17, 0.16)",
      },
    },
  },
  plugins: [],
};

export default config;
