// ============================================
// TA ASSESS V3 - Adaptive Test Engine
// ============================================

let testState = {
    assessmentId: null,
    questions: [],
    answers: {},
    currentQuestion: 0,
    startTime: null,
    timerInterval: null,
    submitted: false,
    questionShownAt: null,
    responseTimes: {},
    integrity: {
        tabSwitches: 0,
        copyAttempts: 0,
        pasteAttempts: 0,
        contextMenuAttempts: 0,
        rapidAnswers: 0,
        suspiciousSignals: 0,
        events: []
    }
};

const AUTOSAVE_KEY_PREFIX = 'ta_assess_autosave_';
const MIN_REASONABLE_RESPONSE_MS = 900;
const MAX_CLIENT_EVENTS = 40;

document.addEventListener('DOMContentLoaded', async function() {
    const urlParams = new URLSearchParams(window.location.search);
    const assessmentId = urlParams.get('id');

    if (!assessmentId || !TA_ASSESS.findAssessmentById(assessmentId)) {
        alert('Asesmen tidak ditemukan');
        window.location.href = 'index.html';
        return;
    }

    testState.assessmentId = assessmentId;
    testState.questions = TA_ASSESS.questionsDatabase[assessmentId] || [];

    // Question Bank menjadi sumber soal utama bila endpoint tersedia.
    await loadQuestionsFromQuestionBank(assessmentId);

    if (testState.questions.length === 0) {
        alert('Asesmen tidak memiliki soal (data tidak lengkap)');
        window.location.href = 'index.html';
        return;
    }

    testState.questions.forEach(q => { testState.answers[q.id] = null; });

    applyAdaptiveDisplay();
    setupIntegrityMonitor();
    tryResumeSession();
    setupConsentListeners();
    updateCalibrationNotice();
});

async function loadQuestionsFromQuestionBank(assessmentId) {
    if (typeof CONFIG === 'undefined' || !isConfigured(CONFIG.QUESTION_BANK_API)) return;

    const endpoint = `${CONFIG.QUESTION_BANK_API}?action=questions&assessmentId=${encodeURIComponent(assessmentId)}`;

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 7000);
        const response = await fetch(endpoint, {
            method: 'GET',
            cache: 'no-store',
            signal: controller.signal
        });
        clearTimeout(timeout);

        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();

        if (!data.success || !Array.isArray(data.questions) || data.questions.length === 0) {
            throw new Error('Question Bank tidak mengembalikan soal aktif.');
        }

        const normalized = data.questions
            .map(normalizeRemoteQuestion)
            .filter(Boolean)
            .sort((a, b) => a.order - b.order);

        if (!normalized.length) throw new Error('Tidak ada soal yang kompatibel.');

        if (typeof questionsDatabase !== 'undefined') {
            questionsDatabase[assessmentId] = normalized;
        }
        testState.questions = normalized;

        console.info('[TA ASSESS] Question Bank aktif:', {
            assessmentId,
            count: normalized.length,
            version: data.questionVersion || 'unknown'
        });
    } catch (error) {
        console.warn('[TA ASSESS] Question Bank gagal dimuat. Menggunakan fallback lokal:', error);
    }
}

function normalizeRemoteQuestion(q) {
    if (!q || !q.id || !q.text) return null;

    const type = String(q.type || 'likert').toLowerCase();
    const supported = ['likert', 'single_choice', 'multi_choice', 'binary', 'yes_no', 'essay'];
    if (!supported.includes(type)) return null;

    const options = Array.isArray(q.options) ? q.options.map((option, index) => ({
        id: String(option.id || `OPT-${index + 1}`),
        label: String(option.label || ''),
        value: option.value == null ? String(index + 1) : String(option.value),
        score: option.score && typeof option.score === 'object' ? option.score : {}
    })).filter(option => option.label) : [];

    return {
        id: String(q.id),
        text: String(q.text),
        dimension: String(q.dimension || ''),
        reverse: Boolean(q.reverse),
        pairId: String(q.pairId || ''),
        pairRole: String(q.pairRole || ''),
        tags: Array.isArray(q.tags) ? q.tags.map(String) : [],
        type,
        itemType: type,
        options,
        scoring: q.scoring && typeof q.scoring === 'object' ? q.scoring : {},
        required: q.required !== false,
        order: Number(q.order) || 0,
        version: String(q.version || '1.0')
    };
}

// ============================================
// Autosave & Resume
// ============================================

