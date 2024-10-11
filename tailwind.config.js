/** @type {import('tailwindcss').Config} */

module.exports = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    fontFamily: {
      sans: ["var(--font-general-sans)"],
    },
    extend: {
      colors: {
        foreground: "hsl(var(--foreground))",
        foregroundLight: "hsl(var(--foreground-light))",
        background: "hsl(var(--background))",

        blue: {
          DEFAULT: "hsl(var(--blue))",
          foreground: "hsl(var(--blue-foreground))",
        },
        glacierBlue: {
          DEFAULT: "hsl(var(--glacier-blue))",
          foreground: "hsl(var(--glacier-blue-foreground))",
        },
        lightBlue: {
          DEFAULT: "hsl(var(--light-blue))",
          foreground: "hsl(var(--light-blue-foreground))",
        },
        darkNavy: {
          DEFAULT: "hsl(var(--dark-navy))",
          foreground: "hsl(var(--dark-navy-foreground))",
        },
        white: {
          DEFAULT: "hsl(var(--white))",
          foreground: "hsl(var(--white-foreground))",
        },

        success: "hsl(var(--success))",
        error: "hsl(var(--error))",
      },
      borderRadius: {
        sm: "8px",
        md: "12px",
        lg: "24px",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
