import colors from "tailwindcss/colors";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      // Tông "giấy & bìa da" cho tiệm sách
      colors: {
        primary: "#3e2c23", // nâu gỗ đậm (bìa da): nút, tiêu đề
        secondary: "#6b4a38", // nâu sáng hơn: hover, cuối gradient
        accent: "#a8432a", // đỏ gạch: giá tiền, điểm nhấn
        paper: "#f7f2e8", // nền kem như trang giấy
        light: "#fbf8f2",
        dark: "#231912",
        gray: colors.stone, // xám ấm thay xám lạnh
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        serif: ["Lora", "Georgia", "serif"],
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
        "3xl": "2rem",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};