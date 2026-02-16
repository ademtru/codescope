/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gh: {
          canvas: {
            DEFAULT: '#0d1117',
            subtle: '#161b22',
            inset: '#010409',
          },
          border: {
            DEFAULT: '#30363d',
            muted: '#21262d',
            subtle: '#6e7681',
          },
          fg: {
            DEFAULT: '#e6edf3',
            muted: '#8b949e',
            subtle: '#6e7681',
            onEmphasis: '#ffffff',
          },
          accent: {
            fg: '#58a6ff',
            emphasis: '#1f6feb',
            muted: 'rgba(56,139,253,0.4)',
            subtle: 'rgba(56,139,253,0.15)',
          },
          success: {
            fg: '#3fb950',
            emphasis: '#238636',
            muted: 'rgba(46,160,67,0.4)',
            subtle: 'rgba(46,160,67,0.15)',
          },
          attention: {
            fg: '#d29922',
            emphasis: '#9e6a03',
            muted: 'rgba(187,128,9,0.4)',
            subtle: 'rgba(187,128,9,0.15)',
          },
          danger: {
            fg: '#f85149',
            emphasis: '#da3633',
            muted: 'rgba(248,81,73,0.4)',
            subtle: 'rgba(248,81,73,0.15)',
          },
          done: {
            fg: '#a371f7',
            emphasis: '#8957e5',
            muted: 'rgba(163,113,247,0.4)',
            subtle: 'rgba(163,113,247,0.15)',
          },
          btn: {
            bg: '#21262d',
            hover: '#30363d',
            active: '#282e33',
            border: '#f0f6fc1a',
            primary: '#238636',
            primaryHover: '#2ea043',
          },
          header: '#161b22',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', '"Noto Sans"', 'Helvetica', 'Arial', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', '"SF Mono"', 'Menlo', 'Consolas', '"Liberation Mono"', 'monospace'],
      },
      fontSize: {
        'gh-sm': ['12px', { lineHeight: '20px' }],
        'gh-base': ['14px', { lineHeight: '20px' }],
        'gh-lg': ['16px', { lineHeight: '24px' }],
        'gh-xl': ['20px', { lineHeight: '28px' }],
        'gh-2xl': ['24px', { lineHeight: '32px' }],
        'gh-3xl': ['32px', { lineHeight: '40px' }],
      },
      borderRadius: {
        'gh': '6px',
        'gh-lg': '12px',
      },
      boxShadow: {
        'gh': '0 0 0 1px #30363d',
        'gh-md': '0 3px 6px #010409',
        'gh-lg': '0 8px 24px #010409',
        'gh-overlay': '0 1px 3px rgba(27,31,35,0.12), 0 8px 24px rgba(27,31,35,0.12)',
      },
    },
  },
  plugins: [],
}
