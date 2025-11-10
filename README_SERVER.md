# PSDturni - Backend Server Setup

## Overview

The PSDturni backend server provides server-side Excel and PDF generation with full color support and proper formatting.

## Prerequisites

- Node.js (v14 or higher)
- npm (comes with Node.js)
- LibreOffice (for PDF conversion)

## Installation

### 1. Install Node.js Dependencies

```bash
npm install
```

### 2. Install LibreOffice (for PDF conversion)

#### Ubuntu/Debian:
```bash
sudo apt-get update
sudo apt-get install -y libreoffice
```

#### macOS:
```bash
brew install libreoffice
```

#### Windows:
Download and install from https://www.libreoffice.org/download/download/

## Running the Server

### Start the server:

```bash
npm start
```

Or for development with auto-reload:

```bash
npm run dev
```

The server will start on **http://localhost:3000**

## How It Works

### Excel Generation
1. Uses the `Novembre 2025.xlsx` template file
2. Fills it with shift data while preserving formatting
3. Applies color coding based on:
   - Time slots (MATT, POM, NTT, GG)
   - Weekend vs weekday
   - Empty shifts (light red)
   - Closed shifts (bright red)

### PDF Generation
1. Generates Excel file with proper formatting
2. Converts to PDF using LibreOffice
3. Maintains colors and layout in horizontal 2-page format

## API Endpoints

### POST /api/generate-excel
Generates an Excel file with color coding.

**Request Body:**
```json
{
  "year": 2024,
  "month": 10,
  "type": "draft",
  "shifts": {...},
  "ambulatoriStatus": {...},
  "users": [...]
}
```

**Response:** Excel file download

### POST /api/generate-pdf
Generates a PDF file from the Excel template.

**Request Body:** Same as `/api/generate-excel`

**Response:** PDF file download

## Troubleshooting

### Server won't start
- Check if port 3000 is already in use
- Ensure all dependencies are installed (`npm install`)

### PDF generation fails
- Verify LibreOffice is installed: `libreoffice --version`
- Check server logs for specific errors

### Colors not showing in Excel
- Server-side generation should always show colors
- If not, check the template file exists: `Novembre 2025.xlsx`

## File Structure

- `server.js` - Main server file
- `package.json` - Dependencies
- `Novembre 2025.xlsx` - Excel template
- `app.js` - Frontend code (calls backend APIs)

## Color Coding Reference

| Slot Type | Weekday | Weekend |
|-----------|---------|---------|
| MATT/1/2/3| White   | #D0DAE6 |
| POM       | #FFF2CC | #C9D6E3 |
| NTT       | #D9D9D9 | #BEC9D6 |
| GG        | #E7E6E6 | #C5D3E0 |
| Empty     | #FFE6E6 | #FFE6E6 |
| Closed    | #FF0000 | #FF0000 |
