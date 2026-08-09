import Link from 'next/link';
import { connectDB } from '@/lib/db';
import { User } from '@/lib/models';
import { requireAuth } from '@/lib/auth';
import { seedIfEmpty } from '@/lib/seed';

const nav = [
  { href: '/', label: 'ড্যাশবোর্ড', en: 'Dashboard', icon: '📊' },
  { href: '/today-transactions', label: 'আজকের লেনদেন', en: 'Today Txns', icon: '📅' },
  { href: '/sell', label: 'বিক্রি', en: 'Sell', icon: '🛒' },
  { href: '/products', label: 'স্টক / পণ্য', en: 'Stock', icon: '📦' },
  { href: '/recharge', label: 'মোবাইল রিচার্জ', en: 'Recharge', icon: '⚡' },
  { href: '/baki', label: 'বাকি / পাওনা', en: 'Baki', icon: '🧾' },
  { href: '/bkash', label: 'bKash', en: 'bKash', icon: '📱' },
  { href: '/expense', label: 'খরচ', en: 'Expense', icon: '💸' },
  { href: '/customers', label: 'গ্রাহক তালিকা', en: 'Customers', icon: '👥' },
  { href: '/report', label: 'রিপোর্ট', en: 'Report', icon: '📈' },
];

export default async function DashboardLayout({ children }) {
  const uid = requireAuth();
  await connectDB();
  await seedIfEmpty();
  const user = await User.findById(uid);

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <h1>🏪 {user?.shopName || 'আমার দোকান'}</h1>
          <p>Shop Dashboard</p>
        </div>
        <nav className="nav">
          {nav.map((n) => (
            <Link key={n.href} href={n.href}>
              <span className="icon">{n.icon}</span>
              <span>{n.label}</span>
            </Link>
          ))}
        </nav>
        <div className="sidebar-foot">
          <div className="muted" style={{ fontSize: 12, marginBottom: 10, textAlign: 'center', color: '#94a3b8' }}>
            👤 {user?.name || 'Admin'}
          </div>
          <form action="/api/auth/logout" method="POST">
            <button type="submit">🚪 লগআউট / Logout</button>
          </form>
        </div>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
