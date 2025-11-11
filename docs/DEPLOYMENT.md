# PSDturni - Deployment and Setup Guide

## Table of Contents
1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Quick Start](#quick-start)
4. [GitHub Pages Deployment](#github-pages-deployment)
5. [Alternative Hosting Options](#alternative-hosting-options)
6. [Initial Configuration](#initial-configuration)
7. [User Setup](#user-setup)
8. [Backup and Maintenance](#backup-and-maintenance)
9. [Troubleshooting](#troubleshooting)
10. [Security Best Practices](#security-best-practices)

---

## Overview

PSDturni is a static web application that requires no backend server. It can be deployed to any web hosting service that supports static files (HTML, CSS, JavaScript).

### Deployment Characteristics
- **Type**: Static website
- **Files**: HTML, CSS, JavaScript
- **Server Requirements**: None (client-side only)
- **Database**: None (uses browser localStorage)
- **Cost**: Free (when using GitHub Pages or similar)

---

## Prerequisites

### For Deployment
- Git installed locally
- GitHub account (for GitHub Pages deployment)
- Web browser (Chrome, Firefox, Safari, or Edge)
- Text editor (VS Code recommended)

### For Development
- Node.js (optional, for local development server)
- Git
- Modern web browser with developer tools

### Browser Requirements (End Users)
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- JavaScript enabled
- localStorage enabled
- Minimum 1024×768 screen resolution (1920×1080 recommended)

---

## Quick Start

### Option 1: Use Live Version

**Already deployed at**: https://morosss.github.io/PSDturni/

1. Open the URL in your browser
2. Login with default admin credentials:
   - Username: `spizzocri`
   - Password: (provided by administrator)
3. Change password on first login
4. Start using the application

---

### Option 2: Local Development

#### 1. Clone Repository

```bash
git clone https://github.com/morosss/PSDturni.git
cd PSDturni
```

#### 2. Open Locally

**Method A: Direct File**
```bash
# Open index.html directly in browser
open index.html  # macOS
start index.html # Windows
xdg-open index.html # Linux
```

**Method B: Local Server (Recommended)**

Using Python:
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

Using Node.js (http-server):
```bash
npm install -g http-server
http-server -p 8000
```

Using PHP:
```bash
php -S localhost:8000
```

Then open: http://localhost:8000

---

## GitHub Pages Deployment

### Initial Setup

#### 1. Fork or Create Repository

```bash
# If starting from scratch
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/PSDturni.git
git push -u origin main
```

#### 2. Enable GitHub Pages

1. Go to repository settings on GitHub
2. Navigate to "Pages" section (left sidebar)
3. Under "Source", select:
   - Branch: `main`
   - Folder: `/ (root)`
4. Click "Save"
5. Wait 1-2 minutes for deployment
6. Access site at: `https://YOUR_USERNAME.github.io/PSDturni/`

---

### Updating Deployment

```bash
# Make changes to files
git add .
git commit -m "Description of changes"
git push origin main
```

**Note**: GitHub Pages automatically redeploys on push to main branch (1-2 minute delay)

---

### Custom Domain (Optional)

#### 1. Configure DNS

Add CNAME record:
```
Type: CNAME
Name: turni (or your subdomain)
Value: YOUR_USERNAME.github.io
```

#### 2. Configure GitHub

1. In repository settings > Pages
2. Add custom domain: `turni.yourdomain.com`
3. Wait for DNS check (can take 24-48 hours)
4. Enable "Enforce HTTPS"

#### 3. Update Repository

Create `CNAME` file in root:
```
turni.yourdomain.com
```

Commit and push:
```bash
git add CNAME
git commit -m "Add custom domain"
git push origin main
```

---

## Alternative Hosting Options

### 1. Netlify

#### Deployment via Git

1. Create Netlify account
2. Click "New site from Git"
3. Connect GitHub repository
4. Configure:
   - Build command: (leave empty)
   - Publish directory: `/`
5. Click "Deploy site"

#### Deployment via Drag & Drop

1. Log into Netlify
2. Drag project folder to deployment area
3. Wait for deployment
4. Access provided URL

**Advantages**:
- Automatic HTTPS
- Custom domains free
- Instant previews
- Form handling (if needed)

---

### 2. Vercel

#### Deployment via Git

```bash
npm install -g vercel
cd PSDturni
vercel
```

Follow prompts:
- Set up and deploy: Yes
- Scope: Your account
- Link to existing project: No
- Project name: PSDturni
- Directory: ./
- Override settings: No

#### Web Interface

1. Visit vercel.com
2. Click "Import Project"
3. Connect GitHub repository
4. Deploy

**Advantages**:
- Automatic HTTPS
- Edge network (fast globally)
- Preview deployments
- Analytics

---

### 3. Cloudflare Pages

1. Log into Cloudflare
2. Go to Pages
3. Create project
4. Connect Git repository
5. Configure:
   - Build command: (none)
   - Build output directory: `/`
6. Deploy

**Advantages**:
- Cloudflare CDN
- Unlimited bandwidth
- DDoS protection
- Web analytics

---

### 4. Self-Hosted (Apache)

#### Apache Configuration

```apache
<VirtualHost *:80>
    ServerName turni.hospital.local
    DocumentRoot /var/www/PSDturni

    <Directory /var/www/PSDturni>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted

        # Enable HTML5 History API (if needed)
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>

    # Security headers
    Header set X-Content-Type-Options "nosniff"
    Header set X-Frame-Options "SAMEORIGIN"
    Header set X-XSS-Protection "1; mode=block"

    ErrorLog ${APACHE_LOG_DIR}/psdturni_error.log
    CustomLog ${APACHE_LOG_DIR}/psdturni_access.log combined
</VirtualHost>
```

#### Nginx Configuration

```nginx
server {
    listen 80;
    server_name turni.hospital.local;
    root /var/www/PSDturni;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Security headers
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Logging
    access_log /var/log/nginx/psdturni_access.log;
    error_log /var/log/nginx/psdturni_error.log;
}
```

---

### 5. Internal Network (No Internet)

For hospitals with no internet access:

1. Set up local web server (Apache/Nginx)
2. Copy files to server document root
3. Configure internal DNS or use IP address
4. Access via: `http://192.168.1.100/PSDturni/`

**Note**: Each browser will have separate localStorage data

---

## Initial Configuration

### 1. Update Default Users

Edit `app.js` line 205-236 to update default users:

```javascript
const defaultUsers = [
    {
        id: 'admin',
        name: 'Administrator',
        code: 'ADMIN',
        role: 'admin',
        specialty: 'Administrator',
        password: null, // Will set on first login
        capabilities: SHIFT_TYPES,
        canDoREP: true
    },
    // Add your hospital staff here
];
```

### 2. Customize Shift Types (Optional)

Edit `app.js` lines 7-32 to modify shift types:

```javascript
const SHIFT_TYPES = [
    'Your Shift Type 1',
    'Your Shift Type 2',
    // ...
];

const TIME_SLOTS = {
    'Your Shift Type 1': ['MATT', 'POM'],
    // ...
};
```

### 3. Configure Hospital Logo (Optional)

To add hospital logo to PDF exports:

1. Convert logo to base64:
   ```bash
   base64 logo.png > logo_base64.txt
   ```

2. Add to `app.js` in `generatePDF()` function:
   ```javascript
   const logoData = 'data:image/png;base64,YOUR_BASE64_STRING';
   doc.addImage(logoData, 'PNG', 10, 10, 30, 30);
   ```

### 4. Set Application Title (Optional)

Edit `index.html` line 6:

```html
<title>Your Hospital Name - Shift Management</title>
```

Edit `index.html` line 15:

```html
<h1>Your Hospital Name</h1>
```

---

## User Setup

### First-Time Admin Setup

#### 1. Access Application

Open deployed URL in browser

#### 2. Admin First Login

1. Username: `spizzocri` (or your custom admin ID)
2. Password: (leave empty for first login)
3. Set new password (minimum 6 characters)
4. Click "Set Password"

#### 3. Add Users

1. Navigate to "Utenti" (Users)
2. Click "Aggiungi Utente" (Add User)
3. Fill form:
   - **Nome Completo**: Full name (e.g., "Dott. Mario Rossi")
   - **ID Utente**: Username (e.g., "mrossi")
   - **Codice**: Short code for calendar (e.g., "MARIO")
   - **Ruolo**: Role (Admin or User)
   - **Specialità**: Specialty
   - **Email**: Optional email
   - **Turni Assegnabili**: Check shift types user can work
   - **Può fare REP**: Check if user can do ward rounds
4. Click "Salva Utente" (Save User)
5. Repeat for all users

#### 4. Test User Login

1. Logout (top right menu)
2. Login as new user (no password on first login)
3. Set password
4. Verify access

---

### User Onboarding Email Template

```
Subject: PSDturni - Hospital Shift Management System Access

Dear Dr. [NAME],

You now have access to the PSDturni shift management system.

Access Details:
- URL: https://turni.hospital.it/
- Username: [USERNAME]
- Password: (none - set on first login)

First Login Steps:
1. Open the URL above
2. Enter your username
3. Leave password field empty
4. Click "Login"
5. Set your personal password (minimum 6 characters)

Features:
- View your assigned shifts
- Declare unavailability for upcoming months
- Change your password anytime

Important:
- Declare unavailability before the 20th of the previous month
- Example: For December shifts, submit by November 20th

Support:
Contact the administrator if you have any issues.

Best regards,
IT Department
```

---

## Backup and Maintenance

### Manual Backup

#### Export Data

Add this function to `app.js`:

```javascript
function exportBackup() {
    const backup = {
        users: localStorage.getItem('users'),
        shifts: localStorage.getItem('shifts'),
        availability: localStorage.getItem('availability'),
        ambulatoriStatus: localStorage.getItem('ambulatoriStatus'),
        approvalStatus: localStorage.getItem('approvalStatus'),
        shiftVersions: localStorage.getItem('shiftVersions'),
        timestamp: new Date().toISOString()
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

Call from browser console:
```javascript
exportBackup();
```

#### Import Data

```javascript
function importBackup(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const backup = JSON.parse(e.target.result);

        if (confirm('This will overwrite all data. Continue?')) {
            Object.keys(backup).forEach(key => {
                if (key !== 'timestamp') {
                    localStorage.setItem(key, backup[key]);
                }
            });
            location.reload();
        }
    };
    reader.readAsText(file);
}
```

Use file input:
```html
<input type="file" onchange="importBackup(this.files[0])">
```

---

### Automated Backup Strategy

#### 1. Browser Extension

Use browser extension to auto-export localStorage:
- Chrome: "localStorage Manager"
- Firefox: "Storage Area Explorer"

Schedule daily backups

#### 2. Backend Sync (Advanced)

Create backend API to periodically sync localStorage:

```javascript
// Auto-sync every 6 hours
setInterval(() => {
    const data = {
        users: localStorage.getItem('users'),
        shifts: localStorage.getItem('shifts'),
        // ...
    };

    fetch('https://api.hospital.it/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });
}, 6 * 60 * 60 * 1000);
```

---

### Monthly Maintenance Tasks

#### Checklist

- [ ] Export PDF of approved shifts
- [ ] Backup localStorage data
- [ ] Check storage usage
- [ ] Review user list (add/remove users)
- [ ] Clean old availability data (>6 months)
- [ ] Delete old versions (keep last 10)
- [ ] Test PDF export functionality
- [ ] Verify all users can login
- [ ] Check for browser updates
- [ ] Review error logs (browser console)

---

## Troubleshooting

### Common Issues

#### 1. Login Issues

**Problem**: Cannot login

**Solutions**:
- Check username (case-sensitive, lowercase)
- First login? Leave password empty
- Clear browser cache and try again
- Check browser console for errors (F12)
- Verify localStorage is enabled

#### 2. Data Not Saving

**Problem**: Changes not persisting

**Solutions**:
- Check localStorage is enabled
- Check storage quota (might be full)
- Clear old data
- Try different browser
- Check browser console for errors

**Check Storage Size**:
```javascript
// In browser console
let size = 0;
for (let key in localStorage) {
    size += localStorage[key].length;
}
console.log(`Storage used: ${(size / 1024).toFixed(2)} KB`);
```

#### 3. PDF Export Not Working

**Problem**: PDF doesn't download

**Solutions**:
- Check browser allows downloads
- Try different browser
- Check browser console for errors
- Verify jsPDF library loaded
- Disable browser extensions temporarily

#### 4. Slow Performance

**Problem**: Application running slowly

**Solutions**:
- Clear browser cache
- Delete old shift data
- Reduce number of saved versions
- Close other browser tabs
- Update browser
- Check CPU/memory usage

#### 5. Data Loss

**Problem**: All data disappeared

**Solutions**:
- Check if using same browser/device
- Check if browser data was cleared
- Restore from backup
- Contact administrator
- Check if localStorage was disabled

---

### Browser Console Debugging

Open console (F12) and check for errors:

```javascript
// Check if data exists
console.log('Users:', localStorage.getItem('users'));
console.log('Shifts:', localStorage.getItem('shifts'));

// Check current state
console.log('AppState:', AppState);

// Check logged in user
console.log('Current user:', AppState.currentUser);

// Test storage
localStorage.setItem('test', 'hello');
console.log('Test:', localStorage.getItem('test'));
```

---

## Security Best Practices

### 1. HTTPS

**Always use HTTPS in production**

- GitHub Pages: Automatic
- Custom domain: Enable in settings
- Self-hosted: Configure SSL certificate

**Why**: Protects data in transit

---

### 2. Password Policy

**Enforce strong passwords**:

Edit `app.js` password validation:

```javascript
function validatePassword(password) {
    if (password.length < 8) {
        return { valid: false, error: 'Minimum 8 characters' };
    }

    if (!/[A-Z]/.test(password)) {
        return { valid: false, error: 'Must include uppercase letter' };
    }

    if (!/[0-9]/.test(password)) {
        return { valid: false, error: 'Must include number' };
    }

    return { valid: true };
}
```

---

### 3. Regular Audits

**Monthly Security Checklist**:

- [ ] Review user list (remove inactive users)
- [ ] Check for unauthorized logins (if logging added)
- [ ] Update browsers to latest version
- [ ] Review password strength
- [ ] Check for suspicious activity
- [ ] Backup all data
- [ ] Test restore procedure

---

### 4. Access Control

**Limit admin access**:
- Only 1-2 admin users
- Use unique admin usernames (not "admin")
- Rotate admin passwords quarterly
- Log admin actions (if logging added)

---

### 5. Data Privacy

**GDPR Considerations** (if applicable):

- Store only necessary data
- Don't collect sensitive medical data
- Inform users about data storage (localStorage)
- Provide data export functionality
- Allow users to delete their data
- Document data retention policy

---

## Monitoring (Optional)

### Add Google Analytics

Add to `index.html` before `</head>`:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

### Error Tracking (Sentry)

Add to `index.html` before `</head>`:

```html
<script
  src="https://js.sentry.io/SDK_URL"
  crossorigin="anonymous"
></script>
<script>
  Sentry.init({
    dsn: 'YOUR_DSN',
    environment: 'production'
  });
</script>
```

---

## Production Checklist

Before going live:

- [ ] Update default users
- [ ] Set strong admin password
- [ ] Configure HTTPS
- [ ] Test on all target browsers
- [ ] Test on mobile devices
- [ ] Test PDF export
- [ ] Test Excel export
- [ ] Verify all features work
- [ ] Set up backup strategy
- [ ] Document admin procedures
- [ ] Train users
- [ ] Plan rollout communication
- [ ] Establish support process
- [ ] Monitor first week closely

---

## Scaling Considerations

### When to Add Backend

Consider backend API when:
- More than 50 users
- Need multi-device sync
- Need real-time collaboration
- Need automated backups
- Need audit logging
- Need email notifications
- Need mobile app

### Migration Path

1. Keep current frontend
2. Add Node.js/Express backend
3. Add PostgreSQL database
4. Migrate localStorage data to DB
5. Add API endpoints
6. Update frontend to use API
7. Add authentication (JWT)
8. Add real-time features (WebSockets)

---

## Support and Maintenance

### Documentation

- **User Guide**: GUIDA_RAPIDA.md
- **Features**: docs/FEATURES.md
- **API Reference**: docs/API_REFERENCE.md
- **Architecture**: docs/ARCHITECTURE.md
- **Database Schema**: docs/DATABASE_SCHEMA.md

### Community

- **Repository**: https://github.com/morosss/PSDturni
- **Issues**: Report bugs via GitHub Issues
- **Updates**: Check repository for new releases

---

## Conclusion

PSDturni is designed for simple, fast deployment with zero infrastructure costs. The static nature makes it ideal for small-to-medium hospital departments with limited IT resources.

For questions or support, contact the system administrator or open an issue on GitHub.

---

**Last Updated**: November 2025
**Version**: 1.0.0
