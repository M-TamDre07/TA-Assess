// ============================================
// TA ASSESS V2 - Automated Tests (Node.js, no dependency)
// Jalankan: node tests/run-tests.js
// ============================================

const path = require('path');
const dataModule = require(path.join(__dirname, '..', 'js', 'assessments-data.js'));
global.assessments = dataModule.assessments;
global.questionsDatabase = dataModule.questionsDatabase;
global.scoringConfiguration = dataModule.scoringConfiguration;
global.interpretationGuides = dataModule.interpretationGuides;
global.APP_VERSION = dataModule.APP_VERSION;
global.checkAssessmentData = dataModule.checkAssessmentData;

const scriptModule = require(path.join(__dirname, '..', 'js', 'script.js'));

let passed = 0;
let failed = 0;
const failures = [];

function assert(condition, description) {
    if (condition) {
        passed++;
    } else {
        failed++;
        failures.push(description);
        console.error('FAIL:', description);
    }
}

// ------------------------------------------------
// 1. Data consistency (metadata.items === jumlah soal aktual)
// ------------------------------------------------
Object.values(dataModule.assessments).forEach(a => {
    const q = dataModule.questionsDatabase[a.id] || [];
    assert(q.length === a.details.items, `${a.id}: metadata.items (${a.details.items}) === jumlah soal aktual (${q.length})`);
});

const dataErrors = dataModule.checkAssessmentData();
assert(dataErrors.length === 0, `checkAssessmentData() tidak menghasilkan error (ditemukan: ${dataErrors.length})`);

// ------------------------------------------------
// 2. Scoring dasar (semua jawaban terisi, tanpa reverse)
// ------------------------------------------------
{
    const answers = { 1: 3, 2: 4, 3: 5, 4: 2, 5: 1, 6: 3, 7: 4, 8: 2, 9: 5, 10: 1 };
    const profile = scriptModule.calculateProfile('PERSONALITY-01', answers);
    assert(profile.Openness.itemCount === 2, 'Openness punya 2 soal terjawab');
    assert(profile.Openness.meanScore === 3, `Openness meanScore = 3 (dapat: ${profile.Openness.meanScore})`);
}

// ------------------------------------------------
// 3. Reverse scoring benar (skala 1-5: 1<->5, 2<->4, 3<->3)
// ------------------------------------------------
{
    // Soal id 7 (Conscientiousness, reverse) & id 2 (Conscientiousness, non-reverse)
    const answers = { 2: 5, 7: 1 }; // reverse: 1 -> (1+5)-1 = 5
    const profile = scriptModule.calculateProfile('PERSONALITY-01', answers);
    assert(profile.Conscientiousness.meanScore === 5, `Reverse scoring benar: mean=5 (dapat: ${profile.Conscientiousness.meanScore})`);
}

// ------------------------------------------------
// 4. Null / unanswered TIDAK dihitung sebagai skor (bukan 0)
// ------------------------------------------------
{
    const answers = { 1: 5, 6: null }; // Openness: 1 soal terjawab, 1 soal null
    const profile = scriptModule.calculateProfile('PERSONALITY-01', answers);
    assert(profile.Openness.itemCount === 1, `Null diabaikan dari itemCount (dapat: ${profile.Openness.itemCount})`);
    assert(profile.Openness.meanScore === 5, `Null tidak menurunkan mean (dapat: ${profile.Openness.meanScore})`);
}

// ------------------------------------------------
// 5. Semua jawaban null -> tidak NaN, tidak Infinity
// ------------------------------------------------
{
    const emptyAnswers = {};
    dataModule.questionsDatabase['PERSONALITY-01'].forEach(q => { emptyAnswers[q.id] = null; });
    const profile = scriptModule.calculateProfile('PERSONALITY-01', emptyAnswers);
    Object.values(profile).forEach(d => {
        assert(d.meanScore === null, `Dimensi tanpa jawaban -> meanScore null, bukan NaN (${d.dimension}: ${d.meanScore})`);
        assert(Number.isFinite(d.normalizedScore), `normalizedScore finite (${d.dimension}: ${d.normalizedScore})`);
        assert(d.rawScore === 0, `rawScore = 0 saat tidak ada jawaban (${d.dimension}: ${d.rawScore})`);
    });
}

