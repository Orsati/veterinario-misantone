# CLAUDE.md

Istruzioni per lavorare su questo repository.

## Cos'è questo progetto

Versione 2026 del sito statico per **Ambulatorio Veterinario Misantone**, clinica veterinaria a Teramo (Viale Giovanni Bovio 175, attiva dal 1992, Direttore Sanitario Dott. Pasquale Misantone, Aut. Reg. n° 281 del 14/05/1996).

- Stesso layout, stessa struttura e organizzazione dei contenuti del sito originale Wix, ma con estetica moderna 2026: card arrotondate (`rounded-2xl`, `rounded-3xl`), ombre morbide (`shadow-card`, `shadow-cardHover`), bordi sottili semi-trasparenti (`border-wix-teal/15`, `border-wix-teal/10`), header sticky con effetto frosted glass (`bg-white/95 backdrop-blur-md`), pill di navigazione moderna, transizioni fluide e badge orari live.
- Nessun passo di build al momento del deploy: tutto è servito così com'è (`css/stile.css` è compilato e committato).
- Pubblicato su **Cloudflare Workers** come soli file statici (`wrangler.jsonc` punta `assets.directory` a `.`, e `.assetsignore` esclude file di lavoro, sorgenti delle foto e configurazioni). Dominio: `veterinariomisantone.it` (vedi `DNS.md` per la configurazione DNS).

## Struttura

| File / cartella | Ruolo |
|---|---|
| `index.html` | Home page: header sticky con logo, social e barra a pill, hero con orari live, presentazione clinica, striscia fotografica di reparto (`img/home/`), quattro pilastri in card moderne, tabella orari, mappa e footer |
| `chi-siamo.html` | Chi siamo: hero con foto studio in card (`img/chi-siamo/hero.webp`), biografie del Dott. Pasquale Misantone e del Dott. Gabriele Misantone con espansione ("Leggi di più" / "Mostra meno"), galleria fotografica di 15 foto (`img/galleria/`) |
| `servizi.html` | Servizi: panoramica delle prestazioni cliniche, chirurgiche e diagnostiche in card 2026 con 4 foto di reparto (`img/servizi/`) |
| `contattaci.html` | Contattaci: foto hero in card (`img/contattaci/hero.webp`), 3 card interattive per i recapiti (telefono fisso 0861 241533, cellulare 328 3666840, email pasqualemisantone@gmail.com), badge emergenze (328 053 3005) e mappa Google Maps incorporata ("Come raggiungerci") con pulsante rapido |
| `privacy.html` | Informativa GDPR racchiusa in una card moderna `rounded-3xl shadow-card` (nessun cookie proprio, font locali, Google Maps incorporato) |
| `404.html` | Pagina 404 in card moderna `rounded-3xl shadow-card` con percorsi assoluti (`/css/...`, `/img/...`, `/fonts/...`); dopo 10 secondi reindirizza alla home |
| `nav.js` | Menu mobile (`<dialog id="mobile-menu">`), logica `ORARI` (`09:00-12:30,16:00-19:30`), `AVVISO` per chiusure straordinarie, toggle biografie (`data-bio-toggle`) |
| `tailwind.config.js`, `tailwind.input.css` | Configurazione Tailwind e file di ingresso CSS → compilati in `css/stile.css` |
| `fonts/` | Font WOFF2 self-hosted (`fraunces.woff2`, `space-grotesk.woff2`, varianti `poppins-*.woff2`) |
| `img/` | Loghi (`logo-header.webp`), icone social (`fb-black.png`, `ig-black.png`, `fb-white.png`, `ig-white.png`), favicon (`favicon-32.png`, `favicon-192.png`, `apple-touch-icon.png`), open graph (`og.jpg`), sottocartelle `home/`, `chi-siamo/`, `servizi/`, `contattaci/`, `galleria/` |
| `sitemap.xml` | Mappa XML del sito con le 4 pagine pubbliche principali (`/`, `/chi-siamo`, `/servizi`, `/contattaci`) |
| `_headers` | Intestazioni HTTP per Cloudflare (cache lunga su font/CSS/immagini, CSP e sicurezza) |
| `controlla.py` | Script di verifica automatica prima del deploy |

## Tipografia e Colori Wix

