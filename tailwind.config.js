export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        sora: ["Sora", "sans-serif"],
        poppins: ["Poppins", "sans-serif"],
      },
      colors: {
        brand: {
          DEFAULT: "#C0392B",
          50: "#fff1f2",
          100: "#ffe4e8",
          200: "#ffcdd4",
          300: "#ff9daa",
          400: "#fb7185",
          500: "#cf3d4f",
          600: "#b82e40",
          700: "#922233",
          800: "#641724",
          light: "#E74C3C",
          dark: "#A93226",
        },
        primary: "#C0392B",
        "primary-dark": "#A93226",
        "primary-light": "#FADBD8",
        ink: "#16171d",
        mist: "#f4f5f7",
      },
      boxShadow: {
        card: "0 24px 80px rgba(15, 23, 42, 0.14)",
        soft: "0 24px 70px rgba(15, 23, 42, 0.10)",
        lift: "0 8px 32px rgba(0,0,0,0.13)",
      },
      backgroundImage: {
        grain:
          "radial-gradient(circle at top, rgba(255,255,255,0.2), transparent 45%)",
      },
      borderRadius: {
        "2xl": "14px",
        "3xl": "18px",
      },
      fontWeight: {
        normal: "400",
        medium: "500",
        semibold: "600",
        bold: "700",
        extrabold: "800",
        black: "900",
      },
    },
  },
  plugins: [],
};
