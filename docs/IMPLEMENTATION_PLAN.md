# PSDturni - Implementation Plan for New Features

## Overview
This document outlines the implementation plan for the requested features and bug fixes.

---

## 1. Fix Calendario Page - Identical to Gestione Turni

### Current State
- Calendario shows simplified view
- Different column structure than Gestione Turni

### Target State
- Calendario should have identical column structure to Gestione Turni
- All shift types and time slots visible
- Read-only view for users, editable for admins

### Implementation Steps
1. Update `renderCalendar()` function in app.js
2. Use same table structure as Gestione Turni
3. Make cells read-only for regular users
4. Keep color coding and user codes

### Files to Modify
- `app.js`: renderCalendar() function (~line 499-550)
- `styles.css`: Calendar table styles

---

## 2. Improve Assegnazione Automatica Page

### Current State
- Basic form layout
- Limited visual feedback
- No personalization options

### Target State
- Modern, responsive UI with cards/sections
- More visual feedback during generation
- Personalization options:
  - Generate only specific shift types
  - Prioritize certain users
  - Set max/min shifts per user
  - Preview before applying
  - Show progress bar during generation

### Implementation Steps
1. Redesign UI with Material Design cards
2. Add shift type selector (checkboxes)
3. Add user priority settings
4. Add progress indicator
5. Add preview mode
6. Improve results display with charts

### Files to Modify
- `app.js`: renderAutoAssign() function
- `index.html`: Auto-assign view structure
- `styles.css`: Auto-assign styling

---

## 3. Fix Assegna Turno Warning Logic

### Current State
- Shows warning for all users
- No specific reason provided

### Target State
- Warning ONLY for greyed-out users
- Specific warning messages:
  - "Questo utente ha inserito indisponibilità"
  - "Questo utente non è abilitato al turno"
  - "Questo utente ha già un turno in conflitto"

### Implementation Steps
1. Fix validation logic in `validateShiftAssignment()`
2. Return specific warning reasons
3. Update modal to show warning message
4. Grey out incompatible users in selection modal

### Files to Modify
- `app.js`: validateShiftAssignment(), assignShift() functions

---

## 4. Email Management Page (NEW)

### Questions Needed
**Q1**: Do you have an email backend/API to send emails, or should this:
- A) Open default email client with mailto: links?
- B) Copy email addresses to clipboard?
- C) Generate a contact list to export?
- D) Integrate with a service (SendGrid, Mailgun, etc.)?

### Proposed Implementation (Option A - mailto)
1. New page "Gestione Email"
2. Select recipients:
   - All users
   - Only admins
   - Only regular users
   - Custom selection (checkboxes)
3. Email template editor with placeholders
4. Preview and send options

### Implementation Steps
1. Add new view "email-management"
2. Create recipient selection UI
3. Create email template editor
4. Generate mailto: link with BCC
5. Or export recipient list

### Files to Modify
- `app.js`: Add renderEmailManagement() function
- `index.html`: Add email management view
- `styles.css`: Email page styling

---

## 5. Improve Auto-Assignment Algorithm

### Current Issues
- Same people get same shifts repeatedly
- No balance across different ambulatori
- Need better randomization

### Target State
- Balanced distribution:
  - Total shifts per person
  - Shifts per ambulatorio per person
  - Example: If user can do 208 and 207, should do roughly equal in both
- More randomization in selection

### Implementation Strategy
1. Track shifts per ambulatorio per user
2. When assigning, prefer users with fewer shifts in that ambulatorio
3. Add randomization factor (shuffle candidates with similar counts)
4. Balance constraints:
   - Equal distribution of ambulatorio shifts
   - Respect min/max limits per shift type
   - Maintain load balancing overall

### Algorithm Pseudocode
```javascript
For each day and shift:
  1. Get eligible users (has capability, available)
  2. Calculate for each user:
     - Total shifts this month
     - Shifts in this specific ambulatorio this month
  3. Score = (totalShifts * 2) + ambulatorioShifts + random(0, 1)
  4. Sort by score (ascending)
  5. Assign to user with lowest score
```

### Files to Modify
- `app.js`: runAutoAssignment() function

---

## 6. Fix Gestione Indisponibilità & Panoramica

### Current Issues
- Gestione indisponibilità not syncing with panoramica
- Panoramica layout not optimal

