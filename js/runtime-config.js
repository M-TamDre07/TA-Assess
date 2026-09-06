/*
 * TA ASSESS — Public runtime configuration
 *
 * File ini hanya berisi endpoint/link publik.
 * Jangan pernah menaruh API key, bot token, password, atau secret di sini.
 */
(function () {
    if (typeof CONFIG === 'undefined') return;

    CONFIG.GOOGLE_SHEETS_API = 'https://script.google.com/macros/s/AKfycbw1_jurj5YOX_uO5Gyxk4X4FCVkhytFrsruTB5y3zpQHS4qy0euIgyjiPkkYLYt9eRf/exec';
    CONFIG.FORMSPREE_LINK = 'https://formspree.io/f/xaeydera';
    CONFIG.SAWERIA_LINK = 'https://saweria.co/tamaandrea';

    // Kontak telepon tidak disimpan di CONFIG agar tidak ikut menjadi dependency backend.
    // Tautan kontak ditampilkan langsung pada index.html.
})();
