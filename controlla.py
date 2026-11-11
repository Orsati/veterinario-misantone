#!/usr/bin/env python3
"""Controlli sul sito prima di pubblicare. Non modifica nulla; esce con 1 se trova un problema."""

import json, os, re, shutil, struct, subprocess, sys
from html.parser import HTMLParser
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    Image = None


def dimensioni_immagine(f: Path):
    if Image is not None:
        return Image.open(f).size
    b = f.read_bytes()
    if b[:4] == b'RIFF' and b[8:12] == b'WEBP':
        chunk = b[12:16]
        if chunk == b'VP8 ':
            w, h = struct.unpack('<HH', b[26:30])
            return (w & 0x3FFF), (h & 0x3FFF)
        if chunk == b'VP8L':
            bits = struct.unpack('<I', b[21:25])[0]
            return (bits & 0x3FFF) + 1, ((bits >> 14) & 0x3FFF) + 1
        if chunk == b'VP8X':
            w = int.from_bytes(b[24:27], 'little') + 1
            h = int.from_bytes(b[27:30], 'little') + 1
            return w, h
    if b[:8] == b'\x89PNG\r\n\x1a\n':
        return struct.unpack('>II', b[16:24])
    esito = subprocess.run(['sips', '-g', 'pixelWidth', '-g', 'pixelHeight', str(f)], capture_output=True, text=True)
    w = int(re.search(r'pixelWidth:\s*(\d+)', esito.stdout).group(1))
    h = int(re.search(r'pixelHeight:\s*(\d+)', esito.stdout).group(1))
    return w, h

ROOT = Path(__file__).resolve().parent
PAGINE = ['index.html', 'chi-siamo.html', 'servizi.html', 'contattaci.html', 'privacy.html']
TUTTE = PAGINE + ['404.html']
problemi = []


def segnala(msg):
    problemi.append(msg)


class Analisi(HTMLParser):
    def __init__(self):
        super().__init__()
        self.id = set()
        self.tutti_id = []
        self.riferimenti = []   # (tag, attr, valore)
        self.img = []           # dict degli attributi

    def handle_starttag(self, tag, attrs):
        d = dict(attrs)
        if 'id' in d:
            self.id.add(d['id'])
            self.tutti_id.append(d['id'])
        for a in ('href', 'src'):
            if a in d:
                self.riferimenti.append((tag, a, d[a]))
        if 'srcset' in d:
            for parte in d['srcset'].split(','):
                url = parte.strip().split()[0]
                if url:
                    self.riferimenti.append((tag, 'srcset', url))
        if tag == 'img':
            self.img.append(d)


analisi = {}
testi = {}
for p in TUTTE:
    f = ROOT / p
    if not f.exists():
        segnala(f'{p}: file mancante')
        continue
    t = f.read_text(encoding='utf-8')
    testi[p] = t
    a = Analisi()
    a.feed(t)
    analisi[p] = a

# 1. Riferimenti locali, id doppi e ancore
usate = set()
ESTERNE = ('http://', 'https://', 'tel:', 'mailto:', 'data:', 'javascript:')
for p, a in analisi.items():
    for doppio in {i for i in a.tutti_id if a.tutti_id.count(i) > 1}:
        segnala(f'{p}: id doppio "{doppio}"')
    for tag, attr, val in a.riferimenti:
        if val.startswith(ESTERNE):
            continue
        percorso, _, ancora = val.partition('#')
        dest = (ROOT / percorso.lstrip('/')) if percorso else (ROOT / p)
        if percorso and not dest.exists():
            segnala(f'{p}: {attr}="{val}" punta a un file che non esiste')
            continue
        if percorso and dest.is_relative_to(ROOT / 'img'):
            usate.add(dest.resolve())
        if ancora:
            bersaglio = dest.name if percorso else p
            if bersaglio in analisi and ancora not in analisi[bersaglio].id:
                segnala(f'{p}: ancora #{ancora} non trovata in {bersaglio}')

