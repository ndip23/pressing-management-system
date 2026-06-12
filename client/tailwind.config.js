/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'apple-gray': {
          50:  '#f9f9fb',
          100: '#f5f5f7',
          200: '#e8e8ed',
          300: '#d2d2d7',
          400: '#bfbfc3',
          500: '#8e8e93',
          600: '#636366',
          700: '#48484a',
          800: '#3a3a3c',
          900: '#2c2c2e',
          950: '#1c1c1e',
        },
        'apple-blue': {
          DEFAULT: '#007aff',
          light: '#58a6ff',
          dark: '#0a84ff',
        },
        'apple-green': '#34c759',
        'apple-red': '#ff3b30',
        'apple-yellow': '#ffcc00',
        'apple-orange': '#ff9500',
        'apple-purple': '#af52de',
        'apple-teal': '#5ac8fa',
      },

      fontFamily: {
        sans: [
          '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto',
          '"Helvetica Neue"', 'Arial', 'sans-serif',
          '"Apple Color Emoji"', '"Segoe UI Emoji"', '"Segoe UI Symbol"'
        ],
      },

      boxShadow: {
        'apple-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        'apple': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
        'apple-md': '0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -2px rgba(0, 0, 0, 0.07)',
        'apple-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.07), 0 4px 6px -4px rgba(0, 0, 0, 0.07)',
        'apple-xl': '0 20px 25px -5px rgba(0,0,0,0.07), 0 8px 10px -6px rgba(0,0,0,0.07)',
      },

      borderRadius: {
        'apple-sm': '0.375rem',
        'apple': '0.5rem',
        'apple-md': '0.625rem',
        'apple-lg': '0.75rem',
        'apple-xl': '1rem',
      },

      backdropBlur: {
        'apple': '12px',
      },

      transitionTimingFunction: {
        'apple': 'cubic-bezier(0.25, 0.1, 0.25, 1)',
      },

      /* ✅ Floating animation added here */
      keyframes: {
        float: {
          '0%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
          '100%': { transform: 'translateY(0)' },
        },
      },
      animation: {
        float: 'float 4s ease-in-out infinite',
      },
    },
  },

  plugins: [
    require('@tailwindcss/forms')({
      strategy: 'class',
    }),
  ],
};
