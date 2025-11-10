# PSDturni - Sistema Gestione Turni Ospedalieri

Sistema web moderno per la gestione dei turni del personale ospedaliero con interfaccia Material Design.

## 🎯 Caratteristiche

- **Autenticazione Sicura**: Login con username (formato: inizialenome+cognome) e password personalizzabile
- **Gestione Ruoli**: Profili Amministratore e Utente con permessi differenziati
- **Indisponibilità**: Gli utenti possono inserire le proprie indisponibilità per i prossimi 3 mesi
- **Deadline Automatica**: Scadenza il 20 del mese precedente per modifiche alle indisponibilità
- **Assegnazione Turni**: Interfaccia intuitiva per l'assegnazione manuale dei turni
- **Auto-Assegnazione**: Algoritmo intelligente per l'assegnazione automatica dei turni
- **Gestione Ambulatori**: Possibilità di chiudere ambulatori in giorni specifici
- **Validazione Turni**: Controllo automatico delle competenze e disponibilità
- **Esportazione PDF**: Generazione di PDF professionali (bozza o definitivo) con logo ospedaliero
- **Design Responsivo**: Ottimizzato per desktop, tablet e mobile

## 🚀 Utilizzo

### Accesso al Sistema

1. **URL**: https://morosss.github.io/PSDturni/
2. **Primo Accesso**:
   - Inserisci il tuo ID utente (es. `mrossi`)
   - Password temporanea: lascia vuoto al primo accesso
   - Imposta la tua password personale (minimo 6 caratteri)

### Credenziali di Default

**Amministratore:**
- ID: `mrossi`
- Password: (da impostare al primo accesso)

## 📋 Funzionalità per Utente

### Utenti Standard

- **Visualizzare Calendario**: Consulta i turni assegnati per tutti i mesi
- **Gestire Indisponibilità**:
  - Seleziona i giorni di indisponibilità per i prossimi 3 mesi
  - Deadline: 20 del mese precedente
  - Visualizzazione del conto alla rovescia
- **Cambiare Password**: Modifica la password personale in qualsiasi momento

### Amministratori

Tutte le funzioni utente, più:

- **Gestione Utenti**:
  - Aggiungere nuovi utenti
  - Modificare profili esistenti
  - Assegnare ruoli e competenze
  - Eliminare utenti

- **Gestione Turni**:
  - Visualizzare e modificare turni per tutti i mesi
  - Chiudere/aprire ambulatori in giorni specifici
  - Assegnare manualmente personale ai turni
  - Validazione automatica delle assegnazioni

- **Assegnazione Automatica**:
  - Generare automaticamente i turni per un mese
  - Algoritmo che considera competenze, indisponibilità e ambulatori chiusi
  - Report dettagliato dei turni assegnati/non assegnati

- **Esportazione PDF**:
  - Generare PDF professionali
  - Scegliere tra bozza e definitivo
  - Layout ottimizzato per 1-2 pagine

## 🏥 Tipi di Turni

Il sistema gestisce 18 tipi di turni/ambulatori tra cui SALA (Senior/Junior), REPARTO, UTIC, PS, ECO, VISITE e altri.

## 🔒 Sicurezza

- **Password Hashing**: SHA-256
- **Input Sanitization**: Protezione XSS
- **Validazione**: Controlli su tutti gli input
- **LocalStorage**: Dati salvati localmente

## 🛠️ Tecnologie

- HTML5, CSS3, JavaScript ES6+
- Material Design
- jsPDF per esportazione PDF
- Web Crypto API per sicurezza

## 📱 Compatibilità

Chrome, Firefox, Safari, Edge e browser mobile

---

**Versione**: 1.0.0 | **Data**: Novembre 2025