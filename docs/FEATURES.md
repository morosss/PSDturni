# PSDturni - Comprehensive Feature Documentation

## Table of Contents
1. [Feature Overview](#feature-overview)
2. [Authentication & User Management](#authentication--user-management)
3. [Calendar System](#calendar-system)
4. [Shift Management](#shift-management)
5. [Availability Management](#availability-management)
6. [Auto-Assignment Algorithm](#auto-assignment-algorithm)
7. [Export Functionality](#export-functionality)
8. [Version Control](#version-control)
9. [Approval System](#approval-system)
10. [User Interface Features](#user-interface-features)

---

## Feature Overview

PSDturni provides a complete shift management system for hospital cardiology departments with 18 different shift types and comprehensive scheduling features.

### Feature Matrix by Role

| Feature | Standard User | Administrator |
|---------|---------------|---------------|
| View Calendar | ✓ | ✓ |
| Declare Availability | ✓ | ✓ |
| Change Password | ✓ | ✓ |
| View Own Shifts | ✓ | ✓ |
| **Admin Features** | | |
| Manage Users | ✗ | ✓ |
| Assign Shifts Manually | ✗ | ✓ |
| Auto-Assign Shifts | ✗ | ✓ |
| Manage Ambulatori | ✗ | ✓ |
| Export PDF/Excel | ✗ | ✓ |
| View All Availability | ✗ | ✓ |
| Approve Months | ✗ | ✓ |
| Version Management | ✗ | ✓ |

---

## Authentication & User Management

### 1. Login System

**Location**: index.html (lines 15-50), app.js (lines 2350-2450)

#### Features
- Username-based authentication
- SHA-256 password hashing
- "Remember me" functionality
- First-time login password setup
- Secure session management

#### Login Flow
```
1. User enters username (e.g., "agrelli")
2. User enters password
3. System hashes password with SHA-256
4. Compares hash with stored hash
5. On success:
   - Sets AppState.currentUser
   - Saves to rememberedUserId (if checked)
   - Redirects to dashboard
6. On failure:
   - Shows error toast notification
```

#### First Login Flow
```
1. New user logs in with username only
2. System detects password is null
3. Redirects to first login screen
4. User sets new password (min 6 characters)
5. Password hashed and stored
6. User logged in automatically
```

**Code Reference**: app.js:2350-2400

---

### 2. User Management (Admin Only)

**Location**: app.js (lines 2200-2350)

#### Add New User

**Features**:
- Complete profile creation
- Role assignment (Admin/User)
- Specialty selection
- Capability assignment (which shifts user can work)
- Shift limits (min/max per shift type per month)
- Email field (optional)
- Nickname/code generation

**User Object Structure**:
```javascript
{
    id: "userid",              // Login username
    name: "Dr. Full Name",     // Display name
    code: "DFN",              // 3-letter code for calendar
    role: "admin",            // "admin" or "user"
    specialty: "Cardiologo",  // Medical specialty
    email: "email@hospital.it", // Optional email
    password: null,           // null until first login
    capabilities: [           // Array of shift types
        "SALA Senior",
        "REPARTO",
        "UTIC"
    ],
    canDoREP: true,          // Special REP capability flag
    shiftLimits: {           // Min/max per shift type
        "SALA Senior": { min: 2, max: 4 },
        "REPARTO": { min: 3, max: 6 }
    }
}
```

#### Edit User

**Features**:
- Modify all user properties
- Update capabilities
- Adjust shift limits
- Change role
- Cannot edit own role (prevents self-demotion)

#### Delete User

**Features**:
- Remove user from system
- Preserves shift assignments (shows deleted user ID)
- Cannot delete self
- Confirmation required

**Code Reference**: app.js:2200-2350

---

### 3. Password Management

**Location**: app.js (lines 2450-2520)

#### Change Password

**Features**:
- Available to all users
- Requires current password verification
- Minimum 6 characters
- Real-time validation
- SHA-256 hashing

**Modal Structure**:
```html
<div id="changePasswordModal">
  <input type="password" id="currentPassword">
  <input type="password" id="newPassword">
  <input type="password" id="confirmPassword">
  <button onclick="handleChangePassword()">Change</button>
</div>
```

**Validation Rules**:
1. Current password must match
2. New password min 6 characters
3. New password must match confirmation
4. New password different from current

**Code Reference**: app.js:2450-2520

---

## Calendar System

### 1. Calendar View

**Location**: app.js (lines 400-700)

#### Features
- Monthly calendar display
- Color-coded user assignments
- Visual weekend highlighting
- Current day highlighting
- Multi-shift display per day
- Nickname/code display for assigned users
- Month navigation (previous/next)
- Approval status badge

#### Calendar Structure
```
┌─────────────────────────────────────────┐
│  October 2025          [Draft/Approved] │
│  [← Previous]              [Next →]     │
├─────────────────────────────────────────┤
│ Dom | Lun | Mar | Mer | Gio | Ven | Sab │
├─────┬─────┬─────┬─────┬─────┬─────┬─────┤
│  1  │  2  │  3  │  4  │  5  │  6  │  7  │
│     │ SPZ │ AGR │     │ GCA │ ECR │     │
│     │ SALA│ REP │     │ UTIC│ PS  │     │
├─────┼─────┼─────┼─────┼─────┼─────┼─────┤
│ ... │ ... │ ... │ ... │ ... │ ... │ ... │
└─────┴─────┴─────┴─────┴─────┴─────┴─────┘
```

#### Visual Indicators
- **Weekend Background**: Light gray (#f5f5f5)
- **Current Day**: Blue border
- **User Colors**: Auto-generated from username hash
- **Empty Slots**: Dashed border

**Code Reference**: app.js:400-700

---

### 2. Month Navigation

**Features**:
- Previous/Next month buttons
- Auto-advances to next month after current month
- Displays Italian month names
- Updates all views (calendar, shifts, availability)

**Code Reference**: app.js:650-680

---

### 3. Approval Status

**Location**: app.js (lines 2520-2580)

#### Features
- Per-month approval tracking
- Visual badge display (Draft/Approved)
- Toggle approval status (admin only)
- Records who approved and when
- Prevents accidental modifications

#### Approval Object Structure
```javascript
{
    "2025-11": {
        status: "approved",
        approvedBy: "spizzocri",
        approvedAt: "2025-11-25T10:30:00.000Z"
    }
}
```

**UI Display**:
- **Draft**: Gray badge with "Bozza" text
- **Approved**: Green badge with "Approvato" text + date

**Code Reference**: app.js:2520-2580

---

## Shift Management

### 1. Shift Types Configuration

**Location**: app.js (lines 7-32)

#### 18 Shift Types

| Shift Type | Time Slots | Description |
|------------|------------|-------------|
| SALA Senior | MATT, POM | Senior operating room duty |
| SALA Junior | MATT, POM | Junior operating room duty |
| REPARTO | MATT 1-3, POM 1-3 | Ward rounds (3 doctors) |
| UTIC | MATT, POM | Intensive cardiac care unit |
| PS | GG, NTT | Emergency department (24hr/night) |
| RAP | GG, NTT | Ward duty (24hr/night) |
| ENI | h 8-13, SPEC, h 14-18 | ENI clinic |
| VIS 201 | SPEC | Room 201 visits |
| VISITE 208 | MATT, POM | Room 208 visits |
| TDS 207 | MATT, POM | Room 207 stress test |
| ECOTT 205 | MATT, POM | Room 205 echocardiography |
| ECO 206 | MATT, POM, SS | Room 206 echo |
| ECO spec 204 | MATT, POM, SS | Room 204 specialized echo |
| ECO INT | MATT, POM | Internal echocardiography |
| CARDIOCHIR | MATT, POM | Cardiac surgery |
| Vicenza | GG | Vicenza hospital |
| Ricerca | GG | Research day |
| RISERVE | MATT, POM | Reserve/backup |

#### Time Slot Types

| Slot Code | Time | Description |
|-----------|------|-------------|
| MATT | 08:00-13:00 | Morning |
| POM | 14:00-18:00 | Afternoon |
| NTT | 20:00-08:00 | Night |
| GG | 24 hours | All-day |
| SPEC | Special | Special slot |
| SS | SuperSpeed | Fast slot |
| h 8-13 | 08:00-13:00 | Morning hours |
| h 14-18 | 14:00-18:00 | Afternoon hours |

**Code Reference**: app.js:7-32

---

### 2. Manual Shift Assignment

**Location**: app.js (lines 700-1100)

#### Features
- Visual shift grid by day and time slot
- Click to assign user to shift
- User selection modal with filtered candidates
- Real-time validation
- Conflict highlighting
- Override capability (force assign with warning)
- Color-coded assignments

#### Assignment Flow
```
1. Admin navigates to "Gestione Turni"
2. Selects month
3. Clicks on shift slot (e.g., SALA Senior - MATT - Day 15)
4. Modal opens with list of users
5. Users filtered by:
   - Has capability for shift type
   - Not unavailable on that day/time
   - Not already assigned conflicting shift
6. Admin selects user
7. System validates:
   - User has capability ✓
   - User is available ✓
   - No conflicting assignments ✓
8. Assignment saved
9. Calendar updates with color-coded name
```

#### Validation Logic

**Compatible Assignment** (Green):
- User has capability
- User is available
- No conflicts

**Warning Assignment** (Orange):
- User has capability BUT
- User marked unavailable OR
- Already has conflicting shift
- Admin can override with confirmation

**Invalid Assignment** (Red - blocked):
- User lacks capability for shift type
- Cannot override (safety measure)

**Code Reference**: app.js:700-1100

---

### 3. Ambulatorio Management

**Location**: app.js (lines 950-1020)

#### Features
- Close/open ambulatori for specific dates
- Weekend auto-close logic
- Visual closed indicators
- Prevents assignment to closed ambulatori
- Bulk operations possible

#### Closed Ambulatori Logic

**Weekend Auto-Close** (Saturdays and Sundays):
- All ambulatori except: UTIC, PS, RAP
- Reason: Hospital policy - most clinics closed weekends

**Manual Close**:
- Admin can close any ambulatorio any day
- Checkbox toggle in Gestione Turni view
- Saved to ambulatoriStatus object

**Visual Indicators**:
- Closed slots: Gray background with "Chiuso" text
- Cannot assign users to closed slots

**Code Reference**: app.js:950-1020

---

## Availability Management

### 1. User Availability Declaration

**Location**: app.js (lines 1100-1400)

#### Features
- Declare unavailability for next 3 months
- Time slot selection (MATT/POM/NTT)
- Visual calendar interface
- Deadline enforcement (20th of previous month)
- Countdown timer display
- Save confirmation

#### Availability Calendar Structure

```
┌─────────────────────────────────────────┐
│  Indisponibilità - Novembre 2025        │
│  Deadline: 20 Ottobre 2025, 23:59      │
│  [Tempo rimanente: 15 giorni, 6 ore]    │
├─────────────────────────────────────────┤
│ Giorno │ MATT │ POM │ NTT │            │
├────────┼──────┼─────┼─────┤            │
│   1    │  [ ] │ [ ] │ [ ] │            │
│   2    │  [✓] │ [✓] │ [ ] │ ← Selected │
│   3    │  [ ] │ [ ] │ [ ] │            │
│  ...   │  ... │ ... │ ... │            │
└─────────────────────────────────────────┘
```

#### Time Slot Mapping

**User declares unavailability for:**
- **MATT** (Morning): Blocks MATT, MATT 1-3, h 8-13, GG shifts
- **POM** (Afternoon): Blocks POM, POM 1-3, h 14-18, SPEC, SS, GG shifts
- **NTT** (Night): Blocks NTT shifts

**Code Reference**: app.js:1100-1200

---

### 2. Deadline System

**Location**: app.js (lines 1250-1300)

#### Features
- Hard deadline: 20th of previous month at 23:59:59
- Visual countdown timer
- Color-coded warnings:
  - Green: >7 days remaining
  - Orange: 3-7 days remaining
  - Red: <3 days remaining
- Locks availability form after deadline
- Admin can still modify shifts after deadline

#### Deadline Calculation
```javascript
// For November 2025 availability
// Deadline: October 20, 2025, 23:59:59

function getDeadline(year, month) {
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    return new Date(prevYear, prevMonth, 20, 23, 59, 59);
}
```

**After Deadline**:
- Users see: "Deadline scaduta - Contatta l'amministratore"
- Form disabled
- Existing availability still visible (read-only)

**Code Reference**: app.js:1250-1300

---

### 3. Availability Overview (Admin Only)

**Location**: app.js (lines 1300-1400)

#### Features
- Grid view of all users' unavailability
- Color-coded by time slot:
  - Blue: MATT unavailable
  - Orange: POM unavailable
  - Purple: NTT unavailable
  - Dark gray: Multiple slots unavailable
- Export to PDF/Excel
- Heatmap visualization
- Filter by user or date

#### Grid Structure
```
┌──────────────────────────────────────────────────────────┐
│  Panoramica Indisponibilità - Novembre 2025             │
├─────────────┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┤
│ Utente      │ 1 │ 2 │ 3 │ 4 │ 5 │ 6 │ 7 │ 8 │ 9 │10 │...│
├─────────────┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┼───┤
│ S.Pizzocri  │   │ M │   │   │MP │   │   │ N │   │   │   │
│ A.Grelli    │   │   │ P │   │   │   │MN │   │   │   │   │
│ G.Cannone   │ M │   │   │   │   │   │   │MPN│   │   │   │
│ ...         │...│...│...│...│...│...│...│...│...│...│...│
└─────────────┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┴───┘

Legend:
M = MATT unavailable
P = POM unavailable
N = NTT unavailable
MP = MATT + POM unavailable
```

**Code Reference**: app.js:1300-1400

---

## Auto-Assignment Algorithm

### 1. Algorithm Overview

**Location**: app.js (lines 1700-2100)

#### Core Objective
Automatically assign shifts to users while respecting:
1. User capabilities (who can work which shifts)
2. User unavailability (declared by users)
3. Ambulatori status (closed clinics)
4. Business rules (4 key rules)
5. Load balancing (fair distribution)

#### Algorithm Modes

| Mode | Description | Use Case |
|------|-------------|----------|
| Generate All | Replace all existing assignments | Start fresh schedule |
| Fill Remaining | Only assign empty slots | Preserve manual assignments |

**Code Reference**: app.js:1700-1750

---

### 2. Four Core Rules

#### Rule 1: No Day-After-Night Shift

**Business Rationale**: Doctor who worked night shift needs rest next day

```javascript
// Check if user had night shift previous day
function hadNightShiftPreviousDay(userId, date) {
    const prevDate = new Date(date);
    prevDate.setDate(prevDate.getDate() - 1);
    const prevDateKey = formatDate(prevDate);

    // Check all shift types with night slots
    for (let shiftType of ['PS', 'RAP']) {
        if (shifts[prevDateKey]?.[shiftType]?.['NTT'] === userId) {
            return true; // User worked night shift yesterday
        }
    }
    return false;
}
```

**Code Reference**: app.js:1800-1850

---

#### Rule 2: REP-Capable Night Shift

**Business Rationale**: Night shift doctor must be able to do ward rounds (REP)

```javascript
// For night shifts (PS NTT, RAP NTT), assign only REP-capable users
function isREPCapableForNightShift(userId, shiftType, timeSlot) {
    if ((shiftType === 'PS' || shiftType === 'RAP') && timeSlot === 'NTT') {
        const user = users.find(u => u.id === userId);
        return user.canDoREP === true;
    }
    return true; // Not applicable for non-night shifts
}
```

**Code Reference**: app.js:1850-1900

---

#### Rule 3: Weekend Continuity (Emodinamista)

**Business Rationale**: Same emodinamista works Friday-Saturday-Sunday for continuity

```javascript
// If assigning weekend SALA, maintain same emodinamista
function maintainWeekendContinuity(userId, date, shiftType) {
    const day = date.getDay();

    // Only applies to SALA shifts on weekends
    if (!['SALA Senior', 'SALA Junior'].includes(shiftType)) {
        return true;
    }

    if (day === 6) { // Saturday
        // Check who worked Friday
        const friday = new Date(date);
        friday.setDate(friday.getDate() - 1);
        const fridayUserId = getAssignedUser(friday, shiftType, 'MATT');

        // Prefer same user as Friday
        return !fridayUserId || userId === fridayUserId;
    }

    if (day === 0) { // Sunday
        // Check who worked Saturday
        const saturday = new Date(date);
        saturday.setDate(saturday.getDate() - 1);
        const saturdayUserId = getAssignedUser(saturday, shiftType, 'MATT');

        // Prefer same user as Saturday
        return !saturdayUserId || userId === saturdayUserId;
    }

    return true;
}
```

**Code Reference**: app.js:1900-1980

---

#### Rule 4: Weekend Slot Consistency

**Business Rationale**: Same doctor works both MATT and POM on weekend day

```javascript
// If assigning weekend POM, assign same user as MATT
function maintainSlotConsistency(userId, date, shiftType, timeSlot) {
    const day = date.getDay();

    // Only applies to weekends
    if (day !== 0 && day !== 6) {
        return true;
    }

    // If assigning POM, check who has MATT
    if (timeSlot === 'POM') {
        const mattUserId = getAssignedUser(date, shiftType, 'MATT');
        return !mattUserId || userId === mattUserId;
    }

    return true;
}
```

**Code Reference**: app.js:1980-2020

---

### 3. Load Balancing

**Algorithm**: Assign shifts to users with fewest assignments first

```javascript
// Track assignment counts per user
const assignmentCounts = {};
users.forEach(u => assignmentCounts[u.id] = 0);

// When assigning, sort eligible users by count
eligibleUsers.sort((a, b) =>
    assignmentCounts[a.id] - assignmentCounts[b.id]
);

// Assign to user with lowest count
const selectedUser = eligibleUsers[0];
assignShift(selectedUser.id, date, shiftType, timeSlot);
assignmentCounts[selectedUser.id]++;
```

**Result**: Even distribution of shifts across all users

**Code Reference**: app.js:2020-2080

---

### 4. Assignment Report

**Location**: app.js (lines 2080-2100)

#### Report Structure
```
Assegnazione Automatica Completata
───────────────────────────────────
Turni Assegnati: 245 / 280 (87.5%)
Turni Non Assegnati: 35

Dettaglio Turni Non Assegnati:
• 2025-11-05 - SALA Senior - MATT (Nessun utente disponibile)
• 2025-11-12 - ECO 206 - POM (Tutti gli utenti non disponibili)
• ...

Riepilogo per Utente:
• S.Pizzocri: 28 turni
• A.Grelli: 26 turni
• G.Cannone: 27 turni
• ...
```

**Code Reference**: app.js:2080-2100

---

## Export Functionality

### 1. PDF Export

**Location**: app.js (lines 1400-1550)

#### Features
- Professional formatted schedules
- Hospital logo integration
- Draft vs Final version toggle
- Landscape A4 format
- 1-2 page optimized layout
- Color-coded weekends
- Automatic page breaks
- Header with month/year
- Footer with generation date

#### PDF Structure
```
┌────────────────────────────────────────────┐
│ [Hospital Logo]  Turni Novembre 2025      │
│                  BOZZA / DEFINITIVO        │
├────────────────────────────────────────────┤
│ Giorno │ SALA │ REPARTO │ UTIC │ PS │ ... │
├────────┼──────┼─────────┼──────┼────┼─────┤
│ 1 Ven  │ SPZ  │ AGR     │ GCA  │ ECR│ ... │
│ 2 Sab  │ SPZ  │ -       │ GCA  │ ECR│ ... │
│ ...    │ ...  │ ...     │ ...  │ ...│ ... │
├────────┴──────┴─────────┴──────┴────┴─────┤
│ Generato il 25/11/2025 alle 15:30         │
└────────────────────────────────────────────┘
```

#### Export Options Modal
- Month selection
- Version type (Draft/Final)
- Include logo (yes/no)
- Orientation (landscape/portrait)

**Code Reference**: app.js:1400-1550

---

### 2. Excel Export

**Location**: app.js (lines 1550-1650)

#### Features
- Complete shift matrices
- Color-coded weekends (light gray background)
- Formatted headers (bold, background color)
- Multiple sheets (one per month or all shifts)
- Column auto-sizing
- Cell borders and styling
- XLSX format (Excel 2007+)

#### Excel Structure
```
Sheet 1: Novembre 2025
┌────────┬──────────────┬──────────────┬─────┐
│ Giorno │ SALA Senior  │ SALA Junior  │ ... │
├────────┼──────────────┼──────────────┼─────┤
│        │ MATT │ POM   │ MATT │ POM   │ ... │
├────────┼──────┼───────┼──────┼───────┼─────┤
│ 1      │ SPZ  │ AGR   │ GCA  │ ECR   │ ... │
│ 2      │ SPZ  │ SPZ   │ GCA  │ GCA   │ ... │
│ ...    │ ...  │ ...   │ ...  │ ...   │ ... │
└────────┴──────┴───────┴──────┴───────┴─────┘
```

**Code Reference**: app.js:1550-1650

---

### 3. Availability Export

**Location**: app.js (lines 1650-1700)

#### PDF Availability Report

```
┌────────────────────────────────────────────┐
│ Panoramica Indisponibilità - Novembre 2025│
├────────────┬───┬───┬───┬───┬───┬───┬──────┤
│ Utente     │ 1 │ 2 │ 3 │ 4 │ 5 │...│ 30  │
├────────────┼───┼───┼───┼───┼───┼───┼──────┤
│ S.Pizzocri │   │ M │   │MP │   │   │      │
│ A.Grelli   │ P │   │   │   │ N │   │      │
│ ...        │...│...│...│...│...│...│      │
├────────────┴───┴───┴───┴───┴───┴───┴──────┤
│ Legenda:                                   │
│ M = Mattina, P = Pomeriggio, N = Notte    │
│ MP = Mattina + Pomeriggio, ecc.           │
└────────────────────────────────────────────┘
```

#### Excel Availability Report
- Full grid with color coding
- Legend sheet
- Multiple months in separate sheets

**Code Reference**: app.js:1650-1700

---

## Version Control

### 1. Save Version

**Location**: app.js (lines 2100-2150)

#### Features
- Save complete shift configuration snapshot
- Version naming
- Timestamp tracking
- User attribution (who saved)
- Monthly scope (save one month at a time)

#### Version Object Structure
```javascript
{
    id: "v_1732531200000",        // Unique ID (timestamp)
    name: "Versione Novembre Final", // User-defined name
    month: 10,                     // 0-11
    year: 2025,
    shifts: {...},                 // Complete shift assignments
    savedBy: "spizzocri",         // User ID who saved
    savedAt: "2025-11-25T10:30:00.000Z", // ISO timestamp
    description: "Final version after review" // Optional
}
```

**Code Reference**: app.js:2100-2150

---

### 2. Load Version

**Location**: app.js (lines 2150-2200)

#### Features
- Browse saved versions
- Preview version details
- One-click restore
- Confirmation dialog
- Overwrites current shifts for that month

#### Load Flow
```
1. Admin navigates to "Versioni Salvate"
2. Views list of saved versions with:
   - Version name
   - Month/Year
   - Saved by (user)
   - Saved at (timestamp)
3. Clicks "Carica" button
4. Confirmation: "Sostituire i turni correnti con questa versione?"
5. On confirm:
   - Restore shifts from version
   - Update AppState.shifts
   - Save to localStorage
   - Render calendar
6. Success toast: "Versione caricata con successo"
```

**Code Reference**: app.js:2150-2200

---

### 3. Delete Version

#### Features
- Remove old/unused versions
- Free up localStorage space
- Cannot delete currently active version
- Confirmation required

**Code Reference**: app.js:2180-2200

---

## User Interface Features

### 1. Toast Notifications

**Location**: app.js (lines 44-80)

#### Features
- 4 types: Success, Error, Warning, Info
- Material Design icons
- Auto-dismiss (configurable duration)
- Manual dismiss (X button)
- Stacking (multiple toasts)
- Smooth animations

#### Toast Types

| Type | Icon | Color | Use Case |
|------|------|-------|----------|
| Success | check_circle | Green | Successful operations |
| Error | error | Red | Failures, validation errors |
| Warning | warning | Orange | Warnings, overrides |
| Info | info | Blue | Informational messages |

**Usage**:
```javascript
showToast("Turno assegnato con successo", "success", 3000);
showToast("Errore: utente non trovato", "error", 5000);
showToast("Attenzione: l'utente non è disponibile", "warning", 4000);
showToast("Deadline tra 3 giorni", "info", 3000);
```

**Code Reference**: app.js:44-80

---

### 2. Modal Dialogs

**Location**: index.html (lines 350-489)

#### Modal Types

1. **Change Password Modal**
   - 3 input fields (current, new, confirm)
   - Validation messages
   - Cancel/Submit buttons

2. **User Edit Modal**
   - Full user form
   - Capability checkboxes
   - Shift limits inputs
   - Save/Cancel buttons

3. **Export Options Modal**
   - Month selector
   - Format radio buttons (PDF/Excel)
   - Type selector (Draft/Final)
   - Export button

4. **Version Save Modal**
   - Version name input
   - Optional description
   - Save/Cancel buttons

5. **User Selection Modal** (dynamic)
   - List of eligible users for shift
   - Color-coded user cards
   - Click to assign

**Modal Features**:
- Backdrop click to close
- ESC key to close
- Smooth fade-in/fade-out
- Centered positioning
- Responsive sizing

**Code Reference**: index.html:350-489

---

### 3. Navigation System

**Location**: index.html (lines 60-90), app.js (lines 300-400)

#### Navigation Menu

| View ID | Label | Role Required |
|---------|-------|---------------|
| calendar | Calendario | All |
| availability | Indisponibilità | All |
| users | Utenti | Admin |
| shifts | Gestione Turni | Admin |
| autoAssign | Assegnazione Automatica | Admin |
| availabilityOverview | Panoramica Indisponibilità | Admin |
| versions | Versioni Salvate | Admin |

**Navigation Features**:
- Active view highlighting
- Role-based visibility
- Smooth view transitions
- State preservation
- Back button support (via month navigation)

**Code Reference**: app.js:300-400

---

### 4. Responsive Design

**Location**: styles.css (lines 1000-1200)

#### Breakpoints

| Breakpoint | Width | Layout Changes |
|------------|-------|----------------|
| Desktop | >1200px | Full sidebar, multi-column grids |
| Tablet | 768px-1200px | Collapsed sidebar, 2-column grids |
| Mobile | <768px | Hidden sidebar, single column |

#### Responsive Features
- Hamburger menu (mobile)
- Collapsible sidebar
- Scrollable tables
- Touch-friendly buttons (44px min)
- Responsive font sizes
- Flexible grid layouts

**Code Reference**: styles.css:1000-1200

---

### 5. Color Coding System

#### User Colors (Auto-generated)

```javascript
// Generate consistent color from user ID
function getUserColor(userId) {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
        hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }

    const hue = Math.abs(hash) % 360;
    return `hsl(${hue}, 65%, 55%)`;
}
```

**Result**: Each user gets a unique, consistent color across all views

#### Shift Status Colors

| Status | Color | Usage |
|--------|-------|-------|
| Assigned | User color | Shift has assigned user |
| Empty | Gray border | No assignment |
| Closed | Gray bg | Ambulatorio closed |
| Conflict | Orange bg | Validation warning |
| Weekend | Light gray bg | Saturday/Sunday |
| Current day | Blue border | Today's date |

**Code Reference**: app.js:150-200, styles.css:400-600

---

### 6. Accessibility Features

#### Keyboard Navigation
- Tab order preserved
- Enter to submit forms
- ESC to close modals
- Arrow keys in calendar (future enhancement)

#### Screen Reader Support
- Semantic HTML (`<nav>`, `<main>`, `<button>`)
- ARIA labels on icons
- Alt text on images
- Form labels properly associated

#### Visual Accessibility
- High contrast text (WCAG AA compliant)
- Minimum 14px font size
- Focus indicators on interactive elements
- No color-only information (icons + text)

**Code Reference**: styles.css:50-150, index.html (semantic structure)

---

## Performance Features

### 1. Optimization Techniques

| Technique | Implementation | Benefit |
|-----------|----------------|---------|
| Debouncing | Search inputs | Reduce computation |
| Event Delegation | Parent listeners | Fewer event handlers |
| localStorage Caching | Load once per session | Faster data access |
| Lazy Rendering | Render on view switch | Faster initial load |
| Template Literals | Fast HTML generation | Efficient DOM updates |

**Code Reference**: app.js:200-300

---

### 2. Data Caching

```javascript
// Cache user color calculations
const colorCache = new Map();
function getUserColorCached(userId) {
    if (!colorCache.has(userId)) {
        colorCache.set(userId, getUserColor(userId));
    }
    return colorCache.get(userId);
}
```

---

## Feature Summary Statistics

### Code Distribution
- **Total Lines**: 2,637 (app.js)
- **Functions**: ~60 functions
- **Event Listeners**: ~25 listeners
- **Views**: 7 main views
- **Modals**: 5 modal types

### Data Capacity
- **Users**: Tested with 50+ users
- **Shifts**: ~280 slots per month × 18 shift types = 5,040 slots/month
- **Months**: Unlimited (storage permitting)
- **Versions**: Recommended <20 versions to conserve space

### Browser Support
- **Minimum**: Chrome 90+, Firefox 88+, Safari 14+
- **Recommended**: Latest versions for best performance

---

## Future Feature Roadmap

### Planned Enhancements
1. Mobile app (React Native)
2. Email notifications
3. SMS reminders
4. Calendar sync (Google Calendar, iCal)
5. Advanced analytics dashboard
6. Shift swap requests
7. Time-off management integration
8. Multi-hospital support
9. API for third-party integrations
10. Machine learning shift optimization

---

## Feature Dependencies

```
Authentication
    ↓
User Management
    ↓
Capability Assignment
    ↓
Availability Declaration
    ↓
Shift Assignment (Manual/Auto)
    ↓
Export & Reports
```

---

## Conclusion

PSDturni provides a comprehensive shift management solution with 7 main feature areas, 18 shift types, and intelligent automation. The system is designed for hospital cardiology departments with 20-50 medical staff members.

For questions or feature requests, contact the system administrator.

**Last Updated**: November 2025
**Version**: 1.0.0
