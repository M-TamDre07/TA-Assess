// ============================================
// TA ASSESS V2 - Test Engine
// ============================================

let testState = {
    assessmentId: null,
    questions: [],
    answers: {},
    currentQuestion: 0,
    startTime: null,
    timerInterval: null,
    submitted: false
};

const AUTOSAVE_KEY_PREFIX = 'ta_assess_autosave_';

document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const assessmentId = urlParams.get('id');

    if (!assessmentId || !TA_ASSESS.findAssessmentById(assessmentId)) {
        alert('Asesmen tidak ditemukan');
        window.location.href = 'index.html';
        return;
    }

    testState.assessmentId = assessmentId;
    testState.questions = TA_ASSESS.questionsDatabase[assessmentId] || [];

    if (testState.questions.length === 0) {
        alert('Asesmen tidak memiliki soal (data tidak lengkap)');
        window.location.href = 'index.html';
        return;
    }

    testState.questions.forEach(q => { testState.answers[q.id] = null; });

    // Coba resume sesi yang belum selesai
    tryResumeSession();

    setupConsentListeners();
});

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
        console.warn('[TA ASSESS] Autosave gagal (sessionStorage tidak tersedia):', e);
    }
}

function tryResumeSession() {
    try {
        const saved = sessionStorage.getItem(autosaveKey());
        if (!saved) return;
        const data = JSON.parse(saved);
        const answeredBefore = Object.values(data.answers || {}).some(v => v !== null && v !== undefined);
        if (answeredBefore && confirm('Ditemukan progres asesmen sebelumnya yang belum selesai. Lanjutkan dari progres tersebut?')) {
            testState.answers = { ...testState.answers, ...data.answers };
            testState.currentQuestion = data.currentQuestion || 0;
            testState.startTime = data.startTime ? new Date(data.startTime) : null;
        } else {
            sessionStorage.removeItem(autosaveKey());
        }
    } catch (e) {
        console.warn('[TA ASSESS] Gagal membaca autosave:', e);
    }
}

function clearAutosave() {
    sessionStorage.removeItem(autosaveKey());
}

// ============================================
// Consent Screen
// ============================================

function setupConsentListeners() {
    const boxes = ['consent1', 'consent2', 'consent3', 'consent4'].map(id => document.getElementById(id));
    const startBtn = document.getElementById('startBtn');

    function checkAllConsents() {
        startBtn.disabled = !boxes.every(cb => cb && cb.checked);
    }

    boxes.forEach(cb => cb && cb.addEventListener('change', checkAllConsents));
}

function startTest() {
    document.getElementById('consentScreen').style.display = 'none';
    document.getElementById('testScreen').style.display = 'block';

    if (!testState.startTime) {
        testState.startTime = new Date();
    }
    startTimer();
    displayQuestion();

    const assessment = TA_ASSESS.findAssessmentById(testState.assessmentId);
    document.getElementById('assessmentTitle').textContent = assessment.name;
}

// ============================================
// Timer
// ============================================

