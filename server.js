const express = require('express');
const cors = require('cors');
const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static('.')); // Serve static files from current directory

// Italian month names
const ITALIAN_MONTHS = [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
];

const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];

// Shift types and time slots (must match frontend)
const SHIFT_TYPES = [
    'SALA Senior', 'SALA Junior', 'REPARTO MATT', 'REPARTO POM', 'UTIC', 'PS', 'RAP', 'ENI',
    'VIS 201', 'VISITE 208', 'TDS 207', 'ECOTT 205', 'ECO 206',
    'ECO spec 204', 'ECO INT', 'CARDIOCHIR', 'Vicenza', 'Ricerca', 'RISERVE'
];

const TIME_SLOTS = {
    'SALA Senior': ['MATT', 'POM'],
    'SALA Junior': ['MATT', 'POM'],
    'REPARTO MATT': ['1', '2', '3'],
    'REPARTO POM': ['1', '2', '3'],
    'UTIC': ['MATT', 'POM'],
    'PS': ['GG', 'NTT'],
    'RAP': ['GG', 'NTT'],
    'ENI': ['MATT', 'POM'],
    'VIS 201': ['GG'],
    'VISITE 208': ['MATT'],
    'TDS 207': ['MATT'],
    'ECOTT 205': ['GG'],
    'ECO 206': ['MATT', 'POM'],
    'ECO spec 204': ['MATT', 'POM'],
    'ECO INT': ['MATT', 'POM'],
    'CARDIOCHIR': ['GG'],
    'Vicenza': ['GG'],
    'Ricerca': ['GG'],
    'RISERVE': ['SS']
};

// Helper function to get days in month
function getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
}

// Color mapping for slots
function getSlotColor(slot, isWeekend) {
    if (isWeekend) {
        if (slot === 'MATT' || slot === '1' || slot === '2' || slot === '3') return 'D0DAE6';
        if (slot === 'POM') return 'C9D6E3';
        if (slot === 'NTT') return 'BEC9D6';
        if (slot === 'GG') return 'C5D3E0';
        if (slot === 'SPEC' || slot === 'SS') return 'C5D3E0';
        return 'D0DAE6'; // Default
    } else {
        if (slot === 'MATT' || slot === '1' || slot === '2' || slot === '3') return 'FFFFFF';
        if (slot === 'POM') return 'FFF2CC';
        if (slot === 'NTT') return 'D9D9D9';
        if (slot === 'GG') return 'E7E6E6';
        if (slot === 'SPEC' || slot === 'SS') return 'CCCCFF';
        return 'FFFFFF'; // Default
    }
}

