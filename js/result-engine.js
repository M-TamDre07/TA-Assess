// ============================================
// TA ASSESS V2 - Result Engine & PDF Generation
// ============================================

let resultData = null;

document.addEventListener('DOMContentLoaded', function() {
    resultData = TA_ASSESS.getFromSessionStorage('assessmentResult');

    if (!resultData) {
        window.location.href = 'index.html';
        return;
    }

    displayResult();
});

function displayResult() {
    document.getElementById('resultId').textContent = resultData.reportId;
    document.getElementById('assessmentTitle').textContent = resultData.assessmentName;

    document.getElementById('completionTime').textContent = TA_ASSESS.formatDuration(resultData.durationMs);
    document.getElementById('questionsAnswered').textContent = `${resultData.answeredCount} / ${resultData.totalQuestions}`;
    document.getElementById('assessmentDate').textContent = TA_ASSESS.formatDate(new Date(resultData.timestamp));

    displayScoreProfile();
    displayInterpretations();
    displayExploration();
    displayInsight();
    generateQRCodeDisplay();

    const verifyLink = document.getElementById('verifyLink');
    if (verifyLink) verifyLink.href = `verify.html?id=${encodeURIComponent(resultData.reportId)}`;
    const verifUrlEl = document.getElementById('verificationUrl');
    if (verifUrlEl) verifUrlEl.textContent = TA_ASSESS.getVerificationUrl(resultData.reportId);
}

function displayScoreProfile() {
    const container = document.getElementById('scoreProfile');
    container.innerHTML = '';

    const assessment = resultData.assessment;
    const scale = assessment.details.scale;

    assessment.dimensions.forEach(dimension => {
        const interp = resultData.interpretations[dimension.name];
        if (!interp) return;

        const displayScore = interp.score !== null ? interp.score : '-';
        const scorePercentage = interp.score !== null ? (interp.score / scale) * 100 : 0;

        const card = document.createElement('div');
        card.className = 'score-card';
        card.innerHTML = `
            <h3>${dimension.name}</h3>
            <div class="score-display">
                <div class="score-number">${displayScore}</div>
                <div class="score-bar">
                    <div class="score-bar-background">
                        <div class="score-bar-fill" style="width: ${scorePercentage}%"></div>
                    </div>
                </div>
            </div>
            <div class="score-label">${interp.level}${!interp.complete ? ' (sebagian soal tidak terjawab)' : ''}</div>
        `;
        container.appendChild(card);
    });
}

function displayInterpretations() {
    const container = document.getElementById('interpretationContent');
    container.innerHTML = '';

    resultData.assessment.dimensions.forEach(dimension => {
        const interp = resultData.interpretations[dimension.name];
        if (!interp) return;

        const section = document.createElement('div');
        section.style.marginBottom = '2rem';
        section.innerHTML = `
            <h4 style="color: var(--primary-color); margin-bottom: 0.5rem;">${dimension.name}</h4>
            <p class="interpretation-text">${interp.interpretation}</p>
        `;
        container.appendChild(section);
    });

    const noticeEl = document.createElement('p');
    noticeEl.style.fontSize = '0.85rem';
    noticeEl.style.color = 'var(--text-light)';
    noticeEl.style.marginTop = '1rem';
    noticeEl.textContent = `Skor bersifat relatif dalam asesmen ini saja (bukan persentil nasional). Instrumen versi ${resultData.instrumentVersion}, scoring versi ${resultData.scoringVersion}, status: ${resultData.assessment.details.developmentStatus}.`;
    container.appendChild(noticeEl);
}