function autosaveKey() {
    return AUTOSAVE_KEY_PREFIX + testState.assessmentId;
}

function autosaveProgress() {
    try {
        sessionStorage.setItem(autosaveKey(), JSON.stringify({
            answers: testState.answers,
            currentQuestion: testState.currentQuestion,
            startTime: testState.startTime
        }));
    } catch (e) {
        console.warn('[TA ASSESS] Autosave gagal:', e);
    }
}

function tryResumeSession() {
    try {
        const saved = sessionStorage.getItem(autosaveKey());
        if (!saved) return;
        const data = JSON.parse(saved);
        const answeredBefore = Object.values(data.answers || {}).some(v => v !== null && v !== undefined && v !== '');
        if (answeredBefore && confirm('Ditemukan progres asesmen sebelumnya yang belum selesai. Lanjutkan dari progres tersebut?')) {
            testState.answers = { ...testState.answers, ...data.answers };
            testState.currentQuestion = Math.min(
                Number(data.currentQuestion) || 0,
                Math.max(0, testState.questions.length - 1)
            );
            testState.startTime = data.startTime ? new Date(data.startTime) : null;
        } else {
            sessionStorage.removeItem(autosaveKey());
        }
    } catch (e) {
        console.warn('[TA ASSESS] Gagal membaca autosave:', e);
    }
}

function clearAutosave() {
    try { sessionStorage.removeItem(autosaveKey()); } catch (_) {}
}

// ============================================
// Consent & calm start
// ============================================

function setupConsentListeners() {
    const boxes = ['consent1', 'consent2', 'consent3', 'consent4'].map(id => document.getElementById(id));
    const startBtn = document.getElementById('startBtn');

    function checkAllConsents() {
        if (startBtn) startBtn.disabled = !boxes.every(cb => cb && cb.checked);
    }

    boxes.forEach(cb => cb && cb.addEventListener('change', checkAllConsents));
    checkAllConsents();
}

function startTest() {
    document.getElementById('consentScreen').style.display = 'none';
    document.getElementById('testScreen').style.display = 'block';

    if (!testState.startTime) testState.startTime = new Date();

    startTimer();
    displayQuestion();

    const assessment = TA_ASSESS.findAssessmentById(testState.assessmentId);
    const title = document.getElementById('assessmentTitle');
    if (title && assessment) title.textContent = assessment.name;

    showCalmMessage('Tenang saja. Tidak ada jawaban benar atau salah. Jawab yang paling sesuai dengan diri Anda.');
    logIntegrityEvent('assessment_started', { questionCount: testState.questions.length });
}

function showCalmMessage(message) {
    const box = document.getElementById('calmMessage');
    if (!box) return;
    box.textContent = message;
    box.classList.add('visible');
    window.clearTimeout(showCalmMessage._timer);
    showCalmMessage._timer = window.setTimeout(() => box.classList.remove('visible'), 6500);
}

// ============================================
// Adaptive display / screen calibration
// ============================================

function applyAdaptiveDisplay() {
    const root = document.documentElement;
    const width = window.innerWidth || 1024;
    const height = window.innerHeight || 768;
    const dpr = window.devicePixelRatio || 1;
    let device = 'desktop';

    if (width <= 600) device = 'phone';
    else if (width <= 1024) device = 'tablet';

    root.dataset.device = device;
    root.dataset.orientation = width > height ? 'landscape' : 'portrait';
    root.style.setProperty('--ta-ui-scale', width <= 380 ? '0.94' : width >= 1440 ? '1.03' : '1');

    const calibration = document.getElementById('displayCalibration');
    if (calibration) {
        calibration.textContent = `Tampilan otomatis disesuaikan untuk ${device === 'phone' ? 'HP' : device === 'tablet' ? 'tablet' : 'laptop/desktop'} • ${Math.round(dpr * 10) / 10}×`;
    }
}

function updateCalibrationNotice() {
    applyAdaptiveDisplay();
}

window.addEventListener('resize', applyAdaptiveDisplay, { passive: true });
window.addEventListener('orientationchange', () => setTimeout(applyAdaptiveDisplay, 150));

// ============================================
// Timer
// ============================================

