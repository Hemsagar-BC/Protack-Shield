/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          900: '#0a0e1a',
          800: '#111827',
          700: '#1a2332',
          600: '#243044',
          500: '#2d3b52',
          400: '#4a5568',
          300: '#718096',
          200: '#a0aec0',
          100: '#cbd5e0',
        },
        neon: {
          blue: '#00d4ff',
          green: '#00ff88',
          red: '#ff3366',
          amber: '#ffaa00',
          purple: '#a855f7',
          cyan: '#06b6d4',
        },
      },
      boxShadow: {
        'neon-blue': '0 0 15px rgba(0, 212, 255, 0.3), 0 0 30px rgba(0, 212, 255, 0.1)',
        'neon-green': '0 0 15px rgba(0, 255, 136, 0.3), 0 0 30px rgba(0, 255, 136, 0.1)',
        'neon-red': '0 0 15px rgba(255, 51, 102, 0.3), 0 0 30px rgba(255, 51, 102, 0.1)',
        'neon-amber': '0 0 15px rgba(255, 170, 0, 0.3), 0 0 30px rgba(255, 170, 0, 0.1)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.37)',
      },
      backdropBlur: {
        xs: '2px',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(0, 212, 255, 0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(0, 212, 255, 0.6)' },
        },
      },
    },
  },
  plugins: [],
}
