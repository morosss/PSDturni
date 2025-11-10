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
    'REPARTO': ['MATT', 'POM'],
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

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];

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
    ambulatoriStatus: {}
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
// Initialize Default Data
// ===========================
function initializeDefaultData() {
    // Initialize users with actual hospital staff
    const defaultUsers = [
        // Admin users
        { id: 'spizzocri', name: 'Dott. Samuele Pizzocri', role: 'admin', specialty: 'Emodinamista', password: '62c5ec050cf9b0bf5523b30df8c40e3872b8b3f0a48f20e0dc1ec5cdf989686d', capabilities: SHIFT_TYPES },

        // Medical staff
        { id: 'agrelli', name: 'Dott.ssa Arianna Grelli', role: 'user', specialty: 'Cardiologo', password: null, capabilities: ['REPARTO', 'UTIC', 'PS', 'ECO 206', 'VISITE 208', 'VIS 201', 'ECO INT'] },
        { id: 'nbrambilla', name: 'Dott.ssa Nedy Brambilla', role: 'user', specialty: 'Cardiologo', password: null, capabilities: ['REPARTO', 'UTIC', 'PS', 'ECO 206', 'VISITE 208', 'VIS 201'] },
        { id: 'mbarletta', name: 'Dott.ssa Marta Barletta', role: 'user', specialty: 'Cardiologo', password: null, capabilities: ['REPARTO', 'PS', 'ECO 206', 'ECO spec 204', 'VISITE 208'] },
        { id: 'aborin', name: 'Dott. Andrea Borin', role: 'user', specialty: 'Cardiologo', password: null, capabilities: ['REPARTO', 'UTIC', 'PS', 'ECO 206', 'RAP'] },
        { id: 'gcannone', name: 'Dott. Gaspare Sergio Cannone', role: 'user', specialty: 'Emodinamista', password: null, capabilities: ['SALA Senior', 'SALA Junior', 'REPARTO', 'PS', 'UTIC'] },
        { id: 'echiorino', name: 'Dott.ssa Elisa Chiorino', role: 'user', specialty: 'Cardiologo', password: null, capabilities: ['SALA Junior', 'REPARTO', 'PS', 'ECO 206', 'VISITE 208'] },
        { id: 'ecriscione', name: 'Dott. Enrico Criscione', role: 'user', specialty: 'Emodinamista', password: null, capabilities: ['SALA Senior', 'SALA Junior', 'REPARTO', 'PS', 'VIS 201', 'RAP'] },
        { id: 'fdellarosa', name: 'Dott. Francesco Della Rosa', role: 'user', specialty: 'Emodinamista', password: null, capabilities: ['SALA Senior', 'SALA Junior', 'REPARTO', 'PS'] },
        { id: 'rgorla', name: 'Dott. Riccardo Gorla', role: 'user', specialty: 'Emodinamista', password: null, capabilities: ['SALA Senior', 'SALA Junior', 'REPARTO', 'PS', 'UTIC'] },
        { id: 'mguerrini', name: 'Dott. Marco Guerrini', role: 'user', specialty: 'Cardiologo', password: null, capabilities: ['REPARTO', 'PS', 'RAP', 'ECO 206', 'VISITE 208'] },
        { id: 'alodirizzini', name: 'Dott. Angelo Lodi Rizzini', role: 'user', specialty: 'Cardiologo', password: null, capabilities: ['VIS 201', 'VISITE 208', 'ECO 206', 'TDS 207', 'ECOTT 205'] },
        { id: 'vmantovani', name: 'Dott.ssa Valentina Mantovani', role: 'user', specialty: 'Cardiologo', password: null, capabilities: ['REPARTO', 'ECO 206', 'ECO INT', 'VISITE 208'] },
        { id: 'mmazzucca', name: 'Dott. Mattia Mazzucca', role: 'user', specialty: 'Cardiologo', password: null, capabilities: ['REPARTO', 'UTIC', 'ECO 206', 'ECO INT', 'PS'] },
        { id: 'apopolorubbio', name: 'Dott. Antonio Popolo Rubbio', role: 'user', specialty: 'Cardiologo', password: null, capabilities: ['REPARTO', 'PS', 'UTIC', 'ECO 206', 'VISITE 208'] },
        { id: 'msquillace', name: 'Dott. Mattia Squillace', role: 'user', specialty: 'Cardiologo', password: null, capabilities: ['REPARTO', 'UTIC', 'RAP', 'VISITE 208', 'PS'] },
        { id: 'estefanini', name: 'Dott.ssa Elisa Stefanini', role: 'user', specialty: 'Ecocardiografista', password: null, capabilities: ['ECO 206', 'ECO spec 204', 'ECOTT 205', 'ECO INT', 'VISITE 208'] },
        { id: 'ltesta', name: 'Dott. Luca Testa', role: 'user', specialty: 'Cardiologo', password: null, capabilities: ['REPARTO', 'PS', 'UTIC', 'ECO 206'] },
        { id: 'mtusa', name: 'Dott. Maurizio Tusa', role: 'user', specialty: 'Ricercatore', password: null, capabilities: ['Ricerca', 'ECO spec 204', 'ECO INT'] },
        { id: 'avella', name: 'Dott. Alessandro Vella', role: 'user', specialty: 'Cardiologo', password: null, capabilities: ['REPARTO', 'UTIC', 'ECO INT', 'PS'] },
        { id: 'mvicario', name: 'Dott.ssa Maria Lucia Vicario', role: 'user', specialty: 'Cardiologo', password: null, capabilities: ['REPARTO', 'UTIC', 'TDS 207', 'ECO 206', 'PS'] },
        { id: 'jzannoni', name: 'Dott.ssa Jessica Zannoni', role: 'user', specialty: 'Cardiologo', password: null, capabilities: ['REPARTO', 'ECO 206', 'ECO INT', 'VISITE 208'] },
        { id: 'ecozza', name: 'Dott.ssa Elena Cozza', role: 'user', specialty: 'Cardiologo', password: null, capabilities: ['REPARTO', 'ECO 206', 'ECO INT', 'TDS 207', 'VISITE 208'] },
        { id: 'mmorosato', name: 'Dott. Michele Morosato', role: 'user', specialty: 'Cardiologo', password: null, capabilities: ['REPARTO', 'UTIC', 'PS', 'ECO 206', 'RAP'] },
        { id: 'gcattaneo', name: 'Dott.ssa Greta Cattaneo', role: 'user', specialty: 'Cardiologo', password: null, capabilities: ['REPARTO', 'PS', 'ECO 206', 'VISITE 208'] },
        { id: 'tsimone', name: 'Dott. Tommaso Simone', role: 'user', specialty: 'Cardiologo', password: null, capabilities: ['REPARTO', 'VIS 201', 'VISITE 208', 'ECO 206'] },
        { id: 'rdelmaso', name: 'Dott. Raffaele Del Maso', role: 'user', specialty: 'Cardiologo', password: null, capabilities: ['REPARTO', 'UTIC', 'PS', 'ECO 206', 'ECO INT'] }
    ];

    const existingUsers = loadFromStorage('users');
    if (!existingUsers || existingUsers.length === 0) {
        saveToStorage('users', defaultUsers);
        AppState.users = defaultUsers;
    } else {
        AppState.users = existingUsers;
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
    alert('Password modificata con successo');
}

function logout() {
    AppState.currentUser = null;
    document.getElementById('loginForm').reset();
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

    let html = '<table class="calendar-table"><thead><tr>';
    html += '<th class="date-header">Data</th>';

    // Add shift type headers with color coding
    SHIFT_TYPES.forEach(shiftType => {
        const slots = TIME_SLOTS[shiftType];
        slots.forEach(slot => {
            const colorClass = slot === 'POM' ? 'header-pom' : slot === 'MATT' ? 'header-matt' : 'header-default';
            html += `<th class="${colorClass}">${shiftType}<br><small>${slot}</small></th>`;
        });
    });
    html += '</tr></thead><tbody>';

    // Add days
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(AppState.currentYear, AppState.currentMonth, day);
        const dayName = DAY_NAMES[date.getDay()];
        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
        const dateKey = formatDate(AppState.currentYear, AppState.currentMonth, day);

        html += `<tr>`;
        html += `<td class="date-cell ${isWeekend ? 'weekend' : ''}">${day} ${dayName}</td>`;

        // Add shift cells with color coding
        SHIFT_TYPES.forEach(shiftType => {
            const slots = TIME_SLOTS[shiftType];
            slots.forEach(slot => {
                const shiftKey = `${dateKey}_${shiftType}_${slot}`;
                const userId = AppState.shifts[shiftKey] || '';
                const user = userId ? AppState.users.find(u => u.id === userId) : null;
                const displayName = user ? user.name : '';
                const isClosed = AppState.ambulatoriStatus[`${dateKey}_${shiftType}`] === 'closed';

                if (isClosed) {
                    html += `<td class="shift-cell closed"></td>`;
                } else {
                    const colorClass = slot === 'POM' ? 'cell-pom' : slot === 'MATT' ? 'cell-matt' : 'cell-default';
                    html += `<td class="shift-cell ${colorClass}"><div class="shift-name">${displayName}</div></td>`;
                }
            });
        });

        html += '</tr>';
    }

    html += '</tbody></table>';
    container.innerHTML = html;
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
    const unavailableDays = AppState.availability[userAvailabilityKey] || [];

    let html = '<div class="availability-grid">';

    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dayName = DAY_NAMES[date.getDay()];
        const dateKey = formatDate(year, month, day);
        const isSelected = unavailableDays.includes(dateKey);
        const disabledClass = isPastDeadline ? 'disabled' : '';

        html += `
            <div class="availability-day ${isSelected ? 'selected' : ''} ${disabledClass}"
                 data-date="${dateKey}">
                <span class="day-number">${day}</span>
                <span class="day-name">${dayName}</span>
            </div>
        `;
    }

    html += '</div>';
    container.innerHTML = html;

    // Add click handlers
    if (!isPastDeadline) {
        document.querySelectorAll('.availability-day:not(.disabled)').forEach(dayEl => {
            dayEl.addEventListener('click', () => {
                dayEl.classList.toggle('selected');
            });
        });
    }

    updateDeadlineWarning();
}

