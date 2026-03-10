/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './stories/**/*.{js,jsx,ts,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        varity: {
          primary: '#6366F1',    // Indigo-500
          secondary: '#8B5CF6',  // Violet-500
          accent: '#EC4899',     // Pink-500
          success: '#10B981',    // Green-500
          warning: '#F59E0B',    // Amber-500
          error: '#EF4444',      // Red-500
          info: '#3B82F6',       // Blue-500
        },
        // Industry-specific colors
        finance: {
          primary: '#1E40AF',    // Blue-700
          secondary: '#F59E0B',  // Amber-500
          accent: '#10B981',     // Green-500
          bg: '#F3F4F6',         // Gray-100
        },
        healthcare: {
          primary: '#059669',    // Emerald-600
          secondary: '#0EA5E9',  // Sky-500
          accent: '#8B5CF6',     // Violet-500
          bg: '#F0FDF4',         // Green-50
        },
        retail: {
          primary: '#EA580C',    // Orange-600
          secondary: '#A855F7',  // Purple-500
          accent: '#EC4899',     // Pink-500
          bg: '#FFF7ED',         // Orange-50
        },
        iso: {
          primary: '#0284C7',    // Sky-600
          secondary: '#64748B',  // Slate-500
          accent: '#0891B2',     // Cyan-600
          bg: '#F8FAFC',         // Slate-50
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['Fira Code', 'Consolas', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
      borderRadius: {
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
};
