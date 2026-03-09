// tailwind.config.js
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './lib/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',
    './styles/**/*.{css,scss}',
  ],
  theme: {
    extend: {
      backgroundImage: {
        'linear-to-br': 'linear-gradient(to bottom right, var(--tw-gradient-stops))',
        'linear-to-bl': 'linear-gradient(to bottom left, var(--tw-gradient-stops))',
        'linear-to-t': 'linear-gradient(to top, var(--tw-gradient-stops))',
        'linear-to-b': 'linear-gradient(to bottom, var(--tw-gradient-stops))',
        'linear-to-r': 'linear-gradient(to right, var(--tw-gradient-stops))',
      },
    },
  },
  safelist: [
    'from-blue-500', 'to-cyan-500',
    'from-purple-500', 'to-pink-500',
    'from-green-500', 'to-emerald-500',
    'from-yellow-500', 'to-orange-500',
    'from-green-400', 'to-cyan-500',
    'from-yellow-400', 'to-orange-500',
    'from-pink-400', 'to-red-500',
    'from-green-600', 'via-cyan-500', 'to-blue-600',
    'from-green-300', 'via-cyan-300', 'to-blue-300',
    'from-yellow-300', 'via-orange-300', 'to-red-300',
    'from-green-100', 'to-cyan-100',
    'from-green-900/40', 'to-cyan-900/40',
    'from-red-100', 'via-yellow-100', 'to-red-100',
    'from-red-900/20', 'via-yellow-900/20', 'to-red-900/20',
    'from-blue-100', 'to-red-50',
    'from-blue-900/20', 'to-red-900/20',
    'bg-linear-to-br', 'bg-linear-to-bl', 'bg-linear-to-t', 'bg-linear-to-b', 'bg-linear-to-r',
  ],
  plugins: [require('tailwindcss-animate')],
}
