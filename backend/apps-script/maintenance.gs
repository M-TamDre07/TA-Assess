/**
 * TA ASSESS | Backend Maintenance
 *
 * Audit workbook dan konfigurasi tanpa menyentuh jawaban peserta.
 * Gunakan runMaintenanceAudit() untuk pemeriksaan manual.
 *
 * Untuk pemeriksaan rutin, jalankan installMaintenanceTrigger() satu kali.
 */

function runMaintenanceAudit() {
  const started = new Date();
  const result = {
    success: true,
    startedAt: started.toISOString(),
    repaired: [],
    warnings: [],
    properties: {},
    sheets: [],
    analyticsRebuilt: false
  };

  try {
    ensureWorkbook_();
    const workbook = getMaintenanceWorkbook_();

    Object.keys(TA.SHEETS).forEach(function(key) {
      const name = TA.SHEETS[key];
      const sheet = workbook.getSheetByName(name);

      if (!sheet) {
        result.warnings.push(
          'Sheet belum ditemukan setelah ensureWorkbook_: ' + name
        );
        return;
      }

      const expected = expectedHeadersForSheet_(name);
      const header = readHeader_(sheet);
      const headerOk = expected.length === header.length &&
        expected.every(function(value, index) {
          return String(header[index] || '') === String(value);
        });

      if (!headerOk && expected.length) {
        repairHeader_(sheet, expected);
        result.repaired.push('Header diperbaiki: ' + name);
      }

      result.sheets.push({
        name: name,
        rows: Math.max(0, sheet.getLastRow() - 1),
        columns: sheet.getLastColumn(),
        headerOk: headerOk || expected.length === 0
      });
    });

    updateAnalytics_();
    result.analyticsRebuilt = true;

    const props = PropertiesService.getScriptProperties();
    result.properties = {
      spreadsheetIdConfigured: Boolean(
        props.getProperty(TA.PROP_SHEET_ID)
      ),
      verifySecretConfigured: Boolean(
        props.getProperty(TA.PROP_VERIFY_SECRET)
      ),
      serverSharedSecretConfigured: Boolean(
        props.getProperty(TA.PROP_SERVER_SHARED_SECRET)
      ),
      telegramConfigured: Boolean(props.getProperty(TA.PROP_TG_TOKEN)) &&
        Boolean(props.getProperty(TA.PROP_TG_CHAT))
    };

    if (!result.properties.serverSharedSecretConfigured) {
      result.warnings.push(
        'TA_SERVER_SHARED_SECRET belum dikonfigurasi. Submission gateway akan menolak hasil.'
      );
    }

    if (!result.properties.verifySecretConfigured) {
      result.warnings.push(
        'TA_VERIFY_SECRET belum dikonfigurasi. Verifikasi signature belum berada pada mode penuh.'
      );
    }

    result.finishedAt = new Date().toISOString();
    result.durationMs =
      new Date(result.finishedAt).getTime() - started.getTime();

    console.log(JSON.stringify(result));
    return result;
  } catch (error) {
    result.success = false;
    result.error = maintenanceSafeError_(error);
    result.finishedAt = new Date().toISOString();
    console.error(JSON.stringify(result));
    return result;
  }
}

/**
 * Pasang trigger audit harian. Jalankan sekali secara manual.
 * Fungsi ini tidak membuat trigger ganda untuk fungsi yang sama.
 */
function installMaintenanceTrigger() {
  const exists = ScriptApp.getProjectTriggers().some(function(trigger) {
    return trigger.getHandlerFunction() === 'runMaintenanceAudit';
  });

  if (exists) {
    return 'Trigger maintenance sudah tersedia.';
  }

  ScriptApp.newTrigger('runMaintenanceAudit')
    .timeBased()
    .everyDays(1)
    .atHour(3)
    .create();

  return 'Trigger maintenance harian berhasil dibuat.';
}

function getMaintenanceWorkbook_() {
  const id = PropertiesService.getScriptProperties()
    .getProperty(TA.PROP_SHEET_ID);

  if (id) {
    return SpreadsheetApp.openById(id);
  }

  const active = SpreadsheetApp.getActiveSpreadsheet();

  if (!active) {
    throw new Error(
      'Spreadsheet tidak ditemukan. Isi SPREADSHEET_ID atau bind script ke Spreadsheet.'
    );
  }

  return active;
}

function expectedHeadersForSheet_(name) {
  const map = {};
  map[TA.SHEETS.RESULTS] = TA.RESULT_HEADERS;
  map[TA.SHEETS.DIMENSIONS] = TA.DIMENSION_HEADERS;
  map[TA.SHEETS.VERIFY] = TA.VERIFY_HEADERS;
  map[TA.SHEETS.EVENTS] = TA.EVENT_HEADERS;
  map[TA.SHEETS.ASSESSMENTS] = TA.ASSESSMENT_HEADERS;
  map[TA.SHEETS.ANALYTICS] = TA.ANALYTICS_HEADERS;
  map[TA.SHEETS.CONFIG] = TA.CONFIG_HEADERS;
  return map[name] || [];
}

function readHeader_(sheet) {
  if (!sheet.getLastColumn() || !sheet.getLastRow()) {
    return [];
  }

  return sheet
    .getRange(1, 1, 1, sheet.getLastColumn())
    .getValues()[0];
}

function repairHeader_(sheet, expected) {
  if (!expected.length) {
    return;
  }

  sheet
    .getRange(1, 1, 1, expected.length)
    .setValues([expected]);
  sheet.setFrozenRows(1);
}

function maintenanceSafeError_(error) {
  return String(
    error && error.message ? error.message : error || 'Unknown error'
  )
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .slice(0, 400);
}
