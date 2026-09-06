// ============================================
// TA ASSESS V2 - Main Application Logic & Scoring Engine
// ============================================

// ============================================
// Configuration
// Placeholder KOSONG secara default. Fitur terkait akan disabled
// dengan graceful fallback selama placeholder belum diisi.
// Jangan pernah taruh secret/token asli di sini (frontend = publik).
// ============================================

const CONFIG = {
    GOOGLE_SHEETS_API: '',   // Isi dengan URL Web App dari google-apps-script/code.gs setelah deploy
    FORMSPREE_LINK: '',      // Isi dengan link form feedback (Formspree/TypeForm)
    SAWERIA_LINK: '',        // Isi dengan link donasi Saweria
    CONTACT_EMAIL: '',       // Isi dengan email kontak
    TELEGRAM_WEBHOOK_URL: '' // Opsional, lihat docs/SETUP.md — TIDAK BOLEH diisi token bot di frontend
};

function isConfigured(value) {
    return typeof value === 'string' && value.trim().length > 0;
}

// ============================================
// State Management
// ============================================

let currentAssessmentId = null;

// ============================================
// Initialize Application
// ============================================

if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function() {
        if (typeof checkAssessmentData === 'function') {
            checkAssessmentData();
        }
        initializeAssessments();
        setupEventListeners();
        updatePlaceholders();
    });
}

// ============================================
// Assessment Display
// ============================================

function initializeAssessments() {
    const container = document.getElementById('assessmentsContainer');
    if (!container) return;

    container.innerHTML = '';
    Object.values(assessments).forEach(assessment => {
        container.appendChild(createAssessmentCard(assessment));
    });
}

function createAssessmentCard(assessment) {
    const card = document.createElement('div');
    card.className = 'assessment-card';

    const statusClass = assessment.details.developmentStatus.toLowerCase();

    card.innerHTML = `
        <div class="assessment-status ${statusClass}">
            ${assessment.details.developmentStatus}
        </div>
        <h3>${assessment.name}</h3>
        <p class="assessment-description">${assessment.description}</p>
        <div class="assessment-items">
            <strong>Durasi:</strong> ${assessment.details.timeEstimate}<br>
            <strong>Jumlah Soal:</strong> ${assessment.details.items}<br>
            <strong>Kategori:</strong> ${assessment.category}
        </div>
        <button class="assessment-button" onclick="openAssessmentDetail('${assessment.id}')">
            Lihat Detail
        </button>
    `;
    return card;
}

function openAssessmentDetail(assessmentId) {
    const assessment = findAssessmentById(assessmentId);
    if (!assessment) return;

    const modal = document.getElementById('assessmentModal');
    const modalBody = document.getElementById('modalBody');

    const dimensionsHtml = assessment.dimensions
        .map(dim => `<li><strong>${dim.name}:</strong> ${dim.description}</li>`)
        .join('');

    modalBody.innerHTML = `
        <div class="modal-detail">
            <h2>${assessment.name}</h2>
            <p><strong>ID:</strong> ${assessment.id} &nbsp;|&nbsp; <strong>Status:</strong> ${assessment.details.developmentStatus}</p>
            <p><strong>Tujuan:</strong> ${assessment.details.purpose}</p>

            <div class="modal-info">
                <div class="modal-info-item"><strong>Jumlah Soal</strong>${assessment.details.items}</div>
                <div class="modal-info-item"><strong>Durasi</strong>${assessment.details.timeEstimate}</div>
                <div class="modal-info-item"><strong>Skala</strong>${assessment.details.scaleLabel}</div>
                <div class="modal-info-item"><strong>Populasi Sasaran</strong>${assessment.details.targetPopulation}</div>
            </div>

            <h4>Dimensi yang Dieksplorasi:</h4>
            <ul>${dimensionsHtml}</ul>

            <p><strong>Penggunaan yang disarankan:</strong> ${assessment.details.intendedUse}</p>
            <p><strong>Tidak untuk:</strong> ${assessment.details.excludedUse}</p>
            <p style="font-size:0.85rem;color:var(--text-light);"><strong>Status validasi:</strong> ${assessment.details.validationStatus}. Ini adalah asesmen ${assessment.details.developmentStatus.toLowerCase()} untuk eksplorasi diri, bukan instrumen psikologi tervalidasi/tersertifikasi.</p>

            <button class="modal-start-button" onclick="startAssessment('${assessment.id}')">
                Mulai Asesmen
            </button>
        </div>
    `;

    modal.style.display = 'block';
}

