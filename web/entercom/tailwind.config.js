/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        white: 'rgb(var(--color-white) / <alpha-value>)',
        gray: {
          50: 'rgb(var(--color-gray-50) / <alpha-value>)',
          100: 'rgb(var(--color-gray-100) / <alpha-value>)',
          200: 'rgb(var(--color-gray-200) / <alpha-value>)',
          300: 'rgb(var(--color-gray-300) / <alpha-value>)',
          400: 'rgb(var(--color-gray-400) / <alpha-value>)',
          500: 'rgb(var(--color-gray-500) / <alpha-value>)',
          600: 'rgb(var(--color-gray-600) / <alpha-value>)',
          700: 'rgb(var(--color-gray-700) / <alpha-value>)',
          800: 'rgb(var(--color-gray-800) / <alpha-value>)',
          900: 'rgb(var(--color-gray-900) / <alpha-value>)',
        },
        purple: {
          50: 'rgb(var(--color-purple-50) / <alpha-value>)',
          100: 'rgb(var(--color-purple-100) / <alpha-value>)',
          200: 'rgb(var(--color-purple-200) / <alpha-value>)',
          300: 'rgb(var(--color-purple-300) / <alpha-value>)',
          400: 'rgb(var(--color-purple-400) / <alpha-value>)',
          500: 'rgb(var(--color-purple-500) / <alpha-value>)',
          600: 'rgb(var(--color-purple-600) / <alpha-value>)',
          700: 'rgb(var(--color-purple-700) / <alpha-value>)',
          800: 'rgb(var(--color-purple-800) / <alpha-value>)',
          900: 'rgb(var(--color-purple-900) / <alpha-value>)',
        },
        ess: {
          purple: '#9333EA',
          darkPurple: '#581c87',
          navy: '#0F172A',
          blue: '#1E3A8A',
          light: '#F3F4F6',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'sm': '0 2px 8px -2px rgba(147, 51, 234, 0.05), 0 1px 4px -1px rgba(147, 51, 234, 0.03)',
        'md': '0 8px 24px -4px rgba(147, 51, 234, 0.06), 0 4px 10px -2px rgba(147, 51, 234, 0.04)',
        'lg': '0 16px 32px -4px rgba(147, 51, 234, 0.08), 0 8px 16px -4px rgba(147, 51, 234, 0.04)',
        'xl': '0 24px 48px -12px rgba(147, 51, 234, 0.12), 0 12px 24px -8px rgba(147, 51, 234, 0.06)',
        '2xl': '0 32px 64px -16px rgba(147, 51, 234, 0.16), 0 16px 32px -12px rgba(147, 51, 234, 0.08)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'fade-in-up': 'fadeInUp 0.4s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}