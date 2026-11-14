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
    const inFerie = d => Boolean(AVVISO.chiusiDal && d >= AVVISO.chiusiDal && d <= AVVISO.fino);
    const fasce = d => {
        if (inFerie(d)) return [];
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
        if (minuti >= f.da && minuti < f.a) return { aperto: true, stato: 'aperto', testo: `Aperto ora · fino alle ${f.chiude}` };
        if (minuti < f.da) return { aperto: false, stato: 'chiuso', testo: `Chiuso · ${i === 0 ? 'apriamo' : 'riapriamo'} alle ${f.apre}` };
    }
    const g = giorno(data).getUTCDay();
    if (!inFerie(data) && g === 6 && minuti < 12 * 60 + 30) {
        return { aperto: false, stato: 'appuntamento', testo: 'Sabato mattina su appuntamento · urgenze 328 053 3005' };
    }
    for (let n = 1; n < 90; n++) {
        const d = dopo(data, n), f = fasce(d);
        if (!f.length) continue;
        const quando = n === 1 ? 'domani' : n < 7 ? GIORNI[giorno(d).getUTCDay()]
            : giorno(d).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
        if (!inFerie(data) && (g === 0 || g === 6)) {
            return { aperto: false, stato: 'chiuso', testo: `Solo urgenze (328 053 3005) · riapriamo ${quando} alle ${f[0].apre}` };
        }
        return { aperto: false, stato: 'chiuso', testo: `Chiuso · riapriamo ${quando} alle ${f[0].apre}` };
    }
    return { aperto: false, stato: 'chiuso', testo: 'Chiuso' };
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
        const colori = { aperto: 'bg-emerald-500', appuntamento: 'bg-amber-500', chiuso: 'bg-rose-500' };
        const aggiornaStato = () => {
            const { stato, testo } = statoOrari(...adessoATeramo());
            statoEl.textContent = testo;
            pallinoEl.className = `w-2 h-2 rounded-full shrink-0 ${colori[stato] || colori.chiuso}`;
        };
        aggiornaStato();
        setInterval(aggiornaStato, 60000);
    }

    // Barra azioni rapide mobile (Chiama / WhatsApp / Mappa)
    if (!document.getElementById('mobile-dock')) {
        const dock = document.createElement('div');
        dock.id = 'mobile-dock';
        dock.setAttribute('aria-label', 'Azioni rapide');
        dock.className = 'md:hidden fixed bottom-3 inset-x-3 z-30 bg-white/95 backdrop-blur-md border border-wix-teal/20 rounded-2xl shadow-lg p-1.5 grid grid-cols-3 gap-1.5';
        const btn = (href, testo, icona, esterno, accent) => {
            const a = document.createElement('a');
            a.href = href;
            if (esterno) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
            a.className = accent
                ? 'flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl bg-wix-teal text-white font-sans font-semibold text-[13px] shadow-sm active:scale-[0.98] transition-transform'
                : 'flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl bg-wix-sage text-wix-dark hover:bg-wix-sageDeep font-sans font-semibold text-[13px] active:scale-[0.98] transition-transform';
            a.innerHTML = `${icona}<span>${testo}</span>`;
            return a;
        };
        dock.append(
            btn('tel:+390861241533', 'Chiama', '<svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>', false, true),
            btn('https://wa.me/393283666840', 'WhatsApp', '<svg class="w-4 h-4 shrink-0 text-emerald-600" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zm5.79 14.12c-.24.68-1.41 1.3-1.95 1.38-.52.08-1.18.11-1.91-.12-.44-.14-1-.33-1.72-.64-3.03-1.31-5.01-4.37-5.16-4.57-.15-.2-1.23-1.64-1.23-3.13s.78-2.22 1.06-2.52c.28-.3.61-.38.81-.38h.58c.19 0 .44-.07.69.53.25.6.86 2.1.94 2.25.08.15.13.33.03.53-.1.2-.15.33-.3.5-.15.18-.32.39-.45.53-.15.15-.31.31-.13.61.18.3.79 1.3 1.7 2.11 1.17 1.04 2.15 1.36 2.45 1.51.3.15.48.13.66-.08.18-.2.76-.88.96-1.18.2-.3.4-.25.68-.15.28.1 1.76.83 2.06.98.3.15.5.23.58.35.08.13.08.73-.16 1.41z"/></svg>', true, false),
            btn('contattaci.html#mappa-box', 'Mappa', '<svg class="w-4 h-4 shrink-0 text-wix-teal" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>', false, false)
        );
        document.body.appendChild(dock);
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

    // Lightbox galleria fotografica in Home (stile Cosmos)
    const lightbox = document.getElementById('lightbox');
    const items = Array.from(document.querySelectorAll('[data-lightbox-src]'));
    if (lightbox && items.length) {
        const lbImg = document.getElementById('lb-img');
        const lbCaption = document.getElementById('lb-caption');
        const lbCounter = document.getElementById('lb-counter');
        const lbPrev = document.getElementById('lb-prev');
        const lbNext = document.getElementById('lb-next');
        const lbClose = document.getElementById('lb-close');
        let idx = 0, timerChiusura, touchStartX = null;

        const mostra = i => {
            idx = (i + items.length) % items.length;
            const el = items[idx];
            lbImg.src = el.dataset.lightboxSrc;
            lbImg.alt = el.dataset.lightboxAlt || '';
            lbCaption.textContent = el.dataset.lightboxAlt || '';
            lbCounter.textContent = `${String(idx + 1).padStart(2, '0')} / ${String(items.length).padStart(2, '0')}`;
        };
        const apriLb = i => {
            clearTimeout(timerChiusura);
            mostra(i);
            lightbox.classList.remove('chiusura');
            if (!lightbox.open) lightbox.showModal();
        };
        const chiudiLb = () => {
            lightbox.classList.add('chiusura');
            timerChiusura = setTimeout(() => { lightbox.close(); lightbox.classList.remove('chiusura'); }, 180);
        };

        items.forEach((btn, i) => btn.addEventListener('click', () => apriLb(i)));
        if (lbPrev) lbPrev.addEventListener('click', () => mostra(idx - 1));
        if (lbNext) lbNext.addEventListener('click', () => mostra(idx + 1));
        if (lbClose) lbClose.addEventListener('click', chiudiLb);
        lightbox.addEventListener('cancel', e => { e.preventDefault(); chiudiLb(); });
        lightbox.addEventListener('click', e => { if (e.target === lightbox) chiudiLb(); });
        lightbox.addEventListener('keydown', e => {
            if (e.key === 'ArrowLeft') mostra(idx - 1);
            if (e.key === 'ArrowRight') mostra(idx + 1);
        });
        lightbox.addEventListener('touchstart', e => { touchStartX = e.changedTouches[0].clientX; }, { passive: true });
        lightbox.addEventListener('touchend', e => {
            if (touchStartX === null) return;
            const dx = e.changedTouches[0].clientX - touchStartX;
            touchStartX = null;
            if (Math.abs(dx) > 45) mostra(dx > 0 ? idx - 1 : idx + 1);
        }, { passive: true });
    }

    // Barboncino bianco interattivo da accarezzare (touch e mouse) in Home
    const stage = document.getElementById('barboncino-stage');
    if (stage) {
        const pup = document.getElementById('barboncino-svg');
        const head = document.getElementById('barboncino-testa');
        const occhiRiposo = document.getElementById('occhi-riposo');
        const occhiFelici = document.getElementById('occhi-felici');
        const boccaFelice = document.getElementById('bocca-felice');
        const statoPup = document.getElementById('barboncino-stato');
        const countEl = document.getElementById('barboncino-count');
        const premioBtn = document.getElementById('barboncino-premio');

        const frasi = [
            'Scodinzola felice!',
            'Chiude gli occhi per le coccole...',
            'Adora essere accarezzato sulla testolina',
            'Coda a tutta velocità!'
        ];
        let carezze = 0, timerCalma = null, ultimoCuore = 0, ultimaCarezza = 0, attivo = false;

        const impostaFelice = on => {
            pup.classList.toggle('barboncino-felice', on);
            if (occhiRiposo) occhiRiposo.classList.toggle('hidden', on);
            if (occhiFelici) occhiFelici.classList.toggle('hidden', !on);
            if (boccaFelice) boccaFelice.classList.toggle('hidden', !on);
            if (!on && head) head.style.transform = '';
        };

        const generaCuore = (clientX, clientY, simbolo = '♥') => {
            const now = performance.now();
            if (now - ultimoCuore < 140) return;
            ultimoCuore = now;
            const rect = stage.getBoundingClientRect();
            const span = document.createElement('span');
            span.className = 'particella-cuore text-lg select-none text-wix-teal font-bold';
            span.textContent = simbolo;
            span.style.left = `${Math.max(24, Math.min(rect.width - 24, clientX - rect.left))}px`;
            span.style.top = `${Math.max(24, Math.min(rect.height - 24, clientY - rect.top))}px`;
            stage.appendChild(span);
            span.addEventListener('animationend', () => span.remove(), { once: true });
        };

        const registraCarezza = (clientX, clientY, inclinazione = true, forza = false) => {
            const now = performance.now();
            if (forza || now - ultimaCarezza >= 220) {
                ultimaCarezza = now;
                carezze += 1;
                if (countEl) countEl.textContent = `Carezze: ${carezze}`;
                if (statoPup) statoPup.textContent = frasi[Math.min(frasi.length - 1, Math.floor((carezze - 1) / 4))];
            }
            impostaFelice(true);

            if (inclinazione && head) {
                const r = stage.getBoundingClientRect();
                const nx = Math.max(-1, Math.min(1, ((clientX - r.left) / r.width - 0.5) * 2));
                const ny = Math.max(-1, Math.min(1, ((clientY - r.top) / r.height - 0.5) * 2));
                head.style.transform = `translate(${(nx * 4).toFixed(1)}px, ${(ny * 3).toFixed(1)}px) rotate(${(nx * 5).toFixed(1)}deg)`;
            }
            generaCuore(clientX, clientY, carezze % 5 === 0 ? '🐾' : '♥');
            clearTimeout(timerCalma);
            timerCalma = setTimeout(() => impostaFelice(false), 1200);
        };

        stage.addEventListener('pointerdown', e => {
            attivo = true;
            stage.setPointerCapture(e.pointerId);
            registraCarezza(e.clientX, e.clientY, true, true);
            if (navigator.vibrate) navigator.vibrate(8);
        });
        stage.addEventListener('pointermove', e => {
            if (!attivo && e.pointerType === 'touch') return;
            if (e.pointerType === 'mouse' && e.buttons === 0) {
                impostaFelice(true);
                clearTimeout(timerCalma);
                timerCalma = setTimeout(() => impostaFelice(false), 900);
                generaCuore(e.clientX, e.clientY, '♥');
                return;
            }
            if (attivo) registraCarezza(e.clientX, e.clientY, true, false);
        });
        const fine = () => { attivo = false; };
        stage.addEventListener('pointerup', fine);
        stage.addEventListener('pointercancel', fine);
        stage.addEventListener('keydown', e => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                const r = stage.getBoundingClientRect();
                registraCarezza(r.left + r.width / 2, r.top + r.height * 0.35, false, true);
            }
        });

        if (premioBtn) {
            premioBtn.addEventListener('click', () => {
                const r = stage.getBoundingClientRect();
                registraCarezza(r.left + r.width / 2, r.top + r.height * 0.4, false, true);
                ultimoCuore = 0;
                generaCuore(r.left + r.width * 0.42, r.top + r.height * 0.35, '🦴');
                if (statoPup) statoPup.textContent = 'Gnam! Apprezza moltissimo il premietto!';
                if (navigator.vibrate) navigator.vibrate([10, 40, 12]);
            });
        }
    }

    // Mappa interattiva in Contattaci (zoom +/-, reset e trascinamento sicuro su mobile)
    const mappaBox = document.getElementById('mappa-box');
    const mappaImg = document.getElementById('mappa-img');
    const zoomInBtn = document.getElementById('mappa-zoom-in');
    const zoomOutBtn = document.getElementById('mappa-zoom-out');
    const resetBtn = document.getElementById('mappa-reset');
    if (mappaBox && mappaImg) {
        let scala = 1, tx = 0, ty = 0, trascina = false, startX = 0, startY = 0;
        const aggiornaStato = () => {
            const zoomato = scala > 1;
            mappaImg.style.touchAction = zoomato ? 'none' : 'pan-y';
            mappaImg.style.transform = `translate(${tx}px, ${ty}px) scale(${scala})`;
            if (resetBtn) resetBtn.classList.toggle('hidden', !zoomato);
        };
        const limita = () => {
            const maxX = (mappaBox.clientWidth * (scala - 1)) / 2;
            const maxY = (mappaBox.clientHeight * (scala - 1)) / 2;
            tx = Math.max(-maxX, Math.min(maxX, tx));
            ty = Math.max(-maxY, Math.min(maxY, ty));
            aggiornaStato();
        };
        const cambiaZoom = delta => {
            scala = Math.max(1, Math.min(2.4, +(scala + delta).toFixed(2)));
            if (scala === 1) { tx = 0; ty = 0; }
            limita();
        };
        if (zoomInBtn) zoomInBtn.addEventListener('click', () => cambiaZoom(0.35));
        if (zoomOutBtn) zoomOutBtn.addEventListener('click', () => cambiaZoom(-0.35));
        if (resetBtn) resetBtn.addEventListener('click', () => { scala = 1; tx = 0; ty = 0; aggiornaStato(); });
        mappaBox.addEventListener('dblclick', e => {
            if (e.target.closest('a, button')) return;
            cambiaZoom(scala < 2 ? 0.45 : -2);
        });
        mappaImg.addEventListener('pointerdown', e => {
            if (e.pointerType === 'touch' && scala <= 1) return;
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
        aggiornaStato();
    }

    // Menu mobile (<dialog id="mobile-menu">)
    const mobileMenu = document.getElementById('mobile-menu');
    const menuOpen = document.getElementById('menu-open');
    const menuClose = document.getElementById('menu-close');
    if (!mobileMenu) return;

    let chiusura;
    const apri = () => {
        clearTimeout(chiusura);
        mobileMenu.classList.remove('chiusura');
        if (!mobileMenu.open) mobileMenu.showModal();
    };
    const chiudi = () => {
        mobileMenu.classList.add('chiusura');
        chiusura = setTimeout(() => { mobileMenu.close(); mobileMenu.classList.remove('chiusura'); }, 160);
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
