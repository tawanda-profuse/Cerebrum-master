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
                'yedu-gray-text': '#000000',
                'yedu-danger': '#FF0000',
            },
            keyframes: {
                'fade-in-up': {
                    '0%': {
                        opacity: '0',
                        transform: 'translateY(10px)'
                    },
                    '100%': {
                        opacity: '1',
                        transform: 'translateY(0)'
                    },
                }
            },
            animation: {
                'fade-in-up': 'fade-in-up 0.5s ease-out forwards'
            }
        },
    },
    plugins: [require('tailwind-scrollbar')],
};
