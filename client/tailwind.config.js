/** Tailwind scans these paths for class names to generate CSS for. */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Custom palette (see docs/README for design rationale) --
        // deliberately not the default indigo/blue Tailwind starter look.
        ink: '#12151C',
        surface: '#181C25',
        surface2: '#20242F',
        border: '#2B2F3B',
        accent: '#5EEAD4',
        accent2: '#F59E0B',
        danger: '#F87171',
        muted: '#8A8FA3',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
};
