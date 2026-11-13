import type { Config } from "tailwindcss";

/**
 * Design tokens
 * - Neutral scale is driven by CSS variables (see globals.css) so dark / light share one class vocabulary.
 * - Exactly one functional accent (emerald). Amber / red exist only as semantic status colours.
 * - Radii are capped at 6px. Dense tools do not get pills or 2xl cards.
 */
const v = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    borderRadius: { none: "0", sm: "2px", DEFAULT: "4px", md: "4px", lg: "6px", full: "9999px" },
    fontSize: {
      "2xs": ["10px", { lineHeight: "14px" }],
      xs: ["12px", { lineHeight: "16px" }],
      sm: ["13px", { lineHeight: "20px" }],
      base: ["14px", { lineHeight: "22px" }],
      lg: ["16px", { lineHeight: "24px" }],
      xl: ["18px", { lineHeight: "26px" }],
      "2xl": ["22px", { lineHeight: "28px" }],
    },
    extend: {
      colors: {
        bg: v("bg"),            // app canvas
        panel: v("panel"),      // raised surface (panes, cards)
        inset: v("inset"),      // recessed surface (editor gutter, table header)
        line: v("line"),        // 1px dividers
        "line-strong": v("line-strong"),
        fg: v("fg"),            // primary text
        muted: v("muted"),      // secondary text
        faint: v("faint"),      // tertiary text, placeholders
        accent: v("accent"),    // the single functional accent
        "accent-fg": v("accent-fg"),
        warn: v("warn"),
        danger: v("danger"),
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "Inter", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "JetBrains Mono", "ui-monospace", "monospace"],
      },
      spacing: { 4.5: "18px", 13: "52px" },
      keyframes: { "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } } },
      animation: { "fade-in": "fade-in 120ms ease-out" },
    },
  },
  plugins: [],
};
export default config;
