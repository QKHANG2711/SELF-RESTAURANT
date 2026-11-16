/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#FDFBF7',
          100: '#FAF7EE',
          200: '#F4EFE0',
          300: '#ECE3CE',
        },
        charcoal: {
          800: '#2A2E35',
          900: '#1A1D23',
          950: '#111317',
        },
        olive: {
          50: '#F4F7F4',
          100: '#E4EDE5',
          600: '#3D6B52',
          700: '#2E5540',
          800: '#234232',
          900: '#182E23',
        },
        terracotta: {
          50: '#FDF7F4',
          100: '#FAEEE7',
          500: '#D97746',
          600: '#C25E2E',
          700: '#A34B22',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['Playfair Display', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}
