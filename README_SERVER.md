# PSDturni - Backend Server

## ✅ Everything Runs Remotely - No Local Setup Needed!

The PSDturni backend server is **already running** in your remote environment. You don't need to install anything on your local PC.

## Current Status

🟢 **Server is RUNNING on port 3000**

The backend is already configured with:
- Node.js ✅
- All npm dependencies ✅
- LibreOffice (for PDF conversion) ✅
- ExcelJS (for Excel generation) ✅

## How to Access

Simply open the app in your browser:
- If using a web IDE: Access through your IDE's preview/port forwarding
- If using SSH tunnel: Access `http://localhost:3000`
- The server will handle all Excel and PDF generation automatically

## What the Server Does

### Excel Generation (`/api/generate-excel`)
1. Uses the `Novembre 2025.xlsx` template
2. Fills it with your shift data
3. Applies full color coding:
   - **Empty shifts**: Light red (#FFE6E6)
   - **Closed shifts**: Bright red (#FF0000) with white text
   - **Time slots**: MATT (white), POM (yellow), NTT (gray), GG (light gray)
   - **Weekend variations**: Different shades for Saturday/Sunday
4. Returns a downloadable .xlsx file

### PDF Generation (`/api/generate-pdf`)
1. Generates the Excel file (with all colors)
2. Converts it to PDF using LibreOffice
3. Returns a downloadable PDF (horizontal layout, ~2 pages)
4. **All colors and formatting preserved**

## No Installation Required

Everything is handled server-side:
- ✅ No Excel/LibreOffice needed on your PC
- ✅ No Node.js needed on your PC
- ✅ No npm install on your PC
- ✅ Works from any browser

## Testing the Server

The server is already running! Just:
1. Open the app in your browser
2. Log in to PSDturni
3. Navigate to any month
4. Click **"Esporta Excel"** or **"Esporta PDF"**
5. The file downloads with full colors! 🎨

## How It Works

```
Your Browser → Server (port 3000) → ExcelJS + LibreOffice → Download
     ↑                                                            ↓
     └────────────────── Colored file ──────────────────────────┘
```

## Color Coding Reference

| Slot Type | Weekday | Weekend |
|-----------|---------|---------|
| MATT/1/2/3| White   | #D0DAE6 |
| POM       | #FFF2CC | #C9D6E3 |
| NTT       | #D9D9D9 | #BEC9D6 |
| GG        | #E7E6E6 | #C5D3E0 |
| Empty     | #FFE6E6 | #FFE6E6 |
| Closed    | #FF0000 | #FF0000 |

## If You Need to Restart the Server

```bash
# Stop the server
pkill -f "node server.js"

# Start it again
node server.js &
```

## Files

- `server.js` - Backend server (already running)
- `package.json` - Dependencies (already installed)
- `Novembre 2025.xlsx` - Excel template
- `app.js` - Frontend (calls backend APIs)
- `index.html` - Web interface
