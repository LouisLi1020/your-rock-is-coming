/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        display: ['Fraunces', 'Lora', 'Georgia', 'serif'],
        lora: ['Fraunces', 'Lora', 'serif'],
      },
      colors: {
        cream:      { DEFAULT: '#FAF9F6', dark: '#F2F0EB' },
        ink:        { DEFAULT: '#1A1A1A', soft: '#3D3D3D', muted: '#8A8A8A', faint: '#B5B5B5' },
        accent:     { DEFAULT: '#C8E632', hover: '#B8D42A', dim: 'rgba(200,230,50,0.15)', text: '#5A6B00' },
        green:      { DEFAULT: '#2DB87A', dim: 'rgba(45,184,122,0.1)', text: '#1A7A4F' },
        warning:    { DEFAULT: '#E8A830', dim: 'rgba(232,168,48,0.1)' },
        danger:     { DEFAULT: '#E05A5A' },

        sand:       '#FAF9F6',      // → cream
        bark:       '#1A1A1A',      // → ink
        'bark-lt':  '#3D3D3D',      // → ink-soft
        g50:        'rgba(200,230,50,0.15)',  // → accent-dim
        g100:       '#C8E632',      // → accent
        g200:       '#B8D42A',      // → accent-hover
        g400:       '#2DB87A',      // → green
        g600:       '#1A7A4F',      // → green-text
        g800:       '#145F3C',
        t50:        'rgba(45,184,122,0.1)',   // → green-dim
        t400:       '#2DB87A',
        t600:       '#1A7A4F',
        a50:        'rgba(232,168,48,0.1)',   // → warning-dim
        a400:       '#E8A830',
        primary:    '#2DB87A',      // → green
        'primary-fg': '#fff',
      },
      borderRadius: {
        DEFAULT:    '14px',
        sm:         '10px',
        xs:         '6px',
        pill:       '50px',
        // 他的别名
        chip:       '50px',
        panel:      '14px',
        card:       '14px',
      },
    },
  },
  plugins: [],
}
