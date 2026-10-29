/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Minimal palette - black, white, one accent
        bg: 'rgb(var(--bg) / <alpha-value>)',
        fg: 'rgb(var(--fg) / <alpha-value>)',
        accent: 'hsl(var(--accent) / <alpha-value>)',
      },
      animation: {
        'slow-rotate': 'rotate 20s linear infinite',
        'fade-in': 'fadeIn 600ms cubic-bezier(0.4, 0, 0.2, 1)',
        'fade-up': 'fadeUp 600ms cubic-bezier(0.4, 0, 0.2, 1)',
        'scale-in': 'scaleIn 600ms cubic-bezier(0.4, 0, 0.2, 1)',
      },
      keyframes: {
        rotate: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeUp: {
          '0%': { 
            opacity: '0',
            transform: 'translateY(10px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        scaleIn: {
          '0%': { 
            opacity: '0',
            transform: 'scale(0.95)',
          },
          '100%': {
            opacity: '1',
            transform: 'scale(1)',
          },
        },
      },
      fontFamily: {
        display: ['Syne', 'system-ui', 'sans-serif'],
        body: ['Syne', 'system-ui', 'sans-serif'],
      },
      screens: {
        'hover-hover': { raw: '(hover: hover)' },
      },
      borderRadius: {
        'xl': 'var(--radius)',
      },
      transitionDuration: {
        'base': 'var(--transition)',
      },
    },
  },
  plugins: [],
}
