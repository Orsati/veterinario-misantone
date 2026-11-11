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

    // Mappa interattiva in Contattaci (zoom +/- e trascinamento)
    const mappaBox = document.getElementById('mappa-box');
    const mappaImg = document.getElementById('mappa-img');
    const zoomInBtn = document.getElementById('mappa-zoom-in');
    const zoomOutBtn = document.getElementById('mappa-zoom-out');
    if (mappaBox && mappaImg) {
        let scala = 1, tx = 0, ty = 0, trascina = false, startX = 0, startY = 0;
        const limita = () => {
            const maxX = (mappaBox.clientWidth * (scala - 1)) / 2;
            const maxY = (mappaBox.clientHeight * (scala - 1)) / 2;
            tx = Math.max(-maxX, Math.min(maxX, tx));
            ty = Math.max(-maxY, Math.min(maxY, ty));
            mappaImg.style.transform = `translate(${tx}px, ${ty}px) scale(${scala})`;
        };
        const cambiaZoom = delta => {
            scala = Math.max(1, Math.min(2.4, +(scala + delta).toFixed(2)));
            if (scala === 1) { tx = 0; ty = 0; }
            limita();
        };
        if (zoomInBtn) zoomInBtn.addEventListener('click', () => cambiaZoom(0.35));
        if (zoomOutBtn) zoomOutBtn.addEventListener('click', () => cambiaZoom(-0.35));
        mappaBox.addEventListener('dblclick', e => {
            if (e.target.closest('a, button')) return;
            cambiaZoom(scala < 2 ? 0.45 : -2);
        });
        mappaImg.addEventListener('pointerdown', e => {
            if (scala <= 1) cambiaZoom(0.35);
            trascina = true;
            startX = e.clientX - tx;
            startY = e.clientY - ty;
            mappaImg.style.transition = 'none';
            mappaImg.setPointerCapture(e.pointerId);
        });
        mappaImg.addEventListener('pointermove', e => {
            if (!trascina) return;
            tx = e.clientX - startX;
            ty = e.clientY - startY;
            limita();
        });
        const fineTrascina = () => {
            if (!trascina) return;
            trascina = false;
            mappaImg.style.transition = '';
        };
        mappaImg.addEventListener('pointerup', fineTrascina);
        mappaImg.addEventListener('pointercancel', fineTrascina);
    }

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
