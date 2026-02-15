module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Pop Art Palette
        'pop-red': '#FF0000',
        'pop-yellow': '#FFFF00',
        'pop-blue': '#00AAFF',
        'pop-pink': '#FF69B4',
        'pop-lime': '#00FF7F',
        'pop-purple': '#9B59B6',
        'pop-black': '#000000',
        'pop-white': '#FFFFFF',
        'pop-gray': '#FAFAFA',
      },
      fontFamily: {
        'pop': ['Poppins', 'system-ui', 'sans-serif'],
      },
      borderWidth: {
        '3': '3px',
        '4': '4px',
      },
      boxShadow: {
        'pop': '4px 4px 0px 0px #000000',
        'pop-sm': '2px 2px 0px 0px #000000',
        'pop-lg': '6px 6px 0px 0px #000000',
        'pop-hover': '6px 6px 0px 0px #000000',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'pop-bounce': {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1)' },
        },
        'comic-shake': {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-5px) rotate(-1deg)' },
          '75%': { transform: 'translateX(5px) rotate(1deg)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out forwards',
        'pop-bounce': 'pop-bounce 0.3s ease-out',
        'comic-shake': 'comic-shake 0.3s ease-in-out',
      },
    },
  },
  plugins: [],
}
