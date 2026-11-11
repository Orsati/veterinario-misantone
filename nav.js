// Orari della settimana, da domenica (0) a sabato: fasce "apertura-chiusura" separate da virgola, vuoto se chiuso
// (sabato mattina su appuntamento e domenica solo urgenze sono indicati nella tabella orari).
// Coincidono con openingHoursSpecification nel JSON-LD di index.html (verificato da controlla.py).
const ORARI = ['', '09:00-12:30,16:00-19:30', '09:00-12:30,16:00-19:30', '09:00-12:30,16:00-19:30', '09:00-12:30,16:00-19:30', '09:00-12:30,16:00-19:30', ''];

// Avviso opzionale in cima alle pagine per ferie o chiusure straordinarie: con testo vuoto non compare.
const AVVISO = { testo: '', fino: '', chiusiDal: '' };

const GIORNI = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'];
const giorno = data => new Date(data + 'T12:00:00Z');
const dopo = (data, n) => { const d = giorno(data); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };

function statoOrari(data, minuti) {
    const fasce = d => {
        if (AVVISO.chiusiDal && d >= AVVISO.chiusiDal && d <= AVVISO.fino) return [];
        const f = ORARI[giorno(d).getUTCDay()];
        if (!f) return [];
        const min = h => +h.slice(0, 2) * 60 + +h.slice(3);
        return f.split(',').map(s => {
            const [apre, chiude] = s.split('-');
            return { apre, chiude, da: min(apre), a: min(chiude) };
        });
    };
    const oggi = fasce(data);
    for (let i = 0; i < oggi.length; i++) {
        const f = oggi[i];
        if (minuti >= f.da && minuti < f.a) return { aperto: true, testo: `Aperto ora · fino alle ${f.chiude}` };
        if (minuti < f.da) return { aperto: false, testo: `Chiuso · ${i === 0 ? 'apriamo' : 'riapriamo'} alle ${f.apre}` };
    }
    for (let n = 1; n < 90; n++) {
        const d = dopo(data, n), f = fasce(d);
        if (!f.length) continue;
        const quando = n === 1 ? 'domani' : n < 7 ? GIORNI[giorno(d).getUTCDay()]
            : giorno(d).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
        return { aperto: false, testo: `Chiuso · riapriamo ${quando} alle ${f[0].apre}` };
    }
    return { aperto: false, testo: 'Chiuso' };
}

function adessoATeramo() {
    const p = {};
    new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Rome', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
        .formatToParts(new Date()).forEach(x => { p[x.type] = x.value; });
    return [`${p.year}-${p.month}-${p.day}`, +p.hour * 60 + +p.minute];
}

document.addEventListener('DOMContentLoaded', () => {
    const [oggi] = adessoATeramo();
    if (AVVISO.testo && (!AVVISO.fino || oggi <= AVVISO.fino)) {
        const avviso = document.createElement('p');
        avviso.className = 'bg-wix-teal text-white text-center text-sm font-bold px-4 py-2';
        avviso.textContent = AVVISO.testo;
        document.body.prepend(avviso);
    }

    // Stato orari live in Home (#stato-orari e #stato-pallino)
    const statoEl = document.getElementById('stato-orari');
    const pallinoEl = document.getElementById('stato-pallino');
    if (statoEl && pallinoEl) {
        const aggiornaStato = () => {
            const { aperto, testo } = statoOrari(...adessoATeramo());
            statoEl.textContent = testo;
            pallinoEl.className = `w-2 h-2 rounded-full ${aperto ? 'bg-emerald-500' : 'bg-rose-500'}`;
        };
        aggiornaStato();
        setInterval(aggiornaStato, 60000);
    }

    // Espansione / riduzione biografie medici in Chi siamo ("Leggi di più" / "Mostra meno")
    document.querySelectorAll('[data-bio-toggle]').forEach(btn => {
        btn.addEventListener('click', () => {
            const target = document.getElementById(btn.getAttribute('aria-controls'));
            if (!target) return;
            const espanso = btn.getAttribute('aria-expanded') === 'true';
            btn.setAttribute('aria-expanded', String(!espanso));
            target.classList.toggle('line-clamp-4', espanso);
            btn.textContent = espanso ? 'Leggi di più' : 'Mostra meno';
        });
    });

    // Menu mobile (<dialog id="mobile-menu">)
    const mobileMenu = document.getElementById('mobile-menu');
    const menuOpen = document.getElementById('menu-open');
    const menuClose = document.getElementById('menu-close');
    if (!mobileMenu) return;

    let chiusura;
    const apri = () => {
        clearTimeout(chiusura);
        if (!mobileMenu.open) { mobileMenu.classList.remove('aperto'); mobileMenu.showModal(); }
        void mobileMenu.offsetWidth;
        mobileMenu.classList.add('aperto');
    };
    const chiudi = () => {
        mobileMenu.classList.remove('aperto');
        chiusura = setTimeout(() => mobileMenu.close(), 200);
    };

    if (menuOpen) menuOpen.addEventListener('click', apri);
    if (menuClose) menuClose.addEventListener('click', chiudi);
    mobileMenu.addEventListener('cancel', e => { e.preventDefault(); chiudi(); });
    mobileMenu.addEventListener('click', e => {
        const r = mobileMenu.getBoundingClientRect();
        if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) chiudi();
    });
    mobileMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => mobileMenu.close()));
});
