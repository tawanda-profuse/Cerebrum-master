/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ['./src/**/*.{js,jsx,ts,tsx}'],
    darkMode: 'class',
    theme: {
        extend: {
            borderRadius: {
                md: '1em',
            },
            colors: {
                'yedu-green': '#57C032',
                'yedu-light-green': '#57C03247',
                'yedu-light-gray': '#F3F4F6',
                'yedu-dull': '#eee',
                'yedu-dark-gray': '#F3F4F6',
                'yedu-dark': '#000000',
                'yedu-white': '#ffffff',
                'yedu-gray-text': '#868585',
                'yedu-danger': '#FF0000',
            },
        },
    },
    plugins: [require('tailwind-scrollbar')],
};
