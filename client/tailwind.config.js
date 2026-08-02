/** Design tokens transcribed from the mockup research (research_design_system.md)
 * and the template-coder design system spec - colors/radii/type-scale are named
 * tokens here so components never hardcode a raw hex or px value. */
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eaf1fc",
          100: "#d3e3f9",
          200: "#a7c7f3",
          300: "#7aabed",
          400: "#4e8fe6",
          500: "#1466d6",
          600: "#0f4fa8",
          700: "#0c3f86",
          800: "#092f64",
          900: "#062042",
        },
        ai: {
          50: "#eafaf1",
          100: "#d0f2e0",
          200: "#a1e5c1",
          300: "#72d8a2",
          400: "#43cb83",
          500: "#1f9d63",
          600: "#177a4d",
          700: "#125f3d",
          800: "#0d452d",
          900: "#092a1c",
        },
        navy: {
          50: "#eef1f5",
          100: "#d3dae3",
          400: "#3d526e",
          700: "#152c48",
          800: "#0d1f38",
          900: "#081527",
        },
        warning: {
          50: "#fdf5e8",
          100: "#f8e6c2",
          500: "#c9822a",
          600: "#a86a1e",
        },
        error: {
          50: "#fdecec",
          100: "#f8caca",
          500: "#dc2626",
          600: "#b91c1c",
        },
        ink: {
          DEFAULT: "#0f1a2b",
          muted: "#5b6b80",
          secondary: "#39485c",
        },
        surface: {
          canvas: "#f2f4f8",
          card: "#ffffff",
          border: "#dbe3ee",
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      fontSize: {
        helper: ["12px", { lineHeight: "1.4" }],
        secondary: ["14px", { lineHeight: "1.5" }],
        body: ["16px", { lineHeight: "1.6" }],
        "body-lg": ["18px", { lineHeight: "1.6" }],
        "heading-sm": ["20px", { lineHeight: "1.3", fontWeight: "600" }],
        heading: ["24px", { lineHeight: "1.3", fontWeight: "700" }],
        "heading-lg": ["32px", { lineHeight: "1.2", fontWeight: "700" }],
        "heading-xl": ["40px", { lineHeight: "1.15", fontWeight: "800" }],
      },
      borderRadius: {
        xs: "4px",
        sm: "6px",
        md: "8px",
        lg: "12px",
        xl: "16px",
        "2xl": "24px",
      },
      boxShadow: {
        card: "0 12px 40px rgba(15, 26, 43, 0.06)",
      },
      transitionDuration: {
        fast: "150ms",
        normal: "250ms",
        slow: "350ms",
      },
      maxWidth: {
        content: "1440px",
      },
    },
  },
  plugins: [],
};
