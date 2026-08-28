'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegister() {
  useEffect(() => {
    // Only register in production/standalone mode so the dev overlay is never affected.
    if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => console.log('[sw] registered', reg.scope))
        .catch((err) => console.warn('[sw] register failed', err));
    }
  }, []);

  return null;
}
