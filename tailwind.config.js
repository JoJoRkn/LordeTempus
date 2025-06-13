/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './*.html',
        './js/**/*.js',
    ],
    darkMode: 'class',
    theme: {
        extend: {
            colors: {
                'lorde-green': '#00FCC8',
                'lorde-red': '#FF0026',
                'lorde-yellow': '#FFBF00',
                'lorde-dark': '#1a1a1a',
                'lorde-light': '#f5f5f5',
            },
            fontFamily: {
                'poppins': ['Poppins', 'sans-serif'],
                'roboto': ['Roboto', 'sans-serif'],
            },
            animation: {
                'fade-in': 'fadeIn 0.5s ease-out forwards',
                'slide-in': 'slideIn 0.5s ease-out forwards',
                'bounce-slow': 'bounce 3s infinite',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                slideIn: {
                    '0%': { transform: 'translateX(-100%)' },
                    '100%': { transform: 'translateX(0)' },
                },
            },
            boxShadow: {
                'custom': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                'custom-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            },
            borderRadius: {
                'custom': '0.5rem',
            },
        },
    },
    plugins: [
        require('@tailwindcss/forms'),
        require('@tailwindcss/typography'),
        require('@tailwindcss/aspect-ratio'),
    ],
} 