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
        sgds: {
          red: {
            DEFAULT: '#d42426',
            hover: '#b51c1e',
            dark: '#8c1517',
            light: '#fdf2f2',
            border: '#f8b4b6',
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
            blue: '#0284c7',
            blueLight: '#f0f9ff',
            amber: '#d97706',
            amberLight: '#fffbeb',
            green: '#059669',
            greenLight: '#ecfdf5',
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
        card: '0 1px 3px 0 rgba(0, 0, 0, 0.08), 0 1px 2px -1px rgba(0, 0, 0, 0.06)',
        elevated: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.08)',
        modal: '0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
      },
    },
  },
  plugins: [],
};
