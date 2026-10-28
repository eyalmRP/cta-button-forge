/**
 * CTA Button Forge: the team's shared library and export folder.
 *
 * - Saved team designs are rows in the "Designs" sheet of this spreadsheet.
 * - Files saved with "Save to team Drive" go into the Drive folder "CTA Button Forge exports"
 *   (created on first use, in the Drive of whoever deployed this script). Each batch gets its own subfolder.
 *
 * Deploy as a web app: Execute as "Me", Who has access "Anyone". See SETUP.md.
 */
const SHEET_NAME = 'Designs';
const FOLDER_NAME = 'CTA Button Forge exports';
const HEADERS = ['id', 'name', 'by', 'updatedAt', 'createdAt', 'sample', 'design', 'folder'];
// A sheet cell holds at most 50,000 characters.
const MAX_DESIGN = 49000;

function doGet() {
  return out_({ ok: true, designs: list_(), folderUrl: folder_().getUrl() });
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const q = JSON.parse(e.postData.contents);
    const sh = sheet_(), now = Date.now();
    if (q.action === 'add') {
      const design = JSON.stringify(q.design || null);
      if (design.length > MAX_DESIGN) return out_({ ok: false, error: 'too_big' });
      const id = Utilities.getUuid();
      sh.appendRow([id, text_(q.name, 120), text_(q.by, 60), now, now, text_(q.sample, 500), design, text_(q.folder, 40)]);
      return out_({ ok: true, id });
    }
    if (q.action === 'update') {
      const r = rowOf_(sh, q.id);
      if (!r) return out_({ ok: false, error: 'not_found' });
      if (q.name != null) sh.getRange(r, 2).setValue(text_(q.name, 120));
      if (q.by != null) sh.getRange(r, 3).setValue(text_(q.by, 60));
      if (q.sample !== undefined) sh.getRange(r, 6).setValue(text_(q.sample, 500));
      if (q.folder !== undefined) sh.getRange(r, 8).setValue(text_(q.folder, 40));
      if (q.design) {
        const design = JSON.stringify(q.design);
        if (design.length > MAX_DESIGN) return out_({ ok: false, error: 'too_big' });
        sh.getRange(r, 7).setValue(design);
      }
      sh.getRange(r, 4).setValue(now);
      return out_({ ok: true });
    }
    if (q.action === 'delete') {
      const r = rowOf_(sh, q.id);
      if (r) sh.deleteRow(r);
      return out_({ ok: true });
    }
    if (q.action === 'upload') {
      const root = folder_();
      let f = root;
      // only the export folder itself or one of its own subfolders can be written to
      if (q.folderId) {
        f = DriveApp.getFolderById(String(q.folderId));
        const parents = f.getParents();
        let inside = false;
        while (parents.hasNext()) if (parents.next().getId() === root.getId()) inside = true;
        if (!inside) return out_({ ok: false, error: 'bad_folder' });
      } else if (q.subfolder) {
        f = root.createFolder(text_(q.subfolder, 120, true));
      }
      let saved = 0;
      for (const x of q.files || []) {
        const mime = x.mime === 'image/svg+xml' ? 'image/svg+xml' : 'image/png';
        f.createFile(Utilities.newBlob(Utilities.base64Decode(x.data), mime, text_(x.name, 150, true)));
        saved++;
      }
      return out_({ ok: true, folderId: f.getId(), folderUrl: f.getUrl(), saved });
    }
    return out_({ ok: false, error: 'unknown_action' });
  } catch (err) {
    return out_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(HEADERS);
    sh.setFrozenRows(1);
  } else if (sh.getRange(1, 8).getValue() !== 'folder') {
    // sheets made by the first version of this script get the folder column
    sh.getRange(1, 8).setValue('folder');
  }
  return sh;
}

function folder_() {
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty('FOLDER_ID');
  if (id) {
    try { return DriveApp.getFolderById(id); } catch (e) { /* deleted: make a new one */ }
  }
  const found = DriveApp.getFoldersByName(FOLDER_NAME);
  const f = found.hasNext() ? found.next() : DriveApp.createFolder(FOLDER_NAME);
  props.setProperty('FOLDER_ID', f.getId());
  return f;
}

function list_() {
  const rows = sheet_().getDataRange().getValues().slice(1);
  return rows.filter(r => r[0]).map(r => ({
    id: String(r[0]), name: String(r[1] || 'Untitled'), by: String(r[2] || ''),
    updatedAt: Number(r[3]) || 0, createdAt: Number(r[4]) || 0, sample: r[5] ? String(r[5]) : null, design: parse_(r[6]), folder: r[7] ? String(r[7]) : '',
  })).filter(r => r.design).sort((a, b) => b.updatedAt - a.updatedAt);
}

function rowOf_(sh, id) {
  const n = sh.getLastRow() - 1;
  if (n < 1) return 0;
  const ids = sh.getRange(2, 1, n, 1).getValues();
  for (let i = 0; i < ids.length; i++) if (String(ids[i][0]) === String(id)) return i + 2;
  return 0;
}

// Plain text only: a value starting with = + - @ would otherwise run as a sheet formula.
function text_(s, max, fileName) {
  let t = s == null ? '' : String(s).slice(0, max);
  if (fileName) return t.replace(/[\\/:*?"<>|]/g, '-');
  return /^[=+\-@]/.test(t) ? "'" + t : t;
}

function parse_(s) {
  try { return JSON.parse(s); } catch (e) { return null; }
}

function out_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
