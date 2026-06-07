/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,ts}'],
  theme: {
    extend: {
      colors: {
        console: {
          ink: '#08111f',
          panel: '#0d1726',
          raised: '#111d30',
          line: '#26364d',
          text: '#e7edf6',
          muted: '#91a1b9',
          cyan: '#5eead4',
          blue: '#60a5fa',
          green: '#86efac',
          amber: '#fcd34d'
        }
      },
      boxShadow: {
        glow: '0 0 40px rgba(94, 234, 212, 0.12)',
        panel: '0 24px 80px rgba(0, 0, 0, 0.32)'
      },
      keyframes: {
        token: {
          '0%': { opacity: '0', transform: 'translateY(3px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        scan: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' }
        }
      },
      animation: {
        token: 'token 480ms ease-out both',
        scan: 'scan 2.4s ease-in-out infinite'
      }
    }
  },
  plugins: []
};