// API endpoint to generate Excel
app.post('/api/generate-excel', async (req, res) => {
    try {
        const { year, month, type, shifts, ambulatoriStatus, users } = req.body;

        console.log(`Generating Excel for ${ITALIAN_MONTHS[month]} ${year} - ${type}`);

        // Load the template
        const templatePath = path.join(__dirname, 'Novembre 2025.xlsx');
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(templatePath);

        // Get the first worksheet
        const worksheet = workbook.worksheets[0];

        // Update title
        const typeText = type === 'draft' ? 'BOZZA' : 'DEFINITIVO';
        const titleCell = worksheet.getCell('A1');
        titleCell.value = `Turni ${ITALIAN_MONTHS[month]} ${year} - ${typeText}`;

        // Get column headers (row 2 has shift types, row 3 has slots)
        // We'll start filling data from row 4

        const daysInMonth = getDaysInMonth(year, month);
        const startRow = 4; // Data starts at row 4

        // Clear existing data (rows 4 onwards)
        for (let row = startRow; row <= startRow + 50; row++) {
            worksheet.getRow(row).eachCell((cell) => {
                cell.value = null;
            });
        }

        // Fill in data for each day
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dayName = DAY_NAMES[date.getDay()];
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
            const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

            const rowNum = startRow + day - 1;
            const row = worksheet.getRow(rowNum);

            // Set date cell
            const dateCell = row.getCell(1);
            dateCell.value = `${day} ${dayName}`;
            dateCell.font = { bold: true };
            dateCell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: isWeekend ? 'FFADB9CA' : 'FFFFFFFF' }
            };
            dateCell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };

            // Fill in shift assignments
            let colIndex = 2; // Start from column B
            SHIFT_TYPES.forEach(shiftType => {
                const slots = TIME_SLOTS[shiftType];
                const ambulatoriKey = `${dateKey}_${shiftType}`;

                // Check if closed
                const weekendAllowedTypes = ['UTIC', 'PS', 'RAP'];
                const isAutoClosedForWeekend = isWeekend && !weekendAllowedTypes.includes(shiftType);
                const isClosed = ambulatoriStatus[ambulatoriKey] === 'closed' || isAutoClosedForWeekend;

                slots.forEach(slot => {
                    const cell = row.getCell(colIndex);

                    if (isClosed) {
                        cell.value = 'CHIUSO';
                        cell.fill = {
                            type: 'pattern',
                            pattern: 'solid',
                            fgColor: { argb: 'FFFF0000' }
                        };
                        cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
                    } else {
                        const shiftKey = `${dateKey}_${shiftType}_${slot}`;
                        const userId = shifts[shiftKey];

                        if (userId) {
                            const user = users.find(u => u.id === userId);
                            cell.value = user ? (user.code || user.id.toUpperCase()) : '';
                        } else {
                            cell.value = '';
                        }

                        // Apply color based on slot type
                        const bgColor = getSlotColor(slot, isWeekend);
                        cell.fill = {
                            type: 'pattern',
                            pattern: 'solid',
                            fgColor: { argb: 'FF' + bgColor }
                        };

                        // Highlight empty cells in light red
                        if (!userId) {
                            cell.fill = {
                                type: 'pattern',
                                pattern: 'solid',
                                fgColor: { argb: 'FFFFE6E6' }
                            };
                        }

                        cell.font = { color: { argb: 'FF000000' } };
                    }

                    cell.alignment = { horizontal: 'center', vertical: 'middle' };
                    cell.border = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' }
                    };

                    colIndex++;
                });
            });
        }

        // Generate buffer
        const buffer = await workbook.xlsx.writeBuffer();

        // Send the file
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=turni_${ITALIAN_MONTHS[month]}_${year}_${typeText}.xlsx`);
        res.send(buffer);

    } catch (error) {
        console.error('Error generating Excel:', error);
        res.status(500).json({ error: 'Failed to generate Excel file', details: error.message });
    }
});

// API endpoint to generate PDF from Excel
app.post('/api/generate-pdf', async (req, res) => {
    try {
        const { year, month, type, shifts, ambulatoriStatus, users } = req.body;

        console.log(`Generating PDF for ${ITALIAN_MONTHS[month]} ${year} - ${type}`);

        // First generate the Excel file
        const templatePath = path.join(__dirname, 'Novembre 2025.xlsx');
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(templatePath);
        const worksheet = workbook.worksheets[0];

        // Update title
        const typeText = type === 'draft' ? 'BOZZA' : 'DEFINITIVO';
        const titleCell = worksheet.getCell('A1');
        titleCell.value = `Turni ${ITALIAN_MONTHS[month]} ${year} - ${typeText}`;

        const daysInMonth = getDaysInMonth(year, month);
        const startRow = 4;

        // Clear existing data
        for (let row = startRow; row <= startRow + 50; row++) {
            worksheet.getRow(row).eachCell((cell) => {
                cell.value = null;
            });
        }

        // Fill in data (same as Excel generation)
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dayName = DAY_NAMES[date.getDay()];
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
            const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

            const rowNum = startRow + day - 1;
            const row = worksheet.getRow(rowNum);

            const dateCell = row.getCell(1);
            dateCell.value = `${day} ${dayName}`;
            dateCell.font = { bold: true };
            dateCell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: isWeekend ? 'FFADB9CA' : 'FFFFFFFF' }
            };
            dateCell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };

            let colIndex = 2;
            SHIFT_TYPES.forEach(shiftType => {
                const slots = TIME_SLOTS[shiftType];
                const ambulatoriKey = `${dateKey}_${shiftType}`;
                const weekendAllowedTypes = ['UTIC', 'PS', 'RAP'];
                const isAutoClosedForWeekend = isWeekend && !weekendAllowedTypes.includes(shiftType);
                const isClosed = ambulatoriStatus[ambulatoriKey] === 'closed' || isAutoClosedForWeekend;

                slots.forEach(slot => {
                    const cell = row.getCell(colIndex);

                    if (isClosed) {
                        cell.value = 'CHIUSO';
                        cell.fill = {
                            type: 'pattern',
                            pattern: 'solid',
                            fgColor: { argb: 'FFFF0000' }
                        };
                        cell.font = { color: { argb: 'FFFFFFFF' }, bold: true };
                    } else {
                        const shiftKey = `${dateKey}_${shiftType}_${slot}`;
                        const userId = shifts[shiftKey];

                        if (userId) {
                            const user = users.find(u => u.id === userId);
                            cell.value = user ? (user.code || user.id.toUpperCase()) : '';
                        } else {
                            cell.value = '';
                        }

                        const bgColor = getSlotColor(slot, isWeekend);
                        cell.fill = {
                            type: 'pattern',
                            pattern: 'solid',
                            fgColor: { argb: 'FF' + bgColor }
                        };

                        if (!userId) {
                            cell.fill = {
                                type: 'pattern',
                                pattern: 'solid',
                                fgColor: { argb: 'FFFFE6E6' }
                            };
                        }

                        cell.font = { color: { argb: 'FF000000' } };
                    }

                    cell.alignment = { horizontal: 'center', vertical: 'middle' };
                    cell.border = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' }
                    };

                    colIndex++;
                });
            });
        }

        // Save Excel to temp file
        const tempExcelPath = path.join(__dirname, `temp_${Date.now()}.xlsx`);
        await workbook.xlsx.writeFile(tempExcelPath);

        // Convert to PDF using libre-office-convert
        const libre = require('libre-office-convert');
        libre.convertAsync = require('util').promisify(libre.convert);

        const excelBuffer = fs.readFileSync(tempExcelPath);

        // Convert with landscape orientation
        const pdfBuffer = await libre.convertAsync(excelBuffer, '.pdf', undefined);

        // Clean up temp file
        fs.unlinkSync(tempExcelPath);

        // Send PDF
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=turni_${ITALIAN_MONTHS[month]}_${year}_${typeText}.pdf`);
        res.send(pdfBuffer);

    } catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).json({ error: 'Failed to generate PDF file', details: error.message });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`PSDturni backend server running on http://localhost:${PORT}`);
});
