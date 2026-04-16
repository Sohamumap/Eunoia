/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  theme: {
    extend: {
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['DM Sans', '-apple-system', 'sans-serif'],
      },
      colors: {
        cream: '#F8F5F0',
        'warm-white': '#FDFCFA',
        charcoal: '#1C1C1E',
        mid: '#6B6B70',
        accent: '#C17B2F',
        'accent-light': '#E8A84C',
        sage: '#4A7C59',
        rose: '#C0726A',
        'eunoia-blue': '#4A6FA5',
        lavender: '#7B6FA5',
        'card-bg': '#FFFFFF',
        'eunoia-border': '#E8E4DE',
      },
      borderRadius: {
        'eunoia': '18px',
        lg: '18px',
        md: '14px',
        sm: '10px',
      },
      boxShadow: {
        'eunoia': '0 2px 20px rgba(0,0,0,0.07)',
        'eunoia-hover': '0 4px 30px rgba(0,0,0,0.10)',
      },
      animation: {
        'fade-up': 'fadeUp 0.38s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'pulse-crisis': 'pulseGlow 3s ease-in-out infinite',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
