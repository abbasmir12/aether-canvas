import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/renderer/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        aether: {
          canvas: '#F8F8FA',
          sidebar: '#F0F0F4',
          card: '#FFFFFF',
          ink: '#242426',
          muted: '#77777D',
          line: '#DCDCE1',
          dates: '#4A90D9',
          cost: '#34A853',
          place: '#EA4335',
          tasks: '#9B72CF',
        },
      },
      borderRadius: {
        card: '12px',
        summary: '16px',
        pill: '20px',
      },
      boxShadow: {
        card: '0 2px 8px rgba(0,0,0,0.08)',
        floating: '0 8px 30px rgba(37,37,40,0.10)',
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Inter',
          'sans-serif',
        ],
      },
    },
  },
} satisfies Config;
