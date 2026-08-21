'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { taka } from '@/lib/money';
import toast from 'react-hot-toast';

export default function SalesHistoryPage() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all'); // all, today, week, month

  // Selected sale modal
  const [selectedSale, setSelectedSale] = useState(null);

  useEffect(() => {
    fetchSales();
  }, []);

  function fetchSales() {
    setLoading(true);
    fetch('/api/sales?t=' + Date.now())
      .then((r) => r.json())
      .then((d) => {
        setSales(d.sales || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  async function handleDelete(id) {
    if (!confirm('আপনি কি নিশ্চিত যে এই বিক্রির তথ্যটি বাতিল/মুছে ফেলতে চান? স্টক ফেরত যোগ করা হবে।')) {
      return;
    }
    try {
      const res = await fetch(`/api/sales?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'মুছতে সমস্যা হয়েছে');
        return;
      }
      toast.success('✅ বিক্রির হিসাব মুছে ফেলা হয়েছে এবং স্টক অ্যাডজাস্ট করা হয়েছে!');
      if (selectedSale && selectedSale._id === id) {
        setSelectedSale(null);
      }
      fetchSales();
    } catch (err) {
      toast.error('সমস্যা দেখা দিয়েছে');
    }
  }

  // Filtering Logic
  const filteredSales = sales.filter((s) => {
    // Payment method filter
    if (methodFilter !== 'all' && s.paymentMethod !== methodFilter) {
      return false;
    }

    // Date Filter
    if (dateFilter !== 'all') {
      const saleDate = new Date(s.date);
      const now = new Date();
      if (dateFilter === 'today') {
        const isToday =
          saleDate.getDate() === now.getDate() &&
          saleDate.getMonth() === now.getMonth() &&
          saleDate.getFullYear() === now.getFullYear();
        if (!isToday) return false;
      } else if (dateFilter === 'week') {
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        if (saleDate < sevenDaysAgo) return false;
      } else if (dateFilter === 'month') {
        const isThisMonth =
          saleDate.getMonth() === now.getMonth() &&
          saleDate.getFullYear() === now.getFullYear();
        if (!isThisMonth) return false;
      }
    }

    // Search Term Filter
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      const matchCustomer =
        (s.customerName || '').toLowerCase().includes(q) ||
        (s.customerPhone || '').includes(q);
      const matchItems = (s.items || []).some((item) =>
        (item.name || '').toLowerCase().includes(q)
      );
      const matchNote = (s.note || '').toLowerCase().includes(q);

      return matchCustomer || matchItems || matchNote;
    }

    return true;
  });

  // Calculate Summary Totals based on filtered list
  const totalSalesCount = filteredSales.length;
  const totalRevenue = filteredSales.reduce((acc, s) => acc + (s.totalAmount || 0), 0);
  const totalPaid = filteredSales.reduce((acc, s) => acc + (s.paidAmount || 0), 0);
  const totalDue = filteredSales.reduce((acc, s) => acc + (s.dueAmount || 0), 0);

  return (
    <div>
      {/* Top Header */}
      <div className="topbar">
        <div>
          <h2>📜 বিক্রি রেজিস্টার ও ইতিহাস</h2>
          <div className="sub">গ্রাহকদের তালিকা, বেচাকেনার ইতিহাস ও বিস্তারিত পণ্যের হিসাব</div>
        </div>
        <Link href="/admin/sell" className="btn green">
          🛒 নতুন বিক্রি করুন
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid cols-4 mt">
        <div className="card">
          <div className="sub">মোট বিক্রি সংখ্যা</div>
          <div className="value">{totalSalesCount} টি</div>
        </div>
        <div className="card">
          <div className="sub">মোট বিক্রির পরিমাণ</div>
          <div className="value blue">{taka(totalRevenue)}</div>
        </div>
        <div className="card">
          <div className="sub">মোট আদায়কৃত টাকা</div>
          <div className="value green">{taka(totalPaid)}</div>
        </div>
        <div className="card">
          <div className="sub">মোট বাকি (Due)</div>
          <div className="value red">{taka(totalDue)}</div>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="card mt" style={{ padding: '16px' }}>
        <div className="form-grid four" style={{ gap: '12px', alignItems: 'end' }}>
          <div style={{ gridColumn: 'span 2' }}>
            <label style={{ fontSize: '13px', fontWeight: 'bold' }}>🔎 কাস্টমার, ফোন নম্বর বা পণ্যের নাম দিয়ে খুঁজুন</label>
            <input
              type="text"
              placeholder="কাস্টমারের নাম, ফোন নম্বর, পণ্যের নাম বা নোট..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div>
            <label style={{ fontSize: '13px', fontWeight: 'bold' }}>💳 পেমেন্ট মেথড</label>
            <select value={methodFilter} onChange={(e) => setMethodFilter(e.target.value)}>
              <option value="all">সব মেথড</option>
              <option value="cash">নগদ (Cash)</option>
              <option value="bkash">bKash</option>
              <option value="both">নগদ + bKash</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '13px', fontWeight: 'bold' }}>📅 সময়সীমা</label>
            <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}>
              <option value="all">সব সময়</option>
              <option value="today">আজকে</option>
              <option value="week">বিগত ৭ দিন</option>
              <option value="month">চলতি মাস</option>
            </select>
          </div>
        </div>
      </div>

      {/* Sales List Table */}
      <div className="card mt">
        <div className="flex between align-center mb">
          <h3>📋 বিক্রির তালিকা ({filteredSales.length})</h3>
          <button className="btn sm gray" onClick={fetchSales}>
            🔄 রিফ্রেশ
          </button>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>তারিখ ও সময়</th>
                <th>গ্রাহকের তথ্য</th>
                <th>ক্রয়কৃত পণ্য (কি কি নিয়েছে)</th>
                <th>মোট টাকা</th>
                <th>পরিশোধিত</th>
                <th>বাকি (Due)</th>
                <th>মেথড</th>
                <th>অ্যাকশন</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="empty">
                    তথ্য লোড হচ্ছে...
                  </td>
                </tr>
              ) : filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={8} className="empty">
                    কোনো বিক্রির রেকর্ড পাওয়া যায়নি।
                  </td>
                </tr>
              ) : (
                filteredSales.map((s) => {
                  const saleDateStr = new Date(s.date).toLocaleString('bn-BD', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  });

                  return (
                    <tr key={s._id}>
                      <td style={{ fontSize: '13px', color: '#475569', whiteSpace: 'nowrap' }}>
                        {saleDateStr}
                      </td>

                      {/* Customer Info */}
                      <td>
                        <div style={{ fontWeight: '600' }}>
                          {s.customerName || 'ক্যাশ ক্রেতা'}
                        </div>
                        {s.customerPhone ? (
                          <div style={{ fontSize: '12px', color: '#64748b' }}>
                            📞 {s.customerPhone}
                          </div>
                        ) : (
                          <div style={{ fontSize: '11px', color: '#94a3b8' }}>নামহীন কাস্টমার</div>
                        )}
                      </td>

                      {/* Purchased Products breakdown */}
                      <td style={{ maxWidth: '280px' }}>
                        {s.items && s.items.length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {s.items.map((it, idx) => (
                              <div
                                key={idx}
                                style={{
                                  fontSize: '12.5px',
                                  background: '#f8fafc',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  border: '1px solid #e2e8f0',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                }}
                              >
                                <span>
                                  • {it.name} <b style={{ color: '#0284c7' }}>x{it.qty}</b>
                                </span>
                                <span style={{ color: '#475569' }}>{taka(it.total)}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="muted" style={{ fontSize: '12px' }}>
                            পণ্য তথ্য নেই
                          </span>
                        )}
                      </td>

                      {/* Financials */}
                      <td>
                        <b>{taka(s.totalAmount)}</b>
                        {s.discount > 0 && (
                          <div style={{ fontSize: '11px', color: '#059669' }}>
                            ছাড়: -{taka(s.discount)}
                          </div>
                        )}
                      </td>
                      <td className="green" style={{ fontWeight: '600' }}>
                        {taka(s.paidAmount)}
                      </td>
                      <td>
                        {s.dueAmount > 0 ? (
                          <span className="badge red" style={{ fontWeight: 'bold' }}>
                            বাকি: {taka(s.dueAmount)}
                          </span>
                        ) : (
                          <span className="badge green">পরিশোধিত</span>
                        )}
                      </td>

                      {/* Payment method */}
                      <td>
                        <span
                          className={`badge ${
                            s.paymentMethod === 'bkash'
                              ? 'blue'
                              : s.paymentMethod === 'both'
                              ? 'amber'
                              : 'gray'
                          }`}
                        >
                          {s.paymentMethod === 'bkash'
                            ? 'bKash'
                            : s.paymentMethod === 'both'
                            ? 'নগদ+bKash'
                            : 'নগদ'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td>
                        <div className="flex gap4">
                          <button
                            className="btn sm gray"
                            title="ইনভয়েস/রসিদ দেখুন"
                            onClick={() => setSelectedSale(s)}
                          >
                            👁️ রসিদ
                          </button>
                          <button
                            className="btn sm red"
                            title="মুছে ফেলুন"
                            onClick={() => handleDelete(s._id)}
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sale Detail Invoice Modal */}
      {selectedSale && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px',
          }}
          onClick={() => setSelectedSale(null)}
        >
          <div
            className="card"
            style={{
              maxWidth: '500px',
              width: '100%',
              backgroundColor: '#fff',
              borderRadius: '12px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
              padding: '24px',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex between align-center mb">
              <h3 style={{ margin: 0 }}>🧾 বিক্রির মেমো / মেমো ডিটেইলস</h3>
              <button
                className="btn sm gray"
                style={{ borderRadius: '50%', padding: '4px 8px' }}
                onClick={() => setSelectedSale(null)}
              >
                ✕
              </button>
            </div>

            <div style={{ fontSize: '13px', background: '#f8fafc', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
              <div><b>তারিখ:</b> {new Date(selectedSale.date).toLocaleString('bn-BD')}</div>
              <div><b>গ্রাহক:</b> {selectedSale.customerName || 'ক্যাশ ক্রেতা'}</div>
              {selectedSale.customerPhone && <div><b>ফোন:</b> {selectedSale.customerPhone}</div>}
              <div><b>পেমেন্ট মেথড:</b> {selectedSale.paymentMethod === 'bkash' ? 'bKash' : selectedSale.paymentMethod === 'both' ? 'নগদ + bKash' : 'নগদ (Cash)'}</div>
              {selectedSale.note && <div><b>নোট:</b> {selectedSale.note}</div>}
            </div>

            <h4 style={{ margin: '8px 0' }}>🛒 পণ্যের তালিকা:</h4>
            <div className="table-wrap mb">
              <table style={{ fontSize: '13px' }}>
                <thead>
                  <tr>
                    <th>পণ্য</th>
                    <th>দর</th>
                    <th>পরিমাণ</th>
                    <th>মোট</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedSale.items || []).map((it, i) => (
                    <tr key={i}>
                      <td>{it.name}</td>
                      <td>{taka(it.price)}</td>
                      <td><b>{it.qty}</b></td>
                      <td>{taka(it.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ borderTop: '2px dashed var(--border)', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '14px' }}>
              <div className="flex between"><span>সাবটোটাল:</span><span>{taka((selectedSale.totalAmount || 0) + (selectedSale.discount || 0))}</span></div>
              {selectedSale.discount > 0 && <div className="flex between green"><span>ডিসকাউন্ট:</span><span>-{taka(selectedSale.discount)}</span></div>}
              <div className="flex between" style={{ fontWeight: 'bold', fontSize: '16px' }}><span>সর্বমোট:</span><span>{taka(selectedSale.totalAmount)}</span></div>
              <div className="flex between green"><span>প্রদত্ত টাকা:</span><span>{taka(selectedSale.paidAmount)}</span></div>
              <div className="flex between red"><span>বাকি (Due):</span><span>{taka(selectedSale.dueAmount)}</span></div>
            </div>

            <div className="mt" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button className="btn gray" onClick={() => setSelectedSale(null)}>
                বন্ধ করুন
              </button>
              <button className="btn blue" onClick={() => window.print()}>
                🖨️ প্রিন্ট করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
