/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fdf8f6",
          100: "#f2e8e5",
          200: "#eaddd7",
          300: "#e0cec7",
          400: "#d2bab0",
          500: "#b45309", // Warm amber / liquor tone
          600: "#92400e",
          700: "#78350f",
          800: "#451a03",
          900: "#270e02",
        },
      },
    },
  },
  plugins: [],
}
