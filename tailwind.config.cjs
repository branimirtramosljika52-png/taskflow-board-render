module.exports = {
  content: ["./src/ozo/**/*.{js,jsx}"],
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      colors: {
        navy: "#0F172A",
        safety: "#FACC15",
      },
      fontFamily: {
        sans: ["Inter", "Manrope", "system-ui", "sans-serif"],
      },
    },
  },
};
