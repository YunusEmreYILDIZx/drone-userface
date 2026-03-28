/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'glass-bg': 'rgba(20, 20, 25, 0.6)',
        'glass-border': 'rgba(255, 255, 255, 0.08)',
        'hud-green': '#00ff7f',
        'hud-alert': '#ff4500',
        'hud-cyan': '#00f0ff',
      }
    },
  },
  plugins: [],
}
