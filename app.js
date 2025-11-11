// ===========================
// PSDturni - Hospital Shift Management System
// ===========================

// ===========================
// Constants & Configuration
// ===========================
const SHIFT_TYPES = [
    'SALA Senior', 'SALA Junior', 'REPARTO', 'UTIC', 'PS', 'RAP', 'ENI',
    'VIS 201', 'VISITE 208', 'TDS 207', 'ECOTT 205', 'ECO 206',
    'ECO spec 204', 'ECO INT', 'CARDIOCHIR', 'Vicenza', 'Ricerca', 'RISERVE'
];

const TIME_SLOTS = {
    'SALA Senior': ['MATT', 'POM'],
    'SALA Junior': ['MATT', 'POM'],
    'REPARTO': ['MATT 1', 'MATT 2', 'MATT 3', 'POM 1', 'POM 2', 'POM 3'],
    'UTIC': ['MATT', 'POM'],
    'PS': ['GG', 'NTT'],
    'RAP': ['GG', 'NTT'],
    'ENI': ['h 8-13', 'SPEC', 'h 14-18'],
    'VIS 201': ['SPEC'],
    'VISITE 208': ['MATT', 'POM'],
    'TDS 207': ['MATT', 'POM'],
    'ECOTT 205': ['MATT', 'POM'],
    'ECO 206': ['MATT', 'POM', 'SS'],
    'ECO spec 204': ['MATT', 'POM', 'SS'],
    'ECO INT': ['MATT', 'POM'],
    'CARDIOCHIR': ['MATT', 'POM'],
    'Vicenza': ['GG'],
    'Ricerca': ['GG'],
    'RISERVE': ['MATT', 'POM']
};

const ITALIAN_MONTHS = [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
];

const DAY_NAMES = ['dom', 'lun', 'mar', 'mer', 'gio', 'ven', 'sab'];

