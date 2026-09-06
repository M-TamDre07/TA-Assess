// ============================================
// TA ASSESS V2 - Assessment Data & Configuration
// Single source of truth untuk data instrumen.
// ============================================

const APP_VERSION = '0.2.0';

const assessments = {
    personality: {
        id: 'PERSONALITY-01',
        name: 'Big Five Personality — Demo',
        category: 'Personal Exploration',
        description: 'Eksplorasi kecenderungan lima dimensi kepribadian berdasarkan kerangka Big Five, untuk tujuan eksplorasi diri (bukan tes psikologi tervalidasi).',
        details: {
            purpose: 'Mengeksplorasi kecenderungan relatif pada lima dimensi: Openness, Conscientiousness, Extraversion, Agreeableness, dan Neuroticism.',
            instrumentType: 'Self-report Likert questionnaire',
            instrument: 'Big Five Personality Model (adaptasi non-resmi)',
            version: '0.1',
            instrumentVersion: '0.1',
            scoringVersion: '0.1',
            developmentStatus: 'DEMO',
            validationStatus: 'Not validated',
            lastUpdated: '2026-09-06',
            items: 10, // HARUS sama dengan questionsDatabase['PERSONALITY-01'].length
            scale: 5,
            scaleLabel: 'Likert Scale (1-5)',
            timeEstimate: '3-5 menit (versi demo)',
            targetPopulation: 'Umum (13+ tahun)',
            language: 'Indonesian',
            intendedUse: 'Eksplorasi diri mandiri, bahan diskusi reflektif.',
            excludedUse: 'Tidak untuk diagnosis klinis, seleksi kerja/pendidikan, atau keputusan formal apa pun.'
        },
        dimensions: [
            { name: 'Openness', description: 'Keterbukaan terhadap pengalaman baru, kreativitas, dan imajinasi' },
            { name: 'Conscientiousness', description: 'Kedisiplinan, keandalan, dan perhatian terhadap detail' },
            { name: 'Extraversion', description: 'Tingkat energi sosial dan orientasi interpersonal' },
            { name: 'Agreeableness', description: 'Keramahan, empati, dan kerjasama' },
            { name: 'Neuroticism', description: 'Kecenderungan terhadap emosi negatif dan stres' }
        ]
    },
    career: {
        id: 'CAREER-01',
        name: 'Career Interest Exploration — Demo',
        category: 'Career Exploration',
        description: 'Eksplorasi kecenderungan minat aktivitas kerja berdasarkan kerangka RIASEC, untuk eksplorasi awal (bukan penentuan karier final).',
        details: {
            purpose: 'Mengidentifikasi kecenderungan respons pada enam dimensi minat aktivitas (RIASEC) sebagai bahan eksplorasi karier.',
            instrumentType: 'Self-report Likert questionnaire',
            instrument: 'RIASEC Interest Framework (adaptasi non-resmi)',
            version: '0.1',
            instrumentVersion: '0.1',
            scoringVersion: '0.1',
            developmentStatus: 'DEMO',
            validationStatus: 'Not validated',
            lastUpdated: '2026-09-06',
            items: 6, // HARUS sama dengan questionsDatabase['CAREER-01'].length
            scale: 5,
            scaleLabel: 'Likert Scale (1-5)',
            timeEstimate: '2-4 menit (versi demo)',
            targetPopulation: 'SMA ke atas',
            language: 'Indonesian',
            intendedUse: 'Eksplorasi awal minat karier, bahan diskusi dengan guru BK/konselor.',
            excludedUse: 'Tidak untuk keputusan penerimaan kerja/pendidikan atau penentuan karier mutlak.'
        },
        dimensions: [
            { name: 'Realistic', description: 'Preferensi untuk pekerjaan praktis dan teknis' },
            { name: 'Investigative', description: 'Preferensi untuk analisis, penelitian, dan pemecahan masalah' },
            { name: 'Artistic', description: 'Preferensi untuk kreativitas dan ekspresi diri' },
            { name: 'Social', description: 'Preferensi untuk membantu dan bekerja dengan orang lain' },
            { name: 'Enterprising', description: 'Preferensi untuk kepemimpinan dan mencapai tujuan' },
            { name: 'Conventional', description: 'Preferensi untuk organisasi dan struktur' }
        ]
    },
    learning: {
        id: 'LEARNING-01',
        name: 'Learning Preferences — Demo',
        category: 'Education',
        description: 'Eksplorasi preferensi gaya belajar sebagai bahan refleksi strategi belajar personal.',
        details: {
            purpose: 'Menggambarkan kecenderungan preferensi belajar (bukan pengukuran kemampuan belajar).',
            instrumentType: 'Self-report Likert questionnaire',
            instrument: 'Learning Preferences Inventory (adaptasi non-resmi)',
            version: '0.1',
            instrumentVersion: '0.1',
            scoringVersion: '0.1',
            developmentStatus: 'PILOT',
            validationStatus: 'Not validated',
            lastUpdated: '2026-09-06',
            items: 4, // HARUS sama dengan questionsDatabase['LEARNING-01'].length
            scale: 5,
            scaleLabel: 'Likert Scale (1-5)',
            timeEstimate: '2-3 menit (versi demo)',
            targetPopulation: 'Pelajar semua tingkatan',
            language: 'Indonesian',
            intendedUse: 'Refleksi personal strategi belajar.',
            excludedUse: 'Tidak untuk penempatan kelas, penilaian akademik, atau keputusan formal pendidikan.'
        },
        dimensions: [
            { name: 'Visual', description: 'Belajar lebih baik melalui gambar, diagram, dan visualisasi' },
            { name: 'Auditory', description: 'Belajar lebih baik melalui mendengarkan dan diskusi' },
            { name: 'Reading/Writing', description: 'Belajar lebih baik melalui membaca dan menulis' },
            { name: 'Kinesthetic', description: 'Belajar lebih baik melalui praktik dan pengalaman langsung' }
        ]
    }
};