function startTimer() {
    clearInterval(testState.timerInterval);
    testState.timerInterval = setInterval(() => {
        if (!testState.startTime) return;
        const elapsed = Math.floor((new Date() - testState.startTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        const timer = document.getElementById('elapsedTime');
        if (timer) timer.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }, 1000);
}

// ============================================
// Question Display
// ============================================

function displayQuestion() {
    const question = testState.questions[testState.currentQuestion];
    if (!question) return;

    const container = document.getElementById('questionContainer');
    if (!container) return;
    container.innerHTML = '';

    testState.questionShownAt = performance.now();

    const questionDiv = document.createElement('div');
    questionDiv.className = 'question-text';
    questionDiv.textContent = question.text;
    container.appendChild(questionDiv);

    const optionsDiv = document.createElement('div');
    optionsDiv.className = 'answer-options';

    const type = String(question.type || question.itemType || 'likert').toLowerCase();

    if (type === 'essay') {
        renderEssay(question, optionsDiv);
    } else if (type === 'likert') {
        renderLikert(question, optionsDiv);
    } else {
        renderChoiceQuestion(question, optionsDiv, type);
    }

    container.appendChild(optionsDiv);
    updateProgress();
    updateButtons();
}

function renderLikert(question, optionsDiv) {
    const scale = getAssessmentScale();
    const scaleLabels = getScaleLabels(scale);

    for (let i = 1; i <= scale; i++) {
        const optionDiv = createAnswerOption();
        const input = document.createElement('input');
        input.type = 'radio';
        input.name = 'answer';
        input.value = String(i);
        input.checked = Number(testState.answers[question.id]) === i;

        const label = document.createElement('label');
        label.textContent = scaleLabels[i] || i;
        label.htmlFor = `answer-${question.id}-${i}`;

        input.id = label.htmlFor;
        input.addEventListener('change', () => selectAnswer(question.id, i, input));
        optionDiv.append(input, label);
        optionsDiv.appendChild(optionDiv);
    }
}

function renderChoiceQuestion(question, optionsDiv, type) {
    const options = question.options.length ? question.options : getFallbackChoiceOptions(type);

    options.forEach((option, index) => {
        const optionDiv = createAnswerOption();
        const input = document.createElement('input');
        input.type = type === 'multi_choice' ? 'checkbox' : 'radio';
        input.name = type === 'multi_choice' ? `answer-${question.id}-${index}` : 'answer';
        input.value = option.id;
        input.id = `answer-${question.id}-${index}`;

        const current = testState.answers[question.id];
        input.checked = Array.isArray(current) ? current.includes(option.id) : current === option.id;

        const label = document.createElement('label');
        label.htmlFor = input.id;
        label.textContent = option.label;

        input.addEventListener('change', () => {
            if (type === 'multi_choice') {
                const selected = Array.isArray(testState.answers[question.id]) ? testState.answers[question.id].slice() : [];
                if (input.checked && !selected.includes(option.id)) selected.push(option.id);
                if (!input.checked) {
                    const idx = selected.indexOf(option.id);
                    if (idx >= 0) selected.splice(idx, 1);
                }
                selectAnswer(question.id, selected, input);
            } else {
                selectAnswer(question.id, option.id, input);
            }
        });

        optionDiv.append(input, label);
        optionsDiv.appendChild(optionDiv);
    });
}

function renderEssay(question, optionsDiv) {
    const textarea = document.createElement('textarea');
    textarea.className = 'essay-answer';
    textarea.rows = 6;
    textarea.maxLength = 2000;
    textarea.placeholder = 'Tulis jawaban Anda dengan santai. Tidak perlu mencari jawaban yang sempurna.';
    textarea.value = typeof testState.answers[question.id] === 'string' ? testState.answers[question.id] : '';
    textarea.addEventListener('input', () => selectAnswer(question.id, textarea.value, textarea));
    optionsDiv.appendChild(textarea);
}

function createAnswerOption() {
    const optionDiv = document.createElement('div');
    optionDiv.className = 'answer-option';
    return optionDiv;
}

function getFallbackChoiceOptions(type) {
    if (type === 'yes_no' || type === 'binary') {
        return [
            { id: 'yes', label: 'Ya', value: '1', score: {} },
            { id: 'no', label: 'Tidak', value: '0', score: {} }
        ];
    }
    return [];
}

function getAssessmentScale() {
    const config = typeof scoringConfiguration !== 'undefined' ? scoringConfiguration[testState.assessmentId] : null;
    return config && Number(config.scale) ? Number(config.scale) : 5;
}

function getScaleLabels(scale) {
    const labels = {
        5: { 1: 'Sangat Tidak Setuju', 2: 'Tidak Setuju', 3: 'Netral', 4: 'Setuju', 5: 'Sangat Setuju' },
        4: { 1: 'Tidak Cocok', 2: 'Kurang Cocok', 3: 'Cukup Cocok', 4: 'Sangat Cocok' },
        3: { 1: 'Tidak', 2: 'Mungkin', 3: 'Ya' }
    };
    return labels[scale] || {};
}

function selectAnswer(questionId, value, element) {
    const shownAt = testState.questionShownAt || performance.now();
    const responseMs = Math.max(0, Math.round(performance.now() - shownAt));
    testState.responseTimes[questionId] = responseMs;

    if (responseMs > 0 && responseMs < MIN_REASONABLE_RESPONSE_MS) {
        testState.integrity.rapidAnswers++;
        registerIntegritySignal('rapid_answer', { questionId: String(questionId), responseMs });
    }

    testState.answers[questionId] = value;

    document.querySelectorAll('.answer-option').forEach(opt => opt.classList.remove('selected'));
    const option = element && element.closest ? element.closest('.answer-option') : null;
    if (option) option.classList.add('selected');

    autosaveProgress();
    updateUnansweredWarning();
}

function updateButtons() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const submitBtn = document.getElementById('submitBtn');

    if (prevBtn) prevBtn.disabled = testState.currentQuestion === 0;

    if (testState.currentQuestion === testState.questions.length - 1) {
        if (nextBtn) nextBtn.style.display = 'none';
        if (submitBtn) submitBtn.style.display = 'inline-block';
    } else {
        if (nextBtn) nextBtn.style.display = 'inline-block';
        if (submitBtn) submitBtn.style.display = 'none';
    }
    updateUnansweredWarning();
}

function updateUnansweredWarning() {
    const unanswered = countRequiredUnanswered();
    const submitBtn = document.getElementById('submitBtn');
    if (!submitBtn) return;

    submitBtn.textContent = unanswered > 0
        ? `Selesai & Lihat Hasil (${unanswered} soal belum dijawab)`
        : 'Selesai & Lihat Hasil';
}

function countRequiredUnanswered() {
    return testState.questions.filter(q => {
        if (q.required === false) return false;
        const value = testState.answers[q.id];
        if (Array.isArray(value)) return value.length === 0;
        return value === null || value === undefined || value === '';
    }).length;
}

function updateProgress() {
    const total = testState.questions.length;
    const current = testState.currentQuestion + 1;
    const percentage = total ? (current / total) * 100 : 0;
    const fill = document.getElementById('progressFill');
    const number = document.getElementById('questionNumber');
    if (fill) fill.style.width = percentage + '%';
    if (number) number.textContent = `Pertanyaan ${current} dari ${total}`;
}

// ============================================
// Navigation
// ============================================

function nextQuestion() {
    if (testState.currentQuestion >= testState.questions.length - 1) return;
    testState.currentQuestion++;
    displayQuestion();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    autosaveProgress();
}

function previousQuestion() {
    if (testState.currentQuestion <= 0) return;
    testState.currentQuestion--;
    displayQuestion();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    autosaveProgress();
}

// ============================================
// Submission
// ============================================

async function submitTest() {
    const unanswered = countRequiredUnanswered();

    if (unanswered > 0) {
        alert(`Masih ada ${unanswered} pertanyaan yang belum dijawab. Silakan lengkapi semua pertanyaan sebelum menyelesaikan asesmen.`);
        goToFirstUnanswered();
        return;
    }

    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) submitBtn.disabled = true;

    document.getElementById('testScreen').style.display = 'none';
    document.getElementById('loadingScreen').style.display = 'block';

    clearInterval(testState.timerInterval);

    const reportId = TA_ASSESS.generateReportId(testState.assessmentId);
    const scoringAnswers = buildScoringAnswers();
    const resultData = TA_ASSESS.buildResultData(
        testState.assessmentId,
        scoringAnswers,
        reportId,
        testState.startTime
    );

    resultData.integrity = buildIntegritySummary();
    resultData.questionVersion = inferQuestionVersion();
    resultData.responseTiming = buildTimingSummary();

    await saveAssessmentToSheetsWithIntegrity(resultData);

    TA_ASSESS.saveToSessionStorage('assessmentResult', resultData);
    saveToDemoVerificationStore(resultData);

    clearAutosave();
    testState.submitted = true;

    setTimeout(() => { window.location.href = 'result.html'; }, 900);
}

