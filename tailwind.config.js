/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0A0A0A',      // near-black background
        yellow: {
          DEFAULT: '#FFD400', // the star
          warm: '#FFE000',
          deep: '#F7D000',
        },
        paper: '#FFFFFF',
        muted: '#9A9A9A',
      },
      fontFamily: {
        display: ['"Clash Display"', 'system-ui', 'sans-serif'],
        body: ['"General Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        tightest: '-0.04em',
      },
      keyframes: {
        breathe: {
          '0%, 100%': { opacity: '0.55' },
          '50%': { opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
      animation: {
        breathe: 'breathe 4s ease-in-out infinite',
        float: 'float 6s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