// Setiap soal: { id, text, dimension, reverse }
// reverse=true berarti skor akan dibalik sebelum dijumlahkan (lihat scoring-engine di script.js)
const questionsDatabase = {
    'PERSONALITY-01': [
        { id: 1, text: 'Saya banyak melakukan hal-hal kreatif dan imajinatif', dimension: 'Openness', reverse: false },
        { id: 2, text: 'Saya adalah orang yang terorganisir dan disiplin', dimension: 'Conscientiousness', reverse: false },
        { id: 3, text: 'Saya senang menghabiskan waktu bersama orang lain dan acara sosial', dimension: 'Extraversion', reverse: false },
        { id: 4, text: 'Saya peduli dan berempati terhadap perasaan orang lain', dimension: 'Agreeableness', reverse: false },
        { id: 5, text: 'Saya sering merasa cemas atau khawatir tentang berbagai hal', dimension: 'Neuroticism', reverse: false },
        { id: 6, text: 'Saya selalu mencari pengalaman dan hal baru', dimension: 'Openness', reverse: false },
        { id: 7, text: 'Saya sering menunda-nunda tugas atau pekerjaan', dimension: 'Conscientiousness', reverse: true },
        { id: 8, text: 'Saya lebih suka berada di rumah daripada bergaul dengan banyak orang', dimension: 'Extraversion', reverse: true },
        { id: 9, text: 'Saya tidak terlalu peduli dengan kebutuhan orang lain', dimension: 'Agreeableness', reverse: true },
        { id: 10, text: 'Saya merasa diri saya stabil dan emosi terkontrol', dimension: 'Neuroticism', reverse: true }
    ],
    'CAREER-01': [
        { id: 1, text: 'Saya senang bekerja dengan tangan dan alat', dimension: 'Realistic', reverse: false },
        { id: 2, text: 'Saya menyukai menganalisis data dan memecahkan masalah kompleks', dimension: 'Investigative', reverse: false },
        { id: 3, text: 'Saya senang mengekspresikan diri melalui seni atau kreativitas', dimension: 'Artistic', reverse: false },
        { id: 4, text: 'Saya senang membantu orang lain dan memberikan dukungan', dimension: 'Social', reverse: false },
        { id: 5, text: 'Saya termotivasi oleh tantangan dan pencapaian target', dimension: 'Enterprising', reverse: false },
        { id: 6, text: 'Saya menyukai bekerja dengan sistem, aturan, dan organisasi yang jelas', dimension: 'Conventional', reverse: false }
    ],
    'LEARNING-01': [
        { id: 1, text: 'Saya lebih mudah memahami dengan melihat diagram atau gambar', dimension: 'Visual', reverse: false },
        { id: 2, text: 'Saya belajar lebih baik melalui diskusi dan mendengarkan penjelasan', dimension: 'Auditory', reverse: false },
        { id: 3, text: 'Saya suka membaca dan menulis untuk memahami konsep baru', dimension: 'Reading/Writing', reverse: false },
        { id: 4, text: 'Saya belajar paling baik dengan melakukan praktik langsung', dimension: 'Kinesthetic', reverse: false }
    ]
};

