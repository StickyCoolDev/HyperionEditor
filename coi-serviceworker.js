/*! coi-serviceworker v0.1.7 - Guido Zuidhof, licensed under MIT */
let coepCredentialless = false;
if (typeof window !== 'undefined') {
    const script = document.currentScript;
    if (script && script.hasAttribute('data-coep-credentialless')) {
        coepCredentialless = true;
    }
}

if (typeof window === 'undefined') {
    self.addEventListener('install', () => self.skipWaiting());
    self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

    self.addEventListener('fetch', (event) => {
        if (event.request.cache === 'only-if-cached' && event.request.mode !== 'same-origin') {
            return;
        }

        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    if (response.status === 0) {
                        return response;
                    }

                    const newHeaders = new Headers(response.headers);
                    newHeaders.set('Cross-Origin-Embedder-Policy', coepCredentialless ? 'credentialless' : 'require-corp');
                    newHeaders.set('Cross-Origin-Opener-Policy', 'same-origin');

                    return new Response(response.body, {
                        status: response.status,
                        statusText: response.statusText,
                        headers: newHeaders,
                    });
                })
                .catch((e) => console.error('COI fetch error:', e))
        );
    });
} else {
    (() => {
        const reloadedBySelf = window.sessionStorage.getItem('coiReloadedBySelf');
        window.sessionStorage.removeItem('coiReloadedBySelf');

        if (window.crossOriginIsolated) {
            return;
        }

        const coi = {
            shouldRegister: () => true,
            shouldDeregister: () => false,
            doReload: () => window.location.reload(),
            quiet: false,
            ...window.coi
        };

        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistration().then((registration) => {
                if (registration && coi.shouldDeregister()) {
                    registration.unregister().then(() => {
                        coi.doReload();
                    });
                } else if (coi.shouldRegister()) {
                    const scriptUrl = document.currentScript ? document.currentScript.src : './coi-serviceworker.js';
                    navigator.serviceWorker.register(scriptUrl).then(
                        (reg) => {
                            if (!coi.quiet) {
                                console.log('COI Service Worker registered successfully');
                            }
                            reg.addEventListener('updatefound', () => {
                                coi.doReload();
                            });
                            if (!reg.active) {
                                coi.doReload();
                            }
                        },
                        (err) => {
                            if (!coi.quiet) {
                                console.warn('COI Service Worker failed to register (cross-origin headers may rely on host):', err);
                            }
                        }
                    );
                }
            });
        }
    })();
}
