'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import InstallAppButton from '@/app/InstallAppButton';

const nav = [
  { href: '/admin', label: 'ড্যাশবোর্ড', en: 'Dashboard', icon: '📊', color: '#2563eb' },
  { href: '/admin/today-transactions', label: 'আজকের লেনদেন', en: 'Today Txns', icon: '📅', color: '#8b5cf6' },
  { href: '/admin/sell', label: 'বিক্রি', en: 'Sell', icon: '🛒', color: '#16a34a' },
  { href: '/admin/sales-history', label: 'বিক্রি ইতিহাস', en: 'Sales History', icon: '📜', color: '#0ea5e9' },
  { href: '/admin/products', label: 'স্টক / পণ্য', en: 'Stock', icon: '📦', color: '#d97706' },
  { href: '/admin/recharge', label: 'মোবাইল রিচার্জ', en: 'Recharge', icon: '⚡', color: '#f59e0b' },
  { href: '/admin/baki', label: 'বাকি / পাওনা', en: 'Baki', icon: '🧾', color: '#dc2626' },
  { href: '/admin/bkash', label: 'bKash', en: 'bKash', icon: '📱', color: '#e11d48' },
  { href: '/admin/expense', label: 'খরচ', en: 'Expense', icon: '💸', color: '#475569' },
  { href: '/admin/customers', label: 'গ্রাহক তালিকা', en: 'Customers', icon: '👥', color: '#7c3aed' },
  { href: '/admin/offers', label: 'অফার ম্যানেজার', en: 'Offers', icon: '🎁', color: '#db2777' },
  { href: '/admin/merges', label: 'কাস্টমার মার্জ', en: 'Merges', icon: '🔗', color: '#0891b2' },
  { href: '/admin/report', label: 'রিপোর্ট', en: 'Report', icon: '📈', color: '#059669' },
];

const bottomNav = [
  { href: '/admin', label: 'হোম', icon: '🏠' },
  { href: '/admin/sell', label: 'বিক্রি', icon: '🛒' },
  { href: '/admin/baki', label: 'বাকি', icon: '🧾' },
  { href: '/admin/bkash', label: 'বিকাশ', icon: '📱' },
  { type: 'more', label: 'আরও', icon: '☰' },
];

export default function SidebarWrapper({ user, children }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    update();
    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
    };
  }, []);

  const openDrawer = () => setIsOpen(true);
  const closeDrawer = () => setIsOpen(false);

  return (
    <div className={`app ${isOpen ? 'sidebar-open' : ''}`}>
      {/* Mobile App Header */}
      <header className="mobile-header">
        <button
          className="mobile-app-logo"
          onClick={openDrawer}
          aria-label="Open Menu"
        >
          <img src="/icons/icon-192.png" alt="" width="30" height="30" style={{ borderRadius: 8 }} />
        </button>
        <div className="mobile-shop-title-wrap">
          <span className="mobile-shop-title">🏪 {user?.shopName || 'আমার দোকান'}</span>
          <span className={`mobile-status ${online ? 'ok' : 'off'}`}>
            {online ? '● অনলাইন' : '● অফলাইন'}
          </span>
        </div>
        <Link href="/admin/sell" className="mobile-sell-btn">+</Link>
      </header>

      {/* Backdrop for drawer */}
      {isOpen && <div className="sidebar-backdrop" onClick={closeDrawer} />}

      {/* Desktop / drawer sidebar */}
      <aside className={`sidebar ${isOpen ? 'active' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-row">
            <img src="/icons/icon-192.png" alt="" width="42" height="42" style={{ borderRadius: 12 }} />
            <div>
              <h1>🏪 {user?.shopName || 'আমার দোকান'}</h1>
              <p>Shop Dashboard</p>
            </div>
          </div>
          <button className="drawer-close" onClick={closeDrawer} aria-label="Close">✕</button>
        </div>
        <nav className="nav">
          {nav.map((n) => {
            const isActive = pathname === n.href;
            return (
              <Link key={n.href} href={n.href} className={isActive ? 'active' : ''} onClick={closeDrawer}>
                <span className="icon" style={{ color: n.color || 'inherit' }}>{n.icon}</span>
                <span className="nav-text">
                  <b>{n.label}</b>
                  <small>{n.en}</small>
                </span>
                {isActive && <span className="nav-dot" />}
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-foot">
          <div className="muted" style={{ fontSize: 12, marginBottom: 10, textAlign: 'center', color: '#94a3b8' }}>
            👤 {user?.name || 'Admin'}
          </div>
          <InstallAppButton />
          <form action="/api/auth/logout" method="POST" style={{ marginTop: 8 }}>
            <button className="logout-btn" type="submit">🚪 লগআউট / Logout</button>
          </form>
        </div>
      </aside>

      <main className="main">{children}</main>

      {/* Mobile Bottom Navigation */}
      <div className="mobile-nav" role="navigation" aria-label="Main mobile navigation">
        {bottomNav.map((n) => {
          if (n.type === 'more') {
            return (
              <button key="more" className={`mobile-nav-item ${isOpen ? 'active' : ''}`} onClick={openDrawer}>
                <span className="mn-icon">{n.icon}</span>
                <span className="mn-label">{n.label}</span>
              </button>
            );
          }
          const isActive = pathname === n.href;
          return (
            <Link key={n.href} href={n.href} className={`mobile-nav-item ${isActive ? 'active' : ''}`}>
              <span className="mn-icon">{n.icon}</span>
              <span className="mn-label">{n.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
