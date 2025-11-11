# PSDturni - JavaScript API Reference

## Table of Contents
1. [Constants](#constants)
2. [Global State](#global-state)
3. [Utility Functions](#utility-functions)
4. [Storage Functions](#storage-functions)
5. [Authentication Functions](#authentication-functions)
6. [User Management Functions](#user-management-functions)
7. [Calendar Functions](#calendar-functions)
8. [Shift Management Functions](#shift-management-functions)
9. [Availability Functions](#availability-functions)
10. [Auto-Assignment Functions](#auto-assignment-functions)
11. [Export Functions](#export-functions)
12. [Version Control Functions](#version-control-functions)
13. [UI Functions](#ui-functions)

---

## Constants

### SHIFT_TYPES
**Type**: `Array<string>`
**Location**: app.js:7-11
**Description**: Array of all 18 shift types available in the system.

```javascript
const SHIFT_TYPES = [
    'SALA Senior', 'SALA Junior', 'REPARTO', 'UTIC', 'PS', 'RAP', 'ENI',
    'VIS 201', 'VISITE 208', 'TDS 207', 'ECOTT 205', 'ECO 206',
    'ECO spec 204', 'ECO INT', 'CARDIOCHIR', 'Vicenza', 'Ricerca', 'RISERVE'
];
```

---

### TIME_SLOTS
**Type**: `Object<string, Array<string>>`
**Location**: app.js:13-32
**Description**: Maps each shift type to its available time slots.

```javascript
const TIME_SLOTS = {
    'SALA Senior': ['MATT', 'POM'],
    'SALA Junior': ['MATT', 'POM'],
    'REPARTO': ['MATT 1', 'MATT 2', 'MATT 3', 'POM 1', 'POM 2', 'POM 3'],
    // ... (18 total shift types)
};
```

---

### ITALIAN_MONTHS
**Type**: `Array<string>`
**Location**: app.js:34-37
**Description**: Array of Italian month names for display.

```javascript
const ITALIAN_MONTHS = [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
];
```

---

### DAY_NAMES
**Type**: `Array<string>`
**Location**: app.js:39
**Description**: Array of Italian day abbreviations.

```javascript
const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
```

---

## Global State

### AppState
**Type**: `Object`
**Location**: app.js:85-96
**Description**: Centralized application state object.

```javascript
const AppState = {
    currentUser: null,           // Currently logged-in user object
    currentView: 'calendar',     // Active view ('calendar', 'shifts', etc.)
    currentMonth: number,        // 0-11
    currentYear: number,         // YYYY
    users: Array,                // Array of user objects
    shifts: Object,              // Shift assignments
    availability: Object,        // User unavailability data
    ambulatoriStatus: Object,    // Ambulatorio open/closed status
    approvalStatus: Object       // Month approval states
};
```

**Properties**:
- **currentUser**: User object or null if not logged in
- **currentView**: String indicating which page is displayed
- **currentMonth**: Zero-based month index (0 = January)
- **currentYear**: Four-digit year
- **users**: Array of all user objects
- **shifts**: Nested object structure for shift assignments
- **availability**: User unavailability declarations
- **ambulatoriStatus**: Which ambulatori are closed on which dates
- **approvalStatus**: Approval state for each month

---

## Utility Functions

### hashPassword()
**Location**: app.js:101-107
**Returns**: `Promise<string>`
**Description**: Hashes a password using SHA-256.

```javascript
async function hashPassword(password)
```

**Parameters**:
- `password` (string): Plain text password

**Returns**: Promise that resolves to 64-character hex string

**Example**:
```javascript
const hash = await hashPassword('myPassword123');
// Returns: "ef92b778b...def456" (64 chars)
```

---

### sanitizeInput()
**Location**: app.js:109-113
**Returns**: `string`
**Description**: Sanitizes user input to prevent XSS attacks.

```javascript
function sanitizeInput(input)
```

**Parameters**:
- `input` (string): User input to sanitize

**Returns**: HTML-escaped string

**Example**:
```javascript
const safe = sanitizeInput('<script>alert("XSS")</script>');
// Returns: "&lt;script&gt;alert(\"XSS\")&lt;/script&gt;"
```

---

### getDaysInMonth()
**Location**: app.js:115-117
**Returns**: `number`
**Description**: Returns the number of days in a given month.

```javascript
function getDaysInMonth(year, month)
```

**Parameters**:
- `year` (number): Four-digit year
- `month` (number): Zero-based month (0-11)

**Returns**: Number of days (28-31)

**Example**:
```javascript
const days = getDaysInMonth(2025, 1); // February 2025
// Returns: 28
```

---

### formatDate()
**Location**: app.js:119-121
**Returns**: `string`
**Description**: Formats a date as YYYY-MM-DD string.

```javascript
function formatDate(year, month, day)
```

**Parameters**:
- `year` (number): Four-digit year
- `month` (number): Zero-based month (0-11)
- `day` (number): Day of month (1-31)

**Returns**: Date string in ISO format (YYYY-MM-DD)

**Example**:
```javascript
const dateKey = formatDate(2025, 10, 15);
// Returns: "2025-11-15"
```

---

### isDeadlinePassed()
**Location**: app.js:123-129
**Returns**: `boolean`
**Description**: Checks if the deadline (20th of previous month) has passed for availability submissions.

```javascript
function isDeadlinePassed(targetMonth, targetYear)
```

**Parameters**:
- `targetMonth` (number): Zero-based target month (0-11)
- `targetYear` (number): Four-digit target year

**Returns**: `true` if deadline has passed, `false` otherwise

**Example**:
```javascript
// For November 2025, deadline is October 20, 2025
const passed = isDeadlinePassed(10, 2025);
// Returns: true if current date > October 20, 2025, 23:59:59
```

---

### showError()
**Location**: app.js:131-138
**Returns**: `void`
**Description**: Displays an error message in a specific element.

```javascript
function showError(elementId, message)
```

**Parameters**:
- `elementId` (string): DOM element ID to display error in
- `message` (string): Error message to display

**Side Effects**: Adds 'active' class to error element, auto-removes after 5 seconds

**Example**:
```javascript
showError('loginError', 'Invalid username or password');
```

---

### clearError()
**Location**: app.js:140-146
**Returns**: `void`
**Description**: Clears an error message from an element.

```javascript
function clearError(elementId)
```

**Parameters**:
- `elementId` (string): DOM element ID to clear error from

**Example**:
```javascript
clearError('loginError');
```

---

### showToast()
**Location**: app.js:44-80
**Returns**: `void`
**Description**: Displays a toast notification.

```javascript
function showToast(message, type = 'info', duration = 3000)
```

**Parameters**:
- `message` (string): Message to display
- `type` (string): Toast type ('success', 'error', 'warning', 'info')
- `duration` (number): Duration in milliseconds (default: 3000)

**Side Effects**: Creates toast element, auto-removes after duration

**Example**:
```javascript
showToast('Turno assegnato con successo', 'success', 3000);
showToast('Errore: operazione fallita', 'error', 5000);
```

---

## Storage Functions

### saveToStorage()
**Location**: app.js:151-159
**Returns**: `boolean`
**Description**: Saves data to localStorage.

```javascript
function saveToStorage(key, data)
```

**Parameters**:
- `key` (string): localStorage key
- `data` (any): Data to save (will be JSON stringified)

**Returns**: `true` if successful, `false` on error

**Example**:
```javascript
const success = saveToStorage('users', AppState.users);
```

---

### loadFromStorage()
**Location**: app.js:161-169
**Returns**: `any`
**Description**: Loads data from localStorage.

```javascript
function loadFromStorage(key, defaultValue = null)
```

**Parameters**:
- `key` (string): localStorage key
- `defaultValue` (any): Value to return if key doesn't exist

**Returns**: Parsed JSON data or defaultValue

**Example**:
```javascript
const users = loadFromStorage('users', []);
```

---

### initializeDefaultData()
**Location**: app.js:203-296
**Returns**: `void`
**Description**: Initializes application with default users and empty data structures.

```javascript
function initializeDefaultData()
```

**Side Effects**:
- Creates 27 default users if none exist
- Initializes empty shifts, availability, ambulatoriStatus, approvalStatus
- Migrates existing users (adds code field if missing)
- Saves all data to localStorage

**Example**:
```javascript
initializeDefaultData();
```

---

## Authentication Functions

### handleLogin()
**Location**: app.js:~2350-2400
**Returns**: `Promise<void>`
**Description**: Handles user login.

```javascript
async function handleLogin(event)
```

**Parameters**:
- `event` (Event): Form submit event

**Process**:
1. Prevents default form submission
2. Gets username and password from form
3. Finds user in AppState.users
4. If user not found, shows error
5. If password is null, redirects to first login
6. Otherwise, hashes password and compares
7. On success, sets AppState.currentUser and shows dashboard
8. On failure, shows error

**Side Effects**:
- Updates AppState.currentUser
- Saves rememberedUserId if checkbox checked
- Switches to dashboard view

**Example**:
```html
<form onsubmit="handleLogin(event)">
    <input id="username" type="text">
    <input id="password" type="password">
    <button type="submit">Login</button>
</form>
```

---

### handleFirstLogin()
**Location**: app.js:~2400-2450
**Returns**: `Promise<void>`
**Description**: Handles first-time password setup.

```javascript
async function handleFirstLogin(event)
```

**Parameters**:
- `event` (Event): Form submit event

**Process**:
1. Prevents default form submission
2. Gets new password and confirmation
3. Validates passwords match and meet minimum length
4. Hashes password
5. Updates user object with hashed password
6. Saves to storage
7. Logs user in automatically

**Validation**:
- Password minimum 6 characters
- Password and confirmation must match

**Example**:
```html
<form onsubmit="handleFirstLogin(event)">
    <input id="firstPassword" type="password">
    <input id="firstPasswordConfirm" type="password">
    <button type="submit">Set Password</button>
</form>
```

---

### logout()
**Location**: app.js:~2500
**Returns**: `void`
**Description**: Logs out the current user.

```javascript
function logout()
```

**Process**:
1. Sets AppState.currentUser = null
2. Clears rememberedUserId from localStorage (unless "remember me" was checked)
3. Shows login screen

**Example**:
```javascript
logout();
```

---

### handleChangePassword()
**Location**: app.js:~2450-2520
**Returns**: `Promise<void>`
**Description**: Changes the current user's password.

```javascript
async function handleChangePassword()
```

**Process**:
1. Gets current, new, and confirm passwords from modal
2. Verifies current password matches
3. Validates new password (min 6 chars, matches confirm)
4. Hashes new password
5. Updates user object
6. Saves to storage
7. Closes modal and shows success toast

**Validation**:
- Current password must match stored hash
- New password minimum 6 characters
- New password must match confirmation
- New password must differ from current

**Example**:
```javascript
// Called from modal button
<button onclick="handleChangePassword()">Change Password</button>
```

---

## User Management Functions

### renderUsersManagement()
**Location**: app.js:~2200-2250
**Returns**: `void`
**Description**: Renders the user management view (admin only).

```javascript
function renderUsersManagement()
```

**Side Effects**:
- Updates main content area with user management UI
- Displays all users as cards
- Shows "Add User" button
- Attaches event listeners

**Authorization**: Admin only (checks AppState.currentUser.role)

**Example**:
```javascript
renderUsersManagement();
```

---

### addUser()
**Location**: app.js:~2250-2280
**Returns**: `void`
**Description**: Opens modal to add a new user.

```javascript
function addUser()
```

**Side Effects**:
- Opens user edit modal in "add" mode
- Clears all form fields
- Sets up capability checkboxes

**Example**:
```javascript
<button onclick="addUser()">Add User</button>
```

---

### editUser()
**Location**: app.js:~2280-2320
**Returns**: `void`
**Description**: Opens modal to edit an existing user.

```javascript
function editUser(userId)
```

**Parameters**:
- `userId` (string): ID of user to edit

**Side Effects**:
- Opens user edit modal in "edit" mode
- Pre-fills form with user data
- Checks appropriate capability boxes
- Disables role change if editing self

**Example**:
```javascript
<button onclick="editUser('agrelli')">Edit</button>
```

---

### deleteUser()
**Location**: app.js:~2320-2350
**Returns**: `void`
**Description**: Deletes a user from the system.

```javascript
function deleteUser(userId)
```

**Parameters**:
- `userId` (string): ID of user to delete

**Process**:
1. Confirms with user
2. Checks if trying to delete self (blocked)
3. Removes user from AppState.users
4. Saves to storage
5. Re-renders user management view
6. Shows success toast

**Validation**:
- Cannot delete self
- Confirmation required

**Example**:
```javascript
<button onclick="deleteUser('agrelli')">Delete</button>
```

---

### saveUser()
**Location**: app.js:~2280-2320
**Returns**: `void`
**Description**: Saves a user (new or edited) from the modal form.

```javascript
function saveUser()
```

**Process**:
1. Gets form data
2. Validates required fields
3. Generates code from name if not provided
4. Collects selected capabilities
5. Validates at least one capability selected
6. Creates/updates user object
7. Saves to storage
8. Closes modal
9. Re-renders user management
10. Shows success toast

**Validation**:
- Name, ID, specialty required
- At least one capability must be selected
- User ID must be unique (for new users)

**Example**:
```javascript
// Called from modal save button
<button onclick="saveUser()">Save User</button>
```

---

## Calendar Functions

### renderCalendar()
**Location**: app.js:~400-700
**Returns**: `void`
**Description**: Renders the main calendar view showing all shifts.

```javascript
function renderCalendar()
```

**Process**:
1. Gets current month/year from AppState
2. Calculates days in month
3. Generates calendar HTML
4. For each day, displays assigned shifts with user codes
5. Color-codes user assignments
6. Highlights current day
7. Shows weekend styling
8. Displays approval status badge

**Side Effects**:
- Updates main content area
- Attaches navigation event listeners

**Example**:
```javascript
renderCalendar();
```

---

### navigateMonth()
**Location**: app.js:~650-680
**Returns**: `void`
**Description**: Navigates to previous or next month.

```javascript
function navigateMonth(direction)
```

**Parameters**:
- `direction` (number): -1 for previous month, 1 for next month

**Process**:
1. Updates AppState.currentMonth
2. Handles year boundaries (Dec ↔ Jan)
3. Re-renders current view

**Example**:
```javascript
<button onclick="navigateMonth(-1)">Previous</button>
<button onclick="navigateMonth(1)">Next</button>
```

---

### toggleApproval()
**Location**: app.js:~2520-2580
**Returns**: `void`
**Description**: Toggles month approval status between draft and approved (admin only).

```javascript
function toggleApproval()
```

**Process**:
1. Gets current month/year
2. Creates approval key (YYYY-MM)
3. Checks current status
4. If draft, sets to approved with timestamp and user
5. If approved, sets back to draft
6. Saves to storage
7. Re-renders calendar

**Authorization**: Admin only

**Example**:
```javascript
<button onclick="toggleApproval()">Toggle Approval</button>
```

---

### getUserColor()
**Location**: app.js:~150-180
**Returns**: `string`
**Description**: Generates a consistent color for a user based on their ID.

```javascript
function getUserColor(userId)
```

**Parameters**:
- `userId` (string): User ID

**Returns**: HSL color string

**Algorithm**:
1. Hashes userId to number
2. Converts to hue (0-360)
3. Returns HSL color with fixed saturation and lightness

**Example**:
```javascript
const color = getUserColor('agrelli');
// Returns: "hsl(245, 65%, 55%)" (consistent for 'agrelli')
```

---

## Shift Management Functions

### renderShiftsManagement()
**Location**: app.js:~700-900
**Returns**: `void`
**Description**: Renders the shift management view (admin only).

```javascript
function renderShiftsManagement()
```

**Process**:
1. Displays shift grid for current month
2. Shows all shift types and time slots
3. Displays assigned users with colors
4. Shows "Chiuso" for closed ambulatori
5. Makes each slot clickable for assignment
6. Adds ambulatorio close/open toggles

**Side Effects**:
- Updates main content area
- Attaches click listeners to shift slots
- Attaches checkbox listeners for ambulatori

**Authorization**: Admin only

**Example**:
```javascript
renderShiftsManagement();
```

---

### assignShift()
**Location**: app.js:~900-950
**Returns**: `void`
**Description**: Opens modal to assign a user to a shift slot.

```javascript
function assignShift(shiftType, day, timeSlot)
```

**Parameters**:
- `shiftType` (string): Type of shift (e.g., 'SALA Senior')
- `day` (number): Day of month (1-31)
- `timeSlot` (string): Time slot (e.g., 'MATT')

**Process**:
1. Filters users by capability for shift type
2. Checks user availability
3. Highlights incompatible users
4. Opens modal with user list
5. On user selection, validates and assigns
6. Updates AppState.shifts
7. Saves to storage
8. Re-renders shift management

**Example**:
```javascript
assignShift('SALA Senior', 15, 'MATT');
```

---

### validateShiftAssignment()
**Location**: app.js:~950-1000
**Returns**: `Object`
**Description**: Validates if a user can be assigned to a shift.

```javascript
function validateShiftAssignment(userId, shiftType, date, timeSlot)
```

**Parameters**:
- `userId` (string): User ID to validate
- `shiftType` (string): Shift type
- `date` (string): Date in YYYY-MM-DD format
- `timeSlot` (string): Time slot

**Returns**: Object with validation result
```javascript
{
    valid: boolean,           // Overall validity
    hasCapability: boolean,   // User has shift capability
    isAvailable: boolean,     // User is available
    hasConflict: boolean,     // User already assigned conflicting shift
    canOverride: boolean,     // Admin can force assign
    warnings: Array<string>   // Warning messages
}
```

**Example**:
```javascript
const result = validateShiftAssignment('agrelli', 'SALA Senior', '2025-11-15', 'MATT');
if (result.valid) {
    // Assign shift
} else if (result.canOverride) {
    // Show warning, allow override
} else {
    // Block assignment
}
```

---

### toggleAmbulatorio()
**Location**: app.js:~1000-1050
**Returns**: `void`
**Description**: Opens or closes an ambulatorio for a specific date.

```javascript
function toggleAmbulatorio(shiftType, day)
```

**Parameters**:
- `shiftType` (string): Shift type (ambulatorio)
- `day` (number): Day of month

**Process**:
1. Creates date key
2. Toggles closed status in AppState.ambulatoriStatus
3. If closing, removes any existing assignment
4. Saves to storage
5. Re-renders shift management

**Example**:
```javascript
toggleAmbulatorio('ECO 206', 15); // Toggle ECO 206 on day 15
```

---

### isAmbulatorioClosedForWeekend()
**Location**: app.js:~1050-1080
**Returns**: `boolean`
**Description**: Checks if an ambulatorio should be auto-closed on weekends.

```javascript
function isAmbulatorioClosedForWeekend(shiftType, date)
```

**Parameters**:
- `shiftType` (string): Shift type
- `date` (Date): Date object

**Returns**: `true` if should be closed, `false` otherwise

**Logic**:
- Saturdays and Sundays: Most ambulatori closed
- Exceptions: UTIC, PS, RAP (always open)

**Example**:
```javascript
const date = new Date(2025, 10, 16); // Saturday
const closed = isAmbulatorioClosedForWeekend('ECO 206', date);
// Returns: true
```

---

## Availability Functions

### renderAvailabilityCalendar()
**Location**: app.js:~1100-1250
**Returns**: `void`
**Description**: Renders the availability declaration view for users.

```javascript
function renderAvailabilityCalendar()
```

**Process**:
1. Shows calendar for next 3 months
2. For each day, shows MATT/POM/NTT checkboxes
3. Pre-checks boxes based on existing availability
4. Checks deadline and disables if passed
5. Shows countdown timer
6. Displays save button

**Side Effects**:
- Updates main content area
- Attaches checkbox listeners
- Calculates and displays deadline

**Example**:
```javascript
renderAvailabilityCalendar();
```

---

### saveAvailability()
**Location**: app.js:~1200-1250
**Returns**: `void`
**Description**: Saves user's availability declarations.

```javascript
function saveAvailability(month, year)
```

**Parameters**:
- `month` (number): Zero-based month (0-11)
- `year` (number): Four-digit year

**Process**:
1. Checks deadline
2. Collects checked boxes
3. Creates availability object structure
4. Updates AppState.availability
5. Saves to storage
6. Shows success toast

**Data Structure**:
```javascript
{
    "userid_2025_10": {
        "2025-11-15": {
            "mattina": true,
            "pomeriggio": true,
            "notte": false
        }
    }
}
```

**Example**:
```javascript
saveAvailability(10, 2025); // Save November 2025 availability
```

---

### getAvailabilitySlot()
**Location**: app.js:174-187
**Returns**: `Array<string>`
**Description**: Maps a time slot to availability periods.

```javascript
function getAvailabilitySlot(timeSlot)
```

**Parameters**:
- `timeSlot` (string): Time slot code (e.g., 'MATT', 'POM', 'NTT')

**Returns**: Array of availability periods ('mattina', 'pomeriggio', 'notte')

**Mapping**:
- MATT, MATT 1-3, h 8-13 → ['mattina']
- POM, POM 1-3, h 14-18, SPEC, SS → ['pomeriggio']
- NTT → ['notte']
- GG → ['mattina', 'pomeriggio']

**Example**:
```javascript
const slots = getAvailabilitySlot('GG');
// Returns: ['mattina', 'pomeriggio']
```

---

### isUserUnavailableForSlot()
**Location**: app.js:189-198
**Returns**: `boolean`
**Description**: Checks if a user is unavailable for a specific shift slot.

```javascript
function isUserUnavailableForSlot(userId, dateKey, timeSlot)
```

**Parameters**:
- `userId` (string): User ID
- `dateKey` (string): Date in YYYY-MM-DD format
- `timeSlot` (string): Time slot to check

**Returns**: `true` if user is unavailable, `false` if available

**Example**:
```javascript
const unavailable = isUserUnavailableForSlot('agrelli', '2025-11-15', 'MATT');
if (unavailable) {
    // Skip this user for assignment
}
```

---

### renderAvailabilityOverview()
**Location**: app.js:~1300-1400
**Returns**: `void`
**Description**: Renders overview of all users' availability (admin only).

```javascript
function renderAvailabilityOverview()
```

**Process**:
1. Creates grid with users as rows, days as columns
2. For each user/day, shows unavailability codes:
   - M = Mattina unavailable
   - P = Pomeriggio unavailable
   - N = Notte unavailable
   - MP, MN, PN, MPN = Multiple slots unavailable
3. Color-codes cells
4. Adds export buttons

**Side Effects**:
- Updates main content area
- Shows color legend

**Authorization**: Admin only

**Example**:
```javascript
renderAvailabilityOverview();
```

---

## Auto-Assignment Functions

### runAutoAssignment()
**Location**: app.js:~1700-2100
**Returns**: `void`
**Description**: Runs the automatic shift assignment algorithm.

```javascript
function runAutoAssignment(mode = 'fill')
```

**Parameters**:
- `mode` (string): 'fill' to preserve existing assignments, 'all' to replace all

**Process**:
1. Gets all eligible users for each shift type
2. Initializes assignment counters
3. For each day in month:
   - For each shift type:
     - For each time slot:
       - Filters eligible users (capability, availability, rules)
       - Sorts by assignment count (load balancing)
       - Assigns user with fewest assignments
       - Updates counters
4. Generates report
5. Displays statistics

**Four Core Rules**:
1. No day-after-night shifts
2. REP-capable for night shifts
3. Weekend emodinamista continuity
4. Weekend slot consistency

**Example**:
```javascript
runAutoAssignment('fill'); // Fill empty slots only
runAutoAssignment('all');  // Replace all assignments
```

---

### hadNightShiftPreviousDay()
**Location**: app.js:~1800-1850
**Returns**: `boolean`
**Description**: Checks if user worked night shift previous day (Rule 1).

```javascript
function hadNightShiftPreviousDay(userId, date)
```

**Parameters**:
- `userId` (string): User ID
- `date` (Date): Date to check

**Returns**: `true` if user had night shift yesterday, `false` otherwise

**Example**:
```javascript
const hadNight = hadNightShiftPreviousDay('agrelli', new Date(2025, 10, 16));
if (hadNight) {
    // Skip assignment for this user
}
```

---

### hasREPCapableNightShift()
**Location**: app.js:~1850-1900
**Returns**: `boolean`
**Description**: Validates user has REP capability for night shifts (Rule 2).

```javascript
function hasREPCapableNightShift(userId, shiftType, timeSlot)
```

**Parameters**:
- `userId` (string): User ID
- `shiftType` (string): Shift type
- `timeSlot` (string): Time slot

**Returns**: `true` if validation passes, `false` otherwise

**Logic**: For PS NTT and RAP NTT, user must have canDoREP = true

**Example**:
```javascript
const canAssign = hasREPCapableNightShift('gcannone', 'PS', 'NTT');
// Returns: true (gcannone is emodinamista with canDoREP = true)
```

---

### maintainWeekendContinuity()
**Location**: app.js:~1900-1980
**Returns**: `boolean`
**Description**: Ensures same emodinamista works Friday-Saturday-Sunday (Rule 3).

```javascript
function maintainWeekendContinuity(userId, date, shiftType)
```

**Parameters**:
- `userId` (string): User ID
- `date` (Date): Date object
- `shiftType` (string): Shift type

**Returns**: `true` if rule passes, `false` to skip this user

**Logic**:
- Saturday: Prefer same user as Friday
- Sunday: Prefer same user as Saturday
- Only applies to SALA shifts

**Example**:
```javascript
const date = new Date(2025, 10, 16); // Saturday
const ok = maintainWeekendContinuity('gcannone', date, 'SALA Senior');
```

---

### maintainSlotConsistency()
**Location**: app.js:~1980-2020
**Returns**: `boolean`
**Description**: Ensures same user works MATT and POM on weekend days (Rule 4).

```javascript
function maintainSlotConsistency(userId, date, shiftType, timeSlot)
```

**Parameters**:
- `userId` (string): User ID
- `date` (Date): Date object
- `shiftType` (string): Shift type
- `timeSlot` (string): Time slot

**Returns**: `true` if rule passes, `false` to skip this user

**Logic**: If assigning POM on weekend, must match MATT assignment

**Example**:
```javascript
const date = new Date(2025, 10, 16); // Saturday
const ok = maintainSlotConsistency('gcannone', date, 'SALA Senior', 'POM');
```

---

## Export Functions

### generatePDF()
**Location**: app.js:~1400-1550
**Returns**: `void`
**Description**: Generates and downloads a PDF of the shift schedule.

```javascript
function generatePDF(month, year, isDraft = true)
```

**Parameters**:
- `month` (number): Zero-based month (0-11)
- `year` (number): Four-digit year
- `isDraft` (boolean): true for draft watermark, false for final

**Process**:
1. Creates jsPDF document (A4 landscape)
2. Adds hospital logo (if available)
3. Adds header with month/year
4. Adds draft/final badge
5. Creates table with all shifts
6. Color-codes weekends
7. Adds footer with generation timestamp
8. Downloads as PDF file

**Filename**: `Turni_${ITALIAN_MONTHS[month]}_${year}_${isDraft ? 'Bozza' : 'Definitivo'}.pdf`

**Example**:
```javascript
generatePDF(10, 2025, false); // Generate final PDF for November 2025
```

---

### generateExcel()
**Location**: app.js:~1550-1650
**Returns**: `void`
**Description**: Generates and downloads an Excel file of the shift schedule.

```javascript
function generateExcel(month, year)
```

**Parameters**:
- `month` (number): Zero-based month (0-11)
- `year` (number): Four-digit year

**Process**:
1. Creates workbook
2. Creates matrix with days as rows, shifts as columns
3. Fills cells with user codes
4. Styles headers (bold, colored background)
5. Styles weekends (gray background)
6. Auto-sizes columns
7. Downloads as XLSX file

**Filename**: `Turni_${ITALIAN_MONTHS[month]}_${year}.xlsx`

**Example**:
```javascript
generateExcel(10, 2025); // Generate Excel for November 2025
```

---

### exportAvailabilityPdf()
**Location**: app.js:~1650-1680
**Returns**: `void`
**Description**: Exports availability overview as PDF (admin only).

```javascript
function exportAvailabilityPdf(month, year)
```

**Parameters**:
- `month` (number): Zero-based month (0-11)
- `year` (number): Four-digit year

**Process**:
1. Creates PDF with grid layout
2. Users as rows, days as columns
3. Codes: M (Mattina), P (Pomeriggio), N (Notte)
4. Adds legend
5. Downloads PDF

**Filename**: `Indisponibilita_${ITALIAN_MONTHS[month]}_${year}.pdf`

**Example**:
```javascript
exportAvailabilityPdf(10, 2025);
```

---

### exportAvailabilityExcel()
**Location**: app.js:~1680-1700
**Returns**: `void`
**Description**: Exports availability overview as Excel (admin only).

```javascript
function exportAvailabilityExcel(month, year)
```

**Parameters**:
- `month` (number): Zero-based month (0-11)
- `year` (number): Four-digit year

**Process**:
1. Creates workbook
2. Creates grid with color coding
3. Adds legend sheet
4. Downloads XLSX

**Filename**: `Indisponibilita_${ITALIAN_MONTHS[month]}_${year}.xlsx`

**Example**:
```javascript
exportAvailabilityExcel(10, 2025);
```

---

## Version Control Functions

### saveVersion()
**Location**: app.js:~2100-2150
**Returns**: `void`
**Description**: Saves current shift configuration as a named version (admin only).

```javascript
function saveVersion()
```

**Process**:
1. Opens modal for version name
2. Captures current month's shifts
3. Creates version object with metadata
4. Adds to shiftVersions array
5. Saves to storage
6. Shows success toast

**Version Object**:
```javascript
{
    id: timestamp,
    name: "Version Name",
    month: 10,
    year: 2025,
    shifts: {...},
    savedBy: "userid",
    savedAt: "ISO timestamp"
}
```

**Example**:
```javascript
saveVersion(); // Opens modal
```

---

### loadVersion()
**Location**: app.js:~2150-2200
**Returns**: `void`
**Description**: Loads a previously saved version (admin only).

```javascript
function loadVersion(versionId)
```

**Parameters**:
- `versionId` (string): ID of version to load

**Process**:
1. Confirms with user
2. Finds version in shiftVersions
3. Restores shifts from version
4. Updates AppState.shifts
5. Saves to storage
6. Re-renders calendar
7. Shows success toast

**Example**:
```javascript
<button onclick="loadVersion('v_1732531200000')">Load</button>
```

---

### deleteVersion()
**Location**: app.js:~2180-2200
**Returns**: `void`
**Description**: Deletes a saved version (admin only).

```javascript
function deleteVersion(versionId)
```

**Parameters**:
- `versionId` (string): ID of version to delete

**Process**:
1. Confirms with user
2. Removes version from shiftVersions array
3. Saves to storage
4. Re-renders version management view
5. Shows success toast

**Example**:
```javascript
<button onclick="deleteVersion('v_1732531200000')">Delete</button>
```

---

### renderVersionManagement()
**Location**: app.js:~2100-2150
**Returns**: `void`
**Description**: Renders version management view (admin only).

```javascript
function renderVersionManagement()
```

**Process**:
1. Loads all saved versions
2. Displays each version with:
   - Name
   - Month/Year
   - Saved by (user)
   - Saved at (timestamp)
   - Load button
   - Delete button
3. Shows "Save Current" button

**Example**:
```javascript
renderVersionManagement();
```

---

## UI Functions

### switchView()
**Location**: app.js:~300-400
**Returns**: `void`
**Description**: Switches between different application views.

```javascript
function switchView(viewName)
```

**Parameters**:
- `viewName` (string): View to switch to ('calendar', 'availability', 'users', etc.)

**Process**:
1. Updates AppState.currentView
2. Updates navigation active state
3. Calls appropriate render function

**Valid Views**:
- 'calendar'
- 'availability'
- 'users' (admin)
- 'shifts' (admin)
- 'autoAssign' (admin)
- 'availabilityOverview' (admin)
- 'versions' (admin)

**Example**:
```javascript
switchView('calendar');
```

---

### openModal()
**Location**: app.js:~2580-2600
**Returns**: `void`
**Description**: Opens a modal dialog.

```javascript
function openModal(modalId)
```

**Parameters**:
- `modalId` (string): DOM element ID of modal to open

**Side Effects**:
- Adds 'active' class to modal
- Displays modal with backdrop

**Example**:
```javascript
openModal('changePasswordModal');
```

---

### closeModal()
**Location**: app.js:~2600-2620
**Returns**: `void`
**Description**: Closes a modal dialog.

```javascript
function closeModal(modalId)
```

**Parameters**:
- `modalId` (string): DOM element ID of modal to close

**Side Effects**:
- Removes 'active' class from modal
- Hides modal

**Example**:
```javascript
closeModal('changePasswordModal');
```

---

### renderDashboard()
**Location**: app.js:~350-400
**Returns**: `void`
**Description**: Renders the main dashboard after login.

```javascript
function renderDashboard()
```

**Process**:
1. Shows dashboard container
2. Hides login screens
3. Updates user menu with current user name
4. Shows/hides admin menu items based on role
5. Renders default view (calendar)

**Example**:
```javascript
renderDashboard();
```

---

## Event Listeners

### DOMContentLoaded
**Location**: app.js:~2600-2637
**Description**: Initializes application when DOM is ready.

```javascript
document.addEventListener('DOMContentLoaded', function() {
    // Initialize default data
    // Load from storage
    // Check for remembered user
    // Attach event listeners
    // Show login screen
});
```

---

### Form Submissions
**Description**: Various forms throughout the application.

```javascript
// Login form
document.getElementById('loginForm').addEventListener('submit', handleLogin);

// First login form
document.getElementById('firstLoginForm').addEventListener('submit', handleFirstLogin);

// User form
document.getElementById('userForm').addEventListener('submit', saveUser);
```

---

### Navigation Clicks
**Description**: Navigation menu clicks.

```javascript
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', function() {
        const view = this.dataset.view;
        switchView(view);
    });
});
```

---

## Global Window Functions

These functions are exposed to the global `window` object for use in inline event handlers:

```javascript
window.switchView = switchView;
window.editUser = editUser;
window.deleteUser = deleteUser;
window.toggleAmbulatorio = toggleAmbulatorio;
window.assignShift = assignShift;
window.runAutoAssignment = runAutoAssignment;
window.openModal = openModal;
window.closeModal = closeModal;
window.loadVersion = loadVersion;
window.deleteVersion = deleteVersion;
window.navigateMonth = navigateMonth;
window.toggleApproval = toggleApproval;
window.logout = logout;
```

---

## Error Handling

All storage functions include try-catch blocks:

```javascript
function saveToStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (error) {
        console.error('Storage error:', error);
        showToast('Errore nel salvataggio dei dati', 'error');
        return false;
    }
}
```

---

## Best Practices

### 1. Function Naming Conventions
- **render...()**: Functions that update the DOM
- **handle...()**: Event handler functions
- **get...()**: Functions that retrieve data
- **is...()**: Boolean check functions
- **validate...()**: Validation functions
- **save.../load...()**: Storage operations

### 2. Async Functions
Functions that use Web Crypto API are async:
- `hashPassword()`
- `handleLogin()`
- `handleFirstLogin()`
- `handleChangePassword()`

### 3. Side Effects
Functions that modify AppState or localStorage are clearly documented.

### 4. Authorization Checks
Admin-only functions check `AppState.currentUser.role === 'admin'` before executing.

---

## Deprecation Notes

No deprecated functions in current version.

---

## Version History

- **v1.0.0** (November 2025): Initial release

---

## Related Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture
- [FEATURES.md](./FEATURES.md) - Feature documentation
- [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md) - Data structures
- [USER_GUIDE.md](./USER_GUIDE.md) - User manual

---

**Last Updated**: November 2025
**Version**: 1.0.0
