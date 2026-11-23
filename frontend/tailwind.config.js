/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sage: {
          50: '#F4F6F4',
          100: '#E6ECE9',
          200: '#D2DDD8',
          300: '#A8BCB3',
          400: '#6F8A80',
          500: '#4D6D63',
          600: '#3D5A50',
          700: '#2F4F46',
          800: '#233B34',
          900: '#182823',
        },
        alabaster: {
          50: '#FAFAF8',
          100: '#F7F7F5',
          200: '#EAECE8',
          300: '#E2E5E0',
          400: '#D5D9D2',
        },
        clinical: {
          text: '#1C2522',
          muted: '#5C6B64',
          card: '#FFFFFF',
          border: '#E2E5E0',
          amber: '#8A4B1A',
          amberBg: '#FBF0E4',
          amberBorder: '#ECC9A5',
          burgundy: '#8B3A3A',
          burgundyBg: '#FBEBEB',
          burgundyBorder: '#E8BDBD',
        }
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', '"Inter"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      }
    },
  },
  plugins: [],
}
