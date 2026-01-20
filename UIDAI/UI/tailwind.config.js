/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#131722', // TradingView dark bg
        surface: '#1e222d',
        border: '#2a2e39',
        primary: '#2962ff', // Brand blue
        success: '#26a69a', // Green
        danger: '#ef5350', // Red
        text: '#d1d4dc',
        textSecondary: '#787b86',
        grid: '#1e222d',
      }
    },
  },
  plugins: [],
}
