/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        ess: {
          purple: '#0A0F1C', // Matches web hero background
          darkPurple: '#050811',
          orange: '#f7941d',
          green: '#25d366',
          softBlue: '#f8fafc',
          softOrange: '#fff7ed',
        }
      }
    },
  },
  plugins: [],
}