// Konfigurasi scoring: satu sumber kebenaran untuk threshold interpretasi.
const scoringConfiguration = {
    'PERSONALITY-01': {
        scale: 5,
        dimensions: ['Openness', 'Conscientiousness', 'Extraversion', 'Agreeableness', 'Neuroticism'],
        thresholds: {
            low: { max: 2.5, label: 'Rendah' },
            moderate: { max: 3.4, label: 'Sedang' },
            high: { max: 5, label: 'Tinggi' }
        }
    },
    'CAREER-01': {
        scale: 5,
        dimensions: ['Realistic', 'Investigative', 'Artistic', 'Social', 'Enterprising', 'Conventional'],
        thresholds: {
            low: { max: 2.5, label: 'Kecenderungan Rendah' },
            moderate: { max: 3.4, label: 'Kecenderungan Sedang' },
            high: { max: 5, label: 'Kecenderungan Tinggi' }
        }
    },
    'LEARNING-01': {
        scale: 5,
        dimensions: ['Visual', 'Auditory', 'Reading/Writing', 'Kinesthetic'],
        thresholds: {
            low: { max: 2.5, label: 'Preferensi Rendah' },
            moderate: { max: 3.4, label: 'Preferensi Sedang' },
            high: { max: 5, label: 'Preferensi Tinggi' }
        }
    }
};

// Interpretation guides — bahasa probabilistik, tidak deterministik/diagnostik.
// Jika kombinasi assessment/dimension/level tidak ada di sini, engine akan
// menampilkan fallback "Interpretasi belum tersedia untuk assessment ini."
const interpretationGuides = {
    'PERSONALITY-01': {
        Openness: {
            high: 'Hasil menunjukkan kecenderungan relatif lebih tinggi pada dimensi Openness dalam asesmen ini — cenderung terbuka terhadap ide dan pengalaman baru.',
            moderate: 'Hasil menunjukkan kecenderungan sedang pada dimensi Openness dalam asesmen ini — ada keseimbangan antara eksplorasi dan kebiasaan yang familiar.',
            low: 'Hasil menunjukkan kecenderungan relatif lebih rendah pada dimensi Openness dalam asesmen ini — cenderung menyukai rutinitas dan pendekatan yang sudah dikenal.'
        },
        Conscientiousness: {
            high: 'Hasil menunjukkan kecenderungan relatif lebih tinggi pada dimensi Conscientiousness dalam asesmen ini — cenderung terorganisir dan disiplin.',
            moderate: 'Hasil menunjukkan kecenderungan sedang pada dimensi Conscientiousness dalam asesmen ini.',
            low: 'Hasil menunjukkan kecenderungan relatif lebih rendah pada dimensi Conscientiousness dalam asesmen ini — cenderung lebih spontan dan fleksibel.'
        },
        Extraversion: {
            high: 'Hasil menunjukkan kecenderungan relatif lebih tinggi pada dimensi Extraversion dalam asesmen ini — cenderung energik dalam interaksi sosial.',
            moderate: 'Hasil menunjukkan kecenderungan sedang pada dimensi Extraversion dalam asesmen ini.',
            low: 'Hasil menunjukkan kecenderungan relatif lebih rendah pada dimensi Extraversion dalam asesmen ini — cenderung nyaman dengan interaksi kelompok kecil atau waktu sendiri.'
        },
        Agreeableness: {
            high: 'Hasil menunjukkan kecenderungan relatif lebih tinggi pada dimensi Agreeableness dalam asesmen ini — cenderung kooperatif dan empatik.',
            moderate: 'Hasil menunjukkan kecenderungan sedang pada dimensi Agreeableness dalam asesmen ini.',
            low: 'Hasil menunjukkan kecenderungan relatif lebih rendah pada dimensi Agreeableness dalam asesmen ini — cenderung lebih fokus pada tujuan pribadi.'
        },
        Neuroticism: {
            high: 'Hasil menunjukkan kecenderungan relatif lebih tinggi pada dimensi Neuroticism dalam asesmen ini — mungkin lebih sensitif terhadap situasi penuh tekanan.',
            moderate: 'Hasil menunjukkan kecenderungan sedang pada dimensi Neuroticism dalam asesmen ini.',
            low: 'Hasil menunjukkan kecenderungan relatif lebih rendah pada dimensi Neuroticism dalam asesmen ini — cenderung stabil secara emosional dalam konteks asesmen ini.'
        }
    },
    'CAREER-01': {
        Realistic: {
            high: 'Kecenderungan respons pada dimensi Realistic relatif tinggi — tertarik pada aktivitas praktis dan teknis.',
            moderate: 'Kecenderungan respons pada dimensi Realistic berada pada tingkat sedang.',
            low: 'Kecenderungan respons pada dimensi Realistic relatif rendah dalam asesmen ini.'
        },
        Investigative: {
            high: 'Kecenderungan respons pada dimensi Investigative relatif tinggi — tertarik pada analisis dan pemecahan masalah.',
            moderate: 'Kecenderungan respons pada dimensi Investigative berada pada tingkat sedang.',
            low: 'Kecenderungan respons pada dimensi Investigative relatif rendah dalam asesmen ini.'
        },
        Artistic: {
            high: 'Kecenderungan respons pada dimensi Artistic relatif tinggi — tertarik pada ekspresi kreatif.',
            moderate: 'Kecenderungan respons pada dimensi Artistic berada pada tingkat sedang.',
            low: 'Kecenderungan respons pada dimensi Artistic relatif rendah dalam asesmen ini.'
        },
        Social: {
            high: 'Kecenderungan respons pada dimensi Social relatif tinggi — tertarik membantu dan bekerja bersama orang lain.',
            moderate: 'Kecenderungan respons pada dimensi Social berada pada tingkat sedang.',
            low: 'Kecenderungan respons pada dimensi Social relatif rendah dalam asesmen ini.'
        },
        Enterprising: {
            high: 'Kecenderungan respons pada dimensi Enterprising relatif tinggi — tertarik memimpin dan mencapai target.',
            moderate: 'Kecenderungan respons pada dimensi Enterprising berada pada tingkat sedang.',
            low: 'Kecenderungan respons pada dimensi Enterprising relatif rendah dalam asesmen ini.'
        },
        Conventional: {
            high: 'Kecenderungan respons pada dimensi Conventional relatif tinggi — tertarik pada struktur dan keteraturan kerja.',
            moderate: 'Kecenderungan respons pada dimensi Conventional berada pada tingkat sedang.',
            low: 'Kecenderungan respons pada dimensi Conventional relatif rendah dalam asesmen ini.'
        }
    },
    'LEARNING-01': {
        Visual: {
            high: 'Preferensi belajar Visual relatif menonjol dalam asesmen ini.',
            moderate: 'Preferensi belajar Visual berada pada tingkat sedang dalam asesmen ini.',
            low: 'Preferensi belajar Visual relatif rendah dalam asesmen ini.'
        },
        Auditory: {
            high: 'Preferensi belajar Auditory relatif menonjol dalam asesmen ini.',
            moderate: 'Preferensi belajar Auditory berada pada tingkat sedang dalam asesmen ini.',
            low: 'Preferensi belajar Auditory relatif rendah dalam asesmen ini.'
        },
        'Reading/Writing': {
            high: 'Preferensi belajar Reading/Writing relatif menonjol dalam asesmen ini.',
            moderate: 'Preferensi belajar Reading/Writing berada pada tingkat sedang dalam asesmen ini.',
            low: 'Preferensi belajar Reading/Writing relatif rendah dalam asesmen ini.'
        },
        Kinesthetic: {
            high: 'Preferensi belajar Kinesthetic relatif menonjol dalam asesmen ini.',
            moderate: 'Preferensi belajar Kinesthetic berada pada tingkat sedang dalam asesmen ini.',
            low: 'Preferensi belajar Kinesthetic relatif rendah dalam asesmen ini.'
        }
    }
};