# 2. Immagini citate nei JS o nei tag meta/og/link e controllo immagini in img/ non usate
for js in ROOT.glob('*.js'):
    for m in re.findall(r'img/[\w./-]+\.(?:webp|png|jpg)', js.read_text(encoding='utf-8')):
        f = ROOT / m
        if f.exists():
            usate.add(f.resolve())
for p, t in testi.items():
    for m in re.findall(r'(?:https://veterinariomisantone\.it/|[\'"])/?(img/[\w./-]+\.(?:webp|png|jpg))', t):
        f = ROOT / m
        if f.exists():
            usate.add(f.resolve())

for f in (ROOT / 'img').rglob('*'):
    if f.is_file() and not f.name.startswith('.') and f.resolve() not in usate:
        segnala(f'{f.relative_to(ROOT)}: immagine non usata in nessuna pagina')

# 3. Attributi delle <img>: alt presente, proporzioni di width/height uguali al file
for p, a in analisi.items():
    for d in a.img:
        src = d.get('src', '')
        if 'alt' not in d:
            segnala(f'{p}: <img src="{src}"> senza attributo alt')
        elif not d['alt'].strip() and not src.startswith('data:'):
            segnala(f'{p}: <img src="{src}"> ha alt vuoto')
        if src.startswith(ESTERNE) or not src:
            continue
        f = ROOT / src.lstrip('/')
        if not f.exists():
            continue
        if 'width' not in d or 'height' not in d:
            segnala(f'{p}: <img src="{src}"> senza width o height')
            continue
        w, h = int(d['width']), int(d['height'])
        rw, rh = dimensioni_immagine(f)
        if abs(w / h - rw / rh) > 0.01:
            segnala(f'{p}: <img src="{src}"> dichiara {w}x{h} ma il file è {rw}x{rh}')

# 4. Barra in alto, menu mobile e footer uguali sulle pagine principali
def normalizza_nav(s):
    # Rimuove aria-current="page"
    s = re.sub(r'\s*aria-current="page"', '', s)
    # Riporta il link attivo della navigazione alle classi inattive
    s = s.replace('text-wix-teal bg-white shadow-sm font-semibold', 'text-wix-dark hover:text-wix-teal hover:bg-white/60')
    s = re.sub(r'(<a\b[^>]*?)(?<!hover:)text-wix-teal\b', r'\1text-wix-dark hover:text-wix-teal', s)
    return s


for nome, pattern in [
    ('<nav>', r'<nav aria-label="Navigazione principale".*?</nav>'),
    ('<dialog id="mobile-menu">', r'<dialog id="mobile-menu".*?</dialog>'),
    ('<footer>', r'<footer\b.*?</footer>'),
]:
    estratti = {}
    for p in PAGINE:
        m = re.search(pattern, testi[p], re.S)
        if not m:
            segnala(f'{p}: blocco {nome} non trovato')
        else:
            estratti[p] = normalizza_nav(m.group(0))
    if len(set(estratti.values())) > 1:
        primo = PAGINE[0]
        diversi = [p for p, v in estratti.items() if v != estratti[primo]]
        segnala(f'{nome} in {", ".join(diversi)} non coincide con {primo}')

# 5. JSON-LD valido e orari allineati con nav.js
GIORNI_SCHEMA = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
nav_js = (ROOT / 'nav.js').read_text(encoding='utf-8')
m_orari = re.search(r'const ORARI = (\[[^\]]+\])', nav_js)
orari_nav = json.loads(m_orari.group(1).replace("'", '"')) if m_orari else None

for m in re.finditer(r'<script type="application/ld\+json">(.*?)</script>', testi.get('index.html', ''), re.S):
    try:
        dati = json.loads(m.group(1))
    except json.JSONDecodeError as e:
        segnala(f'index.html: JSON-LD non valido ({e})')
        continue
    if orari_nav is not None and 'openingHoursSpecification' in dati:
        da_schema = {g: [] for g in range(7)}
        for spec in dati['openingHoursSpecification']:
            fascia = '' if spec['opens'] == spec['closes'] else f"{spec['opens']}-{spec['closes']}"
            for g in spec['dayOfWeek']:
                if fascia:
                    da_schema[GIORNI_SCHEMA.index(g)].append(fascia)
        orari_schema = [','.join(da_schema[i]) for i in range(7)]
        if orari_schema != orari_nav:
            segnala(f'Orari diversi tra nav.js ({orari_nav}) e JSON-LD di index.html ({orari_schema})')

