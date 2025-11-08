// Safe Service Worker registration
if ('serviceWorker' in navigator) {
  const swUrl = '/service-worker.js';
  fetch(swUrl, { cache: 'no-store' })
    .then(r => {
      const ct = r.headers.get('content-type') || '';
      if (r.ok && ct.includes('javascript')) {
        return navigator.serviceWorker.register(swUrl);
      }
      console.warn('Skipping SW registration: unsupported MIME or missing file', { status: r.status, ct });
    })
    .catch(err => console.warn('SW registration skipped:', err));
}
