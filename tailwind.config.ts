
import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px'
      }
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: '#FFFFFF',
        foreground: '#000000',
        primary: {
          DEFAULT: '#0FA0CE',
          foreground: '#FFFFFF'
        },
        secondary: {
          DEFAULT: '#F97316',
          foreground: '#FFFFFF'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        muted: {
          DEFAULT: '#F6F6F7',
          foreground: '#9F9EA1'
        },
        accent: {
          DEFAULT: '#0FA0CE',
          foreground: '#FFFFFF'
        },
        popover: {
          DEFAULT: '#FFFFFF',
          foreground: '#000000'
        },
        card: {
          DEFAULT: '#FFFFFF',
          foreground: '#000000'
        },
        sidebar: {
          DEFAULT: '#000000',
          foreground: '#FFFFFF',
          border: '#333333',
          ring: '#0FA0CE',
          primary: '#0FA0CE',
          'primary-foreground': '#FFFFFF',
          accent: '#1A1A1A',
          'accent-foreground': '#FFFFFF'
        }
      }
    }
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
