/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        ess: {
          purple: '#081f3d',
          darkPurple: '#0f4c81',
          orange: '#f7941d',
          green: '#25d366',
          softBlue: '#eef5fc',
          softOrange: '#fff7ed',
        }
      }
    },
  },
  plugins: [],
}
