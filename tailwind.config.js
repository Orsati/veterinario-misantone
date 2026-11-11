// Configurazione unica di Tailwind per tutte le pagine.
// Gli stili si generano in css/stile.css: dopo ogni modifica alle classi nell'HTML o negli script, rigenerare con
//   npx tailwindcss@3.4.17 -i tailwind.input.css -o css/stile.css --minify
module.exports = {
    content: ['./index.html', './chi-siamo.html', './servizi.html', './contattaci.html', './privacy.html', './404.html', './nav.js'],
    future: { hoverOnlyWhenSupported: true },
    theme: {
        extend: {
            colors: {
                wix: {
                    teal: '#4D8495',
                    tealAlt: '#4C8394',
                    tealDark: '#3A6775',
                    sage: '#F6F9F5',
                    sageDeep: '#EBF2E9',
                    dark: '#091405',
                    gray: '#626462',
                    blue: '#2751A3',
                    orange: '#F97425',
                    yellow: '#FEF08A',
                    urgentText: '#713F12',
                },
            },
            boxShadow: {
                card: '0 10px 30px -10px rgba(9, 20, 5, 0.06)',
                cardHover: '0 20px 40px -15px rgba(77, 132, 149, 0.16)',
            },
            fontFamily: {
                title: ['Fraunces', 'serif'],
                heading: ['"Space Grotesk"', 'sans-serif'],
                sans: ['Poppins', 'sans-serif'],
                extralight: ['"Poppins ExtraLight"', 'Poppins', 'sans-serif'],
            },
        },
    },
};
