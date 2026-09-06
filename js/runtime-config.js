/*
 * TA ASSESS — Public runtime configuration
 *
 * File ini hanya berisi endpoint/link publik.
 * Jangan pernah menaruh API key, bot token, password, atau secret di sini.
 */
(function () {
    if (typeof CONFIG === 'undefined') return;

    CONFIG.GOOGLE_SHEETS_API = 'https://script.google.com/macros/s/AKfycbw1_jurj5YOX_uO5Gyxk4X4FCVkhytFrsruTB5y3zpQHS4qy0euIgyjiPkkYLYt9eRf/exec';
    CONFIG.ACCOUNT_API = '';
    CONFIG.FORMSPREE_LINK = 'https://formspree.io/f/xaeydera';
    CONFIG.SAWERIA_LINK = 'https://saweria.co/tamaandrea';

    // ACCOUNT_API diisi setelah google-apps-script/account.gs dideploy sebagai Web App.
    // Jangan taruh secret/token di file ini karena frontend bersifat publik.
    // Kontak telepon tetap didefinisikan langsung pada index.html.
})();