function buildScoringAnswers() {
    const output = {};

    testState.questions.forEach(question => {
        const raw = testState.answers[question.id];
        const type = String(question.type || question.itemType || 'likert').toLowerCase();

        if (type === 'likert') {
            output[question.id] = raw;
            return;
        }

        if (type === 'essay') {
            // Essay tidak dipaksa menjadi skor numerik.
            // Engine akan mengabaikannya pada perhitungan dimensi numerik.
            output[question.id] = raw;
            return;
        }

        if (type === 'multi_choice') {
            const selected = Array.isArray(raw) ? raw : [];
            const total = selected.reduce((sum, id) => {
                const option = question.options.find(item => item.id === id);
                return sum + resolveOptionScore(option, question.dimension);
            }, 0);
            output[question.id] = clampScore(total);
            return;
        }

        const option = question.options.find(item => item.id === raw);
        output[question.id] = clampScore(resolveOptionScore(option, question.dimension));
    });

    return output;
}

function resolveOptionScore(option, dimension) {
    if (!option) return 0;
    const score = option.score;
    if (typeof score === 'number' && Number.isFinite(score)) return score;
    if (score && typeof score === 'object') {
        const candidates = [score[dimension], score.value, score.score, score.points];
        for (const candidate of candidates) {
            if (typeof candidate === 'number' && Number.isFinite(candidate)) return candidate;
        }
        const firstNumeric = Object.values(score).find(value => typeof value === 'number' && Number.isFinite(value));
        if (firstNumeric !== undefined) return firstNumeric;
    }
    const value = Number(option.value);
    return Number.isFinite(value) ? value : 0;
}

