import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./App.tsx",
    "./main.tsx",
    "./components/**/*.{ts,tsx}",
    "./pages/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
    "./store/**/*.{ts,tsx}",
    "./services/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(217 33% 18%)",
        input: "hsl(217 33% 18%)",
        ring: "hsl(212 100% 60%)",
        background: "hsl(222 47% 6%)",
        foreground: "hsl(210 40% 98%)",
        primary: {
          DEFAULT: "hsl(212 100% 60%)",
          foreground: "hsl(210 40% 98%)"
        },
        secondary: {
          DEFAULT: "hsl(217 33% 18%)",
          foreground: "hsl(210 40% 98%)"
        },
        muted: {
          DEFAULT: "hsl(217 33% 14%)",
          foreground: "hsl(215 20% 70%)"
        },
        card: {
          DEFAULT: "hsl(222 47% 8%)",
          foreground: "hsl(210 40% 98%)"
        }
      },
      borderRadius: {
        lg: "0.75rem",
        md: "0.5rem",
        sm: "0.375rem"
      }
    }
  },
  plugins: [],
} satisfies Config;