function saveAvailability() {
    const select = document.getElementById('availabilityMonth');
    const [year, month] = select.value.split('-').map(Number);

    if (isDeadlinePassed(month, year)) {
        alert('Non è possibile modificare le indisponibilità dopo la scadenza.');
        return;
    }

    const selectedDays = Array.from(document.querySelectorAll('.availability-day.selected'))
        .map(el => el.dataset.date);

    const userAvailabilityKey = `${AppState.currentUser.id}_${year}_${month}`;
    AppState.availability[userAvailabilityKey] = selectedDays;
    saveToStorage('availability', AppState.availability);

    alert('Indisponibilità salvate con successo!');
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

    openModal('userModal');
}

function editUser(userId) {
    const user = AppState.users.find(u => u.id === userId);
    if (!user) return;

    document.getElementById('userModalTitle').textContent = 'Modifica Utente';
    document.getElementById('userName').value = user.name;
    document.getElementById('userIdInput').value = user.id;
    document.getElementById('userIdInput').disabled = true;
    document.getElementById('userRole').value = user.role;
    document.getElementById('userSpecialty').value = user.specialty || '';

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

    document.getElementById('userForm').dataset.mode = 'edit';
    document.getElementById('userForm').dataset.userId = userId;
    openModal('userModal');
}

