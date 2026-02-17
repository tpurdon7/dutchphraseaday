import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#F6F7F5",
        ink: "#18222D",
        muted: "#64748B",
        accent: "#0D9488",
        accentSoft: "#CCFBF1",
        stroke: "#DCE3E9",
        card: "#FFFFFF"
      },
      boxShadow: {
        soft: "0 12px 40px -20px rgba(24, 34, 45, 0.25)",
        hover: "0 18px 45px -22px rgba(13, 148, 136, 0.4)"
      },
      animation: {
        rise: "rise 350ms ease-out",
        pulseSoft: "pulseSoft 900ms ease-out"
      },
      keyframes: {
        rise: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        pulseSoft: {
          "0%": { transform: "scale(0.98)", opacity: "0.65" },
          "100%": { transform: "scale(1)", opacity: "1" }
        }
      }
    }
  },
  plugins: []
};

export default config;
