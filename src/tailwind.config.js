/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./components/**/*.{js,jsx}",
    "./pages/**/*.{js,jsx}",
    "./contexts/**/*.{js,jsx}",
    "./lib/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        'electric-blue': '#0066FF',
        'lime': '#84FF00',
      },
      fontFamily: {
        'display': ['"Plus Jakarta Sans"', 'sans-serif'],
        'body': ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      borderRadius: {
        '3xl': '24px',
      },
    },
  },
  plugins: [],
}