// ===========================
// Toast Notifications
// ===========================
function showToast(message, type = 'info', duration = 3000) {
    // Create toast container if it doesn't exist
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    // Icon mapping
    const icons = {
        success: 'check_circle',
        error: 'error',
        warning: 'warning',
        info: 'info'
    };

    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <span class="material-icons toast-icon">${icons[type] || icons.info}</span>
        <div class="toast-message">${message}</div>
        <button class="toast-close" onclick="this.parentElement.remove()">
            <span class="material-icons">close</span>
        </button>
    `;

    container.appendChild(toast);

    // Auto remove after duration
    setTimeout(() => {
        toast.classList.add('hiding');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// ===========================
// State Management
// ===========================
const AppState = {
    currentUser: null,
    currentView: 'calendar',
    currentMonth: new Date().getMonth(),
    currentYear: new Date().getFullYear(),
    users: [],
    shifts: {},
    availability: {},
    ambulatoriStatus: {},
    approvalStatus: {} // Format: "YYYY-MM": { status: "draft"|"approved", approvedBy: "user", approvedAt: "ISO date" }
};

// ===========================
// Utility Functions
// ===========================
async function hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function sanitizeInput(input) {
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
}

function getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
}

function formatDate(year, month, day) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function isDeadlinePassed(targetMonth, targetYear) {
    const now = new Date();
    const deadlineMonth = targetMonth === 0 ? 11 : targetMonth - 1;
    const deadlineYear = targetMonth === 0 ? targetYear - 1 : targetYear;
    const deadline = new Date(deadlineYear, deadlineMonth, 20, 23, 59, 59);
    return now > deadline;
}

function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.add('active');
        setTimeout(() => errorElement.classList.remove('active'), 5000);
    }
}

function clearError(elementId) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.classList.remove('active');
        errorElement.textContent = '';
    }
}

// ===========================
// Storage Functions
// ===========================
function saveToStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (error) {
        console.error('Storage error:', error);
        return false;
    }
}

function loadFromStorage(key, defaultValue = null) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : defaultValue;
    } catch (error) {
        console.error('Storage error:', error);
        return defaultValue;
    }
}

// ===========================
// Availability Helper Functions
// ===========================
function getAvailabilitySlot(timeSlot) {
    // Map time slots to availability periods (mattina/pomeriggio/notte)
    const mattina = ['MATT', 'MATT 1', 'MATT 2', 'MATT 3', 'h 8-13'];
    const pomeriggio = ['POM', 'POM 1', 'POM 2', 'POM 3', 'h 14-18', 'SPEC', 'SS'];
    const notte = ['NTT'];
    const allDay = ['GG']; // Covers both mattina and pomeriggio

    if (mattina.includes(timeSlot)) return ['mattina'];
    if (pomeriggio.includes(timeSlot)) return ['pomeriggio'];
    if (notte.includes(timeSlot)) return ['notte'];
    if (allDay.includes(timeSlot)) return ['mattina', 'pomeriggio'];

    return []; // Unknown slot type
}

function isUserUnavailableForSlot(userId, dateKey, timeSlot) {
    const [year, month] = dateKey.split('-').map(Number);
    const userAvailabilityKey = `${userId}_${year}_${month - 1}`;
    const unavailableSlots = AppState.availability[userAvailabilityKey] || {};
    const daySlots = unavailableSlots[dateKey] || {};

    const requiredSlots = getAvailabilitySlot(timeSlot);
    // User is unavailable if ANY of the required slots are marked as unavailable
    return requiredSlots.some(slot => daySlots[slot] === true);
}

// ===========================
// Initialize Default Data
// ===========================
function initializeDefaultData() {
    // Initialize users with actual hospital staff
    const defaultUsers = [
        // Admin users
        { id: 'spizzocri', name: 'Dott. Samuele Pizzocri', code: 'PIZ', role: 'admin', specialty: 'Emodinamista', password: '62c5ec050cf9b0bf5523b30df8c40e3872b8b3f0a48f20e0dc1ec5cdf989686d', capabilities: SHIFT_TYPES, canDoREP: true },

        // Medical staff
        { id: 'agrelli', name: 'Dott.ssa Arianna Grelli', code: 'GRELLI', role: 'user', specialty: 'Cardiologo', password: null, capabilities: ['REPARTO', 'UTIC', 'PS', 'ECO 206', 'VISITE 208', 'VIS 201', 'ECO INT'], canDoREP: false },
        { id: 'nbrambilla', name: 'Dott.ssa Nedy Brambilla', code: 'BRA', role: 'user', specialty: 'Cardiologo', password: null, capabilities: ['REPARTO', 'UTIC', 'PS', 'ECO 206', 'VISITE 208', 'VIS 201'], canDoREP: false },
        { id: 'mbarletta', name: 'Dott.ssa Marta Barletta', code: 'MARTA', role: 'user', specialty: 'Cardiologo', password: null, capabilities: ['REPARTO', 'PS', 'ECO 206', 'ECO spec 204', 'VISITE 208'], canDoREP: false },
        { id: 'aborin', name: 'Dott. Andrea Borin', code: 'BORIN', role: 'user', specialty: 'Cardiologo', password: null, capabilities: ['REPARTO', 'UTIC', 'PS', 'ECO 206', 'RAP'], canDoREP: false },
        { id: 'gcannone', name: 'Dott. Gaspare Sergio Cannone', code: 'GAS', role: 'user', specialty: 'Emodinamista', password: null, capabilities: ['SALA Senior', 'SALA Junior', 'REPARTO', 'PS', 'UTIC'], canDoREP: true },
        { id: 'echiorino', name: 'Dott.ssa Elisa Chiorino', code: 'CHI', role: 'user', specialty: 'Cardiologo', password: null, capabilities: ['SALA Junior', 'REPARTO', 'PS', 'ECO 206', 'VISITE 208'], canDoREP: false },
        { id: 'ecriscione', name: 'Dott. Enrico Criscione', code: 'CRISCIONE', role: 'user', specialty: 'Emodinamista', password: null, capabilities: ['SALA Senior', 'SALA Junior', 'REPARTO', 'PS', 'VIS 201', 'RAP'], canDoREP: true },
        { id: 'fdellarosa', name: 'Dott. Francesco Della Rosa', code: 'DEL', role: 'user', specialty: 'Emodinamista', password: null, capabilities: ['SALA Senior', 'SALA Junior', 'REPARTO', 'PS'], canDoREP: true },
        { id: 'rgorla', name: 'Dott. Riccardo Gorla', code: 'GOR', role: 'user', specialty: 'Emodinamista', password: null, capabilities: ['SALA Senior', 'SALA Junior', 'REPARTO', 'PS', 'UTIC'], canDoREP: true },
        { id: 'mguerrini', name: 'Dott. Marco Guerrini', code: 'GUE', role: 'user', specialty: 'Cardiologo', password: null, capabilities: ['REPARTO', 'PS', 'RAP', 'ECO 206', 'VISITE 208'], canDoREP: false },
        { id: 'alodirizzini', name: 'Dott. Angelo Lodi Rizzini', code: 'LODI', role: 'user', specialty: 'Cardiologo', password: null, capabilities: ['VIS 201', 'VISITE 208', 'ECO 206', 'TDS 207', 'ECOTT 205'], canDoREP: false },
        { id: 'vmantovani', name: 'Dott.ssa Valentina Mantovani', code: 'MANTO', role: 'user', specialty: 'Cardiologo', password: null, capabilities: ['REPARTO', 'ECO 206', 'ECO INT', 'VISITE 208'], canDoREP: false },
        { id: 'mmazzucca', name: 'Dott. Mattia Mazzucca', code: 'MAZZUCCA', role: 'user', specialty: 'Cardiologo', password: null, capabilities: ['REPARTO', 'UTIC', 'ECO 206', 'ECO INT', 'PS'], canDoREP: false },
        { id: 'apopolorubbio', name: 'Dott. Antonio Popolo Rubbio', code: 'ANTO', role: 'user', specialty: 'Cardiologo', password: null, capabilities: ['REPARTO', 'PS', 'UTIC', 'ECO 206', 'VISITE 208'], canDoREP: false },
        { id: 'msquillace', name: 'Dott. Mattia Squillace', code: 'SQUILLO', role: 'user', specialty: 'Cardiologo', password: null, capabilities: ['REPARTO', 'UTIC', 'RAP', 'VISITE 208', 'PS'], canDoREP: false },
        { id: 'estefanini', name: 'Dott.ssa Elisa Stefanini', code: 'STE', role: 'user', specialty: 'Ecocardiografista', password: null, capabilities: ['ECO 206', 'ECO spec 204', 'ECOTT 205', 'ECO INT', 'VISITE 208'], canDoREP: false },
        { id: 'ltesta', name: 'Dott. Luca Testa', code: 'TESTA', role: 'user', specialty: 'Cardiologo', password: null, capabilities: ['REPARTO', 'PS', 'UTIC', 'ECO 206'], canDoREP: false },
        { id: 'mtusa', name: 'Dott. Maurizio Tusa', code: 'TUSA', role: 'user', specialty: 'Ricercatore', password: null, capabilities: ['Ricerca', 'ECO spec 204', 'ECO INT'], canDoREP: false },
        { id: 'avella', name: 'Dott. Alessandro Vella', code: 'VELLA', role: 'user', specialty: 'Cardiologo', password: null, capabilities: ['REPARTO', 'UTIC', 'ECO INT', 'PS'], canDoREP: false },
        { id: 'mvicario', name: 'Dott.ssa Maria Lucia Vicario', code: 'VICARIO', role: 'user', specialty: 'Cardiologo', password: null, capabilities: ['REPARTO', 'UTIC', 'TDS 207', 'ECO 206', 'PS'], canDoREP: false },
        { id: 'jzannoni', name: 'Dott.ssa Jessica Zannoni', code: 'ZANNONI', role: 'user', specialty: 'Cardiologo', password: null, capabilities: ['REPARTO', 'ECO 206', 'ECO INT', 'VISITE 208'], canDoREP: false },
        { id: 'ecozza', name: 'Dott.ssa Elena Cozza', code: 'COZZA', role: 'user', specialty: 'Cardiologo', password: null, capabilities: ['REPARTO', 'ECO 206', 'ECO INT', 'TDS 207', 'VISITE 208'], canDoREP: false },
        { id: 'mmorosato', name: 'Dott. Michele Morosato', code: 'MORO', role: 'user', specialty: 'Cardiologo', password: null, capabilities: ['REPARTO', 'UTIC', 'PS', 'ECO 206', 'RAP'], canDoREP: false },
        { id: 'gcattaneo', name: 'Dott.ssa Greta Cattaneo', code: 'GRETA', role: 'user', specialty: 'Cardiologo', password: null, capabilities: ['REPARTO', 'PS', 'ECO 206', 'VISITE 208'], canDoREP: false },
        { id: 'tsimone', name: 'Dott. Tommaso Simone', code: 'TOM', role: 'user', specialty: 'Cardiologo', password: null, capabilities: ['REPARTO', 'VIS 201', 'VISITE 208', 'ECO 206'], canDoREP: false },
        { id: 'rdelmaso', name: 'Dott. Raffaele Del Maso', code: 'RAFFA', role: 'user', specialty: 'Cardiologo', password: null, capabilities: ['REPARTO', 'UTIC', 'PS', 'ECO 206', 'ECO INT'], canDoREP: false }
    ];

    const existingUsers = loadFromStorage('users');
    if (!existingUsers || existingUsers.length === 0) {
        saveToStorage('users', defaultUsers);
        AppState.users = defaultUsers;
    } else {
        // Migrate existing users: add code field if missing
        AppState.users = existingUsers.map(user => {
            if (!user.code) {
                // Find matching default user by ID
                const defaultUser = defaultUsers.find(du => du.id === user.id);
                if (defaultUser && defaultUser.code) {
                    user.code = defaultUser.code;
                } else {
                    // Generate code from name if not found
                    const nameParts = user.name.replace(/Dott\.(ssa)?/g, '').trim().split(' ');
                    user.code = nameParts[nameParts.length - 1].toUpperCase().substring(0, 6);
                }
            }
            return user;
        });
        saveToStorage('users', AppState.users);
    }

    // Initialize shifts structure
    const existingShifts = loadFromStorage('shifts');
    if (!existingShifts) {
        AppState.shifts = {};
        saveToStorage('shifts', AppState.shifts);
    } else {
        AppState.shifts = existingShifts;
    }

    // Initialize availability
    const existingAvailability = loadFromStorage('availability');
    if (!existingAvailability) {
        AppState.availability = {};
        saveToStorage('availability', AppState.availability);
    } else {
        AppState.availability = existingAvailability;
    }

    // Initialize ambulatori status
    const existingAmbulatori = loadFromStorage('ambulatoriStatus');
    if (!existingAmbulatori) {
        AppState.ambulatoriStatus = {};
        saveToStorage('ambulatoriStatus', AppState.ambulatoriStatus);
    } else {
        AppState.ambulatoriStatus = existingAmbulatori;
    }

    // Initialize approval status
    const existingApprovalStatus = loadFromStorage('approvalStatus');
    if (!existingApprovalStatus) {
        AppState.approvalStatus = {};
        saveToStorage('approvalStatus', AppState.approvalStatus);
    } else {
        AppState.approvalStatus = existingApprovalStatus;
    }
}

// ===========================
// Authentication
// ===========================
async function handleLogin(e) {
    e.preventDefault();
    clearError('loginError');

    const userId = sanitizeInput(document.getElementById('userId').value.toLowerCase().trim());
    const password = document.getElementById('password').value;

    const user = AppState.users.find(u => u.id === userId);

    if (!user) {
        showError('loginError', 'Utente non trovato');
        return;
    }

    // First login - no password set
    if (!user.password) {
        AppState.currentUser = user;
        showScreen('firstLoginScreen');
        return;
    }

    // Verify password
    const hashedPassword = await hashPassword(password);
    if (hashedPassword !== user.password) {
        showError('loginError', 'Password errata');
        return;
    }

    // Login successful
    AppState.currentUser = user;

    // Handle remember me
    const rememberMe = document.getElementById('rememberMe').checked;
    if (rememberMe) {
        localStorage.setItem('rememberedUserId', userId);
    } else {
        localStorage.removeItem('rememberedUserId');
    }

    initializeDashboard();
    showScreen('dashboardScreen');
}

async function handleFirstLogin(e) {
    e.preventDefault();
    clearError('firstLoginError');

    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (newPassword.length < 6) {
        showError('firstLoginError', 'La password deve essere di almeno 6 caratteri');
        return;
    }

    if (newPassword !== confirmPassword) {
        showError('firstLoginError', 'Le password non corrispondono');
        return;
    }

    // Set password
    const hashedPassword = await hashPassword(newPassword);
    const userIndex = AppState.users.findIndex(u => u.id === AppState.currentUser.id);
    AppState.users[userIndex].password = hashedPassword;
    AppState.currentUser.password = hashedPassword;

    saveToStorage('users', AppState.users);

    // Go to dashboard
    initializeDashboard();
    showScreen('dashboardScreen');
}

async function handleChangePassword(e) {
    e.preventDefault();
    clearError('changePasswordError');

    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPasswordChange').value;
    const confirmPassword = document.getElementById('confirmPasswordChange').value;

    // Verify current password
    const hashedCurrent = await hashPassword(currentPassword);
    if (hashedCurrent !== AppState.currentUser.password) {
        showError('changePasswordError', 'Password attuale errata');
        return;
    }

    if (newPassword.length < 6) {
        showError('changePasswordError', 'La nuova password deve essere di almeno 6 caratteri');
        return;
    }

    if (newPassword !== confirmPassword) {
        showError('changePasswordError', 'Le nuove password non corrispondono');
        return;
    }

    // Update password
    const hashedPassword = await hashPassword(newPassword);
    const userIndex = AppState.users.findIndex(u => u.id === AppState.currentUser.id);
    AppState.users[userIndex].password = hashedPassword;
    AppState.currentUser.password = hashedPassword;

    saveToStorage('users', AppState.users);

    closeModal('changePasswordModal');
    showToast('Password modificata con successo', 'success');
}

function logout() {
    AppState.currentUser = null;

    // Preserve remembered userId if it exists
    const rememberedUserId = localStorage.getItem('rememberedUserId');

    document.getElementById('loginForm').reset();

    // Restore remembered userId and check remember me checkbox
    if (rememberedUserId) {
        document.getElementById('userId').value = rememberedUserId;
        document.getElementById('rememberMe').checked = true;
    }

    showScreen('loginScreen');
}

// ===========================
// Screen & View Management
// ===========================
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

function switchView(viewName) {
    AppState.currentView = viewName;

    // Update navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.view === viewName) {
            btn.classList.add('active');
        }
    });

    // Update views
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
    });
    document.getElementById(`${viewName}View`).classList.add('active');

    // Load view-specific content
    switch(viewName) {
        case 'calendar':
            renderCalendar();
            break;
        case 'availability':
            renderAvailabilityCalendar();
            break;
        case 'users':
            renderUsersGrid();
            break;
        case 'shifts':
            renderShiftsManagement();
            break;
        case 'autoassign':
            renderAutoAssign();
            break;
        case 'availability-overview':
            renderAvailabilityOverview();
            break;
        case 'versions':
            updateVersionMonthSelectors();
            renderVersionsGrid();
            break;
    }
}

function initializeDashboard() {
    // Update user name in header
    document.getElementById('currentUserName').textContent = AppState.currentUser.name;

    // Show/hide admin features
    const isAdmin = AppState.currentUser.role === 'admin';
    document.querySelectorAll('.admin-only').forEach(element => {
        element.style.display = isAdmin ? 'flex' : 'none';
    });

    // Initialize default view
    switchView('calendar');
}

// ===========================
// Calendar View
// ===========================
function renderCalendar() {
    const monthText = `${ITALIAN_MONTHS[AppState.currentMonth]} ${AppState.currentYear}`;
    document.getElementById('currentMonth').textContent = monthText;

    const container = document.getElementById('calendarGrid');
    const daysInMonth = getDaysInMonth(AppState.currentYear, AppState.currentMonth);

    // Check if user should see shifts for this month
    const canSeeShifts = shouldShowShiftsForUser(AppState.currentYear, AppState.currentMonth);

    // Use exact Excel column names - very compact
    const shiftAbbrev = {
        'SALA Senior': 'SALAsenior',
        'SALA Junior': 'SALAjunior',
        'REPARTO': 'REPARTO',
        'UTIC': 'UTIC',
        'PS': 'PS',
        'RAP': 'RAP',
        'ENI': 'ENI',
        'VIS 201': 'VIS 201',
        'VISITE 208': 'VIS 208',
        'TDS 207': 'TDS 207',
        'ECOTT 205': 'ECOTT',
        'ECO 206': 'ECO 206',
        'ECO spec 204': 'ECO 204',
        'ECO INT': 'ECO INT',
        'CARDIOCHIR': 'CARD',
        'Vicenza': 'VICE',
        'Ricerca': 'RIC',
        'RISERVE': 'RIS'
    };

    // Excel-style slot abbreviations - very compact, numbers only for ambulatori
    const slotAbbrev = (slot) => {
        // Extract just the number from slots like "MATT 1", "POM 2", etc.
        const numberMatch = slot.match(/\s+(\d+)$/);
        if (numberMatch) {
            return numberMatch[1]; // Return just "1", "2", "3"
        }

        // For time ranges like "h 8-13", simplify to "8-13"
        if (slot.startsWith('h ')) {
            return slot.replace('h ', '');
        }

        // Standard slots
        if (slot === 'MATT') return 'MAT';
        if (slot === 'POM') return 'POM';
        if (slot === 'NTT') return 'NOT';
        if (slot === 'GG') return 'GG';
        if (slot === 'SS') return 'SS';
        if (slot === 'SPEC') return 'SPEC';

        return slot; // Return as-is for anything else
    };

    let html = '<table class="calendar-table compact-calendar"><thead><tr>';
    html += '<th class="date-header">GG</th>';

    // Add shift type headers - compact format
    SHIFT_TYPES.forEach(shiftType => {
        const slots = TIME_SLOTS[shiftType];
        const abbrev = shiftAbbrev[shiftType] || shiftType;
        slots.forEach(slot => {
            html += `<th class="compact-header">${abbrev}<br>${slotAbbrev(slot)}</th>`;
        });
    });
    html += '</tr></thead><tbody>';

    // Add days
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(AppState.currentYear, AppState.currentMonth, day);
        const dayName = DAY_NAMES[date.getDay()];
        const dayAbbrev = dayName.substring(0, 2); // Lu, Ma, Me, Gi, Ve, Sa, Do
        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
        const dateKey = formatDate(AppState.currentYear, AppState.currentMonth, day);

        html += `<tr>`;
        html += `<td class="date-cell compact-date ${isWeekend ? 'weekend' : ''}">${day}<br><small>${dayAbbrev}</small></td>`;

        // Add shift cells
        SHIFT_TYPES.forEach(shiftType => {
            const slots = TIME_SLOTS[shiftType];
            slots.forEach(slot => {
                const shiftKey = `${dateKey}_${shiftType}_${slot}`;
                const assignedUserId = AppState.shifts[shiftKey] || '';
                // Check if EITHER the whole ambulatorio OR the individual slot is closed
                const ambulatoriKey = `${dateKey}_${shiftType}`;
                const isAmbulatorioClosedWhole = AppState.ambulatoriStatus[ambulatoriKey] === 'closed';
                const isIndividualSlotClosed = AppState.ambulatoriStatus[shiftKey] === 'closed';
                const isClosed = isAmbulatorioClosedWhole || isIndividualSlotClosed;

                let displayValue = '';
                // Only show assignments if user has permission
                if (canSeeShifts && assignedUserId) {
                    const user = AppState.users.find(u => u.id === assignedUserId);
                    displayValue = user ? (user.code || user.id.toUpperCase()) : assignedUserId.toUpperCase();
                }

                // Determine slot color class - handle slots with spaces
                const slotClass = slot.includes('MATT') || slot === '1' || slot === '2' || slot === '3' ? 'slot-matt' :
                                  slot.includes('POM') ? 'slot-pom' :
                                  slot === 'NTT' ? 'slot-ntt' :
                                  slot === 'GG' ? 'slot-gg' :
                                  slot === 'SS' || slot === 'SPEC' ? 'slot-spec' : '';

                const isEmpty = !displayValue && !isClosed;

                if (isClosed) {
                    html += `<td class="shift-cell closed compact-cell"></td>`;
                } else if (isEmpty) {
                    html += `<td class="shift-cell empty-cell compact-cell ${slotClass} ${isWeekend ? 'weekend-slot' : ''}"><div class="compact-shift-content"></div></td>`;
                } else {
                    html += `<td class="shift-cell compact-cell ${slotClass} ${isWeekend ? 'weekend-slot' : ''}"><div class="compact-shift-content">${displayValue}</div></td>`;
                }
            });
        });

        html += '</tr>';
    }

    html += '</tbody></table>';
    container.innerHTML = html;

    // Update approval UI
    updateApprovalUI();
}

function changeMonth(direction) {
    AppState.currentMonth += direction;
    if (AppState.currentMonth < 0) {
        AppState.currentMonth = 11;
        AppState.currentYear--;
    } else if (AppState.currentMonth > 11) {
        AppState.currentMonth = 0;
        AppState.currentYear++;
    }
    renderCalendar();
}

// ===========================
// Availability Management
// ===========================
function renderAvailabilityCalendar() {
    updateAvailabilityMonthSelector();
    updateDeadlineWarning();
    renderAvailabilityDays();
}

function updateAvailabilityMonthSelector() {
    const select = document.getElementById('availabilityMonth');
    const now = new Date();
    let html = '';

    // Next 3 months
    for (let i = 1; i <= 3; i++) {
        const month = (now.getMonth() + i) % 12;
        const year = now.getFullYear() + Math.floor((now.getMonth() + i) / 12);
        html += `<option value="${year}-${month}">${ITALIAN_MONTHS[month]} ${year}</option>`;
    }

    select.innerHTML = html;
    select.addEventListener('change', renderAvailabilityDays);
}

function updateDeadlineWarning() {
    const select = document.getElementById('availabilityMonth');
    const [year, month] = select.value.split('-').map(Number);
    const warningBox = document.getElementById('deadlineWarning');

    if (isDeadlinePassed(month, year)) {
        warningBox.innerHTML = '<strong>Attenzione:</strong> Il termine per modificare le indisponibilità è scaduto (20 del mese precedente).';
        warningBox.style.display = 'block';
    } else {
        const deadlineMonth = month === 0 ? 11 : month - 1;
        const deadlineYear = month === 0 ? year - 1 : year;
        warningBox.innerHTML = `Scadenza per ${ITALIAN_MONTHS[month]}: <strong>20 ${ITALIAN_MONTHS[deadlineMonth]} ${deadlineYear}</strong>`;
        warningBox.style.display = 'block';
    }
}

function renderAvailabilityDays() {
    const select = document.getElementById('availabilityMonth');
    const [year, month] = select.value.split('-').map(Number);
    const container = document.getElementById('availabilityCalendar');
    const daysInMonth = getDaysInMonth(year, month);
    const isPastDeadline = isDeadlinePassed(month, year);
    const userAvailabilityKey = `${AppState.currentUser.id}_${year}_${month}`;
    const unavailableSlots = AppState.availability[userAvailabilityKey] || {};

    let html = '<div class="availability-slots-grid">';

    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dayName = DAY_NAMES[date.getDay()];
        const dateKey = formatDate(year, month, day);
        const daySlots = unavailableSlots[dateKey] || {};
        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
        const disabledClass = isPastDeadline ? 'disabled' : '';

        html += `
            <div class="availability-day-card ${isWeekend ? 'weekend' : ''} ${disabledClass}">
                <div class="day-header ${!isPastDeadline ? 'clickable' : ''}" data-date="${dateKey}">
                    <span class="day-number">${day}</span>
                    <span class="day-name">${dayName}</span>
                </div>
                <div class="slot-toggles">
                    <button class="slot-toggle ${daySlots.mattina ? 'unavailable' : 'available'}"
                            data-date="${dateKey}"
                            data-slot="mattina"
                            ${isPastDeadline ? 'disabled' : ''}>
                        <span class="material-icons">${daySlots.mattina ? 'close' : 'check'}</span>
                        <span class="slot-label">Mattina</span>
                    </button>
                    <button class="slot-toggle ${daySlots.pomeriggio ? 'unavailable' : 'available'}"
                            data-date="${dateKey}"
                            data-slot="pomeriggio"
                            ${isPastDeadline ? 'disabled' : ''}>
                        <span class="material-icons">${daySlots.pomeriggio ? 'close' : 'check'}</span>
                        <span class="slot-label">Pomeriggio</span>
                    </button>
                    <button class="slot-toggle ${daySlots.notte ? 'unavailable' : 'available'}"
                            data-date="${dateKey}"
                            data-slot="notte"
                            ${isPastDeadline ? 'disabled' : ''}>
                        <span class="material-icons">${daySlots.notte ? 'close' : 'check'}</span>
                        <span class="slot-label">Notte</span>
                    </button>
                </div>
            </div>
        `;
    }

    html += '</div>';
    container.innerHTML = html;

    // Add click handlers for slot toggles
    if (!isPastDeadline) {
        document.querySelectorAll('.slot-toggle:not([disabled])').forEach(toggle => {
            toggle.addEventListener('click', () => {
                toggle.classList.toggle('unavailable');
                toggle.classList.toggle('available');
                const icon = toggle.querySelector('.material-icons');
                icon.textContent = toggle.classList.contains('unavailable') ? 'close' : 'check';
            });
        });

        // Add click handlers for day headers to toggle all slots
        document.querySelectorAll('.day-header.clickable').forEach(header => {
            header.addEventListener('click', () => {
                const dateKey = header.dataset.date;
                const dayCard = header.closest('.availability-day-card');
                const toggles = dayCard.querySelectorAll('.slot-toggle:not([disabled])');

                // Check if all are available or not
                const allUnavailable = Array.from(toggles).every(t => t.classList.contains('unavailable'));

                // Toggle all to opposite state
                toggles.forEach(toggle => {
                    if (allUnavailable) {
                        toggle.classList.remove('unavailable');
                        toggle.classList.add('available');
                        toggle.querySelector('.material-icons').textContent = 'check';
                    } else {
                        toggle.classList.remove('available');
                        toggle.classList.add('unavailable');
                        toggle.querySelector('.material-icons').textContent = 'close';
                    }
                });
            });
        });
    }

    updateDeadlineWarning();
}

function saveAvailability() {
    const select = document.getElementById('availabilityMonth');
    const [year, month] = select.value.split('-').map(Number);

    if (isDeadlinePassed(month, year)) {
        showToast('Non è possibile modificare le indisponibilità dopo la scadenza.', 'warning');
        return;
    }

    // Build slot-based unavailability object
    const unavailableSlots = {};
    document.querySelectorAll('.slot-toggle.unavailable').forEach(toggle => {
        const date = toggle.dataset.date;
        const slot = toggle.dataset.slot;
        if (!unavailableSlots[date]) {
            unavailableSlots[date] = {};
        }
        unavailableSlots[date][slot] = true;
    });

    const userAvailabilityKey = `${AppState.currentUser.id}_${year}_${month}`;
    AppState.availability[userAvailabilityKey] = unavailableSlots;
    saveToStorage('availability', AppState.availability);

    showToast('Indisponibilità salvate con successo!', 'success');

    // Refresh availability overview if it's currently active
    const overviewView = document.getElementById('availability-overviewView');
    if (overviewView && overviewView.classList.contains('active')) {
        renderAvailabilityOverviewGrid();
    }
}

// ===========================
// Users Management (Admin)
// ===========================
function renderUsersGrid() {
    const container = document.getElementById('usersGrid');
    let html = '';

    AppState.users.forEach(user => {
        const capabilitiesHtml = user.capabilities.slice(0, 6).map(cap =>
            `<span class="capability-tag">${cap}</span>`
        ).join('');

        const moreText = user.capabilities.length > 6 ?
            `<span class="capability-tag">+${user.capabilities.length - 6}</span>` : '';

        html += `
            <div class="user-card fade-in">
                <div class="user-card-header">
                    <div class="user-info">
                        <h3>${user.name}</h3>
                        <p class="user-id">@${user.id}</p>
                    </div>
                    <span class="user-role ${user.role}">${user.role}</span>
                </div>
                <p class="user-specialty">${user.specialty || 'Non specificata'}</p>
                <div class="user-capabilities">
                    <h4>Turni abilitati:</h4>
                    <div class="capability-tags">
                        ${capabilitiesHtml}
                        ${moreText}
                    </div>
                </div>
                <div class="user-actions">
                    <button class="btn btn-secondary" onclick="editUser('${user.id}')">
                        <span class="material-icons">edit</span>
                        Modifica
                    </button>
                    ${user.id !== AppState.currentUser.id ?
                        `<button class="btn btn-secondary" onclick="deleteUser('${user.id}')">
                            <span class="material-icons">delete</span>
                            Elimina
                        </button>` : ''}
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

function openAddUserModal() {
    document.getElementById('userModalTitle').textContent = 'Aggiungi Utente';
    document.getElementById('userForm').reset();
    document.getElementById('userForm').dataset.mode = 'add';

    // Populate shift capabilities checkboxes
    const container = document.getElementById('shiftCapabilities');
    let html = '';
    SHIFT_TYPES.forEach(shiftType => {
        html += `
            <label>
                <input type="checkbox" name="capability" value="${shiftType}">
                <span>${shiftType}</span>
            </label>
        `;
    });
    container.innerHTML = html;

    // Populate shift limits grid
    renderShiftLimitsGrid();

    openModal('userModal');
}

function renderShiftLimitsGrid(userLimits = {}) {
    const container = document.getElementById('shiftLimits');
    let html = '';

    SHIFT_TYPES.forEach(shiftType => {
        const limits = userLimits[shiftType] || { min: '', max: '' };
        html += `
            <div class="limit-row">
                <div class="limit-label">${shiftType}</div>
                <div class="limit-input-group">
                    <label>Min</label>
                    <input type="number" min="0"
                           class="limit-min"
                           data-shift="${shiftType}"
                           value="${limits.min}"
                           placeholder="0">
                </div>
                <div class="limit-input-group">
                    <label>Max</label>
                    <input type="number" min="0"
                           class="limit-max"
                           data-shift="${shiftType}"
                           value="${limits.max}"
                           placeholder="∞">
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

function editUser(userId) {
    const user = AppState.users.find(u => u.id === userId);
    if (!user) return;

    document.getElementById('userModalTitle').textContent = 'Modifica Utente';
    document.getElementById('userName').value = user.name;
    document.getElementById('userCode').value = user.code || '';
    document.getElementById('userIdInput').value = user.id;
    document.getElementById('userIdInput').disabled = true;
    document.getElementById('userRole').value = user.role;
    document.getElementById('userSpecialty').value = user.specialty || '';
    document.getElementById('userEmail').value = user.email || '';

    // Populate and check capabilities
    const container = document.getElementById('shiftCapabilities');
    let html = '';
    SHIFT_TYPES.forEach(shiftType => {
        const checked = user.capabilities.includes(shiftType) ? 'checked' : '';
        html += `
            <label>
                <input type="checkbox" name="capability" value="${shiftType}" ${checked}>
                <span>${shiftType}</span>
            </label>
        `;
    });
    container.innerHTML = html;

    // Populate shift limits grid with user's current limits
    renderShiftLimitsGrid(user.shiftLimits || {});

    document.getElementById('userForm').dataset.mode = 'edit';
    document.getElementById('userForm').dataset.userId = userId;
    openModal('userModal');
}

async function handleUserFormSubmit(e) {
    e.preventDefault();
    clearError('userFormError');

    const mode = e.target.dataset.mode;
    const name = sanitizeInput(document.getElementById('userName').value.trim());
    const code = sanitizeInput(document.getElementById('userCode').value.trim().toUpperCase());
    const userId = sanitizeInput(document.getElementById('userIdInput').value.toLowerCase().trim());
    const role = document.getElementById('userRole').value;
    const specialty = sanitizeInput(document.getElementById('userSpecialty').value.trim());
    const email = sanitizeInput(document.getElementById('userEmail').value.trim());
    const capabilities = Array.from(document.querySelectorAll('input[name="capability"]:checked'))
        .map(cb => cb.value);

    // Collect shift limits
    const shiftLimits = {};
    document.querySelectorAll('.limit-min').forEach(input => {
        const shiftType = input.dataset.shift;
        const min = input.value ? parseInt(input.value) : null;
        const maxInput = document.querySelector(`.limit-max[data-shift="${shiftType}"]`);
        const max = maxInput.value ? parseInt(maxInput.value) : null;

        if (min !== null || max !== null) {
            shiftLimits[shiftType] = { min: min || 0, max: max || null };
        }
    });

    if (!name || !userId) {
        showError('userFormError', 'Nome e ID sono obbligatori');
        return;
    }

    if (capabilities.length === 0) {
        showError('userFormError', 'Seleziona almeno un turno');
        return;
    }

    if (mode === 'add') {
        // Check if user already exists
        if (AppState.users.find(u => u.id === userId)) {
            showError('userFormError', 'Esiste già un utente con questo ID');
            return;
        }

        const newUser = {
            id: userId,
            name: name,
            code: code || userId.toUpperCase().substring(0, 5),
            role: role,
            specialty: specialty,
            email: email || null,
            password: null,
            capabilities: capabilities,
            shiftLimits: shiftLimits
        };

        AppState.users.push(newUser);
    } else {
        // Edit mode
        const userIndex = AppState.users.findIndex(u => u.id === e.target.dataset.userId);
        if (userIndex === -1) return;

        AppState.users[userIndex].name = name;
        AppState.users[userIndex].code = code || userId.toUpperCase().substring(0, 5);
        AppState.users[userIndex].role = role;
        AppState.users[userIndex].specialty = specialty;
        AppState.users[userIndex].email = email || null;
        AppState.users[userIndex].capabilities = capabilities;
        AppState.users[userIndex].shiftLimits = shiftLimits;

        // Update current user if editing self
        if (AppState.currentUser.id === e.target.dataset.userId) {
            AppState.currentUser = AppState.users[userIndex];
        }
    }

    saveToStorage('users', AppState.users);
    closeModal('userModal');
    renderUsersGrid();
    document.getElementById('userIdInput').disabled = false;
}

function deleteUser(userId) {
    if (!confirm('Sei sicuro di voler eliminare questo utente?')) return;

    const userIndex = AppState.users.findIndex(u => u.id === userId);
    if (userIndex === -1) return;

    AppState.users.splice(userIndex, 1);
    saveToStorage('users', AppState.users);
    renderUsersGrid();
}

// ===========================
// Shifts Management (Admin)
// ===========================
function renderShiftsManagement() {
    updateShiftMonthSelector();
    renderShiftsGrid();
}

function updateShiftMonthSelector() {
    const select = document.getElementById('shiftMonth');
    const now = new Date();
    let html = '';

    // Current month and next 3 months
    for (let i = 0; i <= 3; i++) {
        const month = (now.getMonth() + i) % 12;
        const year = now.getFullYear() + Math.floor((now.getMonth() + i) / 12);
        const selected = month === AppState.currentMonth && year === AppState.currentYear ? 'selected' : '';
        html += `<option value="${year}-${month}" ${selected}>${ITALIAN_MONTHS[month]} ${year}</option>`;
    }

    select.innerHTML = html;
    select.addEventListener('change', renderShiftsGrid);
}

function renderShiftsGrid() {
    const select = document.getElementById('shiftMonth');
    const [year, month] = select.value.split('-').map(Number);
    const container = document.getElementById('shiftsGrid');
    const daysInMonth = getDaysInMonth(year, month);

    // Create visual grid calendar
    let html = '<div class="visual-shift-calendar">';

    // Header with shift types
    html += '<div class="shift-calendar-header">';
    html += '<div class="shift-date-column">Data</div>';
    SHIFT_TYPES.forEach(shiftType => {
        html += `<div class="shift-column-header">${shiftType}</div>`;
    });
    html += '</div>';

    // Days grid
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dayName = DAY_NAMES[date.getDay()];
        const dateKey = formatDate(year, month, day);
        const isWeekend = date.getDay() === 0 || date.getDay() === 6;

        html += `<div class="shift-calendar-row ${isWeekend ? 'weekend-row' : ''}">`;
        html += `<div class="shift-date-cell">
            <div class="date-number">${day}</div>
            <div class="date-name">${dayName}</div>
        </div>`;

        SHIFT_TYPES.forEach(shiftType => {
            const slots = TIME_SLOTS[shiftType];
            const ambulatoriKey = `${dateKey}_${shiftType}`;

            // Weekend logic: only UTIC, PS, RAP are open by default
            const weekendAllowedTypes = ['UTIC', 'PS', 'RAP'];
            const isAutoClosedForWeekend = isWeekend && !weekendAllowedTypes.includes(shiftType);

            // Check if manually closed or auto-closed for weekend
            const isClosed = AppState.ambulatoriStatus[ambulatoriKey] === 'closed' || isAutoClosedForWeekend;
            const isAdmin = AppState.currentUser.role === 'admin';

            html += `<div class="shift-cell-container ${isClosed ? 'closed-cell' : ''}" data-ambulatori="${ambulatoriKey}">`;

            if (isClosed) {
                html += `
                    <div class="closed-indicator">
                        <span class="material-icons">block</span>
                        <span>CHIUSO</span>
                    </div>
                    ${isAdmin ? `<button class="toggle-ambulatori-btn" onclick="toggleAmbulatorio('${ambulatoriKey}', false)">
                        <span class="material-icons">lock_open</span>
                    </button>` : ''}
                `;
            } else {
                html += `<div class="shift-slots">`;

                slots.forEach(slot => {
                    const shiftKey = `${dateKey}_${shiftType}_${slot}`;
                    const slotKey = shiftKey; // Individual slot key for closing
                    const assignedUserId = AppState.shifts[shiftKey] || '';
                    const assignedUser = assignedUserId ? AppState.users.find(u => u.id === assignedUserId) : null;

                    // Check if this individual slot is closed
                    const isSlotClosed = AppState.ambulatoriStatus[slotKey] === 'closed';

                    const isUnavailable = assignedUser ? isUserUnavailableForSlot(assignedUserId, dateKey, slot) : false;
                    const canWork = assignedUser ? assignedUser.capabilities.includes(shiftType) : true;

                    const hasError = assignedUser && (!canWork || isUnavailable);
                    const colorClass = assignedUser ? getColorForUser(assignedUserId) : '';
                    const userCode = assignedUser ? (assignedUser.code || assignedUser.id.toUpperCase()) : '';

                    const isAdmin = AppState.currentUser.role === 'admin';
                    // Fix slot type class - replace spaces with hyphens for valid CSS
                    const slotTypeClass = `slot-type-${slot.toLowerCase().replace(/\s+/g, '-')}`;

                    if (isSlotClosed) {
                        // Render closed slot
                        html += `
                            <div class="shift-slot closed-slot ${slotTypeClass}">
                                <div class="slot-time">${slot}</div>
                                <div class="closed-indicator-small">
                                    <span class="material-icons">block</span>
                                </div>
                                ${isAdmin ? `<button class="toggle-slot-btn" onclick="event.stopPropagation(); toggleAmbulatorio('${slotKey}', false);" title="Riapri slot">
                                    <span class="material-icons">lock_open</span>
                                </button>` : ''}
                            </div>
                        `;
                    } else {
                        // Render open slot
                        html += `
                            <div class="shift-slot ${assignedUser ? 'assigned' : 'empty'} ${hasError ? 'has-error' : ''} ${colorClass} ${slotTypeClass} ${!isAdmin ? 'read-only' : ''}"
                                 ${isAdmin ? `onclick="openShiftModal('${shiftKey}', '${shiftType}', '${dateKey}', '${slot}')"` : ''}>
                                <div class="slot-time">${slot}</div>
                                ${assignedUser ? `
                                    <div class="assigned-person">
                                        <div class="person-name">${userCode}</div>
                                        ${hasError ? '<span class="material-icons error-icon" title="Attenzione">warning</span>' : ''}
                                    </div>
                                ` : `
                                    <div class="empty-slot-indicator">
                                        <span class="material-icons">person_add</span>
                                        <span>Assegna</span>
                                    </div>
                                `}
                                ${isAdmin ? `<button class="toggle-slot-btn close-slot" onclick="event.stopPropagation(); toggleAmbulatorio('${slotKey}', true);" title="Chiudi slot">
                                    <span class="material-icons">lock</span>
                                </button>` : ''}
                            </div>
                        `;
                    }
                });

                html += `</div>`;
                if (isAdmin) {
                    html += `<button class="toggle-ambulatori-btn close" onclick="toggleAmbulatorio('${ambulatoriKey}', true)">
                        <span class="material-icons">lock</span>
                    </button>`;
                }
            }

            html += `</div>`;
        });

        html += '</div>';
    }

    html += '</div>';
    container.innerHTML = html;
}

// Helper functions for visual calendar
function getColorForUser(userId) {
    const colors = ['color-1', 'color-2', 'color-3', 'color-4', 'color-5', 'color-6', 'color-7', 'color-8'];
    const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
}

function getInitials(name) {
    return name.split(' ')
        .map(word => word[0])
        .filter((_, i, arr) => i === 0 || i === arr.length - 1)
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

function getShortName(name) {
    const parts = name.split(' ');
    if (parts.length === 1) return name;
    const lastName = parts[parts.length - 1];
    return lastName.length > 10 ? lastName.slice(0, 10) + '.' : lastName;
}

function openShiftModal(shiftKey, shiftType, dateKey, slot) {
    // Only allow admins to edit shifts
    if (AppState.currentUser.role !== 'admin') {
        return;
    }

    const [year, month, day] = dateKey.split('-').map(Number);
    const modal = document.getElementById('shiftAssignModal') || createShiftAssignModal();

    const assignedUserId = AppState.shifts[shiftKey] || '';

    let html = `
        <div class="assign-modal-header">
            <h3>Assegna Turno</h3>
            <div class="assign-modal-info">
                <span><strong>${shiftType}</strong> - ${slot}</span>
                <span>${day}/${month + 1}/${year}</span>
            </div>
        </div>
        <div class="user-selection-grid">
    `;

    // Sort users: available and enabled first
    const sortedUsers = [...AppState.users].sort((a, b) => {
        const aCanWork = a.capabilities.includes(shiftType);
        const aUnavailable = isUserUnavailableForSlot(a.id, dateKey, slot);
        const aScore = (aCanWork ? 2 : 0) + (aUnavailable ? 0 : 1);

        const bCanWork = b.capabilities.includes(shiftType);
        const bUnavailable = isUserUnavailableForSlot(b.id, dateKey, slot);
        const bScore = (bCanWork ? 2 : 0) + (bUnavailable ? 0 : 1);

        return bScore - aScore; // Higher score first
    });

    sortedUsers.forEach(user => {
        const canWork = user.capabilities.includes(shiftType);
        const isUnavailable = isUserUnavailableForSlot(user.id, dateKey, slot);
        const isSelected = assignedUserId === user.id;
        const colorClass = getColorForUser(user.id);

        const userCode = user.code || user.id.toUpperCase();
        html += `
            <div class="user-select-card ${!canWork || isUnavailable ? 'disabled' : ''} ${isSelected ? 'selected' : ''} ${colorClass}"
                 onclick="selectUserForShift('${shiftKey}', '${user.id}')">
                <div class="user-avatar-large">${userCode}</div>
                <div class="user-select-info">
                    <div class="user-select-name">${userCode}</div>
                    <div class="user-select-specialty">${user.specialty}</div>
                </div>
                ${!canWork ? '<span class="badge badge-error">Non abilitato</span>' : ''}
                ${isUnavailable ? '<span class="badge badge-warning">Non disponibile</span>' : ''}
                ${isSelected ? '<span class="material-icons check-icon">check_circle</span>' : ''}
                ${!canWork || isUnavailable ? '<span class="badge badge-info" style="background: #2196f3;">Override</span>' : ''}
            </div>
        `;
    });

    html += `</div>`;
    html += `
        <div class="modal-actions">
            <button class="btn btn-secondary" onclick="closeModal('shiftAssignModal')">Annulla</button>
            <button class="btn btn-primary" onclick="clearShift('${shiftKey}')">
                <span class="material-icons">clear</span>
                Rimuovi Assegnazione
            </button>
        </div>
    `;

    modal.querySelector('.modal-content').innerHTML = html;
    modal.classList.add('active');
}

function createShiftAssignModal() {
    const modal = document.createElement('div');
    modal.id = 'shiftAssignModal';
    modal.className = 'modal';
    modal.innerHTML = '<div class="modal-content modal-large"></div>';
    document.body.appendChild(modal);

    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal('shiftAssignModal');
    });

    return modal;
}

function selectUserForShift(shiftKey, userId) {
    // Parse shift key to get details
    // shiftKey format: "2025-11-15_SALA Senior_MATT"
    const parts = shiftKey.split('_');
    const dateKey = parts[0]; // Date is already formatted: "2025-11-15"
    const shiftType = parts.slice(1, -1).join('_'); // Join middle parts for multi-word shift types
    const slot = parts[parts.length - 1];

    const user = AppState.users.find(u => u.id === userId);
    if (!user) {
        assignShift(shiftKey, userId);
        closeModal('shiftAssignModal');
        renderShiftsGrid();
        renderCalendar(); // Also update calendar view
        return;
    }

    // Check if this is an override case - ONLY show warning for greyed out users
    const canWork = user.capabilities.includes(shiftType);
    const isUnavailable = isUserUnavailableForSlot(userId, dateKey, slot);

    // ONLY show warning if user is greyed out (not capable OR unavailable)
    if (!canWork || isUnavailable) {
        const userCode = user.code || user.id.toUpperCase();
        let warningMessages = [];

        // Specific warning messages based on the reason
        if (!canWork) {
            warningMessages.push(`❌ Questo utente non è abilitato al turno "${shiftType}"`);
        }
        if (isUnavailable) {
            warningMessages.push(`⚠️ Questo utente ha inserito indisponibilità per questo orario`);
        }

        const warning = `ATTENZIONE - Override necessario per ${userCode}:\n\n` +
                       warningMessages.join('\n') +
                       '\n\nVuoi procedere comunque con l\'assegnazione?';

        if (!confirm(warning)) {
            return;
        }

        // Log override action
        console.log(`Override: Assigning ${userCode} to ${shiftType} on ${dateKey} despite restrictions`);
        showToast(`Assegnazione forzata: ${userCode} assegnato con override`, 'warning', 5000);
    } else {
        // Normal assignment - no warning needed
        showToast(`${user.code || user.id.toUpperCase()} assegnato correttamente`, 'success');
    }

    assignShift(shiftKey, userId);
    closeModal('shiftAssignModal');
    renderShiftsGrid();
    renderCalendar(); // Also update calendar view
}

function clearShift(shiftKey) {
    delete AppState.shifts[shiftKey];
    saveToStorage('shifts', AppState.shifts);
    closeModal('shiftAssignModal');
    renderShiftsGrid();
}

function toggleAmbulatorio(ambulatoriKey, isClosed) {
    // Only allow admins to toggle ambulatori
    if (AppState.currentUser.role !== 'admin') {
        return;
    }

    // Prevent closing Reparto (RAP) - it can never be closed
    if (ambulatoriKey.includes('_RAP') && isClosed) {
        showToast('REPARTO non può mai essere chiuso', 'error');
        return;
    }

    if (isClosed) {
        AppState.ambulatoriStatus[ambulatoriKey] = 'closed';
    } else {
        delete AppState.ambulatoriStatus[ambulatoriKey];
    }
    saveToStorage('ambulatoriStatus', AppState.ambulatoriStatus);
    renderShiftsGrid();
}

function assignShift(shiftKey, userId) {
    if (userId) {
        AppState.shifts[shiftKey] = userId;
    } else {
        delete AppState.shifts[shiftKey];
    }
    saveToStorage('shifts', AppState.shifts);

    // Validate assignment
    validateShiftAssignment(shiftKey, userId);
}

function validateShiftAssignment(shiftKey, userId) {
    if (!userId) return true;

    const [dateKey, shiftType, slot] = shiftKey.split('_');
    const user = AppState.users.find(u => u.id === userId);
    const element = document.getElementById(`shift_${shiftKey}`);

    if (!element) return true;

    // Check if user can work this shift type
    if (!user.capabilities.includes(shiftType)) {
        element.classList.add('error');
        const tooltip = document.createElement('div');
        tooltip.className = 'error-tooltip';
        tooltip.textContent = 'Utente non abilitato per questo turno';
        element.appendChild(tooltip);
        return false;
    }

    // Check availability
    if (isUserUnavailableForSlot(userId, dateKey, slot)) {
        element.classList.add('error');
        const tooltip = document.createElement('div');
        tooltip.className = 'error-tooltip';
        tooltip.textContent = 'Utente non disponibile';
        element.appendChild(tooltip);
        return false;
    }

    element.classList.remove('error');
    const existingTooltip = element.querySelector('.error-tooltip');
    if (existingTooltip) existingTooltip.remove();
    return true;
}

// ===========================
// Auto Assignment (Admin)
// ===========================
function renderAutoAssign() {
    updateAutoAssignMonthSelector();
}

function toggleAdvancedOptions() {
    const content = document.getElementById('advancedOptionsContent');
    const icon = document.getElementById('advancedExpandIcon');

    if (content.style.display === 'none') {
        content.style.display = 'block';
        icon.textContent = 'expand_less';
    } else {
        content.style.display = 'none';
        icon.textContent = 'expand_more';
    }
}

function updateAutoAssignMonthSelector() {
    const select = document.getElementById('autoAssignMonth');
    const now = new Date();
    let html = '';

    for (let i = 0; i <= 3; i++) {
        const month = (now.getMonth() + i) % 12;
        const year = now.getFullYear() + Math.floor((now.getMonth() + i) / 12);
        html += `<option value="${year}-${month}">${ITALIAN_MONTHS[month]} ${year}</option>`;
    }

    select.innerHTML = html;
}

// Helper function to count user's shifts of a specific type in a month
function countUserShifts(userId, shiftType, year, month) {
    let count = 0;
    const daysInMonth = getDaysInMonth(year, month);

    for (let day = 1; day <= daysInMonth; day++) {
        const dateKey = formatDate(year, month, day);
        const slots = TIME_SLOTS[shiftType];

        slots.forEach(slot => {
            const shiftKey = `${dateKey}_${shiftType}_${slot}`;
            if (AppState.shifts[shiftKey] === userId) {
                count++;
            }
        });
    }

    return count;
}

// Helper function to check if user has reached their shift limits
function hasReachedShiftLimit(userId, shiftType, year, month) {
    const user = AppState.users.find(u => u.id === userId);
    if (!user || !user.shiftLimits || !user.shiftLimits[shiftType]) {
        return false; // No limits set
    }

    const limits = user.shiftLimits[shiftType];
    const currentCount = countUserShifts(userId, shiftType, year, month);

    // Check max limit
    if (limits.max !== null && currentCount >= limits.max) {
        return true;
    }

    return false;
}

// Helper function to check if user had night shift previous day
function hadNightShiftPreviousDay(userId, dateKey) {
    const [year, month, day] = dateKey.split('-').map(Number);
    if (day === 1) return false; // First day of month, no previous day to check

    const previousDay = day - 1;
    const previousDateKey = formatDate(year, month, previousDay);

    // Check all night shifts (NTT) from previous day
    const nightShifts = ['NTT'];
    return SHIFT_TYPES.some(shiftType => {
        const slots = TIME_SLOTS[shiftType];
        return slots.some(slot => {
            if (nightShifts.some(ns => slot.includes(ns))) {
                const shiftKey = `${previousDateKey}_${shiftType}_${slot}`;
                return AppState.shifts[shiftKey] === userId;
            }
            return false;
        });
    });
}

// Helper function to check if night shift on same day has REP-capable emodinamista
function hasREPCapableNightShift(dateKey) {
    // Check if PS or RAP night shift (NTT) is assigned to REP-capable emodinamista
    const nightShiftTypes = ['PS', 'RAP'];
    return nightShiftTypes.some(shiftType => {
        const slots = TIME_SLOTS[shiftType];
        return slots.some(slot => {
            if (slot === 'NTT') {
                const shiftKey = `${dateKey}_${shiftType}_${slot}`;
                const assignedUserId = AppState.shifts[shiftKey];
                if (assignedUserId) {
                    const assignedUser = AppState.users.find(u => u.id === assignedUserId);
                    return assignedUser && assignedUser.canDoREP === true;
                }
            }
            return false;
        });
    });
}

function runAutoAssignment() {
    const select = document.getElementById('autoAssignMonth');
    const [year, month] = select.value.split('-').map(Number);
    const resultsContainer = document.getElementById('autoAssignResults');

    // Get generation options
    const assignMode = document.querySelector('input[name="assignMode"]:checked').value;
    const fillRemainingOnly = assignMode === 'remaining';

    // Get selected shift types
    const selectedTypes = [];
    if (document.getElementById('assignSALA').checked) {
        selectedTypes.push('SALA Senior', 'SALA Junior');
    }
    if (document.getElementById('assignREPARTO').checked) {
        selectedTypes.push('REPARTO');
    }
    if (document.getElementById('assignUTICPS') && document.getElementById('assignUTICPS').checked) {
        selectedTypes.push('UTIC', 'PS');
    }
    if (document.getElementById('assignRAP') && document.getElementById('assignRAP').checked) {
        selectedTypes.push('RAP');
    }
    if (document.getElementById('assignECO').checked) {
        selectedTypes.push('ECO 206', 'ECO spec 204', 'ECO INT');
    }
    if (document.getElementById('assignVISITE') && document.getElementById('assignVISITE').checked) {
        selectedTypes.push('VIS 201', 'VISITE 208', 'TDS 207', 'ECOTT 205');
    }
    if (document.getElementById('assignOthers').checked) {
        selectedTypes.push('ENI', 'CARDIOCHIR', 'Vicenza', 'Ricerca', 'RISERVE');
    }

    if (selectedTypes.length === 0) {
        resultsContainer.innerHTML = '<div class="error-message active">Seleziona almeno una tipologia di turni da generare.</div>';
        return;
    }

    // Show progress indicator
    const progressContainer = document.getElementById('autoAssignProgress');
    const progressMessage = document.getElementById('progressMessage');
    const progressBarFill = document.getElementById('progressBarFill');
    resultsContainer.innerHTML = '';
    progressContainer.style.display = 'block';

    // Simulate progress updates
    let progress = 0;
    const progressInterval = setInterval(() => {
        progress += 10;
        progressBarFill.style.width = `${Math.min(progress, 90)}%`;

        if (progress === 20) {
            progressMessage.textContent = 'Verifica disponibilità utenti...';
        } else if (progress === 40) {
            progressMessage.textContent = 'Applicazione regole di assegnazione...';
        } else if (progress === 60) {
            progressMessage.textContent = 'Bilanciamento carichi di lavoro...';
        } else if (progress === 80) {
            progressMessage.textContent = 'Finalizzazione assegnazioni...';
        }
    }, 100);

    // Enhanced auto-assignment algorithm with shift rules
    setTimeout(() => {
        clearInterval(progressInterval);
        progressBarFill.style.width = '100%';
        progressMessage.textContent = 'Completato!';
        const daysInMonth = getDaysInMonth(year, month);
        let assignedCount = 0;
        let errorCount = 0;
        const errors = [];

        // If in "all" mode, clear existing assignments for selected shift types
        if (!fillRemainingOnly) {
            for (let day = 1; day <= daysInMonth; day++) {
                const dateKey = formatDate(year, month, day);
                selectedTypes.forEach(shiftType => {
                    const slots = TIME_SLOTS[shiftType];
                    if (slots) {
                        slots.forEach(slot => {
                            const shiftKey = `${dateKey}_${shiftType}_${slot}`;
                            delete AppState.shifts[shiftKey];
                        });
                    }
                });
            }
            saveToStorage('shifts', AppState.shifts);
        }

        // Process shifts in specific order: NTT first, then other shifts
        // This allows us to check REP rules properly
        const shiftOrder = ['PS', 'RAP', ...SHIFT_TYPES.filter(st => st !== 'PS' && st !== 'RAP')];

        // Filter shift order based on selected types
        const filteredShiftOrder = shiftOrder.filter(st => selectedTypes.includes(st));

        for (let day = 1; day <= daysInMonth; day++) {
            const dateKey = formatDate(year, month, day);
            const date = new Date(year, month, day);
            const dayOfWeek = date.getDay(); // 0=Sunday, 5=Friday, 6=Saturday
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

            filteredShiftOrder.forEach(shiftType => {
                const ambulatoriKey = `${dateKey}_${shiftType}`;

                // Weekend logic: only UTIC, PS, RAP are open by default
                const weekendAllowedTypes = ['UTIC', 'PS', 'RAP'];
                const isAutoClosedForWeekend = isWeekend && !weekendAllowedTypes.includes(shiftType);

                if (AppState.ambulatoriStatus[ambulatoriKey] === 'closed' || isAutoClosedForWeekend) return;

                const slots = TIME_SLOTS[shiftType];

                // Process NTT (night) slots first
                const sortedSlots = [...slots].sort((a, b) => {
                    if (a === 'NTT') return -1;
                    if (b === 'NTT') return 1;
                    return 0;
                });

                sortedSlots.forEach(slot => {
                    const shiftKey = `${dateKey}_${shiftType}_${slot}`;

                    // Skip if already assigned (in "remaining" mode, slots were already cleared in "all" mode)
                    if (AppState.shifts[shiftKey]) return;

                    // RULE 3: REP weekend continuity (Friday 8pm to Monday 8am)
                    // Same emodinamista for Friday NTT, Saturday GG+NTT, Sunday GG+NTT
                    let weekendREPUser = null;
                    if (shiftType === 'RAP' && (dayOfWeek === 5 || dayOfWeek === 6 || dayOfWeek === 0)) {
                        // Check if Friday night RAP is already assigned
                        if (dayOfWeek === 6 || dayOfWeek === 0) { // Saturday or Sunday
                            const fridayDate = new Date(year, month, day - (dayOfWeek === 6 ? 1 : 2));
                            const fridayKey = formatDate(fridayDate.getFullYear(), fridayDate.getMonth(), fridayDate.getDate());
                            const fridayNightKey = `${fridayKey}_RAP_NTT`;
                            if (AppState.shifts[fridayNightKey]) {
                                weekendREPUser = AppState.shifts[fridayNightKey];
                            }
                        }
                    }

                    // RULE 4: UTIC weekend consistency (same person for MATT and POM on weekends)
                    let weekendUTICUser = null;
                    if (shiftType === 'UTIC' && isWeekend && slot === 'POM') {
                        // Check if MATT is already assigned
                        const mattKey = `${dateKey}_UTIC_MATT`;
                        if (AppState.shifts[mattKey]) {
                            weekendUTICUser = AppState.shifts[mattKey];
                        }
                    }

                    // Find available users with enhanced filtering
                    let availableUsers = AppState.users.filter(user => {
                        // Must have capability for this shift type
                        if (!user.capabilities.includes(shiftType)) return false;

                        // Must not be unavailable for this slot
                        if (isUserUnavailableForSlot(user.id, dateKey, slot)) return false;

                        // Must not have reached shift limit for this type
                        if (hasReachedShiftLimit(user.id, shiftType, year, month)) return false;

                        // RULE 1: No shifts the day after night shift
                        if (hadNightShiftPreviousDay(user.id, dateKey)) return false;

                        // RULE 2: REP (RAP) assignment logic
                        if (shiftType === 'RAP') {
                            // If user can do REP, they're eligible
                            if (user.canDoREP) return true;

                            // If night shift has REP-capable emodinamista, clinici can also do RAP
                            if (hasREPCapableNightShift(dateKey)) {
                                return user.specialty === 'Cardiologo';
                            }

                            // Otherwise, only REP-capable users
                            return false;
                        }

                        return true;
                    });

                    // Apply weekend continuity rules
                    if (weekendREPUser) {
                        const preferredUser = AppState.users.find(u => u.id === weekendREPUser);
                        if (preferredUser && availableUsers.includes(preferredUser)) {
                            availableUsers = [preferredUser]; // Force same user
                        }
                    }

                    if (weekendUTICUser) {
                        const preferredUser = AppState.users.find(u => u.id === weekendUTICUser);
                        if (preferredUser && availableUsers.includes(preferredUser)) {
                            availableUsers = [preferredUser]; // Force same user
                        }
                    }

                    // ENHANCED LOAD BALANCING (Option A): Balance per ambulatorio + overall
                    // This ensures even distribution within each ambulatorio type
                    availableUsers.sort((a, b) => {
                        // Count total shifts for each user
                        const aTotalCount = Object.values(AppState.shifts).filter(id => id === a.id).length;
                        const bTotalCount = Object.values(AppState.shifts).filter(id => id === b.id).length;

                        // Count shifts in THIS SPECIFIC ambulatorio for each user
                        let aAmbulatoriCount = 0;
                        let bAmbulatoriCount = 0;

                        Object.keys(AppState.shifts).forEach(key => {
                            const parts = key.split('_');
                            if (parts.length >= 4) {
                                const keyShiftType = parts.slice(3, -1).join('_');
                                if (keyShiftType === shiftType) {
                                    if (AppState.shifts[key] === a.id) aAmbulatoriCount++;
                                    if (AppState.shifts[key] === b.id) bAmbulatoriCount++;
                                }
                            }
                        });

                        // PRIORITY 1: Ambulatorio-specific balance (most important)
                        // Prefer users with fewer shifts in this specific ambulatorio
                        const ambulatorioDiff = aAmbulatoriCount - bAmbulatoriCount;
                        if (ambulatorioDiff !== 0) {
                            return ambulatorioDiff;
                        }

                        // PRIORITY 2: Overall balance (secondary)
                        // If ambulatorio count is equal, prefer user with fewer total shifts
                        const totalDiff = aTotalCount - bTotalCount;
                        if (totalDiff !== 0) {
                            return totalDiff;
                        }

                        // PRIORITY 3: Randomization (for fairness when all else equal)
                        // Add randomness to avoid always picking the same user
                        return Math.random() - 0.5;
                    });

                    if (availableUsers.length > 0) {
                        // Assign user with fewest shifts (balanced distribution)
                        const selectedUser = availableUsers[0];
                        AppState.shifts[shiftKey] = selectedUser.id;
                        assignedCount++;
                    } else {
                        errorCount++;
                        errors.push(`${dateKey} - ${shiftType} (${slot}): Nessun utente disponibile`);
                    }
                });
            });
        }

        saveToStorage('shifts', AppState.shifts);

        // Calculate statistics by user (for this month only)
        const userStats = {};
        AppState.users.forEach(user => {
            userStats[user.id] = {
                name: user.name,
                code: user.code || user.id.toUpperCase(),
                total: 0,
                byType: {}
            };
        });

        // Count shifts only for the generated month
        Object.keys(AppState.shifts).forEach(shiftKey => {
            const userId = AppState.shifts[shiftKey];
            const parts = shiftKey.split('_');
            // Check if shift belongs to current month (parts[0] = year-month-day)
            if (parts.length >= 4 && parts[0]) {
                const [shiftYear, shiftMonth] = parts[0].split('-').map(Number);
                if (shiftYear === year && shiftMonth === month) {
                    const shiftType = parts.slice(3, -1).join('_');
                    if (userStats[userId]) {
                        userStats[userId].total++;
                        userStats[userId].byType[shiftType] = (userStats[userId].byType[shiftType] || 0) + 1;
                    }
                }
            }
        });

        // Sort users by total shifts (show all users, even with 0 shifts)
        const sortedUsers = Object.values(userStats).sort((a, b) => b.total - a.total);

        // Calculate success rate
        const totalAttempted = assignedCount + errorCount;
        const successRate = totalAttempted > 0 ? Math.round((assignedCount / totalAttempted) * 100) : 0;

        // Hide progress, show results
        setTimeout(() => {
            progressContainer.style.display = 'none';

            let html = `
                <div class="results-card success">
                    <div class="results-header">
                        <span class="material-icons">check_circle</span>
                        <h3>Generazione Completata</h3>
                    </div>
                    <div class="results-stats">
                        <div class="stat-card">
                            <div class="stat-icon success">
                                <span class="material-icons">event_available</span>
                            </div>
                            <div class="stat-info">
                                <div class="stat-value">${assignedCount}</div>
                                <div class="stat-label">Turni Assegnati</div>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon ${errorCount > 0 ? 'warning' : 'success'}">
                                <span class="material-icons">${errorCount > 0 ? 'warning' : 'check'}</span>
                            </div>
                            <div class="stat-info">
                                <div class="stat-value">${errorCount}</div>
                                <div class="stat-label">Turni Non Assegnati</div>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon success">
                                <span class="material-icons">analytics</span>
                            </div>
                            <div class="stat-info">
                                <div class="stat-value">${successRate}%</div>
                                <div class="stat-label">Tasso di Successo</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="results-card">
                    <div class="results-header">
                        <span class="material-icons">people</span>
                        <h3>Distribuzione per Utente</h3>
                    </div>
                    <div class="distribution-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>Utente</th>
                                    <th>Totale Turni</th>
                                    <th>Distribuzione</th>
                                </tr>
                            </thead>
                            <tbody>
            `;

            // Show top 15 users (or all if less than 15)
            const usersToShow = sortedUsers.slice(0, 15);
            const maxTotal = Math.max(...sortedUsers.map(u => u.total), 1); // Avoid division by zero

            usersToShow.forEach(user => {
                const barWidth = maxTotal > 0 ? (user.total / maxTotal) * 100 : 0;

                html += `
                    <tr>
                        <td><strong>${user.code}</strong></td>
                        <td>${user.total}</td>
                        <td>
                            <div class="distribution-bar">
                                <div class="distribution-fill" style="width: ${barWidth}%"></div>
                                <span class="distribution-label">${user.total} turni</span>
                            </div>
                        </td>
                    </tr>
                `;
            });

            html += `
                            </tbody>
                        </table>
                    </div>
                </div>
            `;

            if (errors.length > 0 && errors.length <= 20) {
                html += `
                    <div class="results-card warning">
                        <div class="results-header">
                            <span class="material-icons">warning</span>
                            <h3>Turni Non Assegnati</h3>
                        </div>
                        <div class="error-list">
                            <ul>
                `;
                errors.forEach(error => {
                    html += `<li>${error}</li>`;
                });
                html += `
                            </ul>
                        </div>
                    </div>
                `;
            } else if (errors.length > 20) {
                html += `
                    <div class="results-card warning">
                        <div class="results-header">
                            <span class="material-icons">warning</span>
                            <h3>Attenzione</h3>
                        </div>
                        <p>${errorCount} turni non possono essere assegnati per mancanza di personale disponibile.</p>
                    </div>
                `;
            }

            html += `
                <div class="action-buttons">
                    <button class="btn btn-secondary" onclick="switchView('calendar')">
                        <span class="material-icons">calendar_today</span>
                        Visualizza Calendario
                    </button>
                    <button class="btn btn-primary" onclick="switchView('shifts')">
                        <span class="material-icons">edit</span>
                        Modifica Turni
                    </button>
                </div>
            `;

            resultsContainer.innerHTML = html;
        }, 500);
    }, 500);
}

// ===========================
// PDF Export
// ===========================
let currentExportType = 'pdf'; // Track whether user clicked PDF or Excel

function openPdfModal() {
    currentExportType = 'pdf';
    openExportModal();
}

function openExcelModal() {
    currentExportType = 'excel';
    openExportModal();
}

function openExportModal() {
    const select = document.getElementById('pdfMonth');
    const now = new Date();
    let html = '';

    for (let i = 0; i <= 3; i++) {
        const month = (now.getMonth() + i) % 12;
        const year = now.getFullYear() + Math.floor((now.getMonth() + i) / 12);
        const selected = month === AppState.currentMonth && year === AppState.currentYear ? 'selected' : '';
        html += `<option value="${year}-${month}" ${selected}>${ITALIAN_MONTHS[month]} ${year}</option>`;
    }

    select.innerHTML = html;

    // Update modal title and button text
    const title = document.getElementById('exportModalTitle');
    const submitText = document.getElementById('exportSubmitText');
    if (currentExportType === 'pdf') {
        title.textContent = 'Esporta PDF';
        submitText.textContent = 'Scarica PDF';
    } else {
        title.textContent = 'Esporta Excel';
        submitText.textContent = 'Scarica Excel';
    }

    openModal('pdfModal');
}

function handlePdfExport(e) {
    e.preventDefault();

    const select = document.getElementById('pdfMonth');
    const [year, month] = select.value.split('-').map(Number);
    const exportType = document.querySelector('input[name="pdfType"]:checked').value;

    if (currentExportType === 'pdf') {
        generatePDF(year, month, exportType);
    } else {
        generateExcel(year, month, exportType);
    }

    closeModal('pdfModal');
}

function generatePDF(year, month, type) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('landscape', 'mm', 'a4');

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Header background
    doc.setFillColor(198, 40, 40);
    doc.rect(0, 0, pageWidth, 25, 'F');

    // Add icon on the left
    const img = new Image();
    img.src = 'icon.jpg';
    try {
        doc.addImage(img, 'JPEG', 8, 5, 15, 15);
    } catch (e) {
        console.log('Icon not loaded for PDF');
    }

    // Title on the right
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text(`Turni ${ITALIAN_MONTHS[month]} ${year}`, pageWidth - 15, 12, { align: 'right' });

    // Type indicator
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    const typeText = type === 'draft' ? 'BOZZA' : 'DEFINITIVO';
    doc.text(typeText, pageWidth - 15, 19, { align: 'right' });

    // Reset text color
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);

    // Prepare table data
    const daysInMonth = getDaysInMonth(year, month);
    const tableData = [];

    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dayName = DAY_NAMES[date.getDay()];
        const dateKey = formatDate(year, month, day);

        const row = [`${day} ${dayName}`];

        // Add assignments for each shift type (showing only first few to fit in 2 pages)
        const mainShifts = ['SALA Senior', 'SALA Junior', 'REPARTO', 'UTIC', 'PS', 'ECO 206'];
        mainShifts.forEach(shiftType => {
            const slots = TIME_SLOTS[shiftType];
            const ambulatoriKey = `${dateKey}_${shiftType}`;

            if (AppState.ambulatoriStatus[ambulatoriKey] === 'closed') {
                row.push('CHIUSO');
            } else {
                const assignments = slots.map(slot => {
                    const shiftKey = `${dateKey}_${shiftType}_${slot}`;
                    const userId = AppState.shifts[shiftKey];
                    if (!userId) return '-';
                    const user = AppState.users.find(u => u.id === userId);
                    return user ? (user.code || user.id.toUpperCase()) : '-';
                }).join('\n');
                row.push(assignments || '-');
            }
        });

        tableData.push(row);
    }

    const headers = ['Data', 'SALA Sr', 'SALA Jr', 'REPARTO', 'UTIC', 'PS', 'ECO 206'];

    doc.autoTable({
        head: [headers],
        body: tableData,
        startY: 28,
        theme: 'grid',
        styles: {
            fontSize: 6,
            cellPadding: 1,
            lineWidth: 0.1
        },
        headStyles: {
            fillColor: [97, 97, 97],
            textColor: 255,
            fontStyle: 'bold',
            fontSize: 7
        },
        columnStyles: {
            0: { cellWidth: 18, fontStyle: 'bold' }
        },
        margin: { left: 8, right: 8, top: 28, bottom: 15 },
        didDrawPage: function(data) {
            // Footer
            doc.setFontSize(7);
            doc.setTextColor(128);
            doc.text(
                `Generato il ${new Date().toLocaleDateString('it-IT')}`,
                pageWidth / 2,
                pageHeight - 8,
                { align: 'center' }
            );
        }
    });

    // Save PDF
    doc.save(`turni_${ITALIAN_MONTHS[month]}_${year}_${type}.pdf`);
}

function generateExcel(year, month, type) {
    const wb = XLSX.utils.book_new();
    const daysInMonth = getDaysInMonth(year, month);
    const typeText = type === 'draft' ? 'BOZZA' : 'DEFINITIVO';

    // Create data array for all shifts
    const data = [];

    // Title row - Excel-style format (just month name in uppercase)
    const titleRow = [ITALIAN_MONTHS[month].toUpperCase()];
    // Fill rest of title row with empty strings
    let totalCols = 1;
    SHIFT_TYPES.forEach(shiftType => {
        totalCols += TIME_SLOTS[shiftType].length;
    });
    for (let i = 1; i < totalCols; i++) {
        titleRow.push('');
    }
    data.push(titleRow);

    // Excel-style abbreviations for shift types and slots
    const shiftAbbrev = {
        'SALA Senior': 'SALAsenior',
        'SALA Junior': 'SALAjunior',
        'REPARTO': 'REPARTO',
        'UTIC': 'UTIC',
        'PS': 'PS',
        'RAP': 'RAP',
        'ENI': 'ENI',
        'VIS 201': 'VIS 201',
        'VISITE 208': 'VIS 208',
        'TDS 207': 'TDS 207',
        'ECOTT 205': 'ECOTT',
        'ECO 206': 'ECO 206',
        'ECO spec 204': 'ECO 204',
        'ECO INT': 'ECO INT',
        'CARDIOCHIR': 'CARD',
        'Vicenza': 'VICE',
        'Ricerca': 'RIC',
        'RISERVE': 'RIS'
    };

    const slotAbbrev = (slot) => {
        // Extract just the number from slots like "MATT 1", "POM 2"
        const numberMatch = slot.match(/\s+(\d+)$/);
        if (numberMatch) return numberMatch[1];

        // Simplify time ranges
        if (slot.startsWith('h ')) return slot.replace('h ', '');

        // Standard abbreviations
        if (slot === 'MATT') return 'MAT';
        if (slot === 'POM') return 'POM';
        if (slot === 'NTT') return 'NOT';
        if (slot === 'GG') return 'GG';
        if (slot === 'SS') return 'SS';
        if (slot === 'SPEC') return 'SPEC';
        return slot;
    };

    // Header row 1: Shift types (offset by 1 due to title)
    const header1 = ['Data'];
    SHIFT_TYPES.forEach(shiftType => {
        const slots = TIME_SLOTS[shiftType];
        const abbrev = shiftAbbrev[shiftType] || shiftType;
        slots.forEach(() => {
            header1.push(abbrev);
        });
    });
    data.push(header1);

    // Header row 2: Time slots (offset by 1 due to title) - numbers only for ambulatori
    const header2 = [''];
    SHIFT_TYPES.forEach(shiftType => {
        const slots = TIME_SLOTS[shiftType];
        slots.forEach(slot => {
            header2.push(slotAbbrev(slot));
        });
    });
    data.push(header2);

    // Data rows - one for each day
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dayName = DAY_NAMES[date.getDay()]; // Already lowercase
        const dateKey = formatDate(year, month, day);
        const isWeekend = date.getDay() === 0 || date.getDay() === 6;

        // Excel format: date object for proper Excel date handling
        const excelDate = new Date(year, month, day);
        const row = [excelDate];

        SHIFT_TYPES.forEach(shiftType => {
            const slots = TIME_SLOTS[shiftType];
            const ambulatoriKey = `${dateKey}_${shiftType}`;

            // Weekend logic
            const weekendAllowedTypes = ['UTIC', 'PS', 'RAP'];
            const isAutoClosedForWeekend = isWeekend && !weekendAllowedTypes.includes(shiftType);

            if (AppState.ambulatoriStatus[ambulatoriKey] === 'closed' || isAutoClosedForWeekend) {
                slots.forEach(() => row.push('CHIUSO'));
            } else {
                slots.forEach(slot => {
                    const shiftKey = `${dateKey}_${shiftType}_${slot}`;
                    const userId = AppState.shifts[shiftKey];
                    if (!userId) {
                        row.push('');
                    } else {
                        const user = AppState.users.find(u => u.id === userId);
                        row.push(user ? (user.code || user.id.toUpperCase()) : '');
                    }
                });
            }
        });

        data.push(row);
    }

    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(data);

    // Set column widths
    const colWidths = [{ wch: 15 }]; // Date column
    SHIFT_TYPES.forEach(shiftType => {
        const slots = TIME_SLOTS[shiftType];
        slots.forEach(() => {
            colWidths.push({ wch: 10 });
        });
    });
    ws['!cols'] = colWidths;

    // Merge cells for title row and shift type headers
    const merges = [];

    // Merge title row across all columns
    merges.push({
        s: { r: 0, c: 0 },
        e: { r: 0, c: totalCols - 1 }
    });

    // Merge cells for shift type headers (row 1, offset by title row)
    let colIndex = 1;
    SHIFT_TYPES.forEach(shiftType => {
        const slots = TIME_SLOTS[shiftType];
        if (slots.length > 1) {
            merges.push({
                s: { r: 1, c: colIndex },
                e: { r: 1, c: colIndex + slots.length - 1 }
            });
        }
        colIndex += slots.length;
    });
    ws['!merges'] = merges;

    // Add styling
    const range = XLSX.utils.decode_range(ws['!ref']);

    // Style title row (row 0) - Excel blue header
    for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
        if (!ws[cellAddress]) ws[cellAddress] = { t: 's', v: '' };
        ws[cellAddress].s = {
            font: { bold: true, sz: 12, color: { rgb: 'FFFFFF' } },
            fill: { fgColor: { rgb: '4472C4' } },
            alignment: { horizontal: 'left', vertical: 'center' }
        };
    }

    // Style header rows (rows 1 and 2, shift types and time slots) - Excel blue
    for (let col = range.s.c; col <= range.e.c; col++) {
        for (let row = 1; row <= 2; row++) {
            const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
            if (!ws[cellAddress]) ws[cellAddress] = { t: 's', v: '' };
            ws[cellAddress].s = {
                font: { bold: true, sz: 9, color: { rgb: 'FFFFFF' } },
                fill: { fgColor: { rgb: '4472C4' } },
                alignment: { horizontal: 'center', vertical: 'center' }
            };
        }
    }

    // Style data cells based on time slot and weekend (starting from row 3, offset by title row)
    for (let row = 3; row <= range.e.r; row++) {
        // Determine weekend status from actual date value
        const dateCell = ws[XLSX.utils.encode_cell({ r: row, c: 0 })];
        let isWeekend = false;
        if (dateCell && dateCell.v) {
            const cellDate = new Date(dateCell.v);
            isWeekend = cellDate.getDay() === 0 || cellDate.getDay() === 6;
        }

        // Date column styling - Excel number format for dates
        ws[XLSX.utils.encode_cell({ r: row, c: 0 })].s = {
            font: { bold: true },
            fill: { fgColor: { rgb: isWeekend ? 'ADB9CA' : 'FFFFFF' } },
            alignment: { horizontal: 'center', vertical: 'center' },
            numFmt: 'd ddd', // Excel date format: "1 sab", "2 dom", etc.
            border: {
                top: { style: 'thin', color: { rgb: '000000' } },
                bottom: { style: 'thin', color: { rgb: '000000' } },
                left: { style: 'thin', color: { rgb: '000000' } },
                right: { style: 'thin', color: { rgb: '000000' } }
            }
        };

        let colIndex = 1;
        SHIFT_TYPES.forEach(shiftType => {
            const slots = TIME_SLOTS[shiftType];
            slots.forEach(slot => {
                const cellAddress = XLSX.utils.encode_cell({ r: row, c: colIndex });
                if (!ws[cellAddress]) ws[cellAddress] = { t: 's', v: '' };

                let bgColor;
                if (isWeekend) {
                    // Exact Excel weekend color - uniform light blue
                    bgColor = 'ADB9CA';
                } else {
                    // Exact Excel weekday colors
                    if (slot.includes('MATT') || slot === 'MATT') bgColor = 'FFFFFF';
                    else if (slot.includes('POM') || slot === 'POM') bgColor = 'FFF2CC';
                    else if (slot === 'NTT') bgColor = 'BFBFBF'; // Exact Excel gray
                    else if (slot === 'GG') bgColor = 'FFFFFF';
                    else if (slot === 'SS') bgColor = 'FFFFFF';
                    else if (slot === 'SPEC') bgColor = 'CCCCFF';
                    else bgColor = 'FFFFFF'; // Default for numbered slots
                }

                ws[cellAddress].s = {
                    fill: { fgColor: { rgb: bgColor } },
                    alignment: { horizontal: 'center', vertical: 'center' },
                    border: {
                        top: { style: 'thin', color: { rgb: '000000' } },
                        bottom: { style: 'thin', color: { rgb: '000000' } },
                        left: { style: 'thin', color: { rgb: '000000' } },
                        right: { style: 'thin', color: { rgb: '000000' } }
                    }
                };

                colIndex++;
            });
        });
    }

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, `${ITALIAN_MONTHS[month]} ${year}`);

    // Generate and download file
    XLSX.writeFile(wb, `turni_${ITALIAN_MONTHS[month]}_${year}_${typeText}.xlsx`);
    showToast('Excel esportato con successo', 'success');
}

// ===========================
// Version Management
// ===========================
function loadVersions() {
    return JSON.parse(localStorage.getItem('shiftVersions')) || [];
}

function saveVersions(versions) {
    localStorage.setItem('shiftVersions', JSON.stringify(versions));
}

function saveNewVersion(name, year, month) {
    const versions = loadVersions();

    // Get all shifts for the specified month
    const monthShifts = {};
    const daysInMonth = getDaysInMonth(year, month);

    for (let day = 1; day <= daysInMonth; day++) {
        const dateKey = formatDate(year, month, day);
        SHIFT_TYPES.forEach(shiftType => {
            const slots = TIME_SLOTS[shiftType];
            slots.forEach(slot => {
                const shiftKey = `${dateKey}_${shiftType}_${slot}`;
                if (AppState.shifts[shiftKey]) {
                    monthShifts[shiftKey] = AppState.shifts[shiftKey];
                }
            });
        });
    }

    // Get ambulatori status for the month
    const monthAmbulatori = {};
    for (let day = 1; day <= daysInMonth; day++) {
        const dateKey = formatDate(year, month, day);
        SHIFT_TYPES.forEach(shiftType => {
            const ambulatoriKey = `${dateKey}_${shiftType}`;
            if (AppState.ambulatoriStatus[ambulatoriKey]) {
                monthAmbulatori[ambulatoriKey] = AppState.ambulatoriStatus[ambulatoriKey];
            }
        });
    }

    const version = {
        id: Date.now().toString(),
        name,
        year,
        month,
        shifts: monthShifts,
        ambulatoriStatus: monthAmbulatori,
        savedAt: new Date().toISOString(),
        savedBy: AppState.currentUser.name
    };

    versions.push(version);
    saveVersions(versions);

    return version;
}

function loadVersion(versionId) {
    const versions = loadVersions();
    const version = versions.find(v => v.id === versionId);

    if (!version) {
        showToast('Versione non trovata', 'error');
        return;
    }

    // Clear existing shifts for that month
    const daysInMonth = getDaysInMonth(version.year, version.month);
    for (let day = 1; day <= daysInMonth; day++) {
        const dateKey = formatDate(version.year, version.month, day);
        SHIFT_TYPES.forEach(shiftType => {
            const slots = TIME_SLOTS[shiftType];
            slots.forEach(slot => {
                const shiftKey = `${dateKey}_${shiftType}_${slot}`;
                delete AppState.shifts[shiftKey];
            });
            const ambulatoriKey = `${dateKey}_${shiftType}`;
            delete AppState.ambulatoriStatus[ambulatoriKey];
        });
    }

    // Load shifts from version
    Object.assign(AppState.shifts, version.shifts);
    Object.assign(AppState.ambulatoriStatus, version.ambulatoriStatus);

    saveToStorage('shifts', AppState.shifts);
    saveToStorage('ambulatoriStatus', AppState.ambulatoriStatus);

    showToast(`Versione "${version.name}" caricata`, 'success');

    // Refresh current view
    const activeView = document.querySelector('.view.active');
    if (activeView) {
        if (activeView.id === 'calendarView') renderCalendar();
        if (activeView.id === 'shiftsView') renderShiftsManagement();
    }
}

function deleteVersion(versionId) {
    if (!confirm('Sei sicuro di voler eliminare questa versione?')) return;

    const versions = loadVersions();
    const filtered = versions.filter(v => v.id !== versionId);
    saveVersions(filtered);

    showToast('Versione eliminata', 'success');
    renderVersionsGrid();
}

function renameVersion(versionId, newName) {
    const versions = loadVersions();
    const version = versions.find(v => v.id === versionId);

    if (version) {
        version.name = newName;
        saveVersions(versions);
        showToast('Versione rinominata', 'success');
        renderVersionsGrid();
    }
}

function renderVersionsGrid() {
    const select = document.getElementById('versionMonth');
    const [year, month] = select.value.split('-').map(Number);

    const versions = loadVersions();
    const monthVersions = versions.filter(v => v.year === year && v.month === month);

    const grid = document.getElementById('versionsGrid');

    if (monthVersions.length === 0) {
        grid.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 40px;">Nessuna versione salvata per questo mese.</p>';
        return;
    }

    grid.innerHTML = monthVersions.map(version => `
        <div class="version-card">
            <div class="version-card-header">
                <h3 class="version-name">${version.name}</h3>
            </div>
            <div class="version-meta">Salvata il: ${new Date(version.savedAt).toLocaleString('it-IT')}</div>
            <div class="version-meta">Da: ${version.savedBy}</div>
            <div class="version-meta">Turni: ${Object.keys(version.shifts).length} assegnazioni</div>
            <div class="version-actions">
                <button class="btn btn-secondary" onclick="loadVersion('${version.id}')">
                    <span class="material-icons">restore</span>
                    Carica
                </button>
                <button class="btn btn-secondary" onclick="
                    const newName = prompt('Nuovo nome:', '${version.name}');
                    if (newName && newName !== '${version.name}') renameVersion('${version.id}', newName);
                ">
                    <span class="material-icons">edit</span>
                    Rinomina
                </button>
                <button class="btn btn-danger" onclick="deleteVersion('${version.id}')">
                    <span class="material-icons">delete</span>
                    Elimina
                </button>
            </div>
        </div>
    `).join('');
}

function handleSaveVersion(e) {
    e.preventDefault();

    const name = document.getElementById('versionName').value.trim();
    const select = document.getElementById('versionMonthSelect');
    const [year, month] = select.value.split('-').map(Number);

    if (!name) {
        document.getElementById('saveVersionError').textContent = 'Inserisci un nome per la versione';
        return;
    }

    try {
        saveNewVersion(name, year, month);
        showToast('Versione salvata con successo', 'success');
        closeModal('saveVersionModal');

        // Clear form
        document.getElementById('versionName').value = '';

        // Refresh versions grid if on that view
        const activeView = document.querySelector('.view.active');
        if (activeView && activeView.id === 'versionsView') {
            renderVersionsGrid();
        }
    } catch (error) {
        document.getElementById('saveVersionError').textContent = 'Errore nel salvataggio della versione';
        console.error(error);
    }
}

function updateVersionMonthSelectors() {
    const now = new Date();
    let html = '';

    for (let i = 0; i <= 3; i++) {
        const month = (now.getMonth() + i) % 12;
        const year = now.getFullYear() + Math.floor((now.getMonth() + i) / 12);
        const selected = month === AppState.currentMonth && year === AppState.currentYear ? 'selected' : '';
        html += `<option value="${year}-${month}" ${selected}>${ITALIAN_MONTHS[month]} ${year}</option>`;
    }

    document.getElementById('versionMonth').innerHTML = html;
    document.getElementById('versionMonthSelect').innerHTML = html;
}

// ===========================
// Approval System
// ===========================
function getMonthApprovalStatus(year, month) {
    const key = `${year}-${month}`;
    return AppState.approvalStatus[key] || { status: 'draft' };
}

function toggleMonthApproval() {
    const key = `${AppState.currentYear}-${AppState.currentMonth}`;
    const current = AppState.approvalStatus[key] || { status: 'draft' };

    const newStatus = current.status === 'draft' ? 'approved' : 'draft';

    AppState.approvalStatus[key] = {
        status: newStatus,
        approvedBy: AppState.currentUser.name,
        approvedAt: new Date().toISOString()
    };

    saveToStorage('approvalStatus', AppState.approvalStatus);

    showToast(
        newStatus === 'approved' ? 'Turni approvati come definitivi' : 'Turni rimessi in bozza',
        'success'
    );

    updateApprovalUI();
}

function updateApprovalUI() {
    const approval = getMonthApprovalStatus(AppState.currentYear, AppState.currentMonth);
    const badge = document.getElementById('approvalBadge');
    const btn = document.getElementById('toggleApprovalBtn');
    const btnText = document.getElementById('approvalBtnText');

    // Update badge
    badge.textContent = approval.status === 'approved' ? 'DEFINITIVO' : 'BOZZA';
    badge.className = `approval-badge ${approval.status}`;

    // Update button text
    if (btn && btnText) {
        btnText.textContent = approval.status === 'approved' ? 'Rimetti in Bozza' : 'Segna come Definitivo';
    }
}

function shouldShowShiftsForUser(year, month) {
    // Admins always see everything
    if (AppState.currentUser.role === 'admin') return true;

    // Regular users only see approved months
    const approval = getMonthApprovalStatus(year, month);
    return approval.status === 'approved';
}

// ===========================
// Modal Management
// ===========================
function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// ===========================
// Event Listeners
// ===========================
function initializeEventListeners() {
    // Login
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('firstLoginForm').addEventListener('submit', handleFirstLogin);

    // Dashboard
    document.getElementById('logoutBtn').addEventListener('click', logout);
    document.getElementById('changePasswordBtn').addEventListener('click', () => openModal('changePasswordModal'));
    document.getElementById('changePasswordForm').addEventListener('submit', handleChangePassword);

    // Navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => switchView(btn.dataset.view));
    });

    // Calendar
    document.getElementById('prevMonth').addEventListener('click', () => changeMonth(-1));
    document.getElementById('nextMonth').addEventListener('click', () => changeMonth(1));
    document.getElementById('exportPdfBtn').addEventListener('click', openPdfModal);
    document.getElementById('exportExcelBtn').addEventListener('click', openExcelModal);
    document.getElementById('pdfForm').addEventListener('submit', handlePdfExport);

    // Availability
    document.getElementById('saveAvailability').addEventListener('click', saveAvailability);

    // Users
    document.getElementById('addUserBtn').addEventListener('click', openAddUserModal);
    document.getElementById('userForm').addEventListener('submit', handleUserFormSubmit);

    // Auto Assignment
    document.getElementById('runAutoAssign').addEventListener('click', runAutoAssignment);
    document.getElementById('runAutoAssignPreview').addEventListener('click', () => {
        showToast('Funzionalità anteprima in sviluppo. Per ora puoi generare i turni e poi modificarli manualmente.', 'info', 4000);
    });

    // Availability Overview
    document.getElementById('exportAvailabilityPdfBtn').addEventListener('click', exportAvailabilityPdf);
    document.getElementById('exportAvailabilityExcelBtn').addEventListener('click', exportAvailabilityExcel);

    // Version Management
    document.getElementById('saveVersionBtn').addEventListener('click', () => openModal('saveVersionModal'));
    document.getElementById('saveVersionForm').addEventListener('submit', handleSaveVersion);
    document.getElementById('versionMonth').addEventListener('change', renderVersionsGrid);

    // Approval System
    document.getElementById('toggleApprovalBtn').addEventListener('click', toggleMonthApproval);

    // Modal close buttons
    document.querySelectorAll('.modal-close, [data-modal]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const modalId = btn.dataset.modal || btn.closest('.modal').id;
            closeModal(modalId);
        });
    });

    // Close modals on outside click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(modal.id);
            }
        });
    });
}

// ===========================
// Availability Overview (Admin)
// ===========================
function renderAvailabilityOverview() {
    updateAvailabilityOverviewMonthSelector();
    renderAvailabilityOverviewGrid();
}

function updateAvailabilityOverviewMonthSelector() {
    const select = document.getElementById('availabilityOverviewMonth');
    const now = new Date();
    let html = '';

    for (let i = 0; i <= 3; i++) {
        const month = (now.getMonth() + i) % 12;
        const year = now.getFullYear() + Math.floor((now.getMonth() + i) / 12);
        const selected = month === AppState.currentMonth && year === AppState.currentYear ? 'selected' : '';
        html += `<option value="${year}-${month}" ${selected}>${ITALIAN_MONTHS[month]} ${year}</option>`;
    }

    select.innerHTML = html;
    select.addEventListener('change', renderAvailabilityOverviewGrid);
}

function renderAvailabilityOverviewGrid() {
    const select = document.getElementById('availabilityOverviewMonth');
    const [year, month] = select.value.split('-').map(Number);
    const container = document.getElementById('availabilityOverviewGrid');
    const daysInMonth = getDaysInMonth(year, month);

    // NEW LAYOUT: rows = days (with M/P/N sub-rows), columns = users (nicknames)
    let html = '<div class="overview-matrix-transposed">';

    // Header row with user nicknames
    html += '<div class="overview-header-row-transposed">';
    html += '<div class="overview-day-column-header">Giorno</div>';
    html += '<div class="overview-slot-column-header">Fascia</div>';

    AppState.users.forEach(user => {
        const userCode = user.code || user.id.toUpperCase();
        html += `<div class="overview-user-header-cell" title="${user.name}">${userCode}</div>`;
    });
    html += '</div>';

    // Day rows (each day has 3 sub-rows: M, P, N)
    const slots = [
        { key: 'mattina', label: 'M', title: 'Mattina' },
        { key: 'pomeriggio', label: 'P', title: 'Pomeriggio' },
        { key: 'notte', label: 'N', title: 'Notte' }
    ];

    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dayName = DAY_NAMES[date.getDay()];
        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
        const dateKey = formatDate(year, month, day);

        slots.forEach((slot, slotIndex) => {
            html += `<div class="overview-day-row-transposed ${isWeekend ? 'weekend-row' : ''}">`;

            // Day number cell (shown only on first row)
            if (slotIndex === 0) {
                html += `<div class="overview-day-cell-label">
                    <div class="day-number">${day}</div>
                    <div class="day-name-small">${dayName}</div>
                </div>`;
            } else {
                html += `<div class="overview-day-cell-label empty-day-cell"></div>`;
            }

            // Slot label
            html += `<div class="overview-slot-cell-label" title="${slot.title}">${slot.label}</div>`;

            // User availability cells
            AppState.users.forEach(user => {
                const userAvailabilityKey = `${user.id}_${year}_${month}`;
                const unavailableSlots = AppState.availability[userAvailabilityKey] || {};
                const daySlots = unavailableSlots[dateKey] || {};

                // Check if user is unavailable for this specific slot
                let isUnavailable = false;
                if (slot.key === 'mattina') {
                    isUnavailable = daySlots.mattina === true || daySlots.MATT === true;
                } else if (slot.key === 'pomeriggio') {
                    isUnavailable = daySlots.pomeriggio === true || daySlots.POM === true;
                } else if (slot.key === 'notte') {
                    isUnavailable = daySlots.notte === true || daySlots.NTT === true;
                }

                const cellClass = isUnavailable ? 'unavailable-cell' : 'available-cell';
                const userCode = user.code || user.id.toUpperCase();
                html += `<div class="${cellClass}" title="${userCode} - ${slot.title}: ${isUnavailable ? 'Non disponibile' : 'Disponibile'}"></div>`;
            });

            html += '</div>';
        });
    }

    html += '</div>';

    // Add legend
    html += `
        <div class="overview-legend">
            <h4>Legenda:</h4>
            <div class="legend-items">
                <div class="legend-item">
                    <div class="legend-color unavailable-cell"></div>
                    <span>Non disponibile (rosso)</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color available-cell"></div>
                    <span>Disponibile (bianco)</span>
                </div>
                <div class="legend-item">
                    <span><strong>M</strong> = Mattina</span>
                </div>
                <div class="legend-item">
                    <span><strong>P</strong> = Pomeriggio</span>
                </div>
                <div class="legend-item">
                    <span><strong>N</strong> = Notte</span>
                </div>
            </div>
        </div>
    `;

    container.innerHTML = html;
}

function exportAvailabilityPdf() {
    const select = document.getElementById('availabilityOverviewMonth');
    const [year, month] = select.value.split('-').map(Number);
    const daysInMonth = getDaysInMonth(year, month);

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('portrait', 'mm', 'a4');

    // Title
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text(`Panoramica Indisponibilità - ${ITALIAN_MONTHS[month]} ${year}`, 105, 12, { align: 'center' });

    // NEW TRANSPOSED LAYOUT: Rows = Days (with M/P/N), Columns = Users
    const headers = ['Giorno', 'Fascia'];
    AppState.users.forEach(user => {
        headers.push(user.code || user.id.toUpperCase());
    });

    const rows = [];
    const slots = [
        { key: 'mattina', label: 'M' },
        { key: 'pomeriggio', label: 'P' },
        { key: 'notte', label: 'N' }
    ];

    for (let day = 1; day <= daysInMonth; day++) {
        const dateKey = formatDate(year, month, day);
        const date = new Date(year, month, day);
        const dayName = DAY_NAMES[date.getDay()];

        slots.forEach((slot, index) => {
            const row = [
                index === 0 ? `${day} ${dayName}` : '', // Day only on first row
                slot.label
            ];

            AppState.users.forEach(user => {
                const userAvailabilityKey = `${user.id}_${year}_${month}`;
                const unavailableSlots = AppState.availability[userAvailabilityKey] || {};
                const daySlots = unavailableSlots[dateKey] || {};

                // Check if unavailable
                let isUnavailable = false;
                if (slot.key === 'mattina') {
                    isUnavailable = daySlots.mattina === true || daySlots.MATT === true;
                } else if (slot.key === 'pomeriggio') {
                    isUnavailable = daySlots.pomeriggio === true || daySlots.POM === true;
                } else if (slot.key === 'notte') {
                    isUnavailable = daySlots.notte === true || daySlots.NTT === true;
                }

                // Use X for unavailable, empty for available
                row.push(isUnavailable ? 'X' : '');
            });

            rows.push(row);
        });
    }

    // Calculate optimal font size based on number of users
    const numUsers = AppState.users.length;
    let fontSize = 6;
    if (numUsers > 20) fontSize = 5;
    if (numUsers > 25) fontSize = 4;

    doc.autoTable({
        head: [headers],
        body: rows,
        startY: 18,
        styles: {
            fontSize: fontSize,
            cellPadding: 0.5,
            lineWidth: 0.1,
            lineColor: [200, 200, 200]
        },
        headStyles: {
            fillColor: [198, 40, 40],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: fontSize + 1
        },
        columnStyles: {
            0: { cellWidth: 18, fontStyle: 'bold' }, // Giorno
            1: { cellWidth: 8, halign: 'center' }     // Fascia
        },
        didParseCell: function(data) {
            // Color unavailable cells (X) with bright red background
            if (data.section === 'body' && data.column.index > 1 && data.cell.text[0] === 'X') {
                data.cell.styles.fillColor = [255, 0, 0]; // Bright red
                data.cell.styles.textColor = [255, 255, 255]; // White text
                data.cell.styles.fontStyle = 'bold';
                data.cell.styles.halign = 'center';
            }
            // Center align all user columns
            if (data.column.index > 1) {
                data.cell.styles.halign = 'center';
            }
        },
        margin: { left: 10, right: 10, top: 18, bottom: 10 },
        tableWidth: 'auto'
    });

    // Add legend at bottom
    const finalY = doc.lastAutoTable.finalY + 5;
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    doc.text('Legenda: X = Non disponibile (rosso) | Vuoto = Disponibile | M = Mattina | P = Pomeriggio | N = Notte', 148, finalY, { align: 'center' });

    doc.save(`indisponibilita_${ITALIAN_MONTHS[month]}_${year}.pdf`);
    showToast('PDF esportato con successo', 'success');
}

function exportAvailabilityExcel() {
    const select = document.getElementById('availabilityOverviewMonth');
    const [year, month] = select.value.split('-').map(Number);
    const daysInMonth = getDaysInMonth(year, month);

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();

    // Create header row with days
    const headers = ['Medico'];
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dayName = DAY_NAMES[date.getDay()].substring(0, 3);
        headers.push(`${day}\n${dayName}`);
    }

    // Create data rows
    const data = [headers];

    AppState.users.forEach(user => {
        const userAvailabilityKey = `${user.id}_${year}_${month}`;
        const unavailableSlots = AppState.availability[userAvailabilityKey] || {};

        const row = [user.name];

        for (let day = 1; day <= daysInMonth; day++) {
            const dateKey = formatDate(year, month, day);
            const daySlots = unavailableSlots[dateKey] || {};

            const slots = [];
            if (daySlots.MATT) slots.push('M');
            if (daySlots.POM) slots.push('P');
            if (daySlots.NTT) slots.push('N');

            row.push(slots.join(','));
        }

        data.push(row);
    });

    // Create worksheet from data
    const ws = XLSX.utils.aoa_to_sheet(data);

    // Set column widths
    const colWidths = [{ wch: 20 }]; // First column (names)
    for (let i = 1; i <= daysInMonth; i++) {
        colWidths.push({ wch: 8 }); // Day columns
    }
    ws['!cols'] = colWidths;

    // Add styling for header row
    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let col = range.s.c; col <= range.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
        if (!ws[cellAddress]) continue;
        ws[cellAddress].s = {
            font: { bold: true, color: { rgb: 'FFFFFF' } },
            fill: { fgColor: { rgb: 'C62828' } },
            alignment: { horizontal: 'center', vertical: 'center', wrapText: true }
        };
    }

    // Add weekend highlighting
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        if (date.getDay() === 0 || date.getDay() === 6) {
            const col = day; // Column index (0 = names, 1+ = days)
            for (let row = 0; row <= range.e.r; row++) {
                const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
                if (!ws[cellAddress]) ws[cellAddress] = { t: 's', v: '' };
                ws[cellAddress].s = {
                    ...ws[cellAddress].s,
                    fill: { fgColor: { rgb: 'ADB9CA' } }
                };
            }
        }
    }

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, `Indisponibilità ${ITALIAN_MONTHS[month]}`);

    // Generate and download file
    XLSX.writeFile(wb, `indisponibilita_${ITALIAN_MONTHS[month]}_${year}.xlsx`);
    showToast('Excel esportato con successo', 'success');
}

// ===========================
// Initialize Application
// ===========================
document.addEventListener('DOMContentLoaded', () => {
    initializeDefaultData();
    initializeEventListeners();

    // Auto-fill userId if remember me was checked
    const rememberedUserId = localStorage.getItem('rememberedUserId');
    if (rememberedUserId) {
        document.getElementById('userId').value = rememberedUserId;
        document.getElementById('rememberMe').checked = true;
    }

    // Check if user is already logged in (for development)
    // In production, you'd want proper session management
    showScreen('loginScreen');
});

// Export functions for global access
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
window.renameVersion = renameVersion;
