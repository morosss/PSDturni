# PSDturni - Database Schema Documentation

## Table of Contents
1. [Overview](#overview)
2. [Storage Architecture](#storage-architecture)
3. [Data Models](#data-models)
4. [localStorage Keys](#localstorage-keys)
5. [Data Relationships](#data-relationships)
6. [Data Validation Rules](#data-validation-rules)
7. [Migration Strategy](#migration-strategy)
8. [Data Examples](#data-examples)
9. [Storage Limits](#storage-limits)
10. [Backup and Recovery](#backup-and-recovery)

---

## Overview

PSDturni uses browser `localStorage` as its persistence layer. All data is stored as JSON-serialized strings under specific keys. There is no traditional database server.

### Key Characteristics
- **Storage Type**: Browser localStorage API
- **Data Format**: JSON
- **Capacity**: ~5-10 MB per domain (browser-dependent)
- **Persistence**: Browser-specific (not synced across devices)
- **Schema**: Flexible (JavaScript objects, no strict schema enforcement)

---

## Storage Architecture

### localStorage API

```javascript
// Save data
localStorage.setItem(key, JSON.stringify(data));

// Load data
const data = JSON.parse(localStorage.getItem(key));

// Remove data
localStorage.removeItem(key);

// Clear all
localStorage.clear();
```

### Data Flow

```
Application State (AppState)
        ↓
    saveToStorage()
        ↓
JSON.stringify()
        ↓
localStorage.setItem()
        ↓
[Browser Storage]

[Browser Storage]
        ↓
localStorage.getItem()
        ↓
JSON.parse()
        ↓
    loadFromStorage()
        ↓
Application State (AppState)
```

---

## Data Models

### 1. User Model

**localStorage Key**: `users`
**Type**: `Array<UserObject>`

#### Schema

```typescript
interface User {
    id: string;                    // Unique username (primary key)
    name: string;                  // Full display name
    code: string;                  // 3-6 letter abbreviation
    role: 'admin' | 'user';       // Authorization role
    specialty: string;             // Medical specialty
    email?: string;                // Optional email address
    password: string | null;       // SHA-256 hash or null (first login)
    capabilities: string[];        // Array of shift types user can work
    canDoREP: boolean;            // Can do REP (ward rounds) - special flag
    shiftLimits?: {               // Optional per-shift monthly limits
        [shiftType: string]: {
            min: number;
            max: number;
        }
    };
}
```

#### Field Descriptions

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| id | string | Yes | Login username | Unique, lowercase, no spaces |
| name | string | Yes | Full name with title | Min 5 chars |
| code | string | Yes | Short code for calendar | 2-6 uppercase letters |
| role | string | Yes | User role | 'admin' or 'user' |
| specialty | string | Yes | Medical specialty | Non-empty string |
| email | string | No | Email address | Valid email format |
| password | string\|null | Yes | Hashed password | 64-char hex (SHA-256) or null |
| capabilities | string[] | Yes | Shift types allowed | At least 1 shift type |
| canDoREP | boolean | Yes | REP capability | true or false |
| shiftLimits | object | No | Monthly shift limits | Min <= max |

#### Example

```json
{
    "id": "agrelli",
    "name": "Dott.ssa Arianna Grelli",
    "code": "GRELLI",
    "role": "user",
    "specialty": "Cardiologo",
    "email": "agrelli@hospital.it",
    "password": "abc123...def789",
    "capabilities": [
        "REPARTO",
        "UTIC",
        "PS",
        "ECO 206",
        "VISITE 208"
    ],
    "canDoREP": false,
    "shiftLimits": {
        "REPARTO": { "min": 4, "max": 8 },
        "UTIC": { "min": 2, "max": 4 }
    }
}
```

#### Indexes

**Primary Key**: `id` (username)
**Unique Constraints**: `id` must be unique
**Search Keys**: `role`, `specialty`, `capabilities`

---

### 2. Shift Assignment Model

**localStorage Key**: `shifts`
**Type**: `Object<string, Object>`

#### Schema

```typescript
interface Shifts {
    [dateKey: string]: {           // "YYYY-MM-DD"
        [shiftType: string]: {     // Shift type name
            [timeSlot: string]: string;  // Time slot -> user ID
        };
    };
}
```

#### Nested Structure

```
shifts
└── "2025-11-15"
    ├── "SALA Senior"
    │   ├── "MATT" → "gcannone"
    │   └── "POM" → "ecriscione"
    ├── "REPARTO"
    │   ├── "MATT 1" → "agrelli"
    │   ├── "MATT 2" → "nbrambilla"
    │   └── "MATT 3" → "aborin"
    └── "PS"
        ├── "GG" → "ltesta"
        └── "NTT" → "gcannone"
```

#### Example

```json
{
    "2025-11-15": {
        "SALA Senior": {
            "MATT": "gcannone",
            "POM": "ecriscione"
        },
        "REPARTO": {
            "MATT 1": "agrelli",
            "MATT 2": "nbrambilla",
            "MATT 3": "aborin",
            "POM 1": "mbarletta",
            "POM 2": "mguerrini",
            "POM 3": "ltesta"
        },
        "UTIC": {
            "MATT": "apopolorubbio",
            "POM": "mvicario"
        },
        "PS": {
            "GG": "ltesta",
            "NTT": "rgorla"
        }
    },
    "2025-11-16": {
        "SALA Senior": {
            "MATT": "gcannone",
            "POM": "gcannone"
        }
    }
}
```

#### Query Patterns

```javascript
// Get shift assignment for specific date/shift/slot
const userId = AppState.shifts[dateKey]?.[shiftType]?.[timeSlot];

// Get all shifts for a date
const dayShifts = AppState.shifts[dateKey] || {};

// Get all assignments for a user
const userShifts = [];
for (const [date, shifts] of Object.entries(AppState.shifts)) {
    for (const [shiftType, slots] of Object.entries(shifts)) {
        for (const [timeSlot, assignedUserId] of Object.entries(slots)) {
            if (assignedUserId === userId) {
                userShifts.push({ date, shiftType, timeSlot });
            }
        }
    }
}
```

---

### 3. Availability Model

**localStorage Key**: `availability`
**Type**: `Object<string, Object>`

#### Schema

```typescript
interface Availability {
    [userKey: string]: {              // "userId_year_month"
        [dateKey: string]: {          // "YYYY-MM-DD"
            mattina?: boolean;        // Morning unavailable
            pomeriggio?: boolean;     // Afternoon unavailable
            notte?: boolean;          // Night unavailable
        };
    };
}
```

#### Key Format

**User Key**: `{userId}_{year}_{month}`
- Example: `agrelli_2025_10` (November 2025 for user agrelli)
- Month is zero-based (0 = January, 11 = December)

**Date Key**: `YYYY-MM-DD`
- Example: `2025-11-15`

#### Example

```json
{
    "agrelli_2025_10": {
        "2025-11-05": {
            "mattina": true,
            "pomeriggio": false,
            "notte": false
        },
        "2025-11-12": {
            "mattina": true,
            "pomeriggio": true,
            "notte": false
        },
        "2025-11-20": {
            "mattina": false,
            "pomeriggio": false,
            "notte": true
        }
    },
    "gcannone_2025_10": {
        "2025-11-08": {
            "mattina": false,
            "pomeriggio": true,
            "notte": false
        }
    }
}
```

#### Availability Slot Mapping

| Time Slot | Maps To |
|-----------|---------|
| MATT, MATT 1-3, h 8-13 | mattina |
| POM, POM 1-3, h 14-18, SPEC, SS | pomeriggio |
| NTT | notte |
| GG | mattina + pomeriggio |

#### Query Patterns

```javascript
// Check if user unavailable for a date/slot
const userKey = `${userId}_${year}_${month}`;
const isUnavailable = AppState.availability[userKey]?.[dateKey]?.mattina === true;

// Get all unavailable days for user/month
const userKey = `${userId}_${year}_${month}`;
const unavailableDays = AppState.availability[userKey] || {};
```

---

### 4. Ambulatori Status Model

**localStorage Key**: `ambulatoriStatus`
**Type**: `Object<string, Object>`

#### Schema

```typescript
interface AmbulatoriStatus {
    [dateKey: string]: {           // "YYYY-MM-DD"
        [shiftType: string]: boolean;  // true = closed, false/undefined = open
    };
}
```

#### Example

```json
{
    "2025-11-05": {
        "ECO 206": true,
        "VISITE 208": true
    },
    "2025-11-12": {
        "TDS 207": true
    },
    "2025-11-25": {
        "ECO INT": true,
        "ECOTT 205": true
    }
}
```

#### Weekend Auto-Close Logic

Certain ambulatori auto-close on weekends (Saturday/Sunday):
- **Auto-closed**: All ambulatori EXCEPT UTIC, PS, RAP
- **Always open**: UTIC, PS, RAP (emergency services)

```javascript
// Check if ambulatorio closed
function isAmbulatorioClosed(shiftType, date) {
    const dateKey = formatDate(date);

    // Check manual close
    if (AppState.ambulatoriStatus[dateKey]?.[shiftType] === true) {
        return true;
    }

    // Check weekend auto-close
    const day = date.getDay();
    if (day === 0 || day === 6) { // Sunday or Saturday
        const alwaysOpen = ['UTIC', 'PS', 'RAP'];
        return !alwaysOpen.includes(shiftType);
    }

    return false;
}
```

---

### 5. Approval Status Model

**localStorage Key**: `approvalStatus`
**Type**: `Object<string, Object>`

#### Schema

```typescript
interface ApprovalStatus {
    [monthKey: string]: {          // "YYYY-MM"
        status: 'draft' | 'approved';
        approvedBy?: string;       // User ID who approved
        approvedAt?: string;       // ISO timestamp
    };
}
```

#### Example

```json
{
    "2025-10": {
        "status": "approved",
        "approvedBy": "spizzocri",
        "approvedAt": "2025-10-25T14:30:00.000Z"
    },
    "2025-11": {
        "status": "draft"
    },
    "2025-12": {
        "status": "approved",
        "approvedBy": "spizzocri",
        "approvedAt": "2025-11-28T09:15:00.000Z"
    }
}
```

#### State Transitions

```
[No Entry] → draft (implicit)
    ↓
draft → approved (admin action)
    ↓
approved → draft (admin action)
```

---

### 6. Shift Versions Model

**localStorage Key**: `shiftVersions`
**Type**: `Array<VersionObject>`

#### Schema

```typescript
interface ShiftVersion {
    id: string;                    // Unique ID (timestamp)
    name: string;                  // User-defined version name
    month: number;                 // Zero-based month (0-11)
    year: number;                  // Four-digit year
    shifts: Shifts;                // Complete shifts object for month
    savedBy: string;               // User ID who saved
    savedAt: string;               // ISO timestamp
    description?: string;          // Optional description
}
```

#### Example

```json
[
    {
        "id": "v_1732531200000",
        "name": "Versione Novembre Preliminare",
        "month": 10,
        "year": 2025,
        "shifts": {
            "2025-11-01": { "SALA Senior": { "MATT": "gcannone" } },
            "2025-11-02": { "SALA Senior": { "MATT": "ecriscione" } }
        },
        "savedBy": "spizzocri",
        "savedAt": "2025-11-15T10:30:00.000Z",
        "description": "Prima versione prima delle modifiche"
    },
    {
        "id": "v_1732617600000",
        "name": "Versione Novembre Finale",
        "month": 10,
        "year": 2025,
        "shifts": {
            "2025-11-01": { "SALA Senior": { "MATT": "rgorla" } },
            "2025-11-02": { "SALA Senior": { "MATT": "fdellarosa" } }
        },
        "savedBy": "spizzocri",
        "savedAt": "2025-11-20T16:45:00.000Z",
        "description": "Versione definitiva approvata"
    }
]
```

#### Version ID Format

```javascript
const versionId = `v_${Date.now()}`;
// Example: "v_1732531200000"
```

---

### 7. Remembered User Model

**localStorage Key**: `rememberedUserId`
**Type**: `string`

#### Schema

```typescript
type RememberedUserId = string | null;
```

#### Example

```javascript
// Save
localStorage.setItem('rememberedUserId', 'agrelli');

// Load
const rememberedUserId = localStorage.getItem('rememberedUserId');
// Returns: "agrelli" or null
```

---

## localStorage Keys

### Complete Key Reference

| Key | Type | Size Estimate | Purpose |
|-----|------|---------------|---------|
| `users` | Array | ~15 KB | User accounts (27 users × 500 bytes) |
| `shifts` | Object | ~300 KB | Shift assignments (12 months × 30 days × 18 shifts) |
| `availability` | Object | ~50 KB | User unavailability (27 users × 3 months) |
| `ambulatoriStatus` | Object | ~10 KB | Closed ambulatori |
| `approvalStatus` | Object | ~2 KB | Month approval states |
| `shiftVersions` | Array | ~100 KB | Version snapshots (10 versions × 10 KB) |
| `rememberedUserId` | String | ~20 bytes | "Remember me" username |
| **Total** | | **~477 KB** | Well under 5 MB limit |

---

## Data Relationships

### Entity Relationship Diagram

```
┌─────────────┐
│    User     │
│ (PK: id)    │
└──────┬──────┘
       │
       │ 1:N
       │
       ├─────────────────────────┐
       │                         │
       ↓                         ↓
┌──────────────┐         ┌─────────────────┐
│   Shifts     │         │  Availability   │
│ (FK: userId) │         │  (FK: userId)   │
└──────┬───────┘         └─────────────────┘
       │
       │ N:1
       │
       ↓
┌──────────────────┐
│  Ambulatori      │
│  Status          │
│ (date+shiftType) │
└──────────────────┘

┌──────────────────┐
│  Approval        │
│  Status          │
│ (month)          │
└──────────────────┘

┌──────────────────┐
│  Shift Versions  │
│ (copies of       │
│  shifts)         │
└──────────────────┘
```

### Relationships

1. **User → Shifts**: One user can have many shift assignments (1:N)
2. **User → Availability**: One user can have many unavailability records (1:N)
3. **Shifts → Ambulatori Status**: Shifts reference ambulatorio status (N:1)
4. **Shifts → Approval Status**: Shifts belong to month with approval status (N:1)
5. **Shift Versions → Shifts**: Versions contain snapshots of shifts (1:1 per month)

### Foreign Keys (Implicit)

| Child Table | Foreign Key | Parent Table | Parent Key |
|-------------|-------------|--------------|------------|
| shifts | userId (value) | users | id |
| availability | userId (in key) | users | id |
| approvalStatus | N/A | N/A | N/A |
| shiftVersions | savedBy | users | id |

---

## Data Validation Rules

### User Validation

```javascript
function validateUser(user) {
    // Required fields
    if (!user.id || !user.name || !user.role || !user.specialty) {
        return { valid: false, error: 'Missing required fields' };
    }

    // ID format (lowercase, no spaces)
    if (!/^[a-z]+$/.test(user.id)) {
        return { valid: false, error: 'Invalid ID format' };
    }

    // Role validation
    if (!['admin', 'user'].includes(user.role)) {
        return { valid: false, error: 'Invalid role' };
    }

    // Capabilities validation
    if (!Array.isArray(user.capabilities) || user.capabilities.length === 0) {
        return { valid: false, error: 'At least one capability required' };
    }

    // Password validation (if set)
    if (user.password && !/^[a-f0-9]{64}$/.test(user.password)) {
        return { valid: false, error: 'Invalid password hash' };
    }

    return { valid: true };
}
```

### Shift Assignment Validation

```javascript
function validateShiftAssignment(userId, shiftType, date, timeSlot) {
    // User exists
    const user = AppState.users.find(u => u.id === userId);
    if (!user) {
        return { valid: false, error: 'User not found' };
    }

    // User has capability
    if (!user.capabilities.includes(shiftType)) {
        return { valid: false, error: 'User lacks capability' };
    }

    // Shift type exists
    if (!SHIFT_TYPES.includes(shiftType)) {
        return { valid: false, error: 'Invalid shift type' };
    }

    // Time slot valid for shift type
    if (!TIME_SLOTS[shiftType]?.includes(timeSlot)) {
        return { valid: false, error: 'Invalid time slot' };
    }

    // User available
    if (isUserUnavailableForSlot(userId, date, timeSlot)) {
        return { valid: false, warning: 'User unavailable', canOverride: true };
    }

    return { valid: true };
}
```

### Availability Validation

```javascript
function validateAvailability(userId, month, year) {
    // User exists
    const user = AppState.users.find(u => u.id === userId);
    if (!user) {
        return { valid: false, error: 'User not found' };
    }

    // Deadline not passed
    if (isDeadlinePassed(month, year)) {
        return { valid: false, error: 'Deadline passed' };
    }

    // Month in valid range (next 3 months)
    const now = new Date();
    const target = new Date(year, month, 1);
    const diffMonths = (target.getFullYear() - now.getFullYear()) * 12 +
                       (target.getMonth() - now.getMonth());

    if (diffMonths < 0 || diffMonths > 2) {
        return { valid: false, error: 'Month out of range' };
    }

    return { valid: true };
}
```

---

## Migration Strategy

### Version 1.0 → Future Versions

#### Adding New Fields

```javascript
// Example: Add email field to existing users
function migrateUsersAddEmail() {
    const users = loadFromStorage('users', []);

    const migratedUsers = users.map(user => {
        if (!user.email) {
            user.email = ''; // Default empty
        }
        return user;
    });

    saveToStorage('users', migratedUsers);
}
```

#### Adding New Data Models

```javascript
// Example: Add notifications model
function migrateAddNotifications() {
    const existing = loadFromStorage('notifications');

    if (!existing) {
        const defaultNotifications = {
            users: {},
            global: []
        };
        saveToStorage('notifications', defaultNotifications);
    }
}
```

---

## Data Examples

### Complete Example Dataset

```json
{
    "users": [
        {
            "id": "spizzocri",
            "name": "Dott. Samuele Pizzocri",
            "code": "PIZ",
            "role": "admin",
            "specialty": "Emodinamista",
            "email": "spizzocri@hospital.it",
            "password": "62c5ec050cf9b0bf5523b30df8c40e3872b8b3f0a48f20e0dc1ec5cdf989686d",
            "capabilities": ["SALA Senior", "SALA Junior", "REPARTO", "PS", "UTIC"],
            "canDoREP": true
        },
        {
            "id": "agrelli",
            "name": "Dott.ssa Arianna Grelli",
            "code": "GRELLI",
            "role": "user",
            "specialty": "Cardiologo",
            "email": "agrelli@hospital.it",
            "password": null,
            "capabilities": ["REPARTO", "UTIC", "PS", "ECO 206"],
            "canDoREP": false
        }
    ],
    "shifts": {
        "2025-11-15": {
            "SALA Senior": { "MATT": "spizzocri", "POM": "spizzocri" },
            "REPARTO": { "MATT 1": "agrelli" }
        }
    },
    "availability": {
        "agrelli_2025_10": {
            "2025-11-05": { "mattina": true }
        }
    },
    "ambulatoriStatus": {
        "2025-11-05": { "ECO 206": true }
    },
    "approvalStatus": {
        "2025-11": { "status": "draft" }
    },
    "shiftVersions": [],
    "rememberedUserId": "spizzocri"
}
```

---

## Storage Limits

### Browser Storage Limits

| Browser | localStorage Limit | sessionStorage Limit |
|---------|-------------------|---------------------|
| Chrome | ~10 MB | ~10 MB |
| Firefox | ~10 MB | ~10 MB |
| Safari | ~5 MB | ~5 MB |
| Edge | ~10 MB | ~10 MB |

### Current Usage Analysis

```javascript
// Calculate storage usage
function getStorageSize() {
    let total = 0;

    for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
            const value = localStorage.getItem(key);
            total += key.length + value.length;
        }
    }

    return {
        bytes: total,
        kilobytes: (total / 1024).toFixed(2),
        megabytes: (total / 1024 / 1024).toFixed(2)
    };
}
```

### Optimization Strategies

1. **Compress old data**: Archive months older than 6 months
2. **Limit versions**: Keep max 20 versions
3. **Remove expired availability**: Delete availability older than current month
4. **Compact data**: Remove empty objects

```javascript
// Cleanup old data
function cleanupOldData() {
    // Remove availability older than 3 months
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - 3);

    const availability = loadFromStorage('availability', {});
    for (let key in availability) {
        const [userId, year, month] = key.split('_');
        const keyDate = new Date(year, month, 1);

        if (keyDate < cutoffDate) {
            delete availability[key];
        }
    }

    saveToStorage('availability', availability);
}
```

---

## Backup and Recovery

### Manual Backup

```javascript
// Export all data as JSON
function exportAllData() {
    const backup = {
        users: loadFromStorage('users'),
        shifts: loadFromStorage('shifts'),
        availability: loadFromStorage('availability'),
        ambulatoriStatus: loadFromStorage('ambulatoriStatus'),
        approvalStatus: loadFromStorage('approvalStatus'),
        shiftVersions: loadFromStorage('shiftVersions'),
        backupDate: new Date().toISOString()
    };

    const json = JSON.stringify(backup, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `psdturni_backup_${Date.now()}.json`;
    a.click();
}
```

### Manual Restore

```javascript
// Import data from JSON
function importAllData(jsonString) {
    try {
        const backup = JSON.parse(jsonString);

        // Validate backup structure
        if (!backup.users || !backup.shifts) {
            throw new Error('Invalid backup format');
        }

        // Confirm with user
        if (!confirm('This will overwrite all current data. Continue?')) {
            return;
        }

        // Restore data
        saveToStorage('users', backup.users);
        saveToStorage('shifts', backup.shifts);
        saveToStorage('availability', backup.availability || {});
        saveToStorage('ambulatoriStatus', backup.ambulatoriStatus || {});
        saveToStorage('approvalStatus', backup.approvalStatus || {});
        saveToStorage('shiftVersions', backup.shiftVersions || []);

        // Reload application
        location.reload();
    } catch (error) {
        alert('Restore failed: ' + error.message);
    }
}
```

### Automated Backup (Recommended)

```javascript
// Auto-backup on significant changes
function autoBackup() {
    const lastBackup = loadFromStorage('lastBackupTimestamp');
    const now = Date.now();

    // Backup every 24 hours
    if (!lastBackup || (now - lastBackup) > 86400000) {
        exportAllData();
        saveToStorage('lastBackupTimestamp', now);
    }
}
```

---

## Future Database Migration Path

### To PostgreSQL/MySQL

```sql
-- Users table
CREATE TABLE users (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(10) NOT NULL,
    role VARCHAR(20) NOT NULL,
    specialty VARCHAR(50) NOT NULL,
    email VARCHAR(100),
    password VARCHAR(64),
    capabilities JSONB NOT NULL,
    can_do_rep BOOLEAN DEFAULT false,
    shift_limits JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Shifts table
CREATE TABLE shifts (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    shift_type VARCHAR(50) NOT NULL,
    time_slot VARCHAR(20) NOT NULL,
    user_id VARCHAR(50) REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(date, shift_type, time_slot)
);

-- Availability table
CREATE TABLE availability (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(50) REFERENCES users(id),
    date DATE NOT NULL,
    mattina BOOLEAN DEFAULT false,
    pomeriggio BOOLEAN DEFAULT false,
    notte BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, date)
);

-- Ambulatori status table
CREATE TABLE ambulatori_status (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    shift_type VARCHAR(50) NOT NULL,
    is_closed BOOLEAN DEFAULT false,
    UNIQUE(date, shift_type)
);

-- Approval status table
CREATE TABLE approval_status (
    id SERIAL PRIMARY KEY,
    month_key VARCHAR(7) NOT NULL UNIQUE,
    status VARCHAR(20) NOT NULL,
    approved_by VARCHAR(50) REFERENCES users(id),
    approved_at TIMESTAMP
);

-- Shift versions table
CREATE TABLE shift_versions (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    month INT NOT NULL,
    year INT NOT NULL,
    shifts_data JSONB NOT NULL,
    saved_by VARCHAR(50) REFERENCES users(id),
    saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    description TEXT
);
```

---

## Conclusion

PSDturni's localStorage-based data architecture provides a simple, serverless solution suitable for small-to-medium deployments. The JSON-based schema offers flexibility but requires careful validation and consistent access patterns.

For larger deployments or multi-device sync, migrating to a traditional relational database (PostgreSQL) or cloud database (Firebase, Supabase) is recommended.

---

## Related Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture
- [FEATURES.md](./FEATURES.md) - Feature documentation
- [API_REFERENCE.md](./API_REFERENCE.md) - JavaScript API reference
- [USER_GUIDE.md](./USER_GUIDE.md) - User manual

---

**Last Updated**: November 2025
**Version**: 1.0.0
