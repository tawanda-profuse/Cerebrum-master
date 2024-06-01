/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ['./src/**/*.{js,jsx,ts,tsx}'],
    theme: {
        extend: {
            fontFamily: {
                montserrat: ['Montserrat', 'sans-serif'],
            },
        },
        colors: {
            'yedu-green': '#57C032',
            'yedu-light-green': '#57C03247',
            'yedu-light-gray': '#D9D9D9',
            'yedu-dull': '#eee',
            'yedu-dark-gray': '#B1AFAF',
            'yedu-dark': '#000000',
            'yedu-white': '#ffffff',
            'yedu-gray-text': '#868585',
            'yedu-danger': '#FF0000',
        },
    },
    plugins: [],
};
