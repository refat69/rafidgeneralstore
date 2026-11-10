'use client';

import { useEffect, useState } from 'react';
import { taka } from '@/lib/money';
import toast from 'react-hot-toast';

export default function CashPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Active modal or tab: 'in' | 'out' | null
  const [modalType, setModalType] = useState(null);
  const [formAmount, setFormAmount] = useState('');
  const [formSource, setFormSource] = useState('home_capital');
  const [formCategory, setFormCategory] = useState('বাড়ি থেকে আনা (বিকাশ ও মাল কেনা)');
  const [formDesc, setFormDesc] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  function loadData() {
    fetch('/api/cash?t=' + Date.now())
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }

  async function handleAddCashTx(e) {
    e.preventDefault();
    const amt = Number(formAmount);
    if (!amt || amt <= 0) {
      toast.error('সঠিক টাকার পরিমাণ লিখুন');
      return;
    }

    setLoading(true);
    const res = await fetch('/api/cash', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: modalType,
        source: formSource,
        category: formCategory,
        amount: amt,
        description: formDesc.trim() || (modalType === 'in' ? 'বাড়ি থেকে আনা ক্যাশ' : 'ক্যাশ উত্তোলন / বাড়ি পাঠানো'),
      }),
    });
    setLoading(false);

    if (!res.ok) {
      toast.error('ক্যাশ লেনদেন সংরক্ষণ করতে সমস্যা হয়েছে');
      return;
    }

    toast.success(modalType === 'in' ? '✅ বাড়ি থেকে আনা ক্যাশ সফলভাবে জমা হয়েছে' : '✅ ক্যাশ উত্তোলন সংরক্ষিত হয়েছে');
    setModalType(null);
    setFormAmount('');
    setFormDesc('');
    loadData();
  }

  async function handleDelete(id) {
    if (!confirm('এই ক্যাশ এন্ট্রিটি মুছে ফেলতে চান?')) return;
    await fetch(`/api/cash?id=${id}`, { method: 'DELETE' });
    toast.success('ক্যাশ এন্ট্রি মুছে ফেলা হয়েছে');
    loadData();
  }

  if (!data) return <div className="empty mt">ক্যাশ হিসাব লোড হচ্ছে...</div>;

  const { summary, today, transactions = [] } = data;

  return (
    <div>
      {/* Top Bar */}
      <div className="topbar">
        <div>
          <h2>💵 ক্যাশবাক্স ও নগদ হিসাব (Cash & Capital)</h2>
          <div className="sub">
            বাড়ি থেকে আনা নগদ টাকা (বিকাশ ও মাল রাখার জন্য), দোকানের ক্যাশ জমা, খরচ ও ক্যাশবাক্সের বর্তমান স্থিতি
          </div>
        </div>
        <div className="flex" style={{ gap: 10 }}>
          <button
            className="btn green"
            onClick={() => {
              setModalType('in');
              setFormSource('home_capital');
              setFormCategory('বাড়ি থেকে আনা (বিকাশ ও মাল কেনা)');
              setFormDesc('বিকাশের ক্যাশ আউট ও নতুন মাল কেনার জন্য বাড়ি থেকে আনা ক্যাশ');
              setFormAmount('');
            }}
          >
            🏠 বাড়ি থেকে আনা ক্যাশ জমা
          </button>
          <button
            className="btn red"
            onClick={() => {
              setModalType('out');
              setFormSource('withdraw_home');
              setFormCategory('বাড়ি ফেরত / লাভ উত্তোলন');
              setFormDesc('দিনের লাভ বা ক্যাশ বাড়ি নিয়ে যাওয়া');
              setFormAmount('');
            }}
          >
            📤 ক্যাশ বাড়ি পাঠানো / উত্তোলন
          </button>
        </div>
      </div>

      {/* Top 4 KPI Cards */}
      <div className="grid cols-4 mb" style={{ marginBottom: 16 }}>
        <div
          className="card"
          style={{
            borderLeft: `5px solid ${summary.cashInHand >= 0 ? '#16a34a' : '#dc2626'}`,
            background: summary.cashInHand >= 0 ? '#f0fdf4' : '#fef2f2',
          }}
        >
          <div className="label" style={{ fontWeight: 'bold' }}>💰 বর্তমানে ক্যাশবাক্সে থাকা ক্যাশ (Cash in Hand)</div>
          <div className={`value ${summary.cashInHand >= 0 ? 'green' : 'red'}`} style={{ fontSize: 30 }}>
            {taka(summary.cashInHand)}
          </div>
          <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
            দোকানের ক্যাশ ড্রয়ারে বর্তমানে থাকা প্রকৃত নগদ টাকা
          </div>
        </div>

        <div className="card" style={{ borderLeft: '4px solid #2563eb' }}>
          <div className="label">🏠 বাড়ি থেকে আনা মোট ক্যাশ</div>
          <div className="value blue">{taka(summary.capitalFromHome)}</div>
          <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
            বিকাশ ও মাল কেনার জন্য আনা প্রারম্ভিক মূলধন
          </div>
        </div>

        <div className="card" style={{ borderLeft: '4px solid #059669' }}>
          <div className="label">🛒 আজকের মোট নগদ জমা (Inflow)</div>
          <div className="value green">{taka(today.todayCashIn)}</div>
          <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
            আজকের বিক্রি, রিচার্জ, বিকাশ ক্যাশ-ইন ও মূলধন
          </div>
        </div>

        <div className="card" style={{ borderLeft: '4px solid #e11d48' }}>
          <div className="label">💸 আজকের মোট নগদ খরচ (Outflow)</div>
          <div className="value red">{taka(today.todayCashOut)}</div>
          <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
            আজকের বিকাশ ক্যাশ-আউট, মাল কেনা ও অন্যান্য খরচ
          </div>
        </div>
      </div>

      {/* 2-Column Breakdown Sections */}
      <div className="grid cols-2 mb" style={{ marginBottom: 16 }}>
        {/* Left Column: Today Cash Reconciliation */}
        <div className="card">
          <div className="flex between align-center mb8" style={{ borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
            <h3 style={{ margin: 0 }}>📅 আজকের ক্যাশ রিকনসিলিয়েশন (Today's Cash Ledger)</h3>
            <span className={`badge ${today.todayNetCashFlow >= 0 ? 'green' : 'red'}`}>
              আজকের নিট ক্যাশ: {today.todayNetCashFlow >= 0 ? '+' : ''}{taka(today.todayNetCashFlow)}
            </span>
          </div>

          <div style={{ fontSize: 13.5, lineHeight: 2.1 }}>
            <div className="flex between" style={{ borderBottom: '1px dashed #e2e8f0' }}>
              <span>🏠 আজকের বাড়ি থেকে আনা ক্যাশ:</span>
              <b className="blue">+{taka(today.todayCapitalFromHome)}</b>
            </div>
            <div className="flex between" style={{ borderBottom: '1px dashed #e2e8f0' }}>
              <span>🛒 আজকের নগদ বিক্রি থেকে পাওয়া:</span>
              <b className="green">+{taka(today.todaySalesCash)}</b>
            </div>
            <div className="flex between" style={{ borderBottom: '1px dashed #e2e8f0' }}>
              <span>⚡ আজকের মোবাইল রিচার্জ ক্যাশ গ্রহণ:</span>
              <b className="green">+{taka(today.todayRechargeCash)}</b>
            </div>
            <div className="flex between" style={{ borderBottom: '1px dashed #e2e8f0' }}>
              <span>📲 আজকের বিকাশ ক্যাশ-ইন (কাস্টমার থেকে প্রাপ্ত):</span>
              <b className="green">+{taka(today.todayBkashCashIn)}</b>
            </div>
            <div className="flex between" style={{ borderBottom: '1px dashed #e2e8f0', color: '#dc2626' }}>
              <span>💸 আজকের বিকাশ ক্যাশ-আউট (কাস্টমারকে দেওয়া নগদ):</span>
              <b>-{taka(today.todayBkashCashOut)}</b>
            </div>
            <div className="flex between" style={{ borderBottom: '1px dashed #e2e8f0', color: '#dc2626' }}>
              <span>📦 আজকের নতুন মাল কেনার নগদ খরচ:</span>
              <b>-{taka(today.todayStockPurchaseCash)}</b>
            </div>
            <div className="flex between" style={{ borderBottom: '1px dashed #e2e8f0', color: '#dc2626' }}>
              <span>🔻 আজকের দোকানের সাধারণ নগদ খরচ:</span>
              <b>-{taka(today.todayExpensesCash)}</b>
            </div>
            {today.todayBundleCashOut > 0 && (
              <div className="flex between" style={{ borderBottom: '1px dashed #e2e8f0', color: '#dc2626' }}>
                <span>📦 আজকের ক্যাশ দিয়ে কেনা সেন্ড মানি বান্ডেল:</span>
                <b>-{taka(today.todayBundleCashOut)}</b>
              </div>
            )}
            {today.todayWithdrawnToHome > 0 && (
              <div className="flex between" style={{ borderBottom: '1px dashed #e2e8f0', color: '#dc2626' }}>
                <span>📤 আজকের বাড়ি ফেরত পাঠানো ক্যাশ / উত্তোলন:</span>
                <b>-{taka(today.todayWithdrawnToHome)}</b>
              </div>
            )}
            <div
              className="flex between mt8"
              style={{
                background: '#f8fafc',
                padding: '8px 12px',
                borderRadius: 8,
                fontWeight: 'bold',
                fontSize: 15,
                borderTop: '2px solid var(--border)',
              }}
            >
              <span>বর্তমান ক্যাশবাক্স ক্লোজিং স্থিতি:</span>
              <span className={summary.cashInHand >= 0 ? 'green' : 'red'}>{taka(summary.cashInHand)}</span>
            </div>
          </div>
        </div>

        {/* Right Column: Overall All-time Cash Breakdown */}
        <div className="card">
          <div className="flex between align-center mb8" style={{ borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
            <h3 style={{ margin: 0 }}>📊 সামগ্রিক সর্বকালীন ক্যাশ প্রবাহ (All-Time Cash Flow)</h3>
            <span className="muted" style={{ fontSize: 12 }}>দোকানের শুরু থেকে আজ পর্যন্ত</span>
          </div>

          <div style={{ fontSize: 13.5, lineHeight: 2.1 }}>
            <div className="flex between" style={{ borderBottom: '1px dashed #e2e8f0' }}>
              <span>🏠 বাড়ি থেকে আনা মোট মূলধন:</span>
              <b className="blue">+{taka(summary.capitalFromHome)}</b>
            </div>
            <div className="flex between" style={{ borderBottom: '1px dashed #e2e8f0' }}>
              <span>🛒 মোট নগদ বিক্রি:</span>
              <b className="green">+{taka(summary.salesCash)}</b>
            </div>
            <div className="flex between" style={{ borderBottom: '1px dashed #e2e8f0' }}>
              <span>⚡ মোট রিচার্জ ক্যাশ গ্রহণ:</span>
              <b className="green">+{taka(summary.rechargeCash)}</b>
            </div>
            <div className="flex between" style={{ borderBottom: '1px dashed #e2e8f0' }}>
              <span>📲 মোট বিকাশ ক্যাশ-ইন গ্রহণ:</span>
              <b className="green">+{taka(summary.bkashCashIn)}</b>
            </div>
            <div className="flex between" style={{ borderBottom: '1px dashed #e2e8f0', color: '#dc2626' }}>
              <span>💸 বিকাশ ক্যাশ-আউটে কাস্টমারকে মোট প্রদত্ত নগদ:</span>
              <b>-{taka(summary.bkashCashOut)}</b>
            </div>
            <div className="flex between" style={{ borderBottom: '1px dashed #e2e8f0', color: '#dc2626' }}>
              <span>📦 পাইকারি মাল ক্রয়ে মোট নগদ খরচ:</span>
              <b>-{taka(summary.stockPurchaseCash)}</b>
            </div>
            <div className="flex between" style={{ borderBottom: '1px dashed #e2e8f0', color: '#dc2626' }}>
              <span>🔻 মোট দোকানের সাধারণ নগদ খরচ:</span>
              <b>-{taka(summary.expensesCash)}</b>
            </div>
            <div className="flex between" style={{ borderBottom: '1px dashed #e2e8f0', color: '#dc2626' }}>
              <span>📤 বাড়ি ফেরত পাঠানো মোট ক্যাশ:</span>
              <b>-{taka(summary.withdrawnToHome)}</b>
            </div>
            <div
              className="flex between mt8"
              style={{
                background: summary.cashInHand >= 0 ? '#ecfdf5' : '#fef2f2',
                padding: '8px 12px',
                borderRadius: 8,
                fontWeight: 'bold',
                fontSize: 15,
                borderTop: '2px solid var(--border)',
              }}
            >
              <span>হাতে থাকা মোট নিট ক্যাশ:</span>
              <span className={summary.cashInHand >= 0 ? 'green' : 'red'}>{taka(summary.cashInHand)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cash Transaction History */}
      <div className="card">
        <div className="flex between align-center mb8">
          <h3>📋 বাড়ি থেকে আনা ও উত্তোলিত ক্যাশের লেজার হিস্টোরি</h3>
          <span className="muted" style={{ fontSize: 13 }}>মোট {transactions.length} টি রেকর্ড</span>
        </div>

        <div className="table-wrap mt8">
          <table>
            <thead>
              <tr>
                <th>তারিখ ও সময়</th>
                <th>ধরন</th>
                <th>ক্যাটাগরি</th>
                <th>বিবরণ / উদ্দেশ্য</th>
                <th>টাকার পরিমাণ</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => {
                const isIn = t.type === 'in';
                return (
                  <tr key={t._id}>
                    <td>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                        {new Date(t.date).toLocaleDateString('bn-BD')} {new Date(t.date).toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${isIn ? 'green' : 'red'}`}>
                        {isIn ? '🏠 ক্যাশ ইন (জমা)' : '📤 ক্যাশ আউট (উত্তোলন)'}
                      </span>
                    </td>
                    <td><b>{t.category}</b></td>
                    <td className="muted">{t.description || '—'}</td>
                    <td>
                      <b style={{ fontSize: 15, color: isIn ? '#16a34a' : '#dc2626' }}>
                        {isIn ? '+' : '−'}{taka(t.amount)}
                      </b>
                    </td>
                    <td>
                      <button className="btn sm red" onClick={() => handleDelete(t._id)}>🗑</button>
                    </td>
                  </tr>
                );
              })}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={6} className="empty">
                    এখনো কোনো বাড়ি থেকে আনা বা ক্যাশ উত্তোলনের রেকর্ড নেই। উপরের বাটন ব্যবহার করে যোগ করুন।
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for In/Out Form */}
      {modalType && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
          }}
        >
          <div className="card" style={{ width: '480px', maxWidth: '92%', background: '#fff' }}>
            <div className="flex between align-center mb8">
              <h3 style={{ margin: 0 }}>
                {modalType === 'in' ? '🏠 বাড়ি থেকে আনা ক্যাশ জমা করুন' : '📤 ক্যাশ বাড়ি ফেরত / উত্তোলন করুন'}
              </h3>
              <button className="btn sm text gray" onClick={() => setModalType(null)}>✕</button>
            </div>

            <form className="form-grid mt8" onSubmit={handleAddCashTx}>
              <div>
                <label>টাকার পরিমাণ (৳) *</label>
                <input
                  type="number"
                  placeholder="যেমন: ৫০০০০"
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  style={{ fontSize: 17, fontWeight: 'bold' }}
                  required
                  autoFocus
                />
              </div>

              <div>
                <label>ক্যাটাগরি / উদ্দেশ্য</label>
                {modalType === 'in' ? (
                  <select
                    value={formCategory}
                    onChange={(e) => {
                      setFormCategory(e.target.value);
                      if (e.target.value.includes('বিকাশ ও মাল')) {
                        setFormDesc('বিকাশের ক্যাশ আউট ও নতুন মাল কেনার জন্য বাড়ি থেকে আনা ক্যাশ');
                      } else if (e.target.value.includes('বিকাশ')) {
                        setFormDesc('বিকাশ ক্যাশআউট সার্ভিসের জন্য আনা ক্যাশ');
                      } else if (e.target.value.includes('মাল')) {
                        setFormDesc('পাইকারি মাল কেনার জন্য আনা ক্যাশ');
                      }
                    }}
                  >
                    <option value="বাড়ি থেকে আনা (বিকাশ ও মাল কেনা)">🏠 বাড়ি থেকে আনা (বিকাশ ও মাল কেনা)</option>
                    <option value="বিকাশ ক্যাশআউট মূলধন">📱 বিকাশ ক্যাশআউট মূলধন</option>
                    <option value="পাইকারি মাল কেনার টাকা">📦 পাইকারি মাল কেনার টাকা</option>
                    <option value="দোকানে সাধারণ মূলধন বৃদ্ধি">💼 দোকানে সাধারণ মূলধন বৃদ্ধি</option>
                    <option value="অন্যান্য ক্যাশ জমা">➕ অন্যান্য ক্যাশ জমা</option>
                  </select>
                ) : (
                  <select
                    value={formCategory}
                    onChange={(e) => {
                      setFormCategory(e.target.value);
                      if (e.target.value.includes('দিনের লাভ')) {
                        setFormDesc('দিনের অর্জিত লাভ বাড়ি নিয়ে যাওয়া');
                      } else {
                        setFormDesc('মালিকের ব্যক্তিগত উত্তোলন');
                      }
                    }}
                  >
                    <option value="বাড়ি ফেরত / লাভ উত্তোলন">🏠 বাড়ি ফেরত / লাভ উত্তোলন</option>
                    <option value="মালিকের ব্যক্তিগত খরচ">👤 মালিকের ব্যক্তিগত খরচ</option>
                    <option value="অন্যান্য ক্যাশ উত্তোলন">➖ অন্যান্য ক্যাশ উত্তোলন</option>
                  </select>
                )}
              </div>

              <div>
                <label>বিবরণ (নোট)</label>
                <input
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder="বিবরণ লিখুন"
                />
              </div>

              <div
                style={{
                  background: modalType === 'in' ? '#f0fdf4' : '#fef2f2',
                  padding: '10px 14px',
                  borderRadius: 8,
                  fontSize: 12.5,
                  color: modalType === 'in' ? '#166534' : '#991b1b',
                }}
              >
                {modalType === 'in'
                  ? '💡 এই টাকাটি আপনার বর্তমান ক্যাশবাক্স এবং বাড়ি থেকে আনা মূলধনের সাথে যোগ হবে।'
                  : 'ℹ️ এই টাকাটি আপনার বর্তমান ক্যাশবাক্স থেকে কমে যাবে (উত্তোলন হিসেবে নথিভুক্ত হবে)।'}
              </div>

              <div className="flex gap mt" style={{ marginTop: 8 }}>
                <button
                  type="submit"
                  className={`btn ${modalType === 'in' ? 'green' : 'red'}`}
                  style={{ flex: 1 }}
                  disabled={loading}
                >
                  {loading ? 'সংরক্ষণ হচ্ছে...' : modalType === 'in' ? '➕ ক্যাশ জমা নিশ্চিত করুন' : '➖ ক্যাশ উত্তোলন নিশ্চিত করুন'}
                </button>
                <button type="button" className="btn gray" onClick={() => setModalType(null)}>
                  বাতিল
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

