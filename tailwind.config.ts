import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{html,ts}', // Escanea todo HTML y TypeScript dentro de src
  ],
  theme: {
    extend: {
      colors: {
        backgroundMain: 'var(--backgroundMain)',
        darkText: 'var(--darkText)',
        lightText: 'var(--lightText)',
        lines: 'var(--lines)',
        backgroundLight: 'var(--backgroundLight)',
        primary: 'var(--primary)',
        secondary: 'var(--secondary)',
        backgroundActive: 'var(--backgroundActive)',
        disabled: 'var(--disabled)',
      },
    },
  },
  plugins: [
    // Aquí puedes añadir plugins Tailwind si quieres
  ],
};

export default config;
