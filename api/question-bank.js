const QUESTION_BANK_URL = 'https://script.google.com/macros/s/AKfycbyT0jepU01BljPXNgMyUaAkgQ5U-j8X5n_kjh3pCosMhOv6hUAUA6uKETaAn7OlXTK9/exec';

module.exports = async function handler(req, res) {
    res.setHeader('Cache-Control', 'public, s-maxage=30, stale-while-revalidate=120');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, error: 'Method tidak didukung.' });
    }

    const assessmentId = String(req.query?.assessmentId || '').trim();
    const version = String(req.query?.version || '').trim();

    if (!/^[A-Za-z0-9._-]{1,120}$/.test(assessmentId)) {
        return res.status(400).json({ success: false, error: 'assessmentId tidak valid.' });
    }

    const url = new URL(QUESTION_BANK_URL);
    url.searchParams.set('action', 'questions');
    url.searchParams.set('assessmentId', assessmentId);
    if (version) url.searchParams.set('version', version.slice(0, 40));

    try {
        const upstream = await fetch(url, {
            method: 'GET',
            headers: { Accept: 'application/json' },
            cache: 'no-store'
        });

        const text = await upstream.text();
        let data;
        try {
            data = JSON.parse(text);
        } catch (_) {
            return res.status(502).json({ success: false, error: 'Question Bank mengembalikan respons yang tidak valid.' });
        }

        if (!upstream.ok || !data.success) {
            return res.status(502).json({
                success: false,
                error: data.error || 'Question Bank tidak tersedia.'
            });
        }

        // Hanya teruskan field yang memang diperlukan frontend.
        const questions = Array.isArray(data.questions) ? data.questions.slice(0, 300) : [];
        return res.status(200).json({
            success: true,
            service: 'TA Assess Question Bank Proxy',
            questionVersion: String(data.questionVersion || ''),
            count: questions.length,
            questions
        });
    } catch (error) {
        console.error('[TA ASSESS] Question Bank proxy error:', error);
        return res.status(502).json({ success: false, error: 'Gagal menghubungi Question Bank.' });
    }
};
