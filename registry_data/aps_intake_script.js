/**
 * APS INTAKE SCRIPT (v2.1)
 * Protocol: HTML Form to Google Sheet
 * Purpose: Receives POST data from GitHub Pages and appends to the active Sheet.
 * * SETUP INSTRUCTIONS:
 * 1. Paste this code into Extensions > Apps Script.
 * 2. Run the 'initialSetup' function once (it will ask for permissions).
 * 3. Deploy as Web App (Execute as: Me, Access: Anyone).
 */

// CONFIGURATION
const SHEET_NAME = 'Sheet1'; // Ensure your Google Sheet tab is named this

const SCRIPT_PROP = PropertiesService.getScriptProperties();

/**
 * Run this function once to link the script to the spreadsheet.
 */
function initialSetup () {
  const activeSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  SCRIPT_PROP.setProperty('key', activeSpreadsheet.getId());
  Logger.log('Setup Complete. Script linked to: ' + activeSpreadsheet.getName());
}

/**
 * Handles the HTTP POST request from the website form.
 */
function doPost (e) {
  const lock = LockService.getScriptLock();
  // Wait up to 10 seconds for concurrent users
  lock.tryLock(10000); 

  try {
    const doc = SpreadsheetApp.openById(SCRIPT_PROP.getProperty('key'));
    const sheet = doc.getSheetByName(SHEET_NAME);

    // Get the headers from Row 1
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const nextRow = sheet.getLastRow() + 1;

    // Map the form data to the headers
    const newRow = headers.map(function(header) {
      // 1. Handle Timestamp automatically
      if (header === 'timestamp') {
        return new Date();
      }
      
      // 2. Handle Checkboxes (Arrays)
      // If multiple checkboxes share a name, they come in as an array. Join them.
      // NOTE: For APS, phenom_ checkboxes are individual, so this is just a fallback.
      if (Array.isArray(e.parameter[header])) {
        return e.parameter[header].join(', ');
      }
      
      // 3. Standard Field Mapping
      // Returns the value if present, or an empty string if blank
      return e.parameter[header] || '';
    });

    // Write the data to the sheet
    sheet.getRange(nextRow, 1, 1, newRow.length).setValues([newRow]);

    // Return Success Message (JSON)
    return ContentService
      .createTextOutput(JSON.stringify({ 'result': 'success', 'row': nextRow }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  catch (e) {
    // Return Error Message (JSON)
    return ContentService
      .createTextOutput(JSON.stringify({ 'result': 'error', 'error': e }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  finally {
    // Release the lock so others can submit
    lock.releaseLock();
  }
}