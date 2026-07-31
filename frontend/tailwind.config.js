/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        surface: '#0f1117',
        panel:   '#161b27',
        card:    '#1e2535',
        border:  '#2a3348',
        accent:  '#6c8ef5',
        'accent-dim': '#3d5299',
        muted:   '#8892a4',
        bright:  '#e8edf5',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
