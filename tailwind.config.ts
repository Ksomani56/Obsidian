import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        // Dark theme (Matte Black)
        'dark-bg': '#000000',
        'dark-pane': '#0A0A0A',
        'dark-primary': '#FFFFFF',
        'dark-secondary': '#A0A0A0',
        'dark-border': '#1A1A1A',
        'dark-accent': '#FFFFFF',
        'dark-green': '#00FF88',
        'dark-red': '#FF4444',
        'dark-hover': 'rgba(255, 255, 255, 0.1)',
        
        // Light theme (Off-White)
        'light-bg': '#FAFAFA',
        'light-pane': '#FFFFFF',
        'light-primary': '#000000',
        'light-secondary': '#666666',
        'light-border': '#E0E0E0',
        'light-accent': '#000000',
        'light-green': '#00AA55',
        'light-red': '#CC0000',
        'light-hover': 'rgba(0, 0, 0, 0.05)',
        
        // Legacy TradingView colors (keeping for compatibility)
        'tv-dark-bg': '#131722',
        'tv-pane-bg': '#1E222D',
        'tv-primary-text': '#D1D4DC',
        'tv-secondary-text': '#868D9E',
        'tv-border': '#2A2E39',
        'tv-blue': '#2962FF',
        'tv-green': '#089981',
        'tv-red': '#F23645',
        'tv-hover-bg': 'rgba(41, 98, 255, 0.2)',
      },
    },
  },
  plugins: [],
  darkMode: 'class',
}
export default config
