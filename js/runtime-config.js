/*
 * TA ASSESS Public runtime configuration
 *
 * File ini hanya berisi endpoint dan link publik.
 * Jangan pernah menaruh API key, bot token, password, atau secret di sini.
 */
(function () {
    if (typeof CONFIG === 'undefined') return;

    CONFIG.GOOGLE_SHEETS_API = 'https://script.google.com/macros/s/AKfycbw1_jurj5YOX_uO5Gyxk4X4FCVkhytFrsruTB5y3zpQHS4qy0euIgyjiPkkYLYt9eRf/exec';
    CONFIG.ACCOUNT_API = '';
    CONFIG.QUESTION_BANK_API = 'https://script.google.com/macros/s/AKfycbyT0jepU01BljPXNgMyUaAkgQ5U-j8X5n_kjh3pCosMhOv6hUAUA6uKETaAn7OlXTK9/exec';
    CONFIG.FORMSPREE_LINK = 'https://formspree.io/f/xaeydera';
    CONFIG.SAWERIA_LINK = 'https://saweria.co/tamaandrea';

    // ACCOUNT_API diisi setelah account.gs dideploy sebagai Web App.
    // QUESTION_BANK_API adalah endpoint publik untuk membaca soal ACTIVE/PILOT/DEMO.
    // Jangan taruh secret atau admin key di file ini karena frontend bersifat publik.
})();
