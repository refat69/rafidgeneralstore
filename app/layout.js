import './globals.css';
import { Toaster } from 'react-hot-toast';

export const metadata = {
  title: 'দোকান ড্যাশবোর্ড | Shop Dashboard',
  description: 'আপনার দোকানের হিসাব, স্টক, বাকি ও bKash ম্যানেজমেন্ট',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }) {
  return (
    <html lang="bn">
      <body>
        {children}
        <Toaster position="top-center" />
      </body>
    </html>
  );
}

