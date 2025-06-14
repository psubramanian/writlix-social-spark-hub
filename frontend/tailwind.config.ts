
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
        border: {
          DEFAULT: 'hsl(var(--border))',
          dark: 'hsl(var(--border-dark))',
        },
        input: {
          DEFAULT: 'hsl(var(--input))',
          dark: 'hsl(var(--input-dark))',
        },
        ring: {
          DEFAULT: 'hsl(var(--ring))',
          dark: 'hsl(var(--ring-dark))',
        },
        background: {
          DEFAULT: 'hsl(var(--background))',
          dark: 'hsl(var(--background-dark))',
        },
        foreground: {
          DEFAULT: 'hsl(var(--foreground))',
          dark: 'hsl(var(--foreground-dark))',
        },
        primary: {
          DEFAULT: '#0FA0CE',
          foreground: '#FFFFFF',
          dark: '#0D8EB8',
          'dark-foreground': '#FFFFFF'
        },
        secondary: {
          DEFAULT: '#F97316',
          foreground: '#FFFFFF',
          dark: '#E56005',
          'dark-foreground': '#FFFFFF'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
          dark: 'hsl(var(--destructive-dark))',
          'dark-foreground': 'hsl(var(--destructive-foreground-dark))',
        },
        muted: {
          DEFAULT: '#F6F6F7',
          foreground: '#9F9EA1',
          dark: '#222222',
          'dark-foreground': '#8A898C',
        },
        accent: {
          DEFAULT: '#0FA0CE',
          foreground: '#FFFFFF',
          dark: '#0D8EB8',
          'dark-foreground': '#FFFFFF',
        },
        popover: {
          DEFAULT: '#FFFFFF',
          foreground: '#000000',
          dark: '#121212',
          'dark-foreground': '#FFFFFF',
        },
        card: {
          DEFAULT: '#FFFFFF',
          foreground: '#000000',
          dark: '#121212',
          'dark-foreground': '#FFFFFF',
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
