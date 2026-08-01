/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit', 'Heebo', 'sans-serif'],
        hebrew: ['Heebo', 'sans-serif'],
      },
      colors: {
        shelf: {
          bg: '#0f172a',
          card: 'rgba(255,255,255,0.05)',
          border: 'rgba(255,255,255,0.1)',
        },
        tile: {
          sale: '#ef4444',
          switch: '#3b82f6',
          push: '#f97316',
          steal: '#eab308',
        },
      },
      animation: {
        'tile-float': 'tileFloat 3s ease-in-out infinite',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
      },
      keyframes: {
        tileFloat: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
      boxShadow: {
        'tile': '0 4px 12px rgba(0,0,0,0.4)',
        'glow-yellow': '0 0 20px rgba(250,204,21,0.4)',
        'glow-blue': '0 0 20px rgba(96,165,250,0.4)',
      },
    },
  },
  plugins: [],
};
