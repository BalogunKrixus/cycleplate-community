import type { Config } from "tailwindcss";

/* No border utilities are used anywhere in this app by design. Separation comes
   from the shadow scale below, which is deliberately soft and low contrast. */
const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#FAF8F4",
        surface: "#FFFFFF",
        ink: "#2A1F17",
        muted: "#6B5D4F",
        faint: "#9A8D80",
        menstrual: "#B23A4B",
        follicular: "#7C9A65",
        ovulatory: "#E0A33E",
        luteal: "#96617F",
        expert: "#7C9A65",
      },
      fontFamily: {
        serif: ["var(--font-playfair)", "Georgia", "serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(42, 31, 23, 0.04), 0 8px 24px rgba(42, 31, 23, 0.06)",
        lift: "0 2px 4px rgba(42, 31, 23, 0.06), 0 16px 40px rgba(42, 31, 23, 0.10)",
        chip: "0 1px 2px rgba(42, 31, 23, 0.05), 0 4px 12px rgba(42, 31, 23, 0.05)",
        inset: "inset 0 1px 2px rgba(42, 31, 23, 0.06)",
      },
      borderRadius: {
        card: "20px",
        chip: "999px",
      },
      keyframes: {
        rise: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "none" },
        },
peak: {
          "0%": { transform: "scale(1)" },
          "45%": { transform: "scale(1.25)" },
          "100%": { transform: "scale(1)" },
        },
      },
      animation: {
        rise: "rise 0.28s cubic-bezier(0.22, 1, 0.36, 1)",
        peak: "peak 0.32s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
