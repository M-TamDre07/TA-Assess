/*
 * TA Assess - kontrol integritas browser.
 *
 * Modul ini membantu menjaga konsistensi sesi dan mencatat sinyal keamanan.
 * Sinyal tersebut bukan bukti kecurangan dan tidak mengubah skor.
 */

(function () {
    'use strict';

    const CHANNEL_NAME = 'ta-assess-integrity';
    const TAB_STORAGE_KEY = 'ta_assess_tab_id';

    let channel = null;
    let tabId = sessionStorage.getItem(TAB_STORAGE_KEY);
    let overlay = null;
    let serverSessionToken = '';
    let serverSessionRequest = null;

    const originalFetch = window.fetch.bind(window);

    if (!tabId) {
        tabId = crypto.randomUUID
            ? crypto.randomUUID()
            : String(Date.now()) + Math.random();
        sessionStorage.setItem(TAB_STORAGE_KEY, tabId);
    }

    function isAssessmentActive() {
        return (
            typeof testState !== 'undefined' &&
            testState.startTime &&
            !testState.submitted
        );
    }

    function signal(name, metadata = {}) {
        if (typeof registerIntegritySignal === 'function') {
            registerIntegritySignal(name, metadata);
        }
    }

    async function sendGatewayEvent(eventName, metadata = {}) {
        if (
            !serverSessionToken ||
            typeof CONFIG === 'undefined' ||
            !CONFIG.ASSESSMENT_EVENT_API
        ) {
            return;
        }

        try {
            await originalFetch(CONFIG.ASSESSMENT_EVENT_API, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-TA-Assessment-Session': serverSessionToken
                },
                body: JSON.stringify({
                    eventName,
                    assessmentId:
                        typeof testState !== 'undefined'
                            ? testState.assessmentId
                            : '',
                    reportId:
                        typeof testState !== 'undefined'
                            ? testState.reportId
                            : '',
                    metadata
                }),
                keepalive: true
            });
        } catch (_) {
            // Pencatatan event tidak boleh menghentikan asesmen.
        }
    }

    function ensureOverlay() {
        if (overlay) {
            return overlay;
        }

        overlay = document.createElement('div');
        overlay.id = 'taIntegrityOverlay';
        overlay.setAttribute('aria-hidden', 'true');
        overlay.style.cssText = [
            'display:none',
            'position:fixed',
            'inset:0',
            'z-index:9998',
            'background:rgba(20,32,44,.96)',
            'color:#fff',
            'align-items:center',
            'justify-content:center',
            'text-align:center',
            'padding:28px',
            'font:600 1rem/1.6 system-ui,sans-serif'
        ].join(';');

        overlay.innerHTML =
            '<div>' +
            '<div style="font-size:1.15rem;margin-bottom:8px">' +
            'Sesi asesmen sedang dijeda' +
            '</div>' +
            '<div>' +
            'Halaman ini disembunyikan sementara karena jendela tidak sedang aktif. ' +
            'Kembali ke halaman asesmen untuk melanjutkan.' +
            '</div>' +
            '</div>';

        document.body.appendChild(overlay);
        return overlay;
    }

    function setHidden(hidden) {
        ensureOverlay().style.display = hidden ? 'flex' : 'none';
    }

    function shuffleQuestions() {
        if (
            typeof testState === 'undefined' ||
            !Array.isArray(testState.questions) ||
            testState.questions.length < 2
        ) {
            return;
        }

        for (let i = testState.questions.length - 1; i > 0; i -= 1) {
            const j = Math.floor(Math.random() * (i + 1));
            [testState.questions[i], testState.questions[j]] = [
                testState.questions[j],
                testState.questions[i]
            ];
        }

        testState.currentQuestion = 0;
    }

    function requestFullscreen() {
        try {
            if (
                document.documentElement.requestFullscreen &&
                !document.fullscreenElement
            ) {
                document.documentElement.requestFullscreen().catch(() => {});
            }
        } catch (_) {
            // Fullscreen bersifat opsional.
        }
    }

    function addWatermark() {
        const header = document.querySelector('.test-header');

        if (!header || header.querySelector('.ta-session-watermark')) {
            return;
        }

        const mark = document.createElement('div');
        mark.className = 'ta-session-watermark';
        mark.textContent = `Sesi ${tabId.slice(0, 8)}`;
        mark.style.cssText =
            'font-size:.72rem;opacity:.58;margin-top:8px;user-select:none;';

        header.appendChild(mark);
    }

    async function initServerSession() {
        if (
            serverSessionToken ||
            typeof CONFIG === 'undefined' ||
            !CONFIG.ASSESSMENT_SECURITY_API ||
            typeof testState === 'undefined'
        ) {
            return serverSessionToken;
        }

        if (serverSessionRequest) {
            return serverSessionRequest;
        }

        const mode =
            sessionStorage.getItem('ta_assess_access_mode') || 'guest';

        serverSessionRequest = (async function () {
            try {
                const url =
                    `${CONFIG.ASSESSMENT_SECURITY_API}` +
                    `?assessmentId=${encodeURIComponent(testState.assessmentId)}` +
                    `&mode=${encodeURIComponent(mode)}`;

                const response = await originalFetch(url, {
                    method: 'GET',
                    cache: 'no-store'
                });

                const data = await response.json();

                if (data && data.success && data.token) {
                    serverSessionToken = data.token;
                    window.__TA_ASSESS_SERVER_SESSION_TOKEN = serverSessionToken;

                    signal('server_session_ready');
                    sendGatewayEvent('assessment_session_issued', {
                        mode,
                        botRisk: data.botRisk || 'unknown'
                    });

                    return serverSessionToken;
                }

                signal('server_session_unavailable');
                return '';
            } catch (_) {
                signal('server_session_unavailable');
                return '';
            } finally {
                serverSessionRequest = null;
            }
        })();

        return serverSessionRequest;
    }

    function installSubmitProxy() {
        if (window.__TA_ASSESS_FETCH_GUARD) {
            return;
        }

        window.__TA_ASSESS_FETCH_GUARD = true;

        window.fetch = async function (input, init) {
            const target =
                typeof input === 'string'
                    ? input
                    : (input && input.url) || '';
            const body =
                init && typeof init.body === 'string'
                    ? init.body
                    : '';
            const mainApi =
                typeof CONFIG !== 'undefined'
                    ? CONFIG.GOOGLE_SHEETS_API
                    : '';
            const proxy =
                typeof CONFIG !== 'undefined'
                    ? CONFIG.ASSESSMENT_SUBMIT_API
                    : '';

            if (mainApi && proxy && target === mainApi && body) {
                try {
                    const parsed = JSON.parse(body);

                    if (parsed && parsed.action === 'submitResult') {
                        // Tunggu sesi server jika halaman dibuka dan dikirim terlalu cepat.
                        if (!serverSessionToken) {
                            await initServerSession();
                        }

                        if (serverSessionToken) {
                            signal('submission_routed_through_server');

                            const nextInit = {
                                ...(init || {}),
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'text/plain;charset=utf-8',
                                    'X-TA-Assessment-Session': serverSessionToken
                                },
                                body
                            };

                            delete nextInit.mode;
                            return originalFetch(proxy, nextInit);
                        }
                    }
                } catch (_) {
                    // Biarkan fetch asli menangani request jika payload bukan JSON.
                }
            }

            return originalFetch(input, init);
        };
    }

    function setupParallelTabMonitor() {
        if (typeof BroadcastChannel !== 'function') {
            return;
        }

        try {
            channel = new BroadcastChannel(CHANNEL_NAME);
            channel.onmessage = function (event) {
                const data = event.data;

                if (
                    isAssessmentActive() &&
                    data &&
                    data.tabId !== tabId &&
                    data.assessmentId === testState.assessmentId
                ) {
                    signal('parallel_tab_detected');
                    sendGatewayEvent('security_warning', {
                        type: 'parallel_tab'
                    });
                    showCalmMessage(
                        'Sesi asesmen terdeteksi terbuka pada tab lain. ' +
                        'Sebaiknya gunakan satu tab agar hasil tetap konsisten.'
                    );
                }
            };

            if (isAssessmentActive()) {
                channel.postMessage({
                    tabId,
                    assessmentId: testState.assessmentId
                });
            }
        } catch (_) {
            channel = null;
        }
    }

    function setupBrowserGuards() {
        document.addEventListener('copy', function (event) {
            if (!isAssessmentActive()) return;
            event.preventDefault();
            signal('copy_blocked');
        });

        document.addEventListener('cut', function (event) {
            if (!isAssessmentActive()) return;
            event.preventDefault();
            signal('cut_blocked');
        });

        document.addEventListener('paste', function (event) {
            if (!isAssessmentActive()) return;
            event.preventDefault();
            signal('paste_blocked');
        });

        document.addEventListener('contextmenu', function (event) {
            if (!isAssessmentActive()) return;
            event.preventDefault();
            signal('context_menu_blocked');
        });

        document.addEventListener('dragstart', function (event) {
            if (!isAssessmentActive()) return;
            event.preventDefault();
            signal('drag_blocked');
        });

        document.addEventListener('selectstart', function (event) {
            if (
                isAssessmentActive() &&
                event.target &&
                !['TEXTAREA', 'INPUT'].includes(event.target.tagName)
            ) {
                event.preventDefault();
            }
        });

        document.addEventListener(
            'keydown',
            function (event) {
                if (!isAssessmentActive()) return;

                const key = String(event.key || '').toLowerCase();
                const blocked =
                    (event.ctrlKey &&
                        ['c', 'x', 'v', 'u', 's', 'p'].includes(key)) ||
                    (event.ctrlKey &&
                        event.shiftKey &&
                        ['i', 'j', 'c'].includes(key)) ||
                    key === 'f12';

                if (blocked) {
                    event.preventDefault();
                    signal('restricted_shortcut', { key });
                }
            },
            true
        );

        window.addEventListener('blur', function () {
            if (!isAssessmentActive()) return;
            signal('window_blur');
            setHidden(true);
        });

        window.addEventListener('focus', function () {
            if (!isAssessmentActive()) return;
            signal('window_focus_return');
            setHidden(false);
        });

        document.addEventListener('visibilitychange', function () {
            if (!isAssessmentActive()) return;

            if (document.hidden) {
                signal('visibility_hidden');
                setHidden(true);
            } else {
                signal('visibility_returned');
                setHidden(false);
            }
        });

        document.addEventListener('fullscreenchange', function () {
            if (isAssessmentActive() && !document.fullscreenElement) {
                signal('fullscreen_exited');
            }
        });

        window.addEventListener('beforeprint', function () {
            if (!isAssessmentActive()) return;
            signal('print_attempt');
            document.body.style.display = 'none';
        });

        window.addEventListener('afterprint', function () {
            document.body.style.display = '';
        });

        window.addEventListener('pagehide', function () {
            if (isAssessmentActive()) {
                signal('page_hidden');
            }
        });
    }

    function wrapStartTest() {
        const originalStart = window.startTest;

        if (
            typeof originalStart !== 'function' ||
            originalStart.__taGuardWrapped
        ) {
            return;
        }

        const wrappedStart = function () {
            shuffleQuestions();
            requestFullscreen();

            const result = originalStart.apply(this, arguments);
            setTimeout(addWatermark, 100);

            return result;
        };

        wrappedStart.__taGuardWrapped = true;
        window.startTest = wrappedStart;
    }

    function setup() {
        installSubmitProxy();
        initServerSession();
        setupParallelTabMonitor();
        setupBrowserGuards();
        wrapStartTest();

        setInterval(function () {
            if (isAssessmentActive() && channel) {
                channel.postMessage({
                    tabId,
                    assessmentId: testState.assessmentId
                });
            }
        }, 10000);
    }

    document.addEventListener('DOMContentLoaded', function () {
        window.setTimeout(setup, 250);
    });
})();