async function handleUserFormSubmit(e) {
    e.preventDefault();
    clearError('userFormError');

    const mode = e.target.dataset.mode;
    const name = sanitizeInput(document.getElementById('userName').value.trim());
    const userId = sanitizeInput(document.getElementById('userIdInput').value.toLowerCase().trim());
    const role = document.getElementById('userRole').value;
    const specialty = sanitizeInput(document.getElementById('userSpecialty').value.trim());
    const capabilities = Array.from(document.querySelectorAll('input[name="capability"]:checked'))
        .map(cb => cb.value);

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
            role: role,
            specialty: specialty,
            password: null,
            capabilities: capabilities
        };

        AppState.users.push(newUser);
    } else {
        // Edit mode
        const userIndex = AppState.users.findIndex(u => u.id === e.target.dataset.userId);
        if (userIndex === -1) return;

        AppState.users[userIndex].name = name;
        AppState.users[userIndex].role = role;
        AppState.users[userIndex].specialty = specialty;
        AppState.users[userIndex].capabilities = capabilities;

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

    // Reload availability to ensure real-time updates
    AppState.availability = loadFromStorage('availability', {});

    let html = '<div class="shift-editor">';

    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dayName = DAY_NAMES[date.getDay()];
        const dateKey = formatDate(year, month, day);

        html += `
            <div class="shift-day-card">
                <div class="shift-day-header">
                    <h4>${day} ${dayName} - ${ITALIAN_MONTHS[month]} ${year}</h4>
                </div>
                <div class="shift-assignments">
        `;

        // Group shift types: separate REPARTO MATT and POM
        const shiftGroups = [];
        SHIFT_TYPES.forEach(shiftType => {
            const slots = TIME_SLOTS[shiftType];
            if (shiftType === 'REPARTO') {
                // Split REPARTO into separate MATT and POM columns
                slots.forEach(slot => {
                    shiftGroups.push({
                        type: shiftType,
                        slot: slot,
                        displayName: `${shiftType} ${slot}`
                    });
                });
            } else {
                shiftGroups.push({
                    type: shiftType,
                    slot: null,
                    displayName: shiftType,
                    slots: slots
                });
            }
        });

        SHIFT_TYPES.forEach(shiftType => {
            const slots = TIME_SLOTS[shiftType];
            const ambulatoriKey = `${dateKey}_${shiftType}`;
            const isClosed = AppState.ambulatoriStatus[ambulatoriKey] === 'closed';

            html += `
                <div class="shift-assignment ${isClosed ? 'closed-shift' : ''}">
                    <label>${shiftType} <small>(Chiuso)</small></label>
                    <div style="display: flex; gap: 4px; align-items: center;">
                        <input type="checkbox"
                               ${isClosed ? 'checked' : ''}
                               onchange="toggleAmbulatorio('${ambulatoriKey}', this.checked)"
                               title="Chiuso">
                    </div>
                </div>
            `;

            if (!isClosed) {
                slots.forEach(slot => {
                    const shiftKey = `${dateKey}_${shiftType}_${slot}`;
                    const assignedUser = AppState.shifts[shiftKey] || '';

                    html += `
                        <div class="shift-assignment" id="shift_${shiftKey}">
                            <label>${shiftType} - ${slot}</label>
                            <select onchange="assignShift('${shiftKey}', this.value)">
                                <option value="">-- Non assegnato --</option>
                                ${AppState.users.map(user => {
                                    const canWork = user.capabilities.includes(shiftType);
                                    const isUnavailable = (AppState.availability[`${user.id}_${year}_${month}`] || []).includes(dateKey);
                                    const selected = assignedUser === user.id ? 'selected' : '';
                                    const disabled = (!canWork || isUnavailable) ? 'disabled' : '';
                                    let optionText = user.name;
                                    if (!canWork) optionText += ' (non abilitato)';
                                    else if (isUnavailable) optionText += ' (non disponibile)';
                                    return `<option value="${user.id}" ${selected} ${disabled}>${optionText}</option>`;
                                }).join('')}
                            </select>
                        </div>
                    `;
                });
            }
        });

        html += `
                </div>
            </div>
        `;
    }

    html += '</div>';
    container.innerHTML = html;
}

