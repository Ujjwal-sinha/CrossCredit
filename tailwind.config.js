/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Space Grotesk', 'system-ui', 'sans-serif'],
        'mono': ['JetBrains Mono', 'monospace'],
        'orbitron': ['Orbitron', 'monospace'],
      },
      colors: {
        // Cyber/Web3 color palette
        cyber: {
          50: '#f0fdff',
          100: '#ccf7fe',
          200: '#99effd',
          300: '#5ce1fa',
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
          950: '#083344',
        },
        neon: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
        matrix: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        dark: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'gradient-cyber': 'linear-gradient(135deg, #06b6d4 0%, #22d3ee 25%, #0ea5e9 50%, #22c55e 75%, #06b6d4 100%)',
        'gradient-dark': 'linear-gradient(135deg, #000000 0%, #0a0a0a 50%, #000000 100%)',
        'gradient-matrix': 'linear-gradient(135deg, #000000 0%, #001a00 25%, #003300 50%, #001a00 75%, #000000 100%)',
        'cyber-grid': `
          linear-gradient(rgba(6, 182, 212, 0.1) 1px, transparent 1px),
          linear-gradient(90deg, rgba(6, 182, 212, 0.1) 1px, transparent 1px)
        `,
      },
      backgroundSize: {
        'cyber-grid': '50px 50px',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 3s linear infinite',
        'bounce-slow': 'bounce 3s infinite',
        'cyber-pulse': 'cyberPulse 2s ease-in-out infinite alternate',
        'matrix-rain': 'matrixRain 20s linear infinite',
        'neon-flicker': 'neonFlicker 1.5s ease-in-out infinite alternate',
        'hologram': 'hologram 4s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px #06b6d4, 0 0 10px #06b6d4, 0 0 15px #06b6d4' },
          '100%': { boxShadow: '0 0 10px #22d3ee, 0 0 20px #22d3ee, 0 0 30px #22d3ee' },
        },
        cyberPulse: {
          '0%': { 
            boxShadow: '0 0 5px #06b6d4, 0 0 10px #06b6d4, 0 0 15px #06b6d4, inset 0 0 5px #06b6d4',
            borderColor: '#06b6d4'
          },
          '100%': { 
            boxShadow: '0 0 10px #22d3ee, 0 0 20px #22d3ee, 0 0 30px #22d3ee, inset 0 0 10px #22d3ee',
            borderColor: '#22d3ee'
          },
        },
        matrixRain: {
          '0%': { transform: 'translateY(-100vh)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        neonFlicker: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
        hologram: {
          '0%, 100%': { 
            transform: 'rotateY(0deg) rotateX(0deg)',
            filter: 'hue-rotate(0deg)'
          },
          '25%': { 
            transform: 'rotateY(5deg) rotateX(2deg)',
            filter: 'hue-rotate(90deg)'
          },
          '50%': { 
            transform: 'rotateY(0deg) rotateX(5deg)',
            filter: 'hue-rotate(180deg)'
          },
          '75%': { 
            transform: 'rotateY(-5deg) rotateX(2deg)',
            filter: 'hue-rotate(270deg)'
          },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'cyber': '0 0 20px rgba(6, 182, 212, 0.5)',
        'neon': '0 0 20px rgba(34, 211, 238, 0.5)',
        'matrix': '0 0 20px rgba(34, 197, 94, 0.5)',
        'glow-sm': '0 0 10px rgba(6, 182, 212, 0.3)',
        'glow-md': '0 0 20px rgba(6, 182, 212, 0.4)',
        'glow-lg': '0 0 30px rgba(6, 182, 212, 0.5)',
      }
    },
  },
  plugins: [],
};