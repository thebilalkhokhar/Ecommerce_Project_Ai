import type { Config } from "tailwindcss";

/**
 * Tailwind v4 primary configuration lives in `src/app/globals.css` (`@theme inline`).
 * This file mirrors the palette for editors/tools that read `tailwind.config.*`
 * and documents the design tokens.
 */
export default {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        background: "#F4F4F8",
        surface: "#FFFFFF",
        textMain: "#2A2C41",
        primary: "#FF724C",
        secondary: "#FDBF50",
      },
    },
  },
} satisfies Config;
