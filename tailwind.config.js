/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        farm: { DEFAULT: '#1B5E20', dark: '#0F3D13', light: '#4CAF50', pale: '#E8F5E9' },
        earth: { DEFAULT: '#795548', light: '#A1887F', pale: '#EFEBE9' },
        page: '#F4F5F0'
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'Segoe UI', 'Roboto', 'sans-serif'] }
    }
  },
  plugins: []
}