function displayExploration() {
    const container = document.getElementById('explorationList');
    container.innerHTML = '';

    const rec = window.TA_RECOMMENDATION
        ? window.TA_RECOMMENDATION.getRecommendations(resultData.assessmentId, resultData.profile)
        : { activities: [], reflectionQuestions: [] };

    rec.activities.forEach(item => {
        const li = document.createElement('li');
        li.textContent = item;
        container.appendChild(li);
    });

    if (rec.reflectionQuestions && rec.reflectionQuestions.length) {
        const heading = document.createElement('li');
        heading.style.listStyle = 'none';
        heading.style.marginTop = '1rem';
        heading.innerHTML = '<strong>Pertanyaan refleksi:</strong>';
        container.appendChild(heading);
        rec.reflectionQuestions.forEach(q => {
            const li = document.createElement('li');
            li.textContent = q;
            container.appendChild(li);
        });
    }

    resultData._recommendation = rec;
}

function displayInsight() {
    const el = document.getElementById('insightContent');
    if (!el || !window.TA_INSIGHT) return;

    const insight = window.TA_INSIGHT.generateInsight(resultData.assessmentId, resultData.profile);
    resultData._insight = insight;

    let html = `<p>${insight.summary}</p>`;
    if (insight.combinationNotes.length > 0) {
        html += insight.combinationNotes.map(n => `<p>${n}</p>`).join('');
    }
    html += `<p style="font-size:0.85rem;color:var(--text-light);font-style:italic;">${insight.disclaimer}</p>`;
    el.innerHTML = html;
}

function generateQRCodeDisplay() {
    const qrImageUrl = TA_ASSESS.generateQRCode(resultData.reportId);
    const container = document.getElementById('qrCodeContainer');
    container.innerHTML = `<img src="${qrImageUrl}" alt="QR Code Verifikasi" width="200" height="200">`;
}

// ============================================
// MBTI — Informational only, tidak resmi, tidak mengubah skor Big Five.
// ============================================

function saveMBTI() {
    const mbtiInput = document.getElementById('mbtiInput').value.toUpperCase().trim();

    if (!/^[IE][NS][TF][JP]$/.test(mbtiInput)) {
        alert('Format MBTI tidak valid. Gunakan format 4 huruf yang benar (contoh: INTP, ESFJ).');
        return;
    }

    resultData.mbti = mbtiInput;
    TA_ASSESS.saveToSessionStorage('assessmentResult', resultData);
    alert('MBTI Anda telah disimpan sebagai informasi tambahan pada laporan PDF (bukan hasil administrasi MBTI resmi).');
}

// ============================================
// PDF Generation
// ============================================