### Font locali (`fonts/`)
- **Titolo / Logo header**: `Fraunces` (`font-title`, serif)
- **Titoli e Intestazioni (`h1`, `h2`, `h3`)**: `Space Grotesk` (`font-heading`, sans-serif)
- **Corpo del testo, navigazione, pulsanti**: `Poppins` (`font-sans`, sans-serif, regular 400 e bold 700)
- **Didascalie e note footer**: `Poppins ExtraLight` (`font-extralight`, sans-serif, weight 200-400)

### Palette colori (`tailwind.config.js`)
- `wix-teal`: `#4D8495` (colore guida principale: testata, titoli, link attivi, pulsanti)
- `wix-tealAlt`: `#4C8394` (sfondo del footer)
- `wix-tealDark`: `#3A6775` (hover sui pulsanti principali)
- `wix-sage`: `#F6F9F5` (sfondo chiaro salvia: barra menu desktop, menu mobile, card, sezione "Come raggiungerci")
- `wix-sageDeep`: `#EBF2E9` (accento salvia per hover di bottoni e icone)
- `wix-dark`: `#091405` (nero/verde scurissimo per il testo principale)
- `wix-gray`: `#626462` (grigio per testi secondari e note)
- `wix-blue`: `#2751A3` (blu per accenti)
- `wix-orange`: `#F97425` (arancione per accenti)
- `wix-yellow`: `#FEF08A` (giallo per badge orari e urgenze)
- `wix-urgentText`: `#713F12` (marrone scuro per testo urgenze)

### Ombre ed Effetti
- `shadow-card`: `0 10px 30px -10px rgba(9, 20, 5, 0.06)` (ombreggiatura card morbida)
- `shadow-cardHover`: `0 20px 40px -15px rgba(77, 132, 149, 0.16)` (hover elevato per card interattive)

## Componenti condivisi obbligatori (Edizione 2026)

Per garantire assoluta coerenza grafica, tutte le pagine principali (`index.html`, `chi-siamo.html`, `servizi.html`, `contattaci.html`, `privacy.html`) condividono la **stessa struttura markup** per:
1. `<header>` sticky con effetto vetro, social desktop e mobile, logo e navigazione a pillole (`bg-wix-sage/90`)
2. `<dialog id="mobile-menu">` (menu a comparsa laterale mobile `bg-wix-sage` con pulsante di chiusura e pillole verticali)
3. `<footer>` (footer `bg-wix-tealAlt` con recapiti, crediti © 2026, link Privacy e icone social)

