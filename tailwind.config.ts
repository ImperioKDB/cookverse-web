import type { Config } from 'tailwindcss';

// Tokens from 06-design-system.md — do not hand-pick colors/fonts per screen,
// extend this file instead so the whole app stays derived from one source.
const config: Config = {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        char: '#1C1815',
        flour: '#F1ECE3',
        chili: '#C7401F',
        turmeric: '#D69A2D',
        bay: '#4B5D3A',
        copper: '#B87333',
      },
      fontFamily: {
        display: ['var(--font-fraunces)', 'serif'],
        sans: ['var(--font-public-sans)', 'ui-sans-serif', 'system-ui'],
        mono: ['var(--font-jetbrains-mono)', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        sm: '6px',
        lg: '12px',
      },
      screens: {
        sm: '375px',
        md: '768px',
        lg: '1024px',
        xl: '1440px',
      },
    },
  },
  plugins: [],
};

export default config;
