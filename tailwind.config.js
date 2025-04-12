/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: '100%',
            code: {
              color: 'var(--tw-prose-code)',
              fontWeight: '400',
              backgroundColor: 'hsl(var(--muted))',
              borderRadius: '0.25rem',
              paddingLeft: '0.25rem',
              paddingRight: '0.25rem',
            },
            'code::before': {
              content: '""',
            },
            'code::after': {
              content: '""',
            },
            pre: {
              backgroundColor: 'hsl(var(--muted))',
              borderRadius: '0.375rem',
              padding: '0.75rem 1rem',
              overflowX: 'auto',
            },
            'pre code': {
              backgroundColor: 'transparent',
              borderRadius: '0',
              padding: '0',
              fontWeight: '400',
            },
            h1: {
              fontWeight: '700',
              fontSize: '1.875rem',
              marginTop: '2rem',
              marginBottom: '1rem',
            },
            h2: {
              fontWeight: '600',
              fontSize: '1.5rem',
              marginTop: '1.5rem',
              marginBottom: '0.75rem',
            },
            h3: {
              fontWeight: '600',
              fontSize: '1.25rem',
              marginTop: '1.25rem',
              marginBottom: '0.6rem',
            },
            ul: {
              paddingLeft: '1.5rem',
            },
            ol: {
              paddingLeft: '1.5rem',
            },
            li: {
              marginTop: '0.25rem',
              marginBottom: '0.25rem',
            },
            a: {
              color: 'hsl(var(--primary))',
              textDecoration: 'underline',
              fontWeight: '500',
            },
            blockquote: {
              fontStyle: 'italic',
              borderLeftWidth: '0.25rem',
              borderLeftColor: 'hsl(var(--border))',
              paddingLeft: '1rem',
            },
            hr: {
              borderColor: 'hsl(var(--border))',
              marginTop: '2rem',
              marginBottom: '2rem',
            },
            table: {
              width: '100%',
              tableLayout: 'auto',
              textAlign: 'left',
              marginTop: '1.5rem',
              marginBottom: '1.5rem',
            },
            thead: {
              borderBottomWidth: '1px',
              borderBottomColor: 'hsl(var(--border))',
            },
            'thead th': {
              fontWeight: '600',
              paddingBottom: '0.5rem',
            },
            'tbody tr': {
              borderBottomWidth: '1px',
              borderBottomColor: 'hsl(var(--border))',
            },
            'tbody td': {
              padding: '0.5rem',
            },
          },
        },
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require('@tailwindcss/typography'),
  ],
} 