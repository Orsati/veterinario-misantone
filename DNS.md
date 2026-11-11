# DNS di veterinariomisantone.it — passaggio da Wix a Cloudflare

## Com'è adesso (stato rilevato prima del cambio)

Il dominio è registrato su **Register.it**, usa i nameserver di **Wix** (`ns0.wixdns.net` e `ns1.wixdns.net`) per il sito web e usa **Register.it** per la posta elettronica.

| Tipo | Nome | Valore attuale | Cosa fa |
|---|---|---|---|
| `NS` | `veterinariomisantone.it` | `ns0.wixdns.net`, `ns1.wixdns.net` | Delega la gestione DNS a Wix |
| `A` | `veterinariomisantone.it` | `185.230.63.107`, `185.230.63.171`, `185.230.63.186` | Vecchio sito su Wix |
| `CNAME` | `www` | `cdn3.wixdns.net` | Vecchio sito su Wix |
| `MX` | `veterinariomisantone.it` | `10 mail.register.it` | Posta su Register.it — **da non toccare** |

Prima di cambiare i nameserver su Register.it, apri il pannello DNS attuale (su Wix o Register.it) e controlla se ci sono altri record `TXT`, `CNAME` o sottodomini da copiare su Cloudflare.

---

## Passaggio a Cloudflare

### 1. Aggiungi il dominio su Cloudflare
1. Accedi a Cloudflare → **Add a domain** → inserisci `veterinariomisantone.it` (piano **Free**).
2. Prima di cambiare i nameserver, controlla nella schermata **DNS → Records** di Cloudflare che il record della posta sia presente:
   - `MX` · nome `@` · mail server `mail.register.it` · priorità `10`.
   - Se c'è un record `A` per `mail`, deve avere la nuvoletta **grigia (DNS Only)** — mai arancione, altrimenti la posta smette di funzionare.
3. Elimina i vecchi record `A` (`185.230.63.*`) e `CNAME` (`www` → `cdn3.wixdns.net`) che puntavano a Wix.

### 2. Collega il Worker al dominio
Nel progetto Cloudflare (`Workers & Pages` → `veterinariomisantone` → `Settings` → `Domains & Routes` → `Add` → `Custom domain`), aggiungi due voci:
- `veterinariomisantone.it`
- `www.veterinariomisantone.it`

Cloudflare crea da solo i record DNS che puntano al sito e genera in automatico il certificato HTTPS.

### 3. Reindirizza `www` verso il dominio senza `www`
Il sito usa `https://veterinariomisantone.it` come indirizzo canonico (dichiarato in `canonical`, `og:url` e `sitemap.xml`). Per evitare che `www.veterinariomisantone.it` mostri una copia separata agli occhi di Google:

In Cloudflare → `Rules` → `Redirect Rules` → `Create rule`:
- **When incoming requests match**: Hostname equals `www.veterinariomisantone.it`
- **Then**: Dynamic redirect → `concat("https://veterinariomisantone.it", http.request.uri.path)` · Status code `301` · Preserve query string.

### 4. Cambia i nameserver su Register.it
1. Entra nel pannello di **Register.it** → Domini → `veterinariomisantone.it` → **Configurazione DNS / Nameserver**.
2. Sostituisci `ns0.wixdns.net` e `ns1.wixdns.net` con i due nameserver indicati da Cloudflare (es. `xxxx.ns.cloudflare.com`).
3. Attendi la propagazione (di solito da 15 minuti a qualche ora). Una volta attivo su Cloudflare, potrai disdire il rinnovo dell'abbonamento Wix.
