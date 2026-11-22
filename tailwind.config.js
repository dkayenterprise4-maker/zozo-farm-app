/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        farm: { DEFAULT: '#2E5A27', dark: '#1F3F1A', light: '#5B8C3E', pale: '#EEF3EA' },
        earth: { DEFAULT: '#795548', light: '#A1887F', pale: '#EFEBE9' },
        page: '#F6F5F1'
      },
      fontFamily: { sans: ['Source Sans 3', 'system-ui', 'Segoe UI', 'Roboto', 'sans-serif'] }
    }
  },
  plugins: []
}
