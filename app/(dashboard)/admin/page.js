'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { taka } from '@/lib/money';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetch('/api/stats').then((r) => r.json()).then(setStats).catch(() => {});
    fetch('/api/auth/me').then((r) => r.json()).then((d) => d.user && setUser(d.user)).catch(() => {});
  }, []);

  return (
    <div>
      <div className="topbar">
        <div>
          <h2>🏪 {stats ? user?.shopName || 'আমার দোকান' : 'আমার দোকান'}</h2>
          <div className="sub">আপনার দোকানের ওভারঅল হিসাব-নিকাশ</div>
        </div>
        <div className="flex" style={{ gap: 10 }}>
          <Link href="/admin/today-transactions" className="btn gray">📅 আজকের লেনদেন</Link>
          <Link href="/admin/sell" className="btn green">+ নতুন বিক্রি</Link>
        </div>
      </div>

      {!stats ? (
        <div className="empty mt">লোড হচ্ছে...</div>
      ) : (
        <>
          <div className="grid cols-4 mt">
            <div className="card" style={{ borderLeft: '4px solid #22c55e' }}>
              <div className="label">আজকের মোট বিক্রি (Today's Sales)</div>
              <div className="value green">{taka(stats.todaySales)}</div>
            </div>
            <div className="card" style={{ borderLeft: '4px solid #3b82f6' }}>
              <div className="label">আজকের মাল কেনা (Today's Purchases)</div>
              <div className="value blue">{taka(stats.todayStockAdded)}</div>
            </div>
            <div className="card" style={{ borderLeft: '4px solid #3b82f6' }}>
              <div className="label">মোট বিক্রি (Overall Sales)</div>
              <div className="value blue">{taka(stats.totalSales)}</div>
            </div>
            <div className="card" style={{ borderLeft: '4px solid #f59e0b' }}>
              <div className="label">মোট নিট লাভ (Total Net Profit)</div>
              <div className={`value ${stats.totalProfit >= 0 ? 'green' : 'red'}`}>
                {taka(stats.totalProfit)}
              </div>
            </div>
          </div>

          <h3 className="section-title mt" style={{ marginBottom: 12, marginTop: 24 }}>📦 স্টক ও লেজার হিসাব</h3>
          <div className="grid cols-4">
            <div className="card">
              <div className="label">মোট বাকি / পাওনা (Total Due)</div>
              <div className="value red">{taka(stats.totalDue)}</div>
            </div>
            <div className="card">
              <div className="label">মোট খরচ (Total Expense)</div>
              <div className="value red">{taka(stats.totalExpense)}</div>
            </div>
            <div className="card">
              <div className="label">bKash ব্যালেন্স</div>
              <div className="value pink">{taka(stats.bkashBalance)}</div>
            </div>
            <div className="card">
              <div className="label">বর্তমান স্টক মূল্য</div>
              <div className="value blue">{taka(stats.stockValue)}</div>
            </div>
          </div>

          <div className="grid cols-2 mt" style={{ gap: 16 }}>
            <div className="card">
              <div className="label">দোকানে মোট পণ্যের সংখ্যা</div>
              <div className="value gray" style={{ fontSize: 28, fontWeight: 'bold' }}>{stats.productCount} টি</div>
            </div>
            <div className="card">
              <div className="label">কম স্টক পণ্য সতর্কতা</div>
              <div className={`value ${stats.lowStockCount > 0 ? 'red' : 'green'}`}>
                {stats.lowStockCount} টি
              </div>
            </div>
          </div>
        </>
      )}

      <div className="grid cols-2 mt">
        <div className="card">
          <h3>🔗 দ্রুত কাজ</h3>
          <div className="grid cols-2 mt8">
            <Link href="/admin/sell" className="btn">🛒 বিক্রি</Link>
            <Link href="/admin/today-transactions" className="btn gray">📅 আজকের লেনদেন</Link>
            <Link href="/admin/recharge" className="btn gray">⚡ রিচার্জ</Link>
            <Link href="/admin/bkash" className="btn gray">📱 bKash</Link>
          </div>
        </div>

        <div className="card">
          <h3>ℹ️ ড্যাশবোর্ড ব্যবহারের তথ্য</h3>
          <div className="muted" style={{ fontSize: 14, lineHeight: 1.7, marginTop: 8 }}>
            <p>• <b>আজকের লেনদেন:</b> আজকের দিনের রিচার্জ, বিক্রি, খরচ ও বিকাশের যাবতীয় বিস্তারিত লেনদেনের হিসাব এবং আজ কত টাকা লাভ হলো তা দেখতে বামের "আজকের লেনদেন" বাটনে ক্লিক করুন।</p>
            <p>• <b>মোবাইল রিচার্জ:</b> মোবাইল রিচার্জের লাভ ও প্যাকেজ কমিশন আলাদা পেইজে হিসাব করার জন্য "রিচার্জ" সেকশনে যান।</p>
            <p>• <b>বিকাশ এজেন্ট ও পার্সোনাল:</b> বিকাশ অপশনে গিয়ে এজেন্ট ক্যাশ-আউট কমিশন এবং পার্সোনাল কাস্টম ক্রয় মূল্যের উপর লাভ হিসাব করতে পারবেন।</p>
          </div>
        </div>
      </div>
    </div>
  );
}