function findAssessmentById(id) {
    return Object.values(assessments).find(a => a.id === id);
}

function startAssessment(assessmentId) {
    currentAssessmentId = assessmentId;
    const modal = document.getElementById('assessmentModal');
    if (modal) modal.style.display = 'none';
    window.location.href = `test.html?id=${assessmentId}`;
}

// ============================================
// Modal Handling
// ============================================

function setupEventListeners() {
    const modal = document.getElementById('assessmentModal');
    const closeBtn = document.querySelector('.close');
    if (!modal || !closeBtn) return;

    closeBtn.onclick = function() { modal.style.display = 'none'; };
    window.onclick = function(event) {
        if (event.target == modal) modal.style.display = 'none';
    };
}

// ============================================
// ID Generator — SATU fungsi, dipakai konsisten untuk
// reportId / assessmentId / QR / Google Sheets / verification.
// Format: [PREFIX]-[TIMESTAMP36]-[RANDOM5]
// ============================================

function generateReportId(assessmentType) {
    const prefix = (assessmentType || 'TA').replace(/[^A-Z0-9]/gi, '').substr(0, 6).toUpperCase();
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substr(2, 5).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
}

// ============================================
// SCORING ENGINE — satu sumber kebenaran.
// Robust terhadap null/undefined, tidak pernah menghasilkan NaN/Infinity,
// dan tidak pernah menghitung skor di luar rentang skala.
// ============================================

function calculateMean(values) {
    const valid = values.filter(v => typeof v === 'number' && isFinite(v));
    if (valid.length === 0) return 0;
    return valid.reduce((sum, v) => sum + v, 0) / valid.length;
}

function calculateWeightedScore(items) {
    // items: [{ value, weight }]
    const valid = items.filter(i => typeof i.value === 'number' && isFinite(i.value) && typeof i.weight === 'number' && isFinite(i.weight));
    const totalWeight = valid.reduce((sum, i) => sum + i.weight, 0);
    if (totalWeight === 0) return 0;
    const weightedSum = valid.reduce((sum, i) => sum + (i.value * i.weight), 0);
    return weightedSum / totalWeight;
}

function normalizeScore(raw, min, max) {
    // Menghasilkan skor 0-100 relatif TERHADAP RENTANG ASESMEN INI SAJA.
    // Ini BUKAN persentil normatif/nasional — lihat docs/ASSESSMENT-METHODOLOGY.md
    if (typeof raw !== 'number' || !isFinite(raw)) return 0;
    if (max === min) return 0;
    const clamped = Math.max(min, Math.min(max, raw));
    const pct = ((clamped - min) / (max - min)) * 100;
    if (!isFinite(pct)) return 0;
    return Math.round(pct * 10) / 10;
}

function classifyScore(meanScore, thresholds) {
    if (!thresholds || meanScore === null || meanScore === undefined || !isFinite(meanScore)) {
        return { key: 'undetermined', label: 'Belum dapat ditentukan' };
    }
    if (meanScore <= thresholds.low.max) return { key: 'low', label: thresholds.low.label };
    if (meanScore <= thresholds.moderate.max) return { key: 'moderate', label: thresholds.moderate.label };
    return { key: 'high', label: thresholds.high.label };
}

/**
 * Hitung skor satu dimensi.
 * - Melewati jawaban null/undefined (tidak ikut dihitung, TIDAK dianggap 0).
 * - Memvalidasi rentang jawaban (1..scale); jawaban di luar rentang di-skip & dicatat sebagai error.
 * - Reverse scoring: score = (min + max) - originalScore  →  untuk skala 1-5: 6 - originalScore.
 */