# 6. Prova di statoOrari in nav.js su casi noti (mattina, pausa pranzo, pomeriggio, sera, weekend, ferie)
PROVA_ORARI = r"""
const fs = require('fs');
const codice = fs.readFileSync('nav.js', 'utf8').split('document.addEventListener')[0];
const fn = new Function(codice + '; return { statoOrari, AVVISO };');

function prova(avviso, casi) {
    const { statoOrari, AVVISO } = fn();
    Object.assign(AVVISO, avviso);
    for (const [data, min, attesoAperto, attesoTesto] of casi) {
        const r = statoOrari(data, min);
        if (r.aperto !== attesoAperto || r.testo !== attesoTesto) {
            console.error(`statoOrari(${data}, ${min}): avuto ${JSON.stringify(r)}, atteso ${attesoAperto} "${attesoTesto}"`);
            process.exit(1);
        }
    }
}

prova({ testo: '', fino: '', chiusiDal: '' }, [
    ['2026-04-13',  8*60,    false, 'Chiuso · apriamo alle 09:00'],              // lunedì prima dell'apertura mattina
    ['2026-04-13',  9*60,    true,  'Aperto ora · fino alle 12:30'],             // lunedì apertura mattina
    ['2026-04-13', 12*60+30, false, 'Chiuso · riapriamo alle 16:00'],            // lunedì pausa pranzo
    ['2026-04-13', 16*60,    true,  'Aperto ora · fino alle 19:30'],             // lunedì apertura pomeriggio
    ['2026-04-13', 19*60+30, false, 'Chiuso · riapriamo domani alle 09:00'],     // lunedì dopo chiusura
    ['2026-04-17', 20*60,    false, 'Chiuso · riapriamo lunedì alle 09:00'],     // venerdì sera -> lunedì
    ['2026-04-18', 11*60,    false, 'Chiuso · riapriamo lunedì alle 09:00'],     // sabato -> lunedì
    ['2026-04-19', 11*60,    false, 'Chiuso · riapriamo domani alle 09:00'],     // domenica -> lunedì (domani)
]);

prova({ testo: 'Ferie', chiusiDal: '2026-08-10', fino: '2026-08-20' }, [
    ['2026-08-12', 10*60, false, 'Chiuso · riapriamo venerdì 21 agosto alle 09:00'],
    ['2026-08-19', 10*60, false, 'Chiuso · riapriamo venerdì alle 09:00'],
    ['2026-08-20', 10*60, false, 'Chiuso · riapriamo domani alle 09:00'],
]);
"""
node_bin = shutil.which('node') or ('/opt/homebrew/bin/node' if os.path.exists('/opt/homebrew/bin/node') else '/usr/local/bin/node')
esito = subprocess.run([node_bin, '-e', PROVA_ORARI], cwd=ROOT, capture_output=True, text=True)
if esito.returncode != 0:
    segnala(f'nav.js: {esito.stderr.strip()}')

# 7. Tutti gli HTML e JS devono essere elencati in tailwind.config.js (altrimenti le loro classi spariscono dal CSS)
tw = (ROOT / 'tailwind.config.js').read_text(encoding='utf-8')
for f in sorted( [*ROOT.glob('*.html'), *ROOT.glob('*.js')] ):
    if f.name == 'tailwind.config.js':
        continue
    if f.name not in tw:
        segnala(f'tailwind.config.js: manca "{f.name}" in content (le sue classi non finirebbero in css/stile.css)')

if problemi:
    for p in problemi:
        print(f'✗ {p}', file=sys.stderr)
    sys.exit(1)
print('Tutto a posto.')
