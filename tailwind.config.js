/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // ── Navigation / shell ──────────────────────────────────────────
        sidebar: '#002832',          // Dark Teal — nav container

        // ── FieldSync Primary ───────────────────────────────────────────
        teal: {
          DEFAULT: '#002832',
          50:  '#e6f5fa',
          100: '#b4f2fe',  // Light Cyan
          200: '#5ad3fe',  // Light Turquoise
          300: '#0b9fdf',  // Warm Turquoise
          400: '#097eb3',  // Cool Turquoise
          500: '#0b9fdf',
          600: '#097eb3',
          700: '#006080',
          800: '#003f55',
          900: '#002832',  // Dark Teal
        },

        // ── Indigo — buttons, CTAs, static headings ────────────────────
        indigo: {
          DEFAULT: '#404CD4',
          50:  '#eef0fb',
          100: '#d5d9f5',
          200: '#aab3ec',
          300: '#8796ff',
          400: '#596ae5',  // Hover Indigo LM
          500: '#404cd4',  // Indigo LM
          600: '#3340b5',
          700: '#2a3499',
          800: '#1f2780',
          900: '#141a66',
        },

        // ── Green — passing conditions, success, add/edit emblems ───────
        green: {
          DEFAULT: '#0D5C32',
          50:  '#e8f5ee',
          100: '#c2e3d1',
          200: '#87c79f',  // DM hover green
          300: '#45b56e',  // DM static green
          400: '#148649',  // LM hover green
          500: '#148649',
          600: '#0d5c32',  // LM static green
          700: '#0a4827',
          800: '#07341c',
          900: '#042011',
        },

        // ── Red — failing conditions, deletion ─────────────────────────
        red: {
          DEFAULT: '#C00000',
          50:  '#fce8e8',
          100: '#f9c2c2',
          200: '#fc6f6f',  // DM static red
          300: '#e35555',
          400: '#c94444',  // LM hover red
          500: '#c94444',
          600: '#c00000',  // LM static red
          700: '#a30000',
          800: '#850000',
          900: '#660000',
        },

        // ── Amber — warnings, visited links ────────────────────────────
        amber: {
          DEFAULT: '#A66F00',
          50:  '#fdf6e7',
          100: '#fae5b3',
          200: '#f5cc66',
          300: '#cb8300',  // LM hover yellow
          400: '#cb8300',
          500: '#a66f00',  // LM static yellow
          600: '#a66f00',
          700: '#8a5c00',
          800: '#6b4700',
          900: '#4d3200',
        },

        // ── Orange — waiting queue ──────────────────────────────────────
        orange: {
          DEFAULT: '#B25000',
          50:  '#fdf0e6',
          100: '#fad8b3',
          200: '#f5b066',
          300: '#e16500',  // LM hover orange
          400: '#e16500',
          500: '#b25000',  // LM static orange
          600: '#b25000',
          700: '#8c3e00',
          800: '#6b2e00',
          900: '#4d2000',
        },

        // ── Purple — progress bar, unvisited links, AI ─────────────────
        purple: {
          DEFAULT: '#5B3BB3',
          50:  '#f0ecfb',
          100: '#d9d1f4',
          200: '#b9aaeb',
          300: '#d9baff',  // DM hover purple
          400: '#7a68a6',  // LM hover purple
          500: '#7a68a6',
          600: '#5b3bb3',  // LM static purple
          700: '#4a2e99',
          800: '#38207a',
          900: '#25145c',
        },

        // ── Blue — hyperlinks ───────────────────────────────────────────
        blue: {
          DEFAULT: '#276AFC',
          50:  '#eaf1ff',
          100: '#ccdcff',
          200: '#99b9ff',
          300: '#6696ff',  // DM link blue
          400: '#276afc',  // LM link blue
          500: '#276afc',
          600: '#1a5fe0',
          700: '#1050c0',
          800: '#0840a0',
          900: '#053080',
        },

        // ── Grays (FieldSync semantic) ──────────────────────────────────
        'hover-gray-lm':  '#F7FAFC',
        'bg-gray-lm':     '#F1F5F9',
        'nav-gray':       '#E2E8F0',
        'std-gray-dm':    '#AFB7C1',
        'std-gray-lm':    '#64748B',
        'hover-gray-dm':  '#445265',
        'container-gray': '#24303F',
      },

      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