### Target State - Panoramica
**New Layout:**
- Rows: Days of month (1-30/31)
- Each day has 3 sub-rows: Mattina | Pomeriggio | Notte
- Columns: User nicknames (codes, not full names)
- Cells: Bright red (#ff0000) if unavailable, white if available
- Compact, fits on one PDF page

**Example:**
```
          | PIZ | GAS | AGR | ECR | ...
Day 1 M   |     | RED |     |     |
      P   |     |     | RED |     |
      N   | RED |     |     |     |
Day 2 M   |     |     |     |     |
      P   | RED |     |     |     |
      N   |     |     |     | RED |
```

### Implementation Steps
1. Fix availability saving in gestione indisponibilità
2. Redesign panoramica with transposed layout
3. Use bright red for unavailable cells
4. Update PDF export to fit one page
5. Optimize table layout for readability

### Files to Modify
- `app.js`: saveAvailability(), renderAvailabilityOverview(), exportAvailabilityPdf()
- `styles.css`: Availability table styling

---

## 7. Excel Export Matching Sample

### Questions Needed
**Q2**: Can you describe the Excel sample format? I cannot read binary .xlsx file directly. Please provide:
- Column headers
- Row structure
- Color coding rules
- Font styles
- Cell merging rules
- Any formulas or special formatting

### Proposed Implementation
Once format is clarified:
1. Use SheetJS library (already included)
2. Create exact column structure
3. Apply color coding:
   - Weekends: grey background
   - Headers: bold + colored
   - User names: colored by user
4. Apply fonts and borders
5. Set column widths
6. Add any formulas needed

### Files to Modify
- `app.js`: generateExcel() function

---

## 8. Statistiche Page (NEW)

### Target State
**Features:**
- View selector: Month view | Year view
- Month selector: All months with data
- Year selector: 2025, 2026, etc.

**Month View:**
- Table: User | Total Shifts | Shift Breakdown by Type
- Bar chart: Shifts per user
- Pie chart: Shift distribution by type
- Heatmap: Users vs Shift Types
- Coverage table: Which users cover each ambulatorio

**Year View:**
- Line chart: Shifts per month (all users)
- Stacked bar chart: Shifts by type per month
- Summary table: Totals per user for year
- Trend analysis

**Visual Components:**
- Use Chart.js or similar library
- Modern cards with shadows
- Responsive grid layout
- Export statistics as PDF/Excel

### Implementation Steps
1. Add Chart.js library (CDN)
2. Create new view "statistics"
3. Add month/year selectors
4. Calculate statistics from AppState.shifts
5. Create chart rendering functions
6. Design responsive card layout
7. Add export functionality

### Files to Modify
- `app.js`: Add renderStatistics() function
- `index.html`: Add statistics view, include Chart.js
- `styles.css`: Statistics page styling

---

## Implementation Order

### Phase 1 - Bug Fixes (High Priority)
1. ✅ Fix Calendario columns (1-2 hours)
2. ✅ Fix Assegna Turno warnings (1 hour)
3. ✅ Fix Gestione Indisponibilità sync (2 hours)

### Phase 2 - Algorithm Improvements (High Priority)
4. ✅ Improve auto-assignment balance (3-4 hours)

### Phase 3 - UI Improvements (Medium Priority)
5. ✅ Improve Assegnazione Automatica UI (2-3 hours)
6. ✅ Improve Panoramica layout (2 hours)

### Phase 4 - New Features (Medium Priority)
7. ✅ Excel export matching sample (2-3 hours) - *pending format details*
8. ✅ Email Management page (2-3 hours) - *pending backend decision*

### Phase 5 - Statistics Feature (Lower Priority)
9. ✅ Statistics page with charts (4-5 hours)

**Total Estimated Time: 20-26 hours**

---

## Questions for Clarification

### Q1: Email Functionality
How should the email system work?
- A) Open mailto: links (no backend needed)
- B) Copy addresses to clipboard
- C) Export contact list
- D) Integrate with email service (requires API)

**Recommendation**: Start with Option A (mailto:) for simplicity, can enhance later.

---

### Q2: Excel Sample Format
Please describe the Excel sample structure:
- What are the column headers?
- What are the row labels?
- What color coding is used?
- Any special formatting (merged cells, formulas)?
- Should it match the PDF exactly?

**Alternative**: If you can open the Excel file and describe it, or share a screenshot, that would help.

---

### Q3: Balance Algorithm Details
For ambulatorio balancing, should the system:
- Ensure each user does roughly equal shifts in each ambulatorio they're capable of?
- Or ensure overall distribution is balanced across all users?
- What's more important: individual balance or overall coverage?

**Example**:
- User A can do 206, 207, 208
- User B can do 206, 207
- Should A do 33% in each, or should we balance based on total availability?

**Recommendation**: Prioritize even distribution within each user's capabilities.

---

## Testing Plan

### Test Cases
1. **Calendario**: Verify all columns match Gestione Turni
2. **Warnings**: Test each warning scenario (unavailable, no capability, conflict)
3. **Sync**: Save availability, verify panoramica updates
4. **Balance**: Generate shifts multiple times, verify distribution
5. **Statistics**: Generate stats, verify accuracy
6. **Email**: Test recipient selection and email generation
7. **Excel**: Export and verify format matches sample

---

## Documentation Updates

After implementation:
1. Update FEATURES.md with new features
2. Update API_REFERENCE.md with new functions
3. Update USER_GUIDE.md with usage instructions
4. Update ARCHITECTURE.md if architecture changes
5. Update README.md with new features

---

## Next Steps

1. **Get clarifications** on Q1, Q2, Q3
2. **Review and approve** implementation plan
3. **Start Phase 1** (bug fixes)
4. **Iterate** through phases
5. **Test** each feature
6. **Update documentation**
7. **Commit and push** changes

---

**Created**: 2025-11-11
**Status**: Awaiting Clarifications
