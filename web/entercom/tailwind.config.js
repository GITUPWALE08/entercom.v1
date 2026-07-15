/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
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