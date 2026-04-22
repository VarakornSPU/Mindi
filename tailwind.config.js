/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        mindi: {
          ink: '#2c2940',
          sidebar: '#2f2742',
        },
      },
      boxShadow: {
        bubble: '0 6px 20px rgba(47, 39, 66, 0.08)',
      },
      animation: {
        'slide-up': 'slideUp 0.25s ease-out',
      },
      keyframes: {
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