### Header Desktop e Mobile
```html
    <header class="bg-white/95 backdrop-blur-md sticky top-0 z-40 border-b border-wix-teal/10">
        <div class="max-w-[1280px] mx-auto px-4 md:px-8 pt-4 pb-4 md:pt-6 md:pb-5 relative">
            <div class="flex items-center justify-between md:hidden mb-2">
                <div class="flex items-center gap-2.5">
                    <a href="https://www.facebook.com/AmbulatorioVeterinarioMisantone" target="_blank" rel="noopener noreferrer" aria-label="Pagina Facebook" class="p-1.5 rounded-full bg-wix-sage hover:bg-wix-sageDeep transition-colors">
                        <img src="img/fb-black.png" alt="Facebook" width="37" height="37" class="w-6 h-6">
                    </a>
                    <a href="https://www.instagram.com/misanvet/?hl=it" target="_blank" rel="noopener noreferrer" aria-label="Profilo Instagram" class="p-1.5 rounded-full bg-wix-sage hover:bg-wix-sageDeep transition-colors">
                        <img src="img/ig-black.png" alt="Instagram" width="37" height="37" class="w-6 h-6">
                    </a>
                </div>
                <button type="button" id="menu-open" aria-label="Apri menu" aria-haspopup="dialog" aria-controls="mobile-menu" class="p-2 rounded-xl bg-wix-sage text-wix-teal hover:bg-wix-sageDeep transition-colors">
                    <svg class="w-7 h-6" viewBox="0 0 32 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true">
                        <path d="M4 5h24M4 12h24M4 19h24"/>
                    </svg>
                </button>
            </div>

            <div class="hidden md:flex items-center gap-2.5 absolute right-8 top-7">
                <a href="https://www.facebook.com/AmbulatorioVeterinarioMisantone" target="_blank" rel="noopener noreferrer" aria-label="Pagina Facebook" class="p-2 rounded-full bg-wix-sage hover:bg-wix-sageDeep hover:-translate-y-0.5 transition-all">
                    <img src="img/fb-black.png" alt="Facebook" width="37" height="37" class="w-7 h-7">
                </a>
                <a href="https://www.instagram.com/misanvet/?hl=it" target="_blank" rel="noopener noreferrer" aria-label="Profilo Instagram" class="p-2 rounded-full bg-wix-sage hover:bg-wix-sageDeep hover:-translate-y-0.5 transition-all">
                    <img src="img/ig-black.png" alt="Instagram" width="37" height="37" class="w-7 h-7">
                </a>
            </div>

            <div class="flex flex-col items-center">
                <a href="index.html" class="order-2 md:order-1 mt-1 md:mt-0 group">
                    <img src="img/logo-header.webp" alt="Logo Ambulatorio Veterinario Misantone" width="96" height="71" class="w-[78px] h-[58px] md:w-[92px] md:h-[68px] object-contain transition-transform duration-300 group-hover:scale-105">
                </a>
                <p class="order-1 md:order-2 font-title font-bold text-[26px] md:text-[38px] leading-[1.2] tracking-[0.04em] text-wix-teal text-center max-w-[320px] md:max-w-none mt-1">
                    <a href="index.html" class="hover:opacity-90 transition-opacity">Ambulatorio Veterinario Misantone</a>
                </p>
            </div>
        </div>

        <div class="hidden md:block bg-wix-sage/90 border-t border-wix-teal/10 w-full py-1.5">
            <nav aria-label="Navigazione principale" class="max-w-[760px] mx-auto flex items-center justify-around px-4">
                <a href="index.html" class="px-5 py-1.5 rounded-full font-sans text-[17px] leading-[1.4em] text-wix-dark hover:text-wix-teal hover:bg-white/60 transition-all duration-200">Home</a>
                <a href="chi-siamo.html" class="px-5 py-1.5 rounded-full font-sans text-[17px] leading-[1.4em] text-wix-dark hover:text-wix-teal hover:bg-white/60 transition-all duration-200">Chi siamo</a>
                <a href="servizi.html" class="px-5 py-1.5 rounded-full font-sans text-[17px] leading-[1.4em] text-wix-dark hover:text-wix-teal hover:bg-white/60 transition-all duration-200">Servizi</a>
                <a href="contattaci.html" class="px-5 py-1.5 rounded-full font-sans text-[17px] leading-[1.4em] text-wix-dark hover:text-wix-teal hover:bg-white/60 transition-all duration-200">Contattaci</a>
            </nav>
        </div>
    </header>
```

### Dialog Menu Mobile
```html
    <dialog id="mobile-menu" aria-label="Menu di navigazione" class="m-0 ml-auto h-full max-h-none w-[300px] max-w-[85vw] bg-wix-sage text-wix-dark p-6 shadow-2xl border-l border-wix-teal/15">
        <div class="flex items-center justify-between mb-8 pb-4 border-b border-wix-teal/10">
            <span class="font-title font-bold text-lg text-wix-teal">Menu</span>
            <button type="button" id="menu-close" aria-label="Chiudi menu" class="p-2 rounded-xl bg-white text-wix-teal shadow-sm">
                <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                    <path d="M6 6l12 12M18 6L6 18"/>
                </svg>
            </button>
        </div>
        <nav aria-label="Menu mobile" class="flex flex-col gap-2 text-center">
            <a href="index.html" class="py-3 px-4 rounded-xl font-sans text-[18px] text-wix-dark hover:text-wix-teal hover:bg-white/60 transition-all">Home</a>
            <a href="chi-siamo.html" class="py-3 px-4 rounded-xl font-sans text-[18px] text-wix-dark hover:text-wix-teal hover:bg-white/60 transition-all">Chi siamo</a>
            <a href="servizi.html" class="py-3 px-4 rounded-xl font-sans text-[18px] text-wix-dark hover:text-wix-teal hover:bg-white/60 transition-all">Servizi</a>
            <a href="contattaci.html" class="py-3 px-4 rounded-xl font-sans text-[18px] text-wix-dark hover:text-wix-teal hover:bg-white/60 transition-all">Contattaci</a>
        </nav>
    </dialog>
```

