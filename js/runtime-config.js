/*
 * TA ASSESS | Public runtime configuration
 * File ini hanya berisi endpoint dan link publik.
 * Jangan pernah menaruh API key, bot token, password, atau secret di sini.
 */
(function () {
    if (typeof CONFIG === 'undefined') return;

    CONFIG.GOOGLE_SHEETS_API = 'https://script.google.com/macros/s/AKfycbw1_jurj5YOX_uO5Gyxk4X4FCVkhytFrsruTB5y3zpQHS4qy0euIgyjiPkkYLYt9eRf/exec';
    CONFIG.ACCOUNT_API = '';
    CONFIG.QUESTION_BANK_API = '/api/question-bank';
    CONFIG.ASSESSMENT_SECURITY_API = '/api/assessment-session';
    CONFIG.ASSESSMENT_SUBMIT_API = '/api/assessment-submit';
    CONFIG.ADMIN_URL = '/admin.html';
    CONFIG.FORMSPREE_LINK = 'https://formspree.io/f/xaeydera';
    CONFIG.SAWERIA_LINK = 'https://saweria.co/tamaandrea';

    // ACCOUNT_API diisi setelah account.gs dideploy sebagai Web App.
    // Question Bank dibaca melalui Vercel Function agar frontend tidak bergantung
    // pada CORS ContentService Apps Script secara langsung.
    // Endpoint security membutuhkan TA_ASSESS_SERVER_SECRET di Vercel.
    // Secret tersebut tidak boleh dimasukkan ke frontend atau GitHub.
})();
