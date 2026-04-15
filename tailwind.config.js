/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        smartops: {
          bg: '#050d12',
          primary: '#00e5cc',
          glow: '#00fff2',
          card: 'rgba(255,255,255,0.04)',
        }
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
        space: ['Space Grotesk', 'sans-serif'],
      },
      backgroundImage: {
        'grid-pattern': `linear-gradient(to right, rgba(0, 229, 204, 0.05) 1px, transparent 1px),
                         linear-gradient(to bottom, rgba(0, 229, 204, 0.05) 1px, transparent 1px)`,
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'grid-scroll': 'grid-scroll 20s linear infinite',
      },
      keyframes: {
        'grid-scroll': {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(50px)' },
        }
      }
    },
  },
  plugins: [],
}
