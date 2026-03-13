/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#030213',
        muted: { DEFAULT: '#ececf0', foreground: '#717182' },
        accent: { DEFAULT: '#e9ebef', foreground: '#030213' },
        input: '#f3f3f5',
      },
      borderRadius: {
        'figma': '0.625rem',
      },
    },
  },
  plugins: [],
}
