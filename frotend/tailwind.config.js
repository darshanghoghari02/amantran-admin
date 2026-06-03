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
          bg: '#FCFAFB',         // Ultra-clean modern off-white/light gray with a rose-tint
          card: '#FFFFFF',       // Pure white card background
          pink: {
            light: '#FFF0F2',    // Soft rose-blush pink
            medium: '#FFCAD2',   // Beautiful modern soft rose pink
            dark: '#FF3E5C',     // Vibrant bright rose/coral red from the mobile app
            hover: '#E62E47',    // Premium vibrant rose hover accent
          },
          gold: {
            light: '#FFF4E6',    // Warm soft cream gold
            accent: '#F7C566',   // Clean modern gold accent
            dark: '#C9943B',     // Deep polished luxury gold
          },
          charcoal: {
            light: '#231A1C',    // Subdued dark gray/rose for sub-containers and active item indicators
            dark: '#0B0809',     // Rich dark charcoal black for dark sidebar and editor headers
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
