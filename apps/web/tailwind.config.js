/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        slate: {
          950: '#0b1120',
          900: '#1E2A38',
          800: '#243344',
        },
        cream: '#F8F5F0',
        green: {
          brand: '#2D7D52',
          light: '#3a9966',
          dark: '#22623f',
        },
        amber: {
          brand: '#E6A817',
        },
      },
      fontFamily: {
        display: ['Georgia', 'serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
