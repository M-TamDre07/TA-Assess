// ============================================
// TA ASSESS V2 - Recommendation Engine (rule-based)
// Input: hasil profil skor. Output: saran eksplorasi, BUKAN keputusan.
// Tidak butuh API key. Semua rule ada di sini (bukan hard-code di UI).
// ============================================

const recommendationRules = [
    // Big Five
    { assessmentId: 'PERSONALITY-01', condition: { dimension: 'Openness', operator: '>=', value: 3.5 },
      recommendations: ['Coba eksplorasi aktivitas kreatif baru (menulis, desain, musik) untuk melihat apa yang cocok bagi Anda.', 'Ikuti kelas atau workshop di bidang yang belum pernah Anda coba.'] },
    { assessmentId: 'PERSONALITY-01', condition: { dimension: 'Conscientiousness', operator: '>=', value: 3.5 },
      recommendations: ['Manfaatkan kecenderungan terorganisir ini untuk menyusun rencana belajar/kerja jangka panjang.', 'Coba peran yang membutuhkan perencanaan detail.'] },
    { assessmentId: 'PERSONALITY-01', condition: { dimension: 'Extraversion', operator: '<=', value: 2.5 },
      recommendations: ['Eksplorasi aktivitas yang nyaman dilakukan sendiri atau kelompok kecil sebagai kekuatan, bukan kekurangan.', 'Coba refleksikan situasi sosial mana yang terasa paling nyaman bagi Anda.'] },
    { assessmentId: 'PERSONALITY-01', condition: { dimension: 'Agreeableness', operator: '>=', value: 3.5 },
      recommendations: ['Pertimbangkan aktivitas atau peran yang melibatkan kolaborasi dan membantu orang lain.'] },
    { assessmentId: 'PERSONALITY-01', condition: { dimension: 'Neuroticism', operator: '>=', value: 3.5 },
      recommendations: ['Pertimbangkan diskusi dengan konselor/psikolog tentang strategi mengelola stres yang cocok untuk Anda.', 'Coba catat situasi yang memicu kekhawatiran sebagai bahan refleksi.'] },

    // RIASEC
    { assessmentId: 'CAREER-01', condition: { dimension: 'Realistic', operator: '>=', value: 3.5 },
      recommendations: ['Eksplorasi bidang yang melibatkan kerja praktis/teknis (mis. teknik, kerajinan, lapangan).'] },
    { assessmentId: 'CAREER-01', condition: { dimension: 'Investigative', operator: '>=', value: 3.5 },
      recommendations: ['Eksplorasi bidang riset, sains, atau analisis data.'] },
    { assessmentId: 'CAREER-01', condition: { dimension: 'Artistic', operator: '>=', value: 3.5 },
      recommendations: ['Eksplorasi bidang kreatif seperti desain, seni, atau media.'] },
    { assessmentId: 'CAREER-01', condition: { dimension: 'Social', operator: '>=', value: 3.5 },
      recommendations: ['Eksplorasi bidang yang melibatkan interaksi dan bantuan kepada orang lain (pendidikan, kesehatan, layanan sosial).'] },
    { assessmentId: 'CAREER-01', condition: { dimension: 'Enterprising', operator: '>=', value: 3.5 },
      recommendations: ['Eksplorasi bidang kepemimpinan, wirausaha, atau penjualan.'] },
    { assessmentId: 'CAREER-01', condition: { dimension: 'Conventional', operator: '>=', value: 3.5 },
      recommendations: ['Eksplorasi bidang administrasi, keuangan, atau manajemen data.'] },

    // Learning
    { assessmentId: 'LEARNING-01', condition: { dimension: 'Visual', operator: '>=', value: 3.5 },
      recommendations: ['Coba gunakan mind-map, diagram, atau video saat belajar materi baru.'] },
    { assessmentId: 'LEARNING-01', condition: { dimension: 'Auditory', operator: '>=', value: 3.5 },
      recommendations: ['Coba belajar lewat diskusi kelompok, podcast, atau menjelaskan materi dengan suara keras.'] },
    { assessmentId: 'LEARNING-01', condition: { dimension: 'Reading/Writing', operator: '>=', value: 3.5 },
      recommendations: ['Coba membuat ringkasan tertulis atau catatan terstruktur setelah belajar.'] },
    { assessmentId: 'LEARNING-01', condition: { dimension: 'Kinesthetic', operator: '>=', value: 3.5 },
      recommendations: ['Coba praktik langsung atau simulasi saat mempelajari konsep baru.'] }
];

const universalReflectionQuestions = [
    'Dari hasil ini, bagian mana yang terasa paling sesuai dengan pengalaman Anda sehari-hari?',
    'Adakah bagian dari hasil ini yang justru terasa kurang sesuai? Mengapa menurut Anda demikian?',
    'Langkah kecil apa yang bisa Anda coba minggu ini berdasarkan hasil ini?'
];

function evaluateCondition(value, operator, target) {
    if (value === null || value === undefined || !isFinite(value)) return false;
    switch (operator) {
        case '>=': return value >= target;
        case '<=': return value <= target;
        case '>': return value > target;
        case '<': return value < target;
        case '==': return value === target;
        default: return false;
    }
}

/**
 * profile: hasil dari TA_ASSESS.calculateProfile(assessmentId, answers)
 */
function getRecommendations(assessmentId, profile) {
    const matched = [];

    recommendationRules
        .filter(rule => rule.assessmentId === assessmentId)
        .forEach(rule => {
            const dimResult = profile[rule.condition.dimension];
            if (!dimResult || dimResult.meanScore === null) return;
            if (evaluateCondition(dimResult.meanScore, rule.condition.operator, rule.condition.value)) {
                matched.push(...rule.recommendations);
            }
        });

    return {
        activities: matched.length > 0 ? matched : ['Belum ada rekomendasi spesifik — jawab lebih banyak dimensi untuk hasil yang lebih kaya.'],
        reflectionQuestions: universalReflectionQuestions,
        discussionSuggestion: 'Jika hasil ini memunculkan pertanyaan lebih lanjut tentang diri Anda, pertimbangkan untuk mendiskusikannya dengan guru BK, konselor, atau psikolog.'
    };
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { recommendationRules, getRecommendations, evaluateCondition };
}
if (typeof window !== 'undefined') {
    window.TA_RECOMMENDATION = { getRecommendations };
}