// ============================================
// Data Calibration — dijalankan otomatis saat load (lihat script.js)
// Memvalidasi konsistensi antar-file agar tidak ada assessment "bohong".
// ============================================
function checkAssessmentData() {
    const errors = [];
    Object.values(assessments).forEach(a => {
        const questions = questionsDatabase[a.id] || [];
        const config = scoringConfiguration[a.id];
        const guide = interpretationGuides[a.id];

        if (questions.length !== a.details.items) {
            errors.push(`${a.id}: metadata.items (${a.details.items}) != jumlah soal aktual (${questions.length})`);
        }
        if (!config) {
            errors.push(`${a.id}: scoringConfiguration tidak ditemukan`);
        } else {
            const ids = new Set();
            questions.forEach(q => {
                if (ids.has(q.id)) errors.push(`${a.id}: question id duplikat (${q.id})`);
                ids.add(q.id);
                if (!config.dimensions.includes(q.dimension)) {
                    errors.push(`${a.id}: soal #${q.id} punya dimension "${q.dimension}" yang tidak ada di scoringConfiguration`);
                }
                if (typeof q.reverse !== 'boolean') {
                    errors.push(`${a.id}: soal #${q.id} field "reverse" harus boolean`);
                }
            });
        }
        if (!guide) {
            errors.push(`${a.id}: interpretationGuides tidak ditemukan (fallback interpretasi akan dipakai)`);
        }
    });

    if (errors.length > 0) {
        errors.forEach(e => console.error('[TA ASSESS DATA ERROR]', e));
    }
    return errors;
}

// Export untuk Node (automated tests) & browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { assessments, questionsDatabase, scoringConfiguration, interpretationGuides, checkAssessmentData, APP_VERSION };
}
