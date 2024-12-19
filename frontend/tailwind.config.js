/** @type {import('tailwindcss').Config} */

module.exports = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    fontFamily: {
      sans: ["var(--font-general-sans)"],
    },
    fontSize: {
      h1: ["32px", "40px"],
      h2: ["24px", "32px"],
      h3: ["20px", "28px"],
      p1: ["16px", "24px"],
      p2: ["14px", "20px"],
      p3: ["12px", "16px"],
    },
    colors: {
      foreground: "hsl(var(--foreground))",
      background: "hsl(var(--background))",

      "navy-100": "hsl(var(--navy-100))",
      "navy-200": "hsl(var(--navy-200))",
      "navy-400": "hsl(var(--navy-400))",
      "navy-500": "hsl(var(--navy-500))",
      "navy-600": "hsl(var(--navy-600))",
      "navy-800": "hsl(var(--navy-800))",
      "navy-900": "hsl(var(--navy-900))",

      blue: "hsl(var(--blue))",
      "glacier-blue": "hsl(var(--glacier-blue))",
      "light-blue": "hsl(var(--light-blue))",
      "dark-navy": "hsl(var(--dark-navy))",
      white: "hsl(var(--white))",

      success: "hsl(var(--success))",
      error: "hsl(var(--error))",
    },
    borderRadius: {
      sm: "8px",
      md: "12px",
      lg: "16px",
      xl: "24px",
    },
    boxShadow: {
      sm: "0 1px 1px 0 hsla(var(--navy-800) / 15%)",
    },
  },
  plugins: [require("tailwindcss-animate")],
};
