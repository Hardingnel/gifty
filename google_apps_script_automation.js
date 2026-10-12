/**
 * Google Apps Script for Automated Survey Processing
 * ----------------------------------------------------
 * Instructions:
 * 1. Open the Google Sheet linked to your Google Form.
 * 2. Click "Extensions" > "Apps Script".
 * 3. Delete any default code, paste this script, and click "Save" (Disk icon).
 * 4. Click "Triggers" (Clock icon on left panel) > "Add Trigger".
 *    - Choose function: onFormSubmitHandler
 *    - Select event source: From spreadsheet
 *    - Select event type: On form submit
 *    - Click Save.
 */

function onFormSubmitHandler(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  
  // Format the newest response row with clean fonts and borders
  var newRowRange = sheet.getRange(lastRow, 1, 1, lastCol);
  newRowRange.setFontFamily("Segoe UI");
  newRowRange.setFontSize(10);
  newRowRange.setVerticalAlignment("middle");
  
  Logger.log("Processed response at row: " + lastRow);
}

/**
 * Creates a clean CSV export URL for automated pipelines
 */
function getCsvExportUrl() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetId = ss.getId();
  var activeSheetId = ss.getActiveSheet().getSheetId();
  var exportUrl = "https://docs.google.com/spreadsheets/d/" + sheetId + "/export?format=csv&gid=" + activeSheetId;
  Logger.log("Pipeline CSV Export URL: " + exportUrl);
  return exportUrl;
}
