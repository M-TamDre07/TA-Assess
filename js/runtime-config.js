/*
 * TA ASSESS | Public runtime configuration
 * File ini hanya berisi endpoint dan link publik.
 * Jangan pernah menaruh API key, bot token, password, atau secret di sini.
 */
(function () {
    if (typeof CONFIG === 'undefined') return;

    // Backend hasil terbaru
    CONFIG.GOOGLE_SHEETS_API = 'https://script.google.com/macros/s/AKfycbybvP-FJvO1ruHoGjikM60Y99ofiu9YrWkIXgl410ua1sxt96sgt8tCXCRYzLy8bwEx/exec';
    CONFIG.ACCOUNT_API = '';
    CONFIG.QUESTION_BANK_API = '/api/question-bank';
    CONFIG.ASSESSMENT_SECURITY_API = '/api/assessment-session';
    CONFIG.ASSESSMENT_SUBMIT_API = '/api/assessment-submit';
    CONFIG.ASSESSMENT_EVENT_API = '/api/assessment-event';
    CONFIG.SYSTEM_HEALTH_API = '/api/system-health';
    CONFIG.ADMIN_URL = '/admin.html';
    CONFIG.FORMSPREE_LINK = 'https://formspree.io/f/xaeydera';
    CONFIG.SAWERIA_LINK = 'https://saweria.co/tamaandrea';
    CONFIG.MRD_COMMUNITY_LINK = 'https://chat.whatsapp.com/BtwsdCb1RTeA2NQufeQhtj';

    // ACCOUNT_API diisi setelah account.gs dideploy sebagai Web App.
    // Question Bank dibaca melalui Vercel Function agar frontend tidak bergantung
    // pada CORS ContentService Apps Script secara langsung.
    // Endpoint security membutuhkan TA_ASSESS_SERVER_SECRET di Vercel.
    // Jika Turnstile digunakan, site key publik boleh diletakkan di frontend,
    // sedangkan secret Turnstile wajib tetap menjadi environment variable server.
})();
