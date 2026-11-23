/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          DEFAULT: '#294638',
          50: '#F3F6F4',
          100: '#E4ECE7',
          200: '#C7D8CF',
          300: '#A6B3A1', // Muted sage accent
          400: '#5C7F6E',
          500: '#3E6151',
          600: '#324F40',
          700: '#294638', // Deep forest green
          800: '#1F352B',
          900: '#15241D',
        },
        ivory: {
          DEFAULT: '#F3F0E9', // Warm ivory
          50: '#FAF9F6', // Off-white
          100: '#F3F0E9',
          200: '#E7E1D7', // Soft beige
          300: '#DCD6CA',
          400: '#CFC5B5',
        },
        beige: {
          DEFAULT: '#E7E1D7', // Soft beige
          50: '#F8F6F2',
          100: '#EFECE5',
          200: '#E7E1D7',
          300: '#DAD2C4',
          400: '#C8BEAD',
        },
        charcoal: {
          DEFAULT: '#292D29', // Body text
          muted: '#5F685F',
          light: '#7B847B',
        },
        offwhite: '#FAF9F6', // Cards and content areas
        sage: {
          50: '#F4F6F4',
          100: '#E7ECE8',
          200: '#D2DDD8',
          300: '#A6B3A1', // Muted sage
          400: '#6F8A80',
          500: '#4D6D63',
          600: '#3D5A50',
          700: '#294638', // Deep forest green
          800: '#1F352B',
          900: '#15241D',
        },
        alabaster: {
          50: '#FAF9F6',
          100: '#F3F0E9',
          200: '#E7E1D7',
          300: '#DCD6CA',
          400: '#CFC5B5',
        },
        clinical: {
          text: '#292D29',
          muted: '#5F685F',
          card: '#FAF9F6',
          border: '#E7E1D7',
          amber: '#8A4B1A',
          amberBg: '#FBF0E4',
          amberBorder: '#ECC9A5',
          burgundy: '#8B3A3A',
          burgundyBg: '#FBEBEB',
          burgundyBorder: '#E8BDBD',
        }
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', '"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Inter"', '"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      }
    },
  },
  plugins: [],
}
