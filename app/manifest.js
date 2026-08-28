export default function manifest() {
  return {
    name: 'রাফিদ জেনারেল স্টোর — দোকান ড্যাশবোর্ড',
    short_name: 'দোকান Dash',
    description: 'আপনার দোকানের হিসাব, স্টক, বাকি ও bKash ম্যানেজমেন্ট',
    id: '/',
    start_url: '/login',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0f172a',
    theme_color: '#2563eb',
    lang: 'bn-BD',
    dir: 'ltr',
    categories: ['business', 'finance', 'productivity'],
    shortcuts: [
      {
        name: 'নতুন বিক্রি',
        short_name: 'বিক্রি',
        url: '/admin/sell',
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
      },
      {
        name: 'বাকি / পাওনা',
        short_name: 'বাকি',
        url: '/admin/baki',
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
      },
      {
        name: 'bKash',
        short_name: 'bKash',
        url: '/admin/bkash',
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
      },
      {
        name: 'রিপোর্ট',
        short_name: 'রিপোর্ট',
        url: '/admin/report',
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
      },
    ],
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any maskable',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any maskable',
      },
    ],
  };
}
