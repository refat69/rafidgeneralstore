'use client';

import { useEffect, useState } from 'react';

export default function InstallAppButton({ small = false }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [isApp, setIsApp] = useState(false);

  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    setIsApp(isStandalone);
    const ua = navigator.userAgent;
    setIsIOS(/iPad|iPhone|iPod/.test(ua) && !isStandalone);

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  async function install() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === 'accepted') {
      setDeferredPrompt(null);
      window.location.reload();
    }
  }

  if (isApp || (!deferredPrompt && !isIOS)) return null;

  return (
    <>
      <button
        className={`btn ${small ? 'sm' : ''} install-btn`}
        onClick={() => (deferredPrompt ? install() : setShowGuide(true))}
        style={{ background: '#16a34a' }}
      >
        📲 {deferredPrompt ? 'অ্যাপ ইন্সটল করুন' : 'হোম স্ক্রিনে যোগ করুন'}
      </button>

      {showGuide && (
        <div className="modal-backdrop" onClick={() => setShowGuide(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom: 12 }}>📱 iPhone / iPad-এ অ্যাপ হিসেবে যুক্ত করুন</h3>
            <ol style={{ lineHeight: 1.9, paddingLeft: 22 }}>
              <li>নিচে <b>Share</b> (⬆️) বাটনে ট্যাপ করুন</li>
              <li><b>Add to Home Screen</b> (হোম স্ক্রিনে যোগ করুন) চাপুন</li>
              <li>Add ট্যাপ করলে অ্যাপের মতো চলে যাবে ✨</li>
            </ol>
            <button className="btn" onClick={() => setShowGuide(false)}>বুঝেছি</button>
          </div>
        </div>
      )}
    </>
  );
}
