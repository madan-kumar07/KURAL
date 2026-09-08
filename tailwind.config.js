/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sky: {
          25:  '#f0f8ff',
          50:  '#e6f3ff',
          100: '#cce7ff',
          200: '#99cfff',
          300: '#66b8ff',
          400: '#33a0ff',
          500: '#0088ff',
          600: '#006dcc',
          700: '#005299',
          800: '#003766',
          900: '#001b33',
        },
        glass: {
          white: 'rgba(255,255,255,0.72)',
          blue:  'rgba(224,240,255,0.60)',
          dark:  'rgba(10,30,60,0.08)',
        },
      },
      fontFamily: {
        sans: ['"Inter"', '"SF Pro Display"', '"Segoe UI"', 'system-ui', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '40px',
      },
      animation: {
        'breathe': 'breathe 2.4s ease-in-out infinite',
        'pulse-ring': 'pulse-ring 2s cubic-bezier(0.4,0,0.6,1) infinite',
        'fade-in': 'fade-in 0.35s ease-out',
        'slide-up': 'slide-up 0.4s cubic-bezier(0.16,1,0.3,1)',
        'slide-down': 'slide-down 0.3s ease-out',
      },
      keyframes: {
        breathe: {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%':       { transform: 'scale(1.06)', opacity: '0.85' },
        },
        'pulse-ring': {
          '0%':   { transform: 'scale(0.9)', opacity: '0.8' },
          '70%':  { transform: 'scale(1.3)', opacity: '0' },
          '100%': { transform: 'scale(0.9)', opacity: '0' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        'slide-up': {
          from: { transform: 'translateY(16px)', opacity: '0' },
          to:   { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-down': {
          from: { transform: 'translateY(-8px)', opacity: '0' },
          to:   { transform: 'translateY(0)', opacity: '1' },
        },
      },
      boxShadow: {
        'glass': '0 4px 32px rgba(0,100,200,0.08), 0 1px 4px rgba(0,0,0,0.04)',
        'glass-lg': '0 8px 48px rgba(0,100,200,0.12), 0 2px 8px rgba(0,0,0,0.06)',
        'glass-xl': '0 16px 64px rgba(0,100,200,0.16), 0 4px 16px rgba(0,0,0,0.08)',
        'orb': '0 0 0 1px rgba(0,136,255,0.15), 0 8px 32px rgba(0,136,255,0.20)',
        'orb-active': '0 0 0 2px rgba(0,136,255,0.4), 0 12px 48px rgba(0,136,255,0.35)',
      },
    },
  },
  plugins: [],
}
