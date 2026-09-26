/** @type {import('tailwindcss').Config} */
const token = (name) => `rgb(var(--${name}-rgb) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        bg: token('bg'),
        surface: token('surface'),
        'surface-muted': token('surface-muted'),
        border: token('border'),
        text: token('text'),
        'text-muted': token('text-muted'),
        primary: {
          DEFAULT: token('primary'),
          hover: token('primary-hover'),
          soft: token('primary-soft'),
        },
        accent: {
          DEFAULT: token('accent'),
          soft: token('accent-soft'),
        },
        'on-primary': token('on-primary'),
        'on-accent': token('on-accent'),
        success: {
          DEFAULT: token('success'),
          soft: token('success-soft'),
        },
        danger: {
          DEFAULT: token('danger'),
          soft: token('danger-soft'),
        },
        info: token('info'),
      },
      fontFamily: {
        // Telegram renders with the platform font: SF Pro on Apple, Roboto on
        // Android, Segoe UI on Windows.
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Text"',
          'Roboto',
          '"Segoe UI"',
          '"Helvetica Neue"',
          'Arial',
          'sans-serif',
        ],
        mono: ['ui-monospace', '"SF Mono"', '"Roboto Mono"', 'Menlo', 'Consolas', 'monospace'],
      },
      fontSize: {
        'page-title': ['22px', { lineHeight: '1.25', fontWeight: '600' }],
        'section-title': ['17px', { lineHeight: '1.3', fontWeight: '600' }],
        'card-title': ['16px', { lineHeight: '1.35', fontWeight: '500' }],
        body: ['15px', { lineHeight: '1.45' }],
        question: ['17px', { lineHeight: '1.5' }],
        small: ['13px', { lineHeight: '1.4' }],
      },
      borderRadius: {
        control: '10px',
        card: '12px',
        sheet: '14px',
      },
      maxWidth: {
        content: '640px',
      },
      height: {
        nav: '64px',
      },
      spacing: {
        'safe-top': 'var(--safe-top)',
        'safe-bottom': 'var(--safe-bottom)',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'sheet-in': {
          from: { transform: 'translateY(100%)' },
          to: { transform: 'translateY(0)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.45' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 180ms ease-out both',
        'slide-up': 'slide-up 220ms ease-out both',
        'sheet-in': 'sheet-in 240ms cubic-bezier(0.32, 0.72, 0, 1) both',
        'pulse-soft': 'pulse-soft 1.4s ease-in-out infinite',
        shimmer: 'shimmer 1.6s infinite',
      },
    },
  },
  plugins: [],
};
