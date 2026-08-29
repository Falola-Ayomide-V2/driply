/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bone: {
          50: "#FBF9F4",
          100: "#F6F2E9",
          200: "#EDE6D3",
          300: "#E0D6BC",
          400: "#C9B98F",
        },
        ink: {
          900: "#15130F",
          800: "#2A2620",
          700: "#3D3830",
          600: "#5A5247",
          500: "#7A7163",
          400: "#9C9484",
        },
        ochre: {
          50: "#FBF6EC",
          100: "#F3E6C8",
          200: "#E6CC91",
          300: "#D9B361",
          400: "#C99B3A",
          500: "#B8862A",
          600: "#996F22",
        },
      },
      fontFamily: {
        display: ['"Bodoni Moda"', "Georgia", "serif"],
        sans: ['"Manrope"', "system-ui", "sans-serif"],
      },
      spacing: {
        safe: "env(safe-area-inset-bottom, 0px)",
      },
    },
  },
  plugins: [],
};
