/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        lora: ['Lora', 'serif'],
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
      colors: {
        sand: '#F9F6EE',
        bark: '#4a3728',
        'bark-lt': '#7a6255',
        g50: '#EAF3DE',
        g100: '#C0DD97',
        g200: '#97C459',
        g400: '#639922',
        g600: '#3B6D11',
        g800: '#27500A',
        t50: '#E1F5EE',
        t400: '#1D9E75',
        t600: '#0F6E56',
        a50: '#FAEEDA',
        a400: '#BA7517',
        primary: '#3B6D11',
        'primary-fg': '#fff',
      },
      borderRadius: {
        chip: '20px',
        panel: '16px',
        card: '12px',
      },
    },
  },
  plugins: [],
}