function clampScore(value) {
    if (!Number.isFinite(Number(value))) return 0;
    return Math.max(0, Math.min(getAssessmentScale(), Number(value)));
}

function saveAssessmentToSheetsWithIntegrity(resultData) {
    if (!isConfigured(CONFIG.GOOGLE_SHEETS_API)) return Promise.resolve({ sent: false });

    const scores = Object.fromEntries(
        Object.entries(resultData.profile || {}).map(([key, value]) => [key, value.meanScore])
    );

    const dimensionStats = Object.fromEntries(
        Object.entries(resultData.profile || {}).map(([key, value]) => [
            key,
            {
                itemCount: value.itemCount,
                expectedItemCount: value.expectedItemCount
            }
        ])
    );

    const payload = {
        action: 'submitResult',
        timestamp: resultData.timestamp,
        reportId: resultData.reportId,
        assessmentId: resultData.assessmentId,
        assessmentName: resultData.assessmentName,
        instrumentVersion: resultData.instrumentVersion,
        scoringVersion: resultData.scoringVersion,
        reportVersion: resultData.reportVersion,
        appVersion: resultData.appVersion,
        scores,
        answersCount: resultData.answeredCount,
        totalQuestions: resultData.totalQuestions,
        duration: resultData.durationMs,
        status: resultData.verificationStatus || 'DEMO',
        dimensionStats,
        integrity: resultData.integrity
    };

    return fetch(CONFIG.GOOGLE_SHEETS_API, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
    }).then(() => ({ sent: true })).catch(error => {
        console.error('[TA ASSESS] Gagal mengirim hasil:', error);
        return { sent: false, error };
    });
}