### Footer
```html
    <footer class="bg-wix-tealAlt text-wix-sage border-t border-white/15">
        <div class="max-w-[1040px] mx-auto px-6 md:px-10 py-8 flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
            <div class="order-2 md:order-1 text-center md:text-left">
                <p class="font-extralight text-[15px] leading-[1.5em] text-wix-sage">© 2026 Ambulatorio Veterinario Misantone · <a href="privacy.html" class="underline underline-offset-4 hover:text-white transition-colors">Privacy</a></p>
                <p class="font-extralight text-[10px] leading-[1.4em] text-wix-sage/80 mt-0.5 mb-4">Logo image by sentavio on Freepik</p>
                <div class="flex items-center justify-center md:justify-start gap-2.5">
                    <a href="https://www.facebook.com/AmbulatorioVeterinarioMisantone" target="_blank" rel="noopener noreferrer" aria-label="Pagina Facebook" class="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
                        <img src="img/fb-white.png" alt="Facebook" width="27" height="27" class="w-5 h-5">
                    </a>
                    <a href="https://www.instagram.com/misanvet/?hl=it" target="_blank" rel="noopener noreferrer" aria-label="Profilo Instagram" class="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
                        <img src="img/ig-white.png" alt="Instagram" width="27" height="27" class="w-5 h-5">
                    </a>
                </div>
            </div>
            <div class="order-1 md:order-2 text-center md:text-right font-extralight text-[15px] leading-[1.6em] text-white space-y-0.5">
                <p><a href="tel:+390861241533" class="hover:underline">0861 241533</a> · <a href="tel:+393283666840" class="hover:underline">328 3666840</a></p>
                <p><a href="mailto:pasqualemisantone@gmail.com" class="hover:underline">pasqualemisantone@gmail.com</a></p>
                <p class="text-wix-sage/90">Viale Bovio 175, 64100, Teramo (TE)</p>
            </div>
        </div>
    </footer>
```

### Gestione voce di menu attiva
- **Desktop nav**: la voce attiva aggiunge `aria-current="page"` e sostituisce `text-wix-dark hover:text-wix-teal hover:bg-white/60` con `text-wix-teal bg-white shadow-sm font-semibold`.
- **Mobile nav**: la voce attiva aggiunge `aria-current="page"` e sostituisce `text-wix-dark hover:text-wix-teal hover:bg-white/60` con `text-wix-teal bg-white shadow-sm font-semibold`.
- **`privacy.html`**: tutte e 4 le voci di navigazione sono nello stato inattivo (nessun `aria-current="page"`).

## Orari e Avvisi (`nav.js`)

- `ORARI`: array di 7 stringhe (da domenica `0` a sabato `6`) con fasce `HH:MM-HH:MM` separate da virgola (lun–ven `09:00-12:30,16:00-19:30`).
- Gli orari devono corrispondere rigorosamente con `openingHoursSpecification` nel JSON-LD di `index.html`.
- `AVVISO`: oggetto opzionale `{ testo: '', fino: '', chiusiDal: '' }` per mostrare un banner in cima alla pagina in caso di ferie o chiusure straordinarie.

## Compilazione CSS (Tailwind)

Non usare CDN. Dopo ogni modifica alle classi HTML o JS, rigenerare `css/stile.css`:

```bash
PATH="/opt/homebrew/bin:/usr/local/bin:$PATH" npx tailwindcss@3.4.17 -i tailwind.input.css -o css/stile.css --minify
```

## Verifica con `controlla.py`

Prima di pubblicare o concludere una sessione di lavoro, eseguire:

```bash
python3 controlla.py
```

Lo script esegue automaticamente i seguenti controlli:
1. Riferimenti locali (`href`, `src`, `srcset`) ed esistenza delle ancore interne (`#...`).
2. Immagini non utilizzate nella cartella `img/`.
3. Attributi di ogni `<img>`: presenza di `alt`, `width`, `height` e proporzioni conformi al file reale (`abs(w/h - rw/rh) <= 0.01`).
4. Corrispondenza di `<nav>`, `<dialog id="mobile-menu">` e `<footer>` su tutte le pagine (`PAGINE`), normalizzando i link attivi.
5. Validità del JSON-LD e allineamento degli orari di apertura con `nav.js`.
6. Test unitari Node.js su `statoOrari` in `nav.js` (casi feriali, pausa pranzo, chiusura, ferie).
7. Presenza di tutti i file `.html` e `.js` nel `content` di `tailwind.config.js`.

Deve terminare stampando `Tutto a posto.` con codice di uscita `0`.
