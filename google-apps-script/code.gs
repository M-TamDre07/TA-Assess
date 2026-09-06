/**
 * TA ASSESS - Google Apps Script Web App Endpoint
 * ================================================
 * Deploy sebagai Web App (Deploy > New deployment > Web app).
 * - Execute as: akun Anda
 * - Who has access: Anyone
 *
 * Setelah deploy, copy Deployment URL ke CONFIG.GOOGLE_SHEETS_API
 * di js/script.js. JANGAN taruh URL/secret lain di frontend selain URL ini
 * (URL Web App aman untuk publik karena hanya menerima POST, tidak
 * memberi akses baca/tulis langsung ke Sheet).
 *
 * Kolom Sheet (baris pertama harus header ini, urutan harus sama):
 * timestamp | reportId | assessmentId | assessmentName | instrumentVersion |
 * scoringVersion | scores | answersCount | duration | status
 */

const SHEET_NAME = 'TA Assess Results'; // Ganti sesuai nama sheet/tab Anda

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse({ success: false, error: 'No payload received' });
    }

    const data = JSON.parse(e.postData.contents);

    const validationError = validatePayload(data);
    if (validationError) {
      return jsonResponse({ success: false, error: validationError });
    }

    const sheet = getOrCreateSheet();

    sheet.appendRow([
      data.timestamp || new Date().toISOString(),
      data.reportId || '',
      data.assessmentId || '',
      data.assessmentName || '',
      data.instrumentVersion || '',
      data.scoringVersion || '',
      JSON.stringify(data.scores || {}),
      data.answersCount != null ? data.answersCount : '',
      data.duration != null ? data.duration : '',
      data.status || ''
    ]);

    return jsonResponse({ success: true, reportId: data.reportId });
  } catch (error) {
    return jsonResponse({ success: false, error: error.toString() });
  }
}

function doGet(e) {
  // Endpoint ini sengaja TIDAK mendukung GET untuk membaca data —
  // menghindari expose seluruh isi Sheet lewat URL publik.
  // Jika Anda butuh endpoint verifikasi (baca), buat fungsi doGet
  // terpisah yang HANYA mengembalikan field non-sensitif untuk satu
  // reportId spesifik (query param), bukan seluruh sheet.
  return jsonResponse({ success: false, error: 'GET not supported on this endpoint' });
}

function validatePayload(data) {
  if (!data || typeof data !== 'object') return 'Payload bukan object JSON yang valid';
  if (!data.reportId) return 'Field reportId wajib diisi';
  if (!data.assessmentId) return 'Field assessmentId wajib diisi';
  return null;
}

function getOrCreateSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow([
      'timestamp', 'reportId', 'assessmentId', 'assessmentName',
      'instrumentVersion', 'scoringVersion', 'scores', 'answersCount',
      'duration', 'status'
    ]);
  }
  return sheet;
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