function goToFirstUnanswered() {
    const idx = testState.questions.findIndex(q => {
        const value = testState.answers[q.id];
        return q.required !== false && (value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0));
    });

    if (idx >= 0) {
        testState.currentQuestion = idx;
        displayQuestion();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function buildTimingSummary() {
    const values = Object.values(testState.responseTimes).filter(Number.isFinite);
    if (!values.length) return { count: 0, medianMs: null, minMs: null, maxMs: null };

    const sorted = values.slice().sort((a, b) => a - b);
    return {
        count: values.length,
        medianMs: sorted.length % 2
            ? sorted[(sorted.length - 1) / 2]
            : Math.round((sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2),
        minMs: Math.min(...values),
        maxMs: Math.max(...values)
    };
}

function buildIntegritySummary() {
    const switchPenalty = Math.min(testState.integrity.tabSwitches, 10);
    const interactionSignals =
        testState.integrity.copyAttempts +
        testState.integrity.pasteAttempts +
        testState.integrity.contextMenuAttempts;

    const score = Math.min(
        100,
        testState.integrity.suspiciousSignals * 15 +
        switchPenalty * 8 +
        interactionSignals * 3
    );

    let level = 'normal';
    if (score >= 60) level = 'perlu_review';
    else if (score >= 25) level = 'perlu_perhatian';

    return {
        version: '1.0',
        level,
        signalScore: score,
        tabSwitches: testState.integrity.tabSwitches,
        copyAttempts: testState.integrity.copyAttempts,
        pasteAttempts: testState.integrity.pasteAttempts,
        contextMenuAttempts: testState.integrity.contextMenuAttempts,
        rapidAnswers: testState.integrity.rapidAnswers,
        suspiciousSignals: testState.integrity.suspiciousSignals,
        note: 'Sinyal integritas adalah indikator teknis, bukan bukti kecurangan dan tidak mengubah skor asesmen.'
    };
}

function inferQuestionVersion() {
    const versions = [...new Set(testState.questions.map(q => q.version).filter(Boolean))];
    return versions.length === 1 ? versions[0] : versions.join(',');
}

// ============================================
// Integrity monitoring
// ============================================

function setupIntegrityMonitor() {
    document.addEventListener('visibilitychange', () => {
        if (!testState.startTime || testState.submitted) return;
        if (document.hidden) {
            testState.integrity.tabSwitches++;
            registerIntegritySignal('tab_hidden', { count: testState.integrity.tabSwitches });
            showCalmMessage('Tidak apa-apa. Jika Anda berpindah layar sebentar, silakan kembali dan lanjutkan dengan tenang.');
        }
    });

    document.addEventListener('copy', () => {
        if (!testState.startTime || testState.submitted) return;
        testState.integrity.copyAttempts++;
        registerIntegritySignal('copy_attempt');
    });

    document.addEventListener('paste', () => {
        if (!testState.startTime || testState.submitted) return;
        testState.integrity.pasteAttempts++;
        registerIntegritySignal('paste_attempt');
    });

    document.addEventListener('contextmenu', () => {
        if (!testState.startTime || testState.submitted) return;
        testState.integrity.contextMenuAttempts++;
        registerIntegritySignal('context_menu');
    });
}

function registerIntegritySignal(name, metadata = {}) {
    testState.integrity.suspiciousSignals++;
    if (testState.integrity.events.length < MAX_CLIENT_EVENTS) {
        testState.integrity.events.push({ name, timestamp: Date.now() });
    }
    logIntegrityEvent(name, metadata);
}

function logIntegrityEvent(eventName, metadata = {}) {
    if (typeof CONFIG === 'undefined' || !isConfigured(CONFIG.GOOGLE_SHEETS_API)) return;

    const safeMetadata = {
        ...metadata,
        device: document.documentElement.dataset.device || 'unknown',
        orientation: document.documentElement.dataset.orientation || 'unknown'
    };

    const payload = {
        action: 'logEvent',
        reportId: null,
        assessmentId: testState.assessmentId,
        source: 'assessment-client',
        metadata: safeMetadata,
        eventName
    };

    fetch(CONFIG.GOOGLE_SHEETS_API, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
    }).catch(() => {});
}

// ============================================
// Demo verification store
// ============================================

function saveToDemoVerificationStore(resultData) {
    try {
        const store = JSON.parse(localStorage.getItem('ta_assess_demo_reports') || '{}');
        store[resultData.reportId] = {
            reportId: resultData.reportId,
            assessmentId: resultData.assessmentId,
            assessmentName: resultData.assessmentName,
            timestamp: resultData.timestamp,
            instrumentVersion: resultData.instrumentVersion,
            scoringVersion: resultData.scoringVersion,
            reportVersion: resultData.reportVersion,
            status: 'DEMO'
        };
        localStorage.setItem('ta_assess_demo_reports', JSON.stringify(store));
    } catch (e) {
        console.warn('[TA ASSESS] Demo verification store gagal:', e);
    }
}

// ============================================
// Prevent accidental navigation away
// ============================================

window.addEventListener('beforeunload', function(e) {
    if (!testState.submitted && testState.startTime) {
        e.preventDefault();
        e.returnValue = '';
    }
});

// ============================================
// Fullscreen (opsional, tidak wajib)
// ============================================

function enterFullscreen() {
    const elem = document.documentElement;
    if (elem.requestFullscreen) elem.requestFullscreen();
    else if (elem.webkitRequestFullscreen) elem.webkitRequestFullscreen();
}

try {
    if (sessionStorage.getItem('ta_assess_calm_mode') === '1') {
        document.documentElement.classList.add('calm-mode');
    }
} catch (_) {}

console.log('TA Assess V3 adaptive test engine loaded');
