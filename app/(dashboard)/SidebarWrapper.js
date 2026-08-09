'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const nav = [
  { href: '/admin', label: 'ড্যাশবোর্ড', en: 'Dashboard', icon: '📊' },
  { href: '/admin/today-transactions', label: 'আজকের লেনদেন', en: 'Today Txns', icon: '📅' },
  { href: '/admin/sell', label: 'বিক্রি', en: 'Sell', icon: '🛒' },
  { href: '/admin/products', label: 'স্টক / পণ্য', en: 'Stock', icon: '📦' },
  { href: '/admin/recharge', label: 'মোবাইল রিচার্জ', en: 'Recharge', icon: '⚡' },
  { href: '/admin/baki', label: 'বাকি / পাওনা', en: 'Baki', icon: '🧾' },
  { href: '/admin/bkash', label: 'bKash', en: 'bKash', icon: '📱' },
  { href: '/admin/expense', label: 'খরচ', en: 'Expense', icon: '💸' },
  { href: '/admin/customers', label: 'গ্রাহক তালিকা', en: 'Customers', icon: '👥' },
  { href: '/admin/offers', label: 'অফার ম্যানেজার', en: 'Offers', icon: '🎁' },
  { href: '/admin/merges', label: 'কাস্টমার মার্জ', en: 'Merges', icon: '🔗' },
  { href: '/admin/report', label: 'রিপোর্ট', en: 'Report', icon: '📈' },
];

export default function SidebarWrapper({ user, children }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const toggleSidebar = () => setIsOpen(!isOpen);
  const closeSidebar = () => setIsOpen(false);

  return (
    <div className={`app ${isOpen ? 'sidebar-open' : ''}`}>
      {/* Mobile Top Header */}
      <header className="mobile-header">
        <button className="hamburger-btn" onClick={toggleSidebar} aria-label="Toggle Navigation Menu">
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
        </button>
        <span className="mobile-shop-title">🏪 {user?.shopName || 'আমার দোকান'}</span>
      </header>

      {/* Backdrop overlay for mobile menu */}
      {isOpen && <div className="sidebar-backdrop" onClick={closeSidebar} />}

      <aside className={`sidebar ${isOpen ? 'active' : ''}`}>
        <div className="sidebar-brand">
          <h1>🏪 {user?.shopName || 'আমার দোকান'}</h1>
          <p>Shop Dashboard</p>
        </div>
        <nav className="nav">
          {nav.map((n) => {
            const isActive = pathname === n.href;
            return (
              <Link key={n.href} href={n.href} className={isActive ? 'active' : ''} onClick={closeSidebar}>
                <span className="icon">{n.icon}</span>
                <span>{n.label}</span>
              </Link>
            );
          })}
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
