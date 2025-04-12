/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      borderRadius: {
        md: '3px', // 6px
        lg: '3px', // 8px
        xl: '3px', // 12px
        '2xl': '3px', // 16px
      },
      boxShadow: {
        sm: '0 2px 4px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        md: '0 2px 4px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        lg: '0 2px 4px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        xl: '0 2px 4px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        '2xl':
          '0 2px 4px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      },
      animation: {
        'bounce-slow': 'bounce 2s infinite',
        'spin-slow': 'spin 3s linear infinite',
        'fade-in': 'fadeIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      scale: {
        102: '1.02',
      },
      fontWeight: {
        normal: '400',
        medium: '600',
        semibold: '600',
        bold: '600',
      },
      colors: {
        'black-rgba': 'rgba(0, 0, 0, 0.54)',
        indigo: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
      },
    },
    fontFamily: {
      sans: [
        'Inter',
        'ui-sans-serif',
        'system-ui',
        '-apple-system',
        'Segoe UI',
        'Roboto',
        'Helvetica Neue',
        'Arial',
        'Noto Sans',
        'sans-serif',
        'Apple Color Emoji',
        'Segoe UI Emoji',
        'Segoe UI Symbol',
        'Noto Color Emoji',
      ],
      mono: ['"Fira Code"', '"Fira Mono"', 'monospace']
    },
  },
  plugins: [
    function ({ addBase }) {
      addBase({
        button: {
          '@apply transition-colors duration-300 ease-in-out': {},
        },
      });
    },
  ],
};