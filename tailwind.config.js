/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  safelist: [
    'text-blue-600',
    'hover:underline',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}