function startTimer() {
    testState.timerInterval = setInterval(() => {
        const elapsed = Math.floor((new Date() - testState.startTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        document.getElementById('elapsedTime').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }, 1000);
}

// ============================================
// Question Display
// ============================================

function displayQuestion() {
    const question = testState.questions[testState.currentQuestion];
    if (!question) return;

    const container = document.getElementById('questionContainer');
    container.innerHTML = '';

    const questionDiv = document.createElement('div');
    questionDiv.className = 'question-text';
    questionDiv.textContent = question.text;
    container.appendChild(questionDiv);

    const optionsDiv = document.createElement('div');
    optionsDiv.className = 'answer-options';

    const scale = TA_ASSESS.scoringConfiguration[testState.assessmentId].scale;
    const scaleLabels = getScaleLabels(scale);

    for (let i = 1; i <= scale; i++) {
        const optionDiv = document.createElement('div');
        optionDiv.className = 'answer-option';
        if (testState.answers[question.id] === i) optionDiv.classList.add('selected');

        const label = scaleLabels[i] || i;
        optionDiv.innerHTML = `
            <input type="radio" name="answer" value="${i}"
                   ${testState.answers[question.id] === i ? 'checked' : ''}
                   onchange="selectAnswer(${question.id}, ${i}, this)">
            <label style="cursor: pointer; margin: 0; flex: 1;">${label}</label>
        `;
        optionsDiv.appendChild(optionDiv);
    }

    container.appendChild(optionsDiv);
    updateProgress();
    updateButtons();
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
    testState.answers[questionId] = value;
    document.querySelectorAll('.answer-option').forEach(opt => opt.classList.remove('selected'));
    element.closest('.answer-option').classList.add('selected');
    autosaveProgress();
    updateUnansweredWarning();
}

// ============================================
// Navigation
// ============================================

function nextQuestion() {
    if (testState.currentQuestion < testState.questions.length - 1) {
        testState.currentQuestion++;
        displayQuestion();
        window.scrollTo(0, 0);
        autosaveProgress();
    }
}

function previousQuestion() {
    if (testState.currentQuestion > 0) {
        testState.currentQuestion--;
        displayQuestion();
        window.scrollTo(0, 0);
        autosaveProgress();
    }
}

function updateButtons() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const submitBtn = document.getElementById('submitBtn');

    prevBtn.disabled = testState.currentQuestion === 0;

    if (testState.currentQuestion === testState.questions.length - 1) {
        nextBtn.style.display = 'none';
        submitBtn.style.display = 'inline-block';
    } else {
        nextBtn.style.display = 'inline-block';
        submitBtn.style.display = 'none';
    }
    updateUnansweredWarning();
}

function updateUnansweredWarning() {
    const unanswered = TA_ASSESS.countUnanswered(testState.assessmentId, testState.answers);
    const submitBtn = document.getElementById('submitBtn');
    if (!submitBtn) return;
    if (unanswered > 0) {
        submitBtn.textContent = `Selesai & Lihat Hasil (${unanswered} soal belum dijawab)`;
    } else {
        submitBtn.textContent = 'Selesai & Lihat Hasil';
    }
}

function updateProgress() {
    const total = testState.questions.length;
    const current = testState.currentQuestion + 1;
    const percentage = (current / total) * 100;
    document.getElementById('progressFill').style.width = percentage + '%';
    document.getElementById('questionNumber').textContent = `Pertanyaan ${current} dari ${total}`;
}

// ============================================
// Submit Test
// Spesifikasi: TIDAK boleh submit jika masih ada soal yang belum dijawab.
// ============================================

function submitTest() {
    const unanswered = TA_ASSESS.countUnanswered(testState.assessmentId, testState.answers);

    if (unanswered > 0) {
        alert(`Masih ada ${unanswered} pertanyaan yang belum dijawab. Silakan lengkapi semua jawaban sebelum menyelesaikan asesmen.`);
        goToFirstUnanswered();
        return;
    }

    document.getElementById('testScreen').style.display = 'none';
    document.getElementById('loadingScreen').style.display = 'block';

    clearInterval(testState.timerInterval);

    // Satu reportId, dipakai konsisten di seluruh alur (PDF, QR, Sheets, verifikasi)
    const reportId = TA_ASSESS.generateReportId(testState.assessmentId);
    const resultData = TA_ASSESS.buildResultData(testState.assessmentId, testState.answers, reportId, testState.startTime);

    TA_ASSESS.saveAssessmentToSheets(resultData);
    TA_ASSESS.saveToSessionStorage('assessmentResult', resultData);

    // Simpan salinan ringan untuk demo verification (lihat verify.html)
    saveToDemoVerificationStore(resultData);

    clearAutosave();
    testState.submitted = true;

    setTimeout(() => { window.location.href = 'result.html'; }, 1200);
}

function goToFirstUnanswered() {
    const idx = testState.questions.findIndex(q => testState.answers[q.id] === null || testState.answers[q.id] === undefined);
    if (idx >= 0) {
        testState.currentQuestion = idx;
        displayQuestion();
        window.scrollTo(0, 0);
    }
}

// ============================================
// DEMO Verification Store
// PENTING: ini adalah adapter DEMO berbasis localStorage, HANYA berfungsi
// di browser yang sama tempat laporan dibuat. Ini BUKAN backend produksi
// dan TIDAK anti-pemalsuan. Lihat docs/ASSESSMENT-METHODOLOGY.md.
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
        console.warn('[TA ASSESS] Gagal menyimpan ke demo verification store:', e);
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

// ============================================
// Tab Switch Detection — HANYA warning/log, bukan kontrol perangkat.
// ============================================

document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        console.warn('[TA ASSESS] Tab switch terdeteksi selama asesmen (log only, tidak memblokir).');
    }
});

console.log('Test engine V2 loaded');