// ------------------------------------------------
// 6. Jawaban di luar rentang (mis. 9 pada skala 1-5) di-skip, tidak NaN
// ------------------------------------------------
{
    const answers = { 1: 9, 6: 3 }; // id 1 invalid (>5), id 6 valid
    const profile = scriptModule.calculateProfile('PERSONALITY-01', answers);
    assert(profile.Openness.itemCount === 1, `Jawaban di luar rentang di-skip (itemCount: ${profile.Openness.itemCount})`);
    assert(profile.Openness.meanScore === 3, `Mean tetap benar setelah skip invalid (${profile.Openness.meanScore})`);
    assert(Number.isFinite(profile.Openness.normalizedScore), 'normalizedScore tetap finite');
}

// ------------------------------------------------
// 7. classifyScore tidak pernah keluar dari 3 level yang valid
// ------------------------------------------------
{
    const config = dataModule.scoringConfiguration['PERSONALITY-01'];
    ['low', 'moderate', 'high', 'undetermined'].forEach(() => {}); // valid keys reference
    const levels = [1, 2.5, 2.6, 3.4, 3.5, 5].map(v => scriptModule.classifyScore(v, config.thresholds).key);
    levels.forEach(l => assert(['low', 'moderate', 'high'].includes(l), `Level "${l}" termasuk salah satu dari low/moderate/high`));
}

// ------------------------------------------------
// 8. countUnanswered akurat
// ------------------------------------------------
{
    const answers = {};
    dataModule.questionsDatabase['CAREER-01'].forEach((q, i) => { answers[q.id] = i === 0 ? null : 3; });
    const unanswered = scriptModule.countUnanswered('CAREER-01', answers);
    assert(unanswered === 1, `countUnanswered = 1 (dapat: ${unanswered})`);
}

// ------------------------------------------------
// 9. generateReportId unik & konsisten formatnya
// ------------------------------------------------
{
    const id1 = scriptModule.generateReportId('PERSONALITY-01');
    const id2 = scriptModule.generateReportId('PERSONALITY-01');
    assert(id1 !== id2, 'Dua reportId berturut-turut berbeda (unik)');
    assert(/^PERSON-[A-Z0-9]+-[A-Z0-9]{5}$/.test(id1), `Format reportId sesuai pola (dapat: ${id1})`);
}

// ------------------------------------------------
// 10. getInterpretation fallback jika guide tidak ada
// ------------------------------------------------
{
    const text = scriptModule.getInterpretation('PERSONALITY-01', 'Openness', 'nonexistent-level');
    assert(text === 'Interpretasi belum tersedia untuk assessment ini.', 'Fallback interpretasi bekerja untuk level tak dikenal');
}

// ------------------------------------------------
// 11. Recommendation engine & Insight engine tidak error dan tidak diagnosis
// ------------------------------------------------
{
    const recModule = require(path.join(__dirname, '..', 'js', 'recommendation-engine.js'));
    const insightModule = require(path.join(__dirname, '..', 'js', 'insight-engine.js'));

    const answers = { 1: 5, 6: 5, 2: 4, 7: 1 }; // Openness & Conscientiousness tinggi
    const profile = scriptModule.calculateProfile('PERSONALITY-01', answers);

    const rec = recModule.getRecommendations('PERSONALITY-01', profile);
    assert(Array.isArray(rec.activities) && rec.activities.length > 0, 'Recommendation engine mengembalikan minimal 1 aktivitas');

    const insight = insightModule.generateInsight('PERSONALITY-01', profile);
    assert(typeof insight.summary === 'string' && insight.summary.length > 0, 'Insight engine menghasilkan ringkasan');
    assert(!/pasti|diagnosis|gangguan mental/i.test(insight.summary), 'Insight tidak memakai bahasa deterministik/diagnostik');
}

// ------------------------------------------------
// Report
// ------------------------------------------------
console.log('\n=======================================');
console.log(`TOTAL: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
console.log('=======================================\n');

if (failed > 0) {
    console.log('Daftar kegagalan:');
    failures.forEach(f => console.log(' -', f));
    process.exitCode = 1;
} else {
    process.exitCode = 0;
}
