import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        primary: {
          DEFAULT: '#2563eb', // blue-600
          hover: '#1d4ed8', // blue-700
        },
        secondary: {
          DEFAULT: '#9333ea', // purple-600
          hover: '#7e22ce', // purple-700
        },
        success: {
          DEFAULT: '#15803d', // green-700
          hover: '#166534', // green-800
        },
        warning: {
          DEFAULT: '#ea580c', // orange-600
          hover: '#c2410c', // orange-700
        },
        danger: {
          DEFAULT: '#dc2626', // red-600
          hover: '#b91c1c', // red-700
        },
      },
    },
  },
  plugins: [],
};

export default config;
