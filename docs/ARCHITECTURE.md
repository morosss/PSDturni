# PSDturni - System Architecture Documentation

## Table of Contents
1. [Overview](#overview)
2. [Architecture Patterns](#architecture-patterns)
3. [System Components](#system-components)
4. [Data Flow](#data-flow)
5. [Technology Stack](#technology-stack)
6. [Security Architecture](#security-architecture)
7. [Storage Architecture](#storage-architecture)
8. [Module Structure](#module-structure)
9. [Design Patterns](#design-patterns)
10. [Performance Considerations](#performance-considerations)

---

## Overview

PSDturni is a client-side single-page application (SPA) for hospital shift management. The architecture follows a **serverless, browser-based approach** with all data persisted in the browser's localStorage. This design enables offline functionality and eliminates server infrastructure requirements.

### Key Architectural Decisions

| Decision | Rationale | Trade-offs |
|----------|-----------|------------|
| Client-side only (no backend) | Zero infrastructure cost, instant deployment, offline capability | No multi-device sync, limited storage (5-10MB) |
| Vanilla JavaScript (no framework) | Minimal bundle size, direct DOM control, no framework overhead | More manual DOM manipulation, less ecosystem tooling |
| localStorage for persistence | Simple persistence layer, no DB setup required | Browser-specific data, no concurrent multi-user support |
| Material Design | Professional UI, well-established patterns | Additional CSS weight |
| SHA-256 password hashing | Secure without backend, uses Web Crypto API | No salt (acceptable for use case) |

---

## Architecture Patterns

### 1. Single-Page Application (SPA)

```
┌─────────────────────────────────────────┐
│         index.html (Shell)              │
│  ┌───────────────────────────────────┐  │
│  │     App State (AppState)          │  │
│  │  - currentUser                    │  │
│  │  - currentView                    │  │
│  │  - data (users, shifts, etc.)     │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │   View Rendering Engine           │  │
│  │  - renderCalendar()               │  │
│  │  - renderShiftsManagement()       │  │
│  │  - renderAvailability()           │  │
│  │  - renderUsersManagement()        │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │   Event Handler Layer             │  │
│  │  - Form submissions               │  │
│  │  - Navigation clicks              │  │
│  │  - Data modifications             │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │   Business Logic Layer            │  │
│  │  - Auto-assignment algorithm      │  │
│  │  - Validation rules               │  │
│  │  - Access control                 │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### 2. State Management Pattern

```javascript
// Centralized application state
const AppState = {
    // Authentication
    currentUser: null,           // User object or null

    // UI State
    currentView: 'calendar',     // Current page
    currentMonth: 10,            // 0-11
    currentYear: 2025,

    // Data State
    users: [],                   // User records
    shifts: {},                  // Shift assignments
    availability: {},            // User unavailability
    ambulatoriStatus: {},        // Clinic open/closed
    approvalStatus: {}           // Month approval state
};
```

**Reference**: app.js:85-96

---

## System Components

### Component Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                     Browser Environment                       │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                 Presentation Layer                      │ │
│  │  - Login Screen                                        │ │
│  │  - Dashboard Views                                     │ │
│  │  - Modals/Dialogs                                      │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                 Application Layer                       │ │
│  │  - Authentication Module                               │ │
│  │  - Authorization Module                                │ │
│  │  - Calendar Manager                                    │ │
│  │  - Shifts Manager                                      │ │
│  │  - Availability Manager                                │ │
│  │  - Auto-Assignment Algorithm                           │ │
│  │  - Export Manager                                      │ │
│  │  - Version Control                                     │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                    Data Layer                           │ │
│  │  - localStorage Interface                              │ │
│  │  - Data persistence                                    │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                 External Libraries                      │ │
│  │  - jsPDF (v2.5.1)                                      │ │
│  │  - jsPDF-AutoTable (v3.8.2)                            │ │
│  │  - SheetJS (v0.18.5)                                   │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Core Technologies
- **HTML5**: Semantic markup, forms, modals
- **CSS3**: Material Design, Grid, Flexbox, CSS Variables
- **JavaScript ES6+**: Vanilla JavaScript (no frameworks)

### External Libraries
- **jsPDF v2.5.1**: PDF generation
- **jsPDF-AutoTable v3.8.2**: PDF table formatting
- **XLSX v0.18.5**: Excel export

### Web APIs
- **localStorage**: Data persistence
- **Web Crypto API**: SHA-256 password hashing

### Hosting
- **GitHub Pages**: Static site hosting
- **HTTPS**: Automatic via GitHub Pages

---

## Security Architecture

### Authentication Flow

```
User Password Input
        ↓
SHA-256 Hash (Web Crypto API)
        ↓
Compare with stored hash
        ↓
Grant/Deny Access
```

**Reference**: app.js:100-120 (hashPassword function)

### Security Measures
1. **Password Hashing**: SHA-256 (no plaintext storage)
2. **Input Sanitization**: XSS protection via sanitizeInput()
3. **Access Control**: Role-based (admin vs user)
4. **HTTPS**: Enforced via GitHub Pages

---

## Storage Architecture

### localStorage Keys

| Key | Type | Purpose |
|-----|------|---------|
| `users` | Array | User accounts with roles and capabilities |
| `shifts` | Object | Shift assignments (date → shift → slot → userId) |
| `availability` | Object | User unavailability declarations |
| `ambulatoriStatus` | Object | Clinic open/closed status |
| `approvalStatus` | Object | Month approval states |
| `shiftVersions` | Array | Saved shift configuration snapshots |
| `rememberedUserId` | String | Username for "Remember me" feature |

**Reference**: app.js:201-350 (saveToStorage, loadFromStorage functions)

---

## File Structure

```
PSDturni/
├── index.html              (489 lines) - Main HTML structure
├── app.js                  (2,637 lines) - Application logic
├── styles.css              (1,200+ lines) - Complete styling
├── README.md               - Project overview
├── GUIDA_RAPIDA.md         - Quick start guide (Italian)
└── docs/                   - Documentation folder
    ├── ARCHITECTURE.md     - This file
    ├── FEATURES.md         - Feature documentation
    ├── API_REFERENCE.md    - JavaScript API reference
    ├── USER_GUIDE.md       - User manual
    ├── DEPLOYMENT.md       - Deployment guide
    └── DATABASE_SCHEMA.md  - Data structure reference
```

---

## Performance Characteristics

### Bundle Size
- **HTML**: ~22 KB
- **CSS**: ~47 KB
- **JavaScript**: ~101 KB
- **External Libraries**: ~200 KB
- **Total**: ~370 KB

### Load Time
- **First Load**: <1 second (3G connection)
- **Subsequent Loads**: <200ms (cached)

---

## Browser Compatibility

### Minimum Requirements
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Required Features
- ES6+ JavaScript support
- Web Crypto API
- localStorage
- CSS Grid & Flexbox

---

## Scalability Considerations

### Current Limitations
1. Single-user per browser (no multi-device sync)
2. localStorage size limit (~5-10 MB)
3. No real-time collaboration
4. No automated backups

### Future Evolution Path
1. Add backend API (Node.js + Express)
2. Database integration (PostgreSQL/MongoDB)
3. Real-time sync (WebSockets)
4. Mobile app (React Native)
5. Cloud backup system

---

## Design Principles

This architecture follows State-of-the-Art (SoA) coding principles:

1. **Separation of Concerns**: Clear separation between presentation, logic, and data
2. **Single Responsibility**: Each function has one clear purpose
3. **DRY (Don't Repeat Yourself)**: Reusable utility functions
4. **KISS (Keep It Simple)**: Minimal dependencies, straightforward logic
5. **Security First**: Input sanitization, password hashing, access control
6. **Performance Optimized**: Efficient rendering, minimal reflows
7. **Maintainable**: Clear naming, logical structure, documented code

---

## References

- **Main Application**: app.js
- **UI Structure**: index.html
- **Styling**: styles.css
- **User Guide**: GUIDA_RAPIDA.md
- **Project Overview**: README.md
