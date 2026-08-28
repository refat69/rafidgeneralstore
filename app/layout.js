import './globals.css';
import { Toaster } from 'react-hot-toast';
import ServiceWorkerRegister from './ServiceWorkerRegister';

export const metadata = {
  title: 'রাফিদ জেনারেল স্টোর | দোকান ড্যাশবোর্ড',
  description: 'আপনার দোকানের হিসাব, স্টক, বাকি ও bKash ম্যানেজমেন্ট — মোবাইল অ্যাপ',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    title: 'দোকান Dash',
    statusBarStyle: 'black-translucent',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#0f172a',
};

export default function RootLayout({ children }) {
  return (
    <html lang="bn">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body>
        {children}
        <Toaster position="top-center" toastOptions={{ style: { fontFamily: 'inherit' } }} />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
