import './globals.css';

export const metadata = {
  title: 'দোকান ড্যাশবোর্ড | Shop Dashboard',
  description: 'আপনার দোকানের হিসাব, স্টক, বাকি ও bKash ম্যানেজমেন্ট',
};

export default function RootLayout({ children }) {
  return (
    <html lang="bn">
      <body>{children}</body>
    </html>
  );
}