function calculateDimensionScore(assessmentId, dimensionName, answers) {
    const config = scoringConfiguration[assessmentId];
    const questions = (questionsDatabase[assessmentId] || []).filter(q => q.dimension === dimensionName);
    const scale = config ? config.scale : 5;
    const min = 1;
    const max = scale;

    const values = [];
    const invalid = [];

    questions.forEach(q => {
        const raw = answers ? answers[q.id] : undefined;
        if (raw === null || raw === undefined || raw === '') return; // skip unanswered
        const numeric = Number(raw);
        if (!Number.isFinite(numeric) || numeric < min || numeric > max) {
            invalid.push({ questionId: q.id, value: raw });
            return; // skip out-of-range, jangan pernah menghasilkan NaN
        }
        const score = q.reverse ? (min + max) - numeric : numeric;
        values.push(score);
    });

    if (invalid.length > 0) {
        invalid.forEach(i => console.error('[TA ASSESS SCORING ERROR]', `${assessmentId} question #${i.questionId} nilai di luar rentang:`, i.value));
    }

    const rawScore = values.reduce((s, v) => s + v, 0);
    const itemCount = values.length;
    const meanScore = itemCount > 0 ? calculateMean(values) : null;
    const normalizedScore = meanScore !== null ? normalizeScore(meanScore, min, max) : 0;
    const level = itemCount > 0 && config ? classifyScore(meanScore, config.thresholds) : { key: 'undetermined', label: 'Belum dapat ditentukan' };

    return {
        dimension: dimensionName,
        rawScore,
        itemCount,
        expectedItemCount: questions.length,
        meanScore: meanScore !== null ? Math.round(meanScore * 100) / 100 : null,
        normalizedScore,
        level: level.key,
        levelLabel: level.label,
        complete: itemCount === questions.length && questions.length > 0
    };
}

/**
 * Hitung profil skor lengkap (semua dimensi) untuk satu assessment.
 */
function calculateProfile(assessmentId, answers) {
    const config = scoringConfiguration[assessmentId];
    if (!config) return null;

    const profile = {};
    config.dimensions.forEach(dim => {
        profile[dim] = calculateDimensionScore(assessmentId, dim, answers);
    });
    return profile;
}

function countUnanswered(assessmentId, answers) {
    const questions = questionsDatabase[assessmentId] || [];
    return questions.filter(q => {
        const v = answers ? answers[q.id] : undefined;
        return v === null || v === undefined || v === '';
    }).length;
}

function getInterpretation(assessmentId, dimension, levelKey) {
    const guide = interpretationGuides[assessmentId];
    if (!guide || !guide[dimension] || !guide[dimension][levelKey]) {
        return 'Interpretasi belum tersedia untuk assessment ini.';
    }
    return guide[dimension][levelKey];
}

// ============================================
// Report Data Assembly
// ============================================

function buildResultData(assessmentId, answers, reportId, startTime) {
    const assessment = findAssessmentById(assessmentId);
    const profile = calculateProfile(assessmentId, answers);

    const interpretations = {};
    Object.keys(profile).forEach(dimension => {
        const d = profile[dimension];
        interpretations[dimension] = {
            score: d.meanScore,
            normalizedScore: d.normalizedScore,
            level: d.levelLabel,
            levelKey: d.level,
            complete: d.complete,
            interpretation: d.itemCount > 0 ? getInterpretation(assessmentId, dimension, d.level) : 'Interpretasi belum tersedia — tidak ada jawaban untuk dimensi ini.'
        };
    });

    const durationMs = startTime ? (Date.now() - new Date(startTime).getTime()) : null;

    return {
        id: reportId,
        reportId: reportId,
        assessmentId: assessmentId,
        assessmentName: assessment.name,
        timestamp: new Date().toISOString(),
        durationMs: durationMs,
        instrumentVersion: assessment.details.instrumentVersion,
        scoringVersion: assessment.details.scoringVersion,
        reportVersion: '0.1',
        appVersion: typeof APP_VERSION !== 'undefined' ? APP_VERSION : '0.0.0',
        verificationStatus: 'DEMO', // lihat docs/ASSESSMENT-METHODOLOGY.md
        profile: profile,
        interpretations: interpretations,
        assessment: assessment,
        answers: answers,
        answeredCount: Object.values(answers).filter(a => a !== null && a !== undefined && a !== '').length,
        totalQuestions: (questionsDatabase[assessmentId] || []).length
    };
}

// ============================================
// Google Sheets Integration (via google-apps-script/code.gs)
// ============================================