function toggleAmbulatorio(ambulatoriKey, isClosed) {
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
    const [year, month] = dateKey.split('-').map(Number);
    const userAvailabilityKey = `${userId}_${year}_${month - 1}`;
    const unavailableDays = AppState.availability[userAvailabilityKey] || [];

    if (unavailableDays.includes(dateKey)) {
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

function runAutoAssignment() {
    const select = document.getElementById('autoAssignMonth');
    const [year, month] = select.value.split('-').map(Number);
    const resultsContainer = document.getElementById('autoAssignResults');

    resultsContainer.innerHTML = '<p>Generazione turni in corso...</p>';

    // Simple auto-assignment algorithm
    setTimeout(() => {
        const daysInMonth = getDaysInMonth(year, month);
        let assignedCount = 0;
        let errorCount = 0;
        const errors = [];

        // Reload availability data to ensure it's up to date
        AppState.availability = loadFromStorage('availability', {});

        for (let day = 1; day <= daysInMonth; day++) {
            const dateKey = formatDate(year, month, day);

            SHIFT_TYPES.forEach(shiftType => {
                const ambulatoriKey = `${dateKey}_${shiftType}`;
                if (AppState.ambulatoriStatus[ambulatoriKey] === 'closed') return;

                const slots = TIME_SLOTS[shiftType];
                slots.forEach(slot => {
                    const shiftKey = `${dateKey}_${shiftType}_${slot}`;

                    // Skip if already assigned
                    if (AppState.shifts[shiftKey]) {
                        assignedCount++;
                        return;
                    }

                    // Find available users
                    const availableUsers = AppState.users.filter(user => {
                        if (!user.capabilities.includes(shiftType)) return false;
                        const userAvailabilityKey = `${user.id}_${year}_${month}`;
                        const unavailableDays = AppState.availability[userAvailabilityKey] || [];
                        return !unavailableDays.includes(dateKey);
                    });

                    if (availableUsers.length > 0) {
                        // Assign randomly (in a real system, this would be more sophisticated)
                        const randomUser = availableUsers[Math.floor(Math.random() * availableUsers.length)];
                        AppState.shifts[shiftKey] = randomUser.id;
                        assignedCount++;
                    } else {
                        errorCount++;
                        errors.push(`${day}/${month + 1} - ${shiftType} (${slot}): Nessun utente disponibile`);
                    }
                });
            });
        }

        saveToStorage('shifts', AppState.shifts);

        let html = `
            <div class="results-summary">
                <h4>Risultati Assegnazione Automatica</h4>
                <div class="stat-grid">
                    <div class="stat-item">
                        <div class="stat-value">${assignedCount}</div>
                        <div class="stat-label">Turni Assegnati</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value">${errorCount}</div>
                        <div class="stat-label">Turni Non Assegnati</div>
                    </div>
                </div>
            </div>
        `;

        if (errors.length > 0 && errors.length <= 20) {
            html += '<div class="error-message active"><h4>Turni non assegnati:</h4><ul>';
            errors.forEach(error => {
                html += `<li>${error}</li>`;
            });
            html += '</ul></div>';
        } else if (errors.length > 20) {
            html += `<div class="error-message active">${errorCount} turni non possono essere assegnati per mancanza di personale disponibile.</div>`;
        }

        html += `
            <div class="form-actions mt-3">
                <button class="btn btn-primary" onclick="switchView('shifts')">
                    <span class="material-icons">edit</span>
                    Modifica Turni
                </button>
            </div>
        `;

        resultsContainer.innerHTML = html;
    }, 500);
}

// ===========================
// Excel Export with Color Coding
// ===========================
function openPdfModal() {
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
    openModal('pdfModal');
}

function handlePdfExport(e) {
    e.preventDefault();

    const select = document.getElementById('pdfMonth');
    const [year, month] = select.value.split('-').map(Number);
    const pdfType = document.querySelector('input[name="pdfType"]:checked').value;

    generateExcel(year, month, pdfType);
    closeModal('pdfModal');
}

function generateExcel(year, month, type) {
    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const daysInMonth = getDaysInMonth(year, month);

    // Prepare data array
    const data = [];

    // Header row 1: Shift type names
    const headerRow1 = [''];
    SHIFT_TYPES.forEach(shiftType => {
        const slots = TIME_SLOTS[shiftType];
        headerRow1.push(shiftType);
        for (let i = 1; i < slots.length; i++) {
            headerRow1.push('');
        }
    });
    data.push(headerRow1);

    // Header row 2: Time slots
    const headerRow2 = ['Data'];
    SHIFT_TYPES.forEach(shiftType => {
        const slots = TIME_SLOTS[shiftType];
        slots.forEach(slot => {
            headerRow2.push(slot);
        });
    });
    data.push(headerRow2);

    // Data rows
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dayName = DAY_NAMES[date.getDay()];
        const dateKey = formatDate(year, month, day);
        const isWeekend = date.getDay() === 0 || date.getDay() === 6;

        const row = [`${day} ${dayName}`];

        SHIFT_TYPES.forEach(shiftType => {
            const slots = TIME_SLOTS[shiftType];
            const ambulatoriKey = `${dateKey}_${shiftType}`;

            if (AppState.ambulatoriStatus[ambulatoriKey] === 'closed') {
                slots.forEach(() => row.push('CLOSED'));
            } else {
                slots.forEach(slot => {
                    const shiftKey = `${dateKey}_${shiftType}_${slot}`;
                    const userId = AppState.shifts[shiftKey];
                    if (!userId) {
                        row.push('');
                    } else {
                        const user = AppState.users.find(u => u.id === userId);
                        row.push(user ? user.name : '');
                    }
                });
            }
        });

        data.push(row);
    }

    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(data);

    // Apply column widths
    const colWidths = [{ wch: 12 }]; // Date column
    SHIFT_TYPES.forEach(shiftType => {
        const slots = TIME_SLOTS[shiftType];
        slots.forEach(() => colWidths.push({ wch: 15 }));
    });
    ws['!cols'] = colWidths;

    // Apply cell styles and colors
    const range = XLSX.utils.decode_range(ws['!ref']);

    // Color mapping based on sample file
    const getSlotColor = (slot) => {
        if (slot === 'POM' || slot === 'POM') return 'FFFFF2CC'; // Light yellow for afternoon
        return 'FFFFFFFF'; // White for morning
    };

    for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
            const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
            if (!ws[cellAddress]) continue;

            const cell = ws[cellAddress];
            if (!cell.s) cell.s = {};

            // Header styling
            if (R === 0 || R === 1) {
                cell.s = {
                    fill: { fgColor: { rgb: R === 0 ? 'FFD9D9D9' : 'FFE6E6E6' } },
                    font: { bold: true, sz: 11 },
                    alignment: { horizontal: 'center', vertical: 'center' },
                    border: {
                        top: { style: 'thin', color: { rgb: '00000000' } },
                        bottom: { style: 'thin', color: { rgb: '00000000' } },
                        left: { style: 'thin', color: { rgb: '00000000' } },
                        right: { style: 'thin', color: { rgb: '00000000' } }
                    }
                };
            } else {
                // Data cells
                const dayRow = data[R];
                const isWeekend = dayRow && dayRow[0] && (dayRow[0].includes('Dom') || dayRow[0].includes('Sab'));
                const headerSlot = data[1][C];
                const cellValue = cell.v;

                let fillColor = 'FFFFFFFF'; // Default white

                // Check if cell is closed (bright red)
                if (cellValue === 'CLOSED') {
                    fillColor = 'FFFF0000'; // Bright red for closed shifts
                    cell.v = ''; // Clear the text
                } else if (C === 0 && isWeekend) {
                    // Apply weekend color
                    fillColor = 'FFADB9CA'; // Grayish blue for weekend dates
                } else if (C > 0 && headerSlot) {
                    // Apply color based on time slot
                    if (headerSlot === 'POM') {
                        fillColor = 'FFFFF2CC'; // Light yellow for afternoon
                    } else {
                        fillColor = 'FFFFFFFF'; // White for morning
                    }
                }

                cell.s = {
                    fill: { fgColor: { rgb: fillColor } },
                    font: { sz: 10 },
                    alignment: { horizontal: C === 0 ? 'left' : 'center', vertical: 'center' },
                    border: {
                        top: { style: 'thin', color: { rgb: '00000000' } },
                        bottom: { style: 'thin', color: { rgb: '00000000' } },
                        left: { style: 'thin', color: { rgb: '00000000' } },
                        right: { style: 'thin', color: { rgb: '00000000' } }
                    }
                };
            }
        }
    }

    // Merge header cells for shift types
    const merges = [];
    let colIndex = 1;
    SHIFT_TYPES.forEach(shiftType => {
        const slots = TIME_SLOTS[shiftType];
        if (slots.length > 1) {
            merges.push({
                s: { r: 0, c: colIndex },
                e: { r: 0, c: colIndex + slots.length - 1 }
            });
        }
        colIndex += slots.length;
    });
    ws['!merges'] = merges;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, `${ITALIAN_MONTHS[month]} ${year}`);

    // Generate Excel file
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'binary', cellStyles: true });

    function s2ab(s) {
        const buf = new ArrayBuffer(s.length);
        const view = new Uint8Array(buf);
        for (let i = 0; i < s.length; i++) view[i] = s.charCodeAt(i) & 0xFF;
        return buf;
    }

    const blob = new Blob([s2ab(wbout)], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `turni_${ITALIAN_MONTHS[month]}_${year}_${type}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
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
    document.getElementById('pdfForm').addEventListener('submit', handlePdfExport);

    // Availability
    document.getElementById('saveAvailability').addEventListener('click', saveAvailability);

    // Users
    document.getElementById('addUserBtn').addEventListener('click', openAddUserModal);
    document.getElementById('userForm').addEventListener('submit', handleUserFormSubmit);

    // Auto Assignment
    document.getElementById('runAutoAssign').addEventListener('click', runAutoAssignment);

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
// Initialize Application
// ===========================
document.addEventListener('DOMContentLoaded', () => {
    initializeDefaultData();
    initializeEventListeners();

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
