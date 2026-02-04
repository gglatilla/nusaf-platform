import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      screens: {
        'xs': '480px', // For very small phone handling
      },
      colors: {
        // Primary - Electric Blue family
        primary: {
          50: '#EFF6FF',   // Ice - subtle backgrounds
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',  // Sky - highlights, focus rings
          500: '#3B82F6',  // Bright Blue - hover states
          600: '#2563EB',  // Electric Blue - primary buttons, links
          700: '#1D4ED8',  // Deep Blue - pressed states
          800: '#1E40AF',
          900: '#1E3A8A',
        },
        // Slate - neutrals
        slate: {
          50: '#F8FAFC',   // Snow - section backgrounds
          100: '#F1F5F9',  // Cloud - tertiary backgrounds
          200: '#E2E8F0',  // Mist - borders, dividers
          300: '#CBD5E1',
          400: '#94A3B8',  // Silver - disabled text
          500: '#64748B',  // Steel - secondary text
          600: '#475569',
          700: '#334155',  // Charcoal - body text
          800: '#1E293B',  // Slate - sidebar hover
          900: '#0F172A',  // Ink - headings, dark sections
        },
        // Status colors
        success: {
          DEFAULT: '#10B981',
          light: '#D1FAE5',
        },
        warning: {
          DEFAULT: '#F59E0B',
          light: '#FEF3C7',
        },
        error: {
          DEFAULT: '#EF4444',
          light: '#FEE2E2',
        },
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'SF Mono', 'Courier New', 'monospace'],
      },
      fontSize: {
        'h1': ['3rem', { lineHeight: '1.1', fontWeight: '700' }],
        'h2': ['2.25rem', { lineHeight: '1.2', fontWeight: '700' }],
        'h3': ['1.5rem', { lineHeight: '1.3', fontWeight: '600' }],
        'h4': ['1.25rem', { lineHeight: '1.4', fontWeight: '600' }],
        'h5': ['1rem', { lineHeight: '1.4', fontWeight: '600' }],
        'body-lg': ['1.125rem', { lineHeight: '1.6', fontWeight: '400' }],
        'body': ['1rem', { lineHeight: '1.6', fontWeight: '400' }],
        'body-sm': ['0.875rem', { lineHeight: '1.5', fontWeight: '400' }],
        'caption': ['0.75rem', { lineHeight: '1.4', fontWeight: '500' }],
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
      borderRadius: {
        'sm': '4px',
        'md': '6px',
        'lg': '8px',
        'xl': '12px',
        '2xl': '16px',
      },
      boxShadow: {
        'sm': '0 1px 2px rgba(0,0,0,0.05)',
        'md': '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)',
        'lg': '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)',
        'xl': '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
        'blue': '0 4px 14px rgba(37, 99, 235, 0.25)',
      },
      transitionDuration: {
        'fast': '150ms',
        'base': '200ms',
        'slow': '300ms',
      },
    },
  },
  plugins: [],
};

export default config;
