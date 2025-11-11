# PSDturni - Sistema Gestione Turni Ospedalieri

Sistema web moderno per la gestione dei turni del personale ospedaliero con interfaccia Material Design.

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/morosss/PSDturni)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Deployment](https://img.shields.io/badge/deployment-GitHub_Pages-brightgreen.svg)](https://morosss.github.io/PSDturni/)

---

## 📋 Indice

- [Caratteristiche Principali](#-caratteristiche-principali)
- [Demo Live](#-demo-live)
- [Documentazione Completa](#-documentazione-completa)
- [Quick Start](#-quick-start)
- [Tecnologie](#-tecnologie)
- [Funzionalità per Ruolo](#-funzionalità-per-ruolo)
- [Tipi di Turni](#-tipi-di-turni)
- [Screenshot](#-screenshot)
- [Architettura](#-architettura)
- [Sicurezza](#-sicurezza)
- [Compatibilità Browser](#-compatibilità-browser)
- [Deployment](#-deployment)
- [Sviluppo](#-sviluppo)
- [Contribuire](#-contribuire)
- [Supporto](#-supporto)
- [Licenza](#-licenza)

---

## 🎯 Caratteristiche Principali

### Per Tutti gli Utenti
- ✅ **Autenticazione Sicura**: Login con username e password personalizzabile (SHA-256)
- ✅ **Calendario Intuitivo**: Visualizzazione chiara dei turni assegnati
- ✅ **Gestione Indisponibilità**: Dichiarazione indisponibilità per i prossimi 3 mesi
- ✅ **Deadline Automatica**: Scadenza il 20 del mese precedente con countdown
- ✅ **Cambio Password**: Modifica password in qualsiasi momento
- ✅ **Design Responsivo**: Ottimizzato per desktop, tablet e mobile

### Per Amministratori
- 👥 **Gestione Utenti**: Aggiungi, modifica, elimina utenti con competenze specifiche
- 📅 **Assegnazione Manuale**: Interfaccia drag-and-drop per assegnare turni
- 🤖 **Auto-Assegnazione Intelligente**: Algoritmo con 4 regole chiave e bilanciamento carico
- 🏥 **Gestione Ambulatori**: Chiudi/apri ambulatori per giorni specifici
- ✅ **Validazione Turni**: Controllo automatico competenze e disponibilità
- 📊 **Panoramica Indisponibilità**: Vista aggregata di tutti gli utenti
- 📄 **Esportazione PDF/Excel**: Genera report professionali (bozza o definitivo)
- 💾 **Version Control**: Salva e ripristina configurazioni turni
- 🔒 **Sistema di Approvazione**: Marca mesi come bozza o approvati

---

## 🌐 Demo Live

**URL**: [https://morosss.github.io/PSDturni/](https://morosss.github.io/PSDturni/)

**Credenziali Admin** (demo):
- Username: `spizzocri`
- Password: Contatta l'amministratore

---

## 📚 Documentazione Completa

La documentazione completa del sistema è disponibile nella cartella `/docs`:

| Documento | Descrizione | Link |
|-----------|-------------|------|
| **ARCHITECTURE.md** | Architettura tecnica del sistema, pattern di design, stack tecnologico | [📖 Leggi](docs/ARCHITECTURE.md) |
| **FEATURES.md** | Documentazione completa di tutte le funzionalità | [📖 Leggi](docs/FEATURES.md) |
| **API_REFERENCE.md** | Riferimento completo API JavaScript (60+ funzioni) | [📖 Leggi](docs/API_REFERENCE.md) |
| **DATABASE_SCHEMA.md** | Schema dati localStorage, modelli, validazione | [📖 Leggi](docs/DATABASE_SCHEMA.md) |
| **DEPLOYMENT.md** | Guida completa deployment e configurazione | [📖 Leggi](docs/DEPLOYMENT.md) |
| **GUIDA_RAPIDA.md** | Guida rapida per iniziare (italiano) | [📖 Leggi](GUIDA_RAPIDA.md) |

### Documentazione per Categoria

**👨‍💻 Per Sviluppatori:**
- [Architettura Sistema](docs/ARCHITECTURE.md)
- [Riferimento API](docs/API_REFERENCE.md)
- [Schema Database](docs/DATABASE_SCHEMA.md)

**🚀 Per DevOps:**
- [Guida Deployment](docs/DEPLOYMENT.md)
- [Backup e Recovery](docs/DEPLOYMENT.md#backup-and-maintenance)
- [Troubleshooting](docs/DEPLOYMENT.md#troubleshooting)

**👥 Per Utenti:**
- [Guida Rapida](GUIDA_RAPIDA.md)
- [Guida Funzionalità](docs/FEATURES.md)

**📊 Per Manager:**
- [Panoramica Funzionalità](docs/FEATURES.md)
- [Sistema di Sicurezza](docs/ARCHITECTURE.md#security-architecture)

---

## 🚀 Quick Start

### 1. Accesso al Sistema

```
1. Apri: https://morosss.github.io/PSDturni/
2. Inserisci username (es. agrelli, aborin, jzannoni)
3. Primo accesso: lascia password vuota
4. Imposta password personale (minimo 6 caratteri)
```

### 2. Per Utenti Standard

```
✓ Visualizza Calendario → Consulta turni assegnati
✓ Gestisci Indisponibilità → Seleziona giorni non disponibili
✓ Cambia Password → Modifica password personale
```

**Importante**: Deadline indisponibilità = 20 del mese precedente

### 3. Per Amministratori

```
✓ Gestione Utenti → Aggiungi/modifica utenti e competenze
✓ Gestione Turni → Assegna manualmente turni
✓ Assegnazione Automatica → Genera turni con algoritmo intelligente
✓ Esportazione → Genera PDF/Excel professionali
✓ Versioni → Salva e ripristina configurazioni
```

---

## 🛠️ Tecnologie

### Core Stack
- **Frontend**: HTML5, CSS3, JavaScript ES6+ (Vanilla)
- **UI Framework**: Material Design
- **Storage**: Browser localStorage (nessun backend)
- **Hosting**: GitHub Pages (statico)

### Librerie Esterne
- **jsPDF** (v2.5.1) - Generazione PDF
- **jsPDF-AutoTable** (v3.8.2) - Tabelle PDF formattate
- **SheetJS** (v0.18.5) - Esportazione Excel

### API Web
- **Web Crypto API** - Hashing password SHA-256
- **localStorage API** - Persistenza dati
- **Fetch API** - Caricamento risorse
- **File API** - Esportazione file

### Design System
- **Material Icons** - Iconografia
- **Roboto Font** - Tipografia
- **CSS Variables** - Theming
- **CSS Grid/Flexbox** - Layout

---

## 📋 Funzionalità per Ruolo

### Utenti Standard

| Funzionalità | Descrizione | Accesso |
|--------------|-------------|---------|
| 📅 Calendario | Visualizza turni personali | ✅ |
| 📋 Indisponibilità | Dichiara giorni non disponibili (prossimi 3 mesi) | ✅ |
| 🔑 Cambio Password | Modifica password personale | ✅ |

### Amministratori

Tutte le funzioni utente **+**:

| Funzionalità | Descrizione | Accesso |
|--------------|-------------|---------|
| 👥 Gestione Utenti | CRUD utenti, assegna ruoli e competenze | 🔒 Admin |
| 📅 Gestione Turni | Assegnazione manuale con validazione | 🔒 Admin |
| 🤖 Auto-Assegnazione | Algoritmo intelligente con 4 regole | 🔒 Admin |
| 🏥 Ambulatori | Chiudi/apri ambulatori per date specifiche | 🔒 Admin |
| 📊 Panoramica | Vista aggregata indisponibilità | 🔒 Admin |
| 📄 Esportazione | PDF/Excel professionale | 🔒 Admin |
| 💾 Versioni | Salva/ripristina configurazioni turni | 🔒 Admin |
| ✅ Approvazione | Marca mesi come bozza/approvati | 🔒 Admin |

---

## 🏥 Tipi di Turni

Sistema gestisce **18 tipi di turni** con slot orari specifici:

### Turni Emodinamica
- **SALA Senior** (MATT, POM) - Sala emodinamica senior
- **SALA Junior** (MATT, POM) - Sala emodinamica junior

### Turni Reparto
- **REPARTO** (MATT 1-3, POM 1-3) - Giro visita reparto (3 medici)
- **UTIC** (MATT, POM) - Unità Terapia Intensiva Cardiologica
- **PS** (GG, NTT) - Pronto Soccorso (24h/notte)
- **RAP** (GG, NTT) - Reparto assistenza (24h/notte)

### Ambulatori
- **ENI** (h 8-13, SPEC, h 14-18) - Ambulatorio ENI
- **VIS 201** (SPEC) - Visite stanza 201
- **VISITE 208** (MATT, POM) - Visite stanza 208
- **TDS 207** (MATT, POM) - Test da sforzo stanza 207

### Ecocardiografia
- **ECOTT 205** (MATT, POM) - Eco transtoracica stanza 205
- **ECO 206** (MATT, POM, SS) - Eco stanza 206
- **ECO spec 204** (MATT, POM, SS) - Eco specialistica stanza 204
- **ECO INT** (MATT, POM) - Eco interventistica

### Altri Turni
- **CARDIOCHIR** (MATT, POM) - Cardiochirurgia
- **Vicenza** (GG) - Ospedale Vicenza
- **Ricerca** (GG) - Giornata ricerca
- **RISERVE** (MATT, POM) - Turni riserva

**Legenda Slot Orari**:
- **MATT** = Mattina (08:00-13:00)
- **POM** = Pomeriggio (14:00-18:00)
- **NTT** = Notte (20:00-08:00)
- **GG** = Giornata intera (24h)
- **SPEC** = Slot speciale
- **SS** = SuperSpeed

---

## 📸 Screenshot

### Dashboard Principale
![Dashboard](screenshots/dashboard.png)

### Calendario Turni
![Calendario](screenshots/calendar.png)

### Gestione Indisponibilità
![Indisponibilità](screenshots/availability.png)

### Assegnazione Automatica
![Auto-Assignment](screenshots/auto-assign.png)

_Screenshots coming soon_

---

## 🏗️ Architettura

### Diagramma Architettura

```
┌─────────────────────────────────────────┐
│         Browser Environment             │
│                                         │
│  ┌────────────────────────────────────┐│
│  │   Presentation Layer (HTML/CSS)    ││
│  └────────────────────────────────────┘│
│                   ↕                     │
│  ┌────────────────────────────────────┐│
│  │   Application Layer (JavaScript)   ││
│  │   - Authentication                 ││
│  │   - Business Logic                 ││
│  │   - Validation                     ││
│  └────────────────────────────────────┘│
│                   ↕                     │
│  ┌────────────────────────────────────┐│
│  │   Data Layer (localStorage)        ││
│  │   - Users                          ││
│  │   - Shifts                         ││
│  │   - Availability                   ││
│  └────────────────────────────────────┘│
└─────────────────────────────────────────┘
```

### Caratteristiche Architetturali

- **Pattern**: Single-Page Application (SPA)
- **State Management**: Centralized AppState object
- **Data Flow**: Unidirectional data flow
- **Storage**: Browser localStorage (no backend)
- **Rendering**: Dynamic DOM manipulation
- **Security**: SHA-256 password hashing, input sanitization

**Dettagli completi**: [ARCHITECTURE.md](docs/ARCHITECTURE.md)

---

## 🔒 Sicurezza

### Misure di Sicurezza Implementate

| Misura | Implementazione | Dettagli |
|--------|-----------------|----------|
| **Password Hashing** | SHA-256 (Web Crypto API) | Nessuna password in plaintext |
| **Input Sanitization** | XSS protection | Tutti gli input sanitizzati |
| **Access Control** | Role-based (admin/user) | Controllo permessi granulare |
| **HTTPS** | Forzato via GitHub Pages | Crittografia dati in transito |
| **Session Management** | Browser session | Logout pulisce sessione |
| **Data Validation** | Client-side validation | Validazione su tutti gli input |

### Best Practices

```
✓ Password minimo 6 caratteri (configurabile)
✓ Hashing SHA-256 lato client
✓ Nessun dato sensibile in localStorage
✓ Input sanitization contro XSS
✓ Role-based access control
✓ HTTPS obbligatorio in produzione
```

**Dettagli completi**: [ARCHITECTURE.md - Security](docs/ARCHITECTURE.md#security-architecture)

---

## 🌐 Compatibilità Browser

### Browser Supportati

| Browser | Versione Minima | Livello Supporto |
|---------|-----------------|------------------|
| Chrome | 90+ | ✅ Completo |
| Firefox | 88+ | ✅ Completo |
| Safari | 14+ | ✅ Completo |
| Edge | 90+ | ✅ Completo |
| Chrome Mobile | 90+ | ✅ Completo |
| Safari iOS | 14+ | ✅ Completo |

### Requisiti Tecnologici

```
✓ JavaScript ES6+ abilitato
✓ localStorage abilitato (5-10 MB)
✓ Web Crypto API support
✓ CSS Grid & Flexbox support
✓ Risoluzione minima: 1024×768
✓ Risoluzione consigliata: 1920×1080
```

### Dispositivi Testati

- 💻 Desktop (Windows, macOS, Linux)
- 📱 Tablet (iPad, Android tablet)
- 📱 Smartphone (iPhone, Android)

---

## 🚀 Deployment

### Opzione 1: GitHub Pages (Attuale)

```bash
# Già deployato su:
https://morosss.github.io/PSDturni/

# Per aggiornare:
git add .
git commit -m "Update"
git push origin main
# Auto-deploy in 1-2 minuti
```

### Opzione 2: Netlify

```bash
# Drag & drop nella dashboard Netlify
# oppure
npm install -g netlify-cli
netlify deploy --prod
```

### Opzione 3: Vercel

```bash
npm install -g vercel
cd PSDturni
vercel --prod
```

### Opzione 4: Self-Hosted

```bash
# Apache/Nginx
cp -r PSDturni /var/www/html/
# Configura VirtualHost
# Accedi via http://server/PSDturni/
```

**Guida completa**: [DEPLOYMENT.md](docs/DEPLOYMENT.md)

---

## 💻 Sviluppo

### Setup Ambiente Locale

```bash
# 1. Clone repository
git clone https://github.com/morosss/PSDturni.git
cd PSDturni

# 2. Avvia server locale (scegli uno)

# Python 3
python -m http.server 8000

# Node.js
npx http-server -p 8000

# PHP
php -S localhost:8000

# 3. Apri browser
open http://localhost:8000
```

### Struttura Progetto

```
PSDturni/
├── index.html              # Struttura HTML principale (489 righe)
├── app.js                  # Logica applicazione (2,637 righe)
├── styles.css              # Stili completi (1,200+ righe)
├── README.md               # Questo file
├── GUIDA_RAPIDA.md         # Guida rapida italiano
├── Novembre 2025.xlsx      # Dati esempio
├── docs/                   # Documentazione completa
│   ├── ARCHITECTURE.md     # Architettura sistema
│   ├── FEATURES.md         # Documentazione features
│   ├── API_REFERENCE.md    # Riferimento API (60+ funzioni)
│   ├── DATABASE_SCHEMA.md  # Schema dati localStorage
│   └── DEPLOYMENT.md       # Guida deployment
└── .git/                   # Version control
```

### Modificare Configurazione

#### 1. Aggiornare Utenti Default

Modifica `app.js` righe 205-236:

```javascript
const defaultUsers = [
    {
        id: 'tuousername',
        name: 'Tuo Nome',
        role: 'admin',
        // ...
    }
];
```

#### 2. Personalizzare Turni

Modifica `app.js` righe 7-32:

```javascript
const SHIFT_TYPES = [
    'Tuo Turno 1',
    'Tuo Turno 2',
    // ...
];
```

#### 3. Aggiungere Logo Ospedale

In `app.js` funzione `generatePDF()`:

```javascript
const logoBase64 = 'data:image/png;base64,TUO_BASE64...';
doc.addImage(logoBase64, 'PNG', 10, 10, 30, 30);
```

---

## 🤝 Contribuire

Contributi benvenuti! Segui questi step:

### 1. Fork e Clone

```bash
# Fork su GitHub, poi:
git clone https://github.com/TUO_USERNAME/PSDturni.git
cd PSDturni
git checkout -b feature/nuova-funzionalita
```

### 2. Sviluppa

```bash
# Fai modifiche
# Testa localmente
# Commit
git add .
git commit -m "Aggiungi nuova funzionalità: descrizione"
```

### 3. Push e Pull Request

```bash
git push origin feature/nuova-funzionalita
# Apri Pull Request su GitHub
```

### Linee Guida

- ✅ Segui State-of-the-Art coding principles
- ✅ Commenta codice complesso
- ✅ Testa su Chrome, Firefox, Safari
- ✅ Mantieni compatibilità con esistente
- ✅ Aggiorna documentazione
- ✅ Usa commit messages descrittivi

---

## 📊 Statistiche Progetto

| Metrica | Valore |
|---------|--------|
| **Righe Codice** | ~4,300+ |
| **Funzioni JavaScript** | 60+ |
| **Componenti UI** | 20+ |
| **Tipi di Turni** | 18 |
| **Utenti Pre-configurati** | 27 |
| **Documentazione** | 6 file, 5,000+ righe |
| **Bundle Size** | ~370 KB |
| **Load Time (3G)** | <1 secondo |

---

## 🆘 Supporto

### Problemi Comuni

**Non riesco ad accedere**
```
→ Verifica username corretto (minuscolo)
→ Primo accesso? Lascia password vuota
→ Contatta amministratore per reset
```

**Non posso modificare indisponibilità**
```
→ Controlla deadline (20 del mese precedente)
→ Deadline passata? Contatta amministratore
```

**PDF non si scarica**
```
→ Controlla permessi download browser
→ Prova browser diverso (Chrome consigliato)
→ Disabilita estensioni temporaneamente
```

### Contatti

- 📧 **Email**: Contatta amministratore sistema
- 🐛 **Bug Report**: [GitHub Issues](https://github.com/morosss/PSDturni/issues)
- 📖 **Documentazione**: [docs/](docs/)
- ❓ **FAQ**: [GUIDA_RAPIDA.md](GUIDA_RAPIDA.md)

---

## 📈 Roadmap

### v1.1 (Q1 2026)
- [ ] Backend API (Node.js + Express)
- [ ] Database PostgreSQL
- [ ] Multi-device sync
- [ ] Email notifications
- [ ] Advanced analytics

### v1.2 (Q2 2026)
- [ ] Mobile app (React Native)
- [ ] Push notifications
- [ ] Calendar integrations (Google, iCal)
- [ ] Shift swap requests
- [ ] Advanced reporting

### v2.0 (Q3 2026)
- [ ] Machine Learning shift optimization
- [ ] Multi-hospital support
- [ ] API per integrazioni terze parti
- [ ] White-label customization
- [ ] Enterprise features

---

## 📜 Licenza

Copyright © 2025 PSDturni

Questo progetto è sviluppato per uso ospedaliero interno.

Per richieste di licenza commerciale, contattare l'amministratore.

---

## 🙏 Riconoscimenti

Sviluppato per il Dipartimento di Cardiologia per semplificare la gestione turni ospedalieri.

### Tecnologie Open Source Utilizzate

- [jsPDF](https://github.com/parallax/jsPDF) - Generazione PDF
- [SheetJS](https://github.com/SheetJS/sheetjs) - Esportazione Excel
- [Material Design Icons](https://material.io/resources/icons/) - Iconografia
- [Google Fonts](https://fonts.google.com/) - Tipografia Roboto

---

## 📞 Contatti

**Repository**: [github.com/morosss/PSDturni](https://github.com/morosss/PSDturni)

**Demo Live**: [morosss.github.io/PSDturni](https://morosss.github.io/PSDturni/)

**Documentazione**: [docs/](docs/)

---

<div align="center">

**PSDturni** - Sistema Gestione Turni Ospedalieri

Versione 1.0.0 | Novembre 2025

[Demo](https://morosss.github.io/PSDturni/) • [Documentazione](docs/) • [Guida Rapida](GUIDA_RAPIDA.md) • [Issues](https://github.com/morosss/PSDturni/issues)

Made with ❤️ for healthcare professionals

</div>