function saveAssessmentToSheets(resultData) {
    if (!isConfigured(CONFIG.GOOGLE_SHEETS_API)) {
        console.log('[TA ASSESS] Google Sheets API belum dikonfigurasi — data tidak dikirim (fitur nonaktif).');
        return Promise.resolve({ sent: false, reason: 'not_configured' });
    }

    const payload = {
        timestamp: resultData.timestamp,
        reportId: resultData.reportId,
        assessmentId: resultData.assessmentId,
        assessmentName: resultData.assessmentName,
        instrumentVersion: resultData.instrumentVersion,
        scoringVersion: resultData.scoringVersion,
        scores: Object.fromEntries(Object.entries(resultData.profile).map(([k, v]) => [k, v.meanScore])),
        answersCount: resultData.answeredCount,
        duration: resultData.durationMs,
        status: resultData.verificationStatus
    };

    return fetch(CONFIG.GOOGLE_SHEETS_API, {
        method: 'POST',
        mode: 'no-cors', // Apps Script Web App tidak mengembalikan header CORS standar
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    .then(() => ({ sent: true }))
    .catch(error => {
        console.error('[TA ASSESS] Gagal mengirim ke Google Sheets:', error);
        return { sent: false, reason: 'network_error', error };
    });
}

// ============================================
// QR Code (pakai layanan publik api.qrserver.com — no API key)
// ============================================

function generateQRCode(reportId) {
    const verificationUrl = `${window.location.origin}${window.location.pathname.replace(/[^/]*$/, '')}verify.html?id=${encodeURIComponent(reportId)}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(verificationUrl)}`;
}

function getVerificationUrl(reportId) {
    return `${window.location.origin}${window.location.pathname.replace(/[^/]*$/, '')}verify.html?id=${encodeURIComponent(reportId)}`;
}

// ============================================
// Placeholder / Config UI Handling
// ============================================

function updatePlaceholders() {
    const saweria = document.getElementById('saweriaLink');
    if (saweria) {
        if (isConfigured(CONFIG.SAWERIA_LINK)) {
            saweria.href = CONFIG.SAWERIA_LINK;
        } else {
            saweria.outerHTML = '<p style="color:var(--text-light);font-size:0.9rem;">Donasi akan tersedia setelah konfigurasi.</p>';
        }
    }

    const formsperra = document.getElementById('formsperra');
    if (formsperra) {
        if (isConfigured(CONFIG.FORMSPREE_LINK)) {
            formsperra.href = CONFIG.FORMSPREE_LINK;
        } else {
            formsperra.outerHTML = '<p style="color:var(--text-light);font-size:0.9rem;">Feedback akan tersedia setelah konfigurasi.</p>';
        }
    }

    const contactEl = document.getElementById('contactEmail');
    if (contactEl) {
        if (isConfigured(CONFIG.CONTACT_EMAIL)) {
            contactEl.innerHTML = `<a href="mailto:${CONFIG.CONTACT_EMAIL}">${CONFIG.CONTACT_EMAIL}</a>`;
        } else {
            contactEl.textContent = 'Kontak akan tersedia setelah konfigurasi.';
        }
    }
}

// ============================================
// Utility
// ============================================

function formatDate(date) {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return date.toLocaleDateString('id-ID', options);
}

function formatDuration(ms) {
    if (!ms || !isFinite(ms) || ms < 0) return '-';
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes} menit ${seconds.toString().padStart(2, '0')} detik`;
}

function saveToSessionStorage(key, data) {
    sessionStorage.setItem(key, JSON.stringify(data));
}

function getFromSessionStorage(key) {
    const data = sessionStorage.getItem(key);
    return data ? JSON.parse(data) : null;
}

function clearSessionStorage(key) {
    sessionStorage.removeItem(key);
}

// ============================================
// Export
// ============================================

const TA_ASSESS_EXPORTS = {
    CONFIG,
    isConfigured,
    startAssessment,
    generateReportId,
    calculateMean,
    calculateWeightedScore,
    normalizeScore,
    classifyScore,
    calculateDimensionScore,
    calculateProfile,
    countUnanswered,
    getInterpretation,
    buildResultData,
    saveAssessmentToSheets,
    generateQRCode,
    getVerificationUrl,
    formatDate,
    formatDuration,
    saveToSessionStorage,
    getFromSessionStorage,
    clearSessionStorage,
    findAssessmentById,
    assessments,
    questionsDatabase,
    scoringConfiguration,
    interpretationGuides
};

if (typeof window !== 'undefined') {
    window.TA_ASSESS = TA_ASSESS_EXPORTS;
    console.log('TA Assess V2 script loaded — status: DEMO/PILOT platform, see docs/ASSESSMENT-METHODOLOGY.md');
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TA_ASSESS_EXPORTS;
}
