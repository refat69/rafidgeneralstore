'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CustomerDashboardPage() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/customer/me')
      .then((res) => res.json())
      .then((resData) => {
        if (!resData.loggedIn) {
          router.push('/customer/login');
        } else {
          setData(resData);
        }
        setLoading(false);
      })
      .catch(() => {
        router.push('/customer/login');
        setLoading(false);
      });
  }, [router]);

  async function handleLogout() {
    try {
      await fetch('/api/customer/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout' }),
      });
      router.push('/');
      router.refresh();
    } catch (e) {
      console.error(e);
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f1f5f9', fontSize: 16 }}>
        লোড হচ্ছে...
      </div>
    );
  }

  if (!data) return null;

  const { user, ledger } = data;

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9', fontFamily: 'system-ui, sans-serif' }}>
      {/* Navbar */}
      <nav style={{ background: '#0f172a', color: '#fff', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>👤 কাস্টমার পোর্টাল</h1>
          <p style={{ margin: 0, fontSize: 11, color: '#94a3b8' }}>রাফিদ জেনারেল স্টোর</p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ fontSize: 14, color: '#cbd5e1' }}>স্বাগতম, {user.name}</span>
          <button onClick={handleLogout} style={{ background: '#dc2626', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            🚪 লগআউট
          </button>
        </div>
      </nav>

      {/* Main Container */}
      <main style={{ maxWidth: 900, margin: '30px auto', padding: '0 16px' }}>
        {/* If pending approval / not merged */}
        {!user.isMerged ? (
          <div style={{ background: '#fff', border: '1px solid #fee2e2', borderRadius: 16, padding: '30px 24px', textAlign: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <span style={{ fontSize: 48 }}>⏳</span>
            <h2 style={{ color: '#dc2626', fontSize: 20, margin: '16px 0 8px' }}>অ্যাকাউন্ট সংযুক্তির জন্য অপেক্ষমান</h2>
            <p style={{ color: '#64748b', fontSize: 15, lineHeight: 1.6, maxWidth: 600, margin: '0 auto 20px' }}>
              আপনার অনলাইন অ্যাকাউন্টটি এখনও রাফিদ জেনারেল স্টোরের মূল খাতার সাথে সংযুক্ত (Merge) করা হয়নি। অ্যাকাউন্টটি সংযুক্ত হয়ে গেলে আপনি আপনার সকল বকেয়া হিসাব এবং খরিদকৃত পণ্যের বিবরণী এখানে দেখতে পাবেন।
            </p>
            <div style={{ background: '#f8fafc', padding: 14, borderRadius: 10, display: 'inline-block', border: '1px solid #e2e8f0', fontSize: 14.5, color: '#334155' }}>
              📞 যোগাযোগ মোবাইল নম্বর: <b>01743476235</b>
            </div>
          </div>
        ) : (
          <div>
            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20, marginBottom: 30 }}>
              <div style={{ background: '#fff', borderLeft: '5px solid #dc2626', borderRadius: 12, padding: 20, boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                <div style={{ color: '#64748b', fontSize: 13, fontWeight: 600 }}>মোট বাকি / পাওনা (Total Due)</div>
                <div style={{ color: '#dc2626', fontSize: 32, fontWeight: 800, marginTop: 8 }}>৳ {ledger.due.toFixed(2)}</div>
              </div>
              <div style={{ background: '#fff', borderLeft: '5px solid #2563eb', borderRadius: 12, padding: 20, boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                <div style={{ color: '#64748b', fontSize: 13, fontWeight: 600 }}>মোট লেনদেনের সংখ্যা</div>
                <div style={{ color: '#2563eb', fontSize: 32, fontWeight: 800, marginTop: 8 }}>{ledger.transactions.length} টি</div>
              </div>
            </div>

            {/* Purchase History */}
            <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e2e8f0', padding: 20, boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 18, color: '#0f172a', borderBottom: '1px solid #f1f5f9', paddingBottom: 10 }}>
                📦 আপনার কেনাকাটার বিবরণী ও খাতা
              </h3>

              {ledger.transactions.length === 0 ? (
                <div style={{ textAlignment: 'center', padding: '30px 10px', color: '#64748b', textAlign: 'center' }}>
                  কোনো লেনদেন রেকর্ড পাওয়া যায়নি।
                </div>
              ) : (
                <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <th style={{ textAlign: 'left', padding: '12px 14px', fontWeight: 600, color: '#64748b' }}>তারিখ</th>
                        <th style={{ textAlign: 'left', padding: '12px 14px', fontWeight: 600, color: '#64748b' }}>পণ্যসমূহ</th>
                        <th style={{ textAlign: 'left', padding: '12px 14px', fontWeight: 600, color: '#64748b' }}>মোট টাকা</th>
                        <th style={{ textAlign: 'left', padding: '12px 14px', fontWeight: 600, color: '#64748b' }}>জমা (Paid)</th>
                        <th style={{ textAlign: 'left', padding: '12px 14px', fontWeight: 600, color: '#64748b' }}>বকেয়া (Due)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ledger.transactions.map((sale) => (
                        <tr key={sale._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                            {new Date(sale.date).toLocaleDateString('bn-BD', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </td>
                          <td style={{ padding: '12px 14px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                              {sale.items.map((item, idx) => (
                                <span key={idx} style={{ fontSize: 13, color: '#334155' }}>
                                  • {item.name} ({item.qty} পিস x ৳{item.price})
                                </span>
                              ))}
                            </div>
                          </td>
                          <td style={{ padding: '12px 14px', fontWeight: 'bold' }}>৳ {sale.totalAmount}</td>
                          <td style={{ padding: '12px 14px', color: '#16a34a', fontWeight: 'bold' }}>৳ {sale.paidAmount}</td>
                          <td style={{ padding: '12px 14px', color: sale.dueAmount > 0 ? '#dc2626' : '#16a34a', fontWeight: 'bold' }}>
                            {sale.dueAmount > 0 ? `৳ ${sale.dueAmount}` : 'পরিশোধিত'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <footer style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b', fontSize: 12 }}>
        © রাফিদ জেনারেল স্টোর | যেকোনো প্রয়োজনে কল করুন: 01743476235
      </footer>
    </div>
  );
}
