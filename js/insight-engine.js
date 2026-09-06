// ============================================
// TA ASSESS V2 - Insight Assistant
// LEVEL 1: Rule-based (aktif, tidak butuh API key)
// LEVEL 2: Template-based NLG (fungsi generateInsight() di bawah ini)
// LEVEL 3: External AI API opsional — TIDAK diimplementasikan di MVP ini.
//          Jika suatu saat dikonfigurasi, engine ini tetap harus berfungsi
//          sebagai fallback ketika API tidak tersedia.
//
// ATURAN KERAS:
// - TIDAK mendiagnosis / tidak menentukan gangguan mental
// - TIDAK mengklaim hasil pasti atau mutlak
// - TIDAK menentukan karier atau keputusan seleksi
// - TIDAK mengubah skor psikometri, hanya membaca hasil yang sudah dihitung
// ============================================

const INSIGHT_DISCLAIMER = 'Insight ini dihasilkan oleh sistem rule-based sederhana untuk membantu memahami hasil asesmen. Ini bukan diagnosis, bukan nasihat profesional, dan tidak menggantikan psikolog atau konselor.';

/**
 * Pasangan dimensi "tinggi bersama" yang punya narasi gabungan sederhana.
 * Ditambah bertahap — tidak mengarang statistik/validitas.
 */
const combinationTemplates = [
    {
        assessmentId: 'PERSONALITY-01',
        when: (p) => highOn(p, 'Openness') && highOn(p, 'Conscientiousness'),
        text: 'Profil ini menunjukkan kecenderungan menggabungkan eksplorasi ide dengan struktur kerja. Anda dapat mengeksplorasi aktivitas yang membutuhkan kreativitas sekaligus perencanaan.'
    },
    {
        assessmentId: 'PERSONALITY-01',
        when: (p) => highOn(p, 'Extraversion') && highOn(p, 'Agreeableness'),
        text: 'Profil ini menunjukkan kecenderungan senang berinteraksi sekaligus kooperatif. Aktivitas yang melibatkan kerja tim atau membantu orang lain mungkin terasa selaras dengan kecenderungan ini.'
    },
    {
        assessmentId: 'CAREER-01',
        when: (p) => highOn(p, 'Investigative') && highOn(p, 'Artistic'),
        text: 'Kecenderungan respons menunjukkan minat pada analisis sekaligus kreativitas — beberapa orang dengan pola ini mengeksplorasi bidang yang menggabungkan keduanya, seperti riset desain atau data visualization.'
    },
    {
        assessmentId: 'LEARNING-01',
        when: (p) => highOn(p, 'Visual') && highOn(p, 'Kinesthetic'),
        text: 'Kecenderungan preferensi belajar menunjukkan kombinasi visual dan praktik langsung — mencoba diagram yang diikuti simulasi/latihan langsung mungkin terasa efektif.'
    }
];

function highOn(profile, dimension) {
    return profile[dimension] && profile[dimension].level === 'high';
}

function summarizeProfile(assessmentId, profile) {
    const dims = Object.values(profile);
    const answered = dims.filter(d => d.itemCount > 0);
    if (answered.length === 0) {
        return 'Belum ada jawaban yang cukup untuk merangkum profil ini.';
    }

    const high = answered.filter(d => d.level === 'high').map(d => d.dimension);
    const low = answered.filter(d => d.level === 'low').map(d => d.dimension);

    let summary = 'Dalam asesmen ini, ';
    if (high.length > 0) {
        summary += `hasil menunjukkan kecenderungan relatif lebih tinggi pada ${formatList(high)}`;
    }
    if (low.length > 0) {
        summary += high.length > 0 ? `, dan kecenderungan relatif lebih rendah pada ${formatList(low)}` : `hasil menunjukkan kecenderungan relatif lebih rendah pada ${formatList(low)}`;
    }
    if (high.length === 0 && low.length === 0) {
        summary += 'hasil relatif merata di semua dimensi yang diukur';
    }
    summary += '. Ingat, ini menggambarkan kecenderungan relatif dalam asesmen ini saja, bukan penilaian mutlak tentang diri Anda.';
    return summary;
}

function formatList(arr) {
    if (arr.length === 1) return arr[0];
    return arr.slice(0, -1).join(', ') + ' dan ' + arr[arr.length - 1];
}

function generateInsight(assessmentId, profile) {
    const summary = summarizeProfile(assessmentId, profile);

    const combinationNotes = combinationTemplates
        .filter(t => t.assessmentId === assessmentId && t.when(profile))
        .map(t => t.text);

    return {
        summary,
        combinationNotes,
        disclaimer: INSIGHT_DISCLAIMER
    };
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { generateInsight, summarizeProfile, INSIGHT_DISCLAIMER };
}
if (typeof window !== 'undefined') {
    window.TA_INSIGHT = { generateInsight, INSIGHT_DISCLAIMER };
}
