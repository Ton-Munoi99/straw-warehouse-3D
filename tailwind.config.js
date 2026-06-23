/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        forest: '#2f6b3f',
        'forest-dark': '#163a22',
        straw: '#c8902f',
        ink: '#1f2a24',
        muted: '#7c8a80',
        'app-bg': '#e9ece2',
        hairline: '#e4e0d4',
        'pale-green': '#eef5ee',
      },
      fontFamily: {
        sans: ["'Plus Jakarta Sans'", 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
