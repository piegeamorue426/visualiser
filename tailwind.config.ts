import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/renderer/**/*.{ts,tsx,html}', './src/ui/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: '#0a0a0f',
          surface: '#12121a',
          border: '#1e1e2e',
          primary: '#00ffcc',
          secondary: '#ff00ff',
          accent: '#7b2dff',
          text: '#e0e0e0',
          muted: '#6b7280',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        neon: '0 0 10px rgba(0, 255, 204, 0.3), 0 0 40px rgba(0, 255, 204, 0.1)',
        'neon-pink': '0 0 10px rgba(255, 0, 255, 0.3), 0 0 40px rgba(255, 0, 255, 0.1)',
      },
    },
  },
  plugins: [],
};

export default config;