function downloadPDF() {
    const element = generatePDFContent();
    const opt = {
        margin: 10,
        filename: `TA-Assess-Report-${resultData.reportId}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
    };
    html2pdf().set(opt).from(element).save();
}

function generatePDFContent() {
    const assessment = resultData.assessment;
    const scale = assessment.details.scale;
    const insight = resultData._insight || { summary: '', combinationNotes: [], disclaimer: '' };
    const rec = resultData._recommendation || { activities: [], reflectionQuestions: [] };

    const htmlContent = `
        <div style="font-family: Arial, sans-serif; color:#2c3e50; max-width:700px; margin:0 auto;">
            <div style="text-align:center; padding:2rem 0; border-bottom:3px solid #3498db;">
                <h1 style="margin:0;">TA ASSESS</h1>
                <div style="color:#7f8c8d; letter-spacing:2px;">PERSONAL EXPLORATION REPORT — ${assessment.details.developmentStatus}</div>
                <div style="margin-top:1rem; font-size:12px;">
                    <div><strong>Report ID:</strong> ${resultData.reportId}</div>
                    <div><strong>Tanggal:</strong> ${TA_ASSESS.formatDate(new Date(resultData.timestamp))}</div>
                    <div><strong>Asesmen:</strong> ${resultData.assessmentName}</div>
                    <div><strong>Instrument v${resultData.instrumentVersion} / Scoring v${resultData.scoringVersion} / Report v${resultData.reportVersion}</strong></div>
                </div>
            </div>

            <h2>Tujuan</h2>
            <p>${assessment.details.purpose}</p>

            <h2>Informasi Peserta &amp; Asesmen</h2>
            <table style="width:100%; font-size:13px; border-collapse:collapse;">
                <tr><td style="padding:4px 0;"><strong>Jumlah soal dijawab</strong></td><td>${resultData.answeredCount} / ${resultData.totalQuestions}</td></tr>
                <tr><td style="padding:4px 0;"><strong>Skala</strong></td><td>${assessment.details.scaleLabel}</td></tr>
                <tr><td style="padding:4px 0;"><strong>Status validasi</strong></td><td>${assessment.details.validationStatus}</td></tr>
            </table>

            <h2>Profil Skor</h2>
            ${assessment.dimensions.map(dim => {
                const interp = resultData.interpretations[dim.name];
                const pct = interp.score !== null ? (interp.score / scale) * 100 : 0;
                return `
                    <div style="margin-bottom:1rem;">
                        <div style="display:flex; justify-content:space-between; font-size:13px;"><strong>${dim.name}</strong><span>${interp.score !== null ? interp.score : '-'} — ${interp.level}</span></div>
                        <div style="background:#ecf0f1; height:8px; border-radius:4px; overflow:hidden;"><div style="background:#3498db; height:100%; width:${pct}%;"></div></div>
                    </div>
                `;
            }).join('')}

            <h2>Interpretasi</h2>
            ${assessment.dimensions.map(dim => `
                <div style="margin-bottom:0.75rem;">
                    <strong>${dim.name}</strong>
                    <p style="margin:0.25rem 0;">${resultData.interpretations[dim.name].interpretation}</p>
                </div>
            `).join('')}

            <h2>Area untuk Dieksplorasi</h2>
            <ul>${rec.activities.map(a => `<li>${a}</li>`).join('')}</ul>

            <h2>Smart Insight</h2>
            <p>${insight.summary}</p>
            ${insight.combinationNotes.map(n => `<p>${n}</p>`).join('')}
            <p style="font-size:11px; font-style:italic; color:#7f8c8d;">${insight.disclaimer}</p>

            ${resultData.mbti ? `
                <div style="background:#e8f4f8; border:1px solid #3498db; border-radius:4px; padding:1rem; margin:1rem 0;">
                    <strong>MBTI — Informational</strong>
                    <div style="font-size:20px; font-family:monospace; margin:0.5rem 0;">${resultData.mbti}</div>
                    <div style="font-size:11px; font-style:italic; color:#7f8c8d;">Data ini dimasukkan oleh pengguna dan bukan hasil administrasi MBTI resmi oleh TA Assess. Tidak memengaruhi skor Big Five di atas.</div>
                </div>
            ` : ''}

            <div style="background:#fff3cd; border:2px solid #f39c12; border-radius:4px; padding:1rem; margin:1.5rem 0; font-size:12px;">
                <strong>⚠️ Penting</strong><br><br>
                Laporan ini adalah hasil self-assessment pada platform TA Assess (status: ${assessment.details.developmentStatus}, belum divalidasi secara psikometrik) dan <strong>bukan diagnosis psikologis</strong>. Tidak dimaksudkan sebagai pengganti pemeriksaan atau konsultasi dengan psikolog profesional. Penerimaan laporan ini untuk keperluan sekolah, pekerjaan, beasiswa, atau institusi lain bergantung sepenuhnya pada kebijakan pihak yang meminta.
            </div>

            <div style="text-align:center; padding-top:1rem; border-top:1px solid #bdc3c7; font-size:12px;">
                <strong>TA ASSESS</strong> — Tama Andrea Studio<br>
                Assessment Report Publisher
            </div>

            <div style="text-align:center; font-size:10px; color:#7f8c8d; margin-top:1rem;">
                Report ID <strong>${resultData.reportId}</strong> dapat diverifikasi (mode DEMO) di: ${TA_ASSESS.getVerificationUrl(resultData.reportId)}
            </div>
        </div>
    `;

    const div = document.createElement('div');
    div.innerHTML = htmlContent;
    return div;
}

console.log('Result engine V2 loaded');
