/**
 * GGU Wallet Registration: Google Sheets backend.
 *
 * 1. Create a new Google Sheet (this is where entries land).
 * 2. Extensions → Apps Script. Delete the sample code, paste this file.
 * 3. Change ADMIN_KEY below to a password only you know.
 * 4. Deploy → New deployment → type "Web app".
 *      Execute as: Me
 *      Who has access: Anyone
 *    Copy the Web app URL and paste it into SCRIPT_URL in index.html.
 */

const ADMIN_KEY = 'change-me-to-something-long';
const SHEET_NAME = 'Registrations';
const HEADERS = ['timestamp', 'name', 'address', 'wallet', 'signature', 'message', 'issued'];

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(HEADERS);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
  }
  return sh;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/** Student submits a registration. One row per wallet address; re-registering updates it. */
function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const d = JSON.parse(e.postData.contents || '{}');
    const name = String(d.name || '').replace(/\s+/g, ' ').trim().slice(0, 80);
    const address = String(d.address || '').trim();
    const signature = String(d.signature || '').trim();
    const message = String(d.message || '').slice(0, 1000);

    if (name.length < 2) return json_({ ok: false, error: 'Missing name.' });
    if (!/^0x[0-9a-fA-F]{40}$/.test(address)) return json_({ ok: false, error: 'Invalid wallet address.' });
    if (!/^0x[0-9a-fA-F]{130}$/.test(signature)) return json_({ ok: false, error: 'Missing or invalid signature.' });
    if (message.indexOf(address) === -1 || message.indexOf(name) === -1) {
      return json_({ ok: false, error: 'Signed message does not match the name and address.' });
    }

    // Guard spreadsheet formulas: a cell starting with = + - @ would be run by Sheets.
    const safe = (s) => (/^[=+\-@]/.test(s) ? "'" + s : s);
    const row = [new Date(), safe(name), address, safe(String(d.wallet || '').slice(0, 60)), signature, safe(message), String(d.issued || '')];

    const sh = sheet_();
    const last = sh.getLastRow();
    if (last > 1) {
      const addrs = sh.getRange(2, 3, last - 1, 1).getValues();
      for (let i = 0; i < addrs.length; i++) {
        if (String(addrs[i][0]).toLowerCase() === address.toLowerCase()) {
          sh.getRange(i + 2, 1, 1, row.length).setValues([row]);
          return json_({ ok: true, updated: true });
        }
      }
    }
    sh.appendRow(row);
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: 'Server error: ' + err.message });
  } finally {
    lock.releaseLock();
  }
}

/** Instructor view: returns all entries when the admin key matches. */
function doGet(e) {
  if (!e.parameter.key || e.parameter.key !== ADMIN_KEY) return json_({ ok: false, error: 'Wrong admin key.' });
  const sh = sheet_();
  const values = sh.getDataRange().getValues();
  const head = values.shift();
  const entries = values.map((r) => {
    const o = {};
    head.forEach((h, i) => { o[h] = r[i] instanceof Date ? r[i].toISOString() : r[i]; });
    return o;
  });
  return json_({ ok: true, entries });
}
