/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/features/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        transit: {
          blue: {
            DEFAULT: '#004b87',
            hover: '#003966',
            active: '#002a4a',
            light: '#f0f5fa',
            surface: '#e6eff7',
            border: '#b8d2eb',
          },
          teal: {
            DEFAULT: '#00847f',
            hover: '#006c68',
            active: '#005552',
            light: '#f0fdfa',
            border: '#99f6e4',
          },
          surface: {
            DEFAULT: '#ffffff',
            pale: '#f4f6f9',
            subtle: '#eef2f6',
            border: '#e2e8f0',
          },
          green: {
            DEFAULT: '#16a34a',
            dark: '#15803d',
            light: '#f0fdf4',
            border: '#bbf7d0',
          },
          amber: {
            DEFAULT: '#d97706',
            dark: '#b45309',
            light: '#fffbeb',
            border: '#fde68a',
          },
          red: {
            DEFAULT: '#dc2626',
            dark: '#b91c1c',
            light: '#fef2f2',
            border: '#fca5a5',
          },
          info: {
            DEFAULT: '#2563eb',
            light: '#eff6ff',
            border: '#bfdbfe',
          },
          mrt: {
            ewl: '#009640',
            nsl: '#d42e12',
            nel: '#9016b2',
            ccl: '#fa9e0d',
            dtl: '#005ec4',
            tel: '#9d5b25',
          },
        },
        sgds: {
          red: {
            DEFAULT: '#004b87', // Replaced with deep transit blue for legacy mappings
            hover: '#003966',
            dark: '#002a4a',
            light: '#f0f5fa',
            border: '#b8d2eb',
          },
          navy: {
            DEFAULT: '#1e293b',
            deep: '#0f172a',
            surface: '#334155',
          },
          gov: {
            header: '#f0f3f6',
            border: '#dbe2e8',
            masthead: '#2b303a',
          },
          accent: {
            blue: '#004b87',
            blueLight: '#f0f5fa',
            amber: '#d97706',
            amberLight: '#fffbeb',
            green: '#16a34a',
            greenLight: '#f0fdf4',
          }
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
      },
      minHeight: {
        screenDvh: '100dvh',
      },
      boxShadow: {
        xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        sm: '0 1px 3px 0 rgba(0, 0, 0, 0.08), 0 1px 2px -1px rgba(0, 0, 0, 0.04)',
        card: '0 1px 3px 0 rgba(0, 0, 0, 0.06), 0 1px 2px -1px rgba(0, 0, 0, 0.04)',
        elevated: '0 3px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -2px rgba(0, 0, 0, 0.04)',
        modal: '0 8px 20px -4px rgba(0, 0, 0, 0.15)',
      },
    },
  },
  plugins: [],
};
