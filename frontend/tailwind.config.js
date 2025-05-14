module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    screens: {
      xs: "320px",
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
      "2xl": "1536px",
    },
    extend: {
      colors: {
        primary: {
          // Warm kitchen tones
          mustard: "#E3B448",
          cherry: "#CB3737",
          olive: "#5C7A29",
        },
        accent: {
          // Bright teal for active elements
          teal: "#3ABBB3",
        },
        game: {
          background: "#FFF8E8",
          surface: "#FFFFFF",
          text: "#2D3748",
        },
      },
      fontFamily: {
        display: ["Fredoka One", "cursive"],
        body: ["Nunito", "sans-serif"],
      },
      animation: {
        "bounce-slow": "bounce 2s infinite",
        "pulse-fast": "pulse 1s infinite",
        wiggle: "wiggle 1s ease-in-out infinite",
      },
      keyframes: {
        wiggle: {
          "0%, 100%": { transform: "rotate(-3deg)" },
          "50%": { transform: "rotate(3deg)" },
        },
      },
    },
  },
  plugins: [],
};
