/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        wedding: {
          bg: '#FDFBF7',         // Very warm cream luxury background
          card: '#FFFFFF',
          pink: {
            light: '#FFF0F2',    // Extremely soft blush pink for cards/hover
            medium: '#FFD1D7',   // Pastel rose pink
            dark: '#B86B77',     // Premium vintage rose pink
          },
          gold: {
            light: '#EED9B3',    // Delicate gold accent
            accent: '#D4AF37',   // Standard luxury gold
            dark: '#AA820A',     // Deep polished gold
          },
          charcoal: {
            light: '#3D3B3C',
            dark: '#1E1D1E',     // Deep premium charcoal for text/sidebars
          }
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        serif: ['Rasa', 'serif'],
        accent: ['KAP011', 'cursive']
      }
    },
  },
  plugins: [],
}
