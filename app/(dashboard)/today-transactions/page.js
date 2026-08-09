'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { taka } from '@/lib/money';

export default function TodayTransactionsPage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    load();
  }, []);

  function load() {
    fetch('/api/today-transactions')
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }

  if (!data) return <div className="empty">আজকের লেনদেন লোড হচ্ছে...</div>;

  const { sales, bkash, expenses, recharges, stockLogs = [] } = data;

  // Calculators
  const todaySalesAmt = sales.reduce((a, s) => a + s.totalAmount, 0);
  const todaySalesPaid = sales.reduce((a, s) => a + s.paidAmount, 0);
  const todaySalesDue = sales.reduce((a, s) => a + s.dueAmount, 0);

  const todaySalesProfit = sales.reduce((acc, s) => {
    const saleItemsProfit = s.items.reduce((sum, it) => {
      return sum + ((it.price - (it.buyPrice || 0)) * it.qty);
    }, 0);
    return acc + saleItemsProfit - s.discount;
  }, 0);

  const todayRechargesAmt = recharges.reduce((a, r) => a + r.amount, 0);
  const todayRechargeProfit = recharges.reduce((a, r) => a + r.commission, 0);

  const todayBkashProfit = bkash.reduce((a, t) => a + (t.profit || 0), 0);

  const todayExpensesAmt = expenses.reduce((a, e) => a + e.amount, 0);

  // Today's Purchases total
  const todayStockAddedAmt = stockLogs.reduce((a, log) => a + (log.qtyAdded * log.buyPrice), 0);

  // Total Net Profit today
  const todayNetProfit = todaySalesProfit + todayRechargeProfit + todayBkashProfit - todayExpensesAmt;

  return (
    <div>
      <div className="topbar">
        <div>
          <h2>📅 আজকের লেনদেন ও হিসাব-নিকাশ</h2>
          <div className="sub">আজকের দিনের সকল কেনা-বেচা, নতুন মাল কেনা, রিচার্জ ও খরচের বিবরণী</div>
        </div>
        <Link href="/" className="btn gray">🏠 ড্যাশবোর্ড</Link>
      </div>

      {/* Summary Cards Row 1 */}
      <div className="grid cols-3 mt">
        <div className="card" style={{ borderLeft: '4px solid #22c55e' }}>
          <div className="label">আজকের নিট লাভ (Net Profit)</div>
          <div className={`value ${todayNetProfit >= 0 ? 'green' : 'red'}`}>{taka(todayNetProfit)}</div>
        </div>
        <div className="card" style={{ borderLeft: '4px solid #2563eb' }}>
          <div className="label">আজকের বিক্রি (Sales)</div>
          <div className="value green">{taka(todaySalesAmt)}</div>
        </div>
        <div className="card" style={{ borderLeft: '4px solid #0284c7' }}>
          <div className="label">আজকের মাল কেনা (Today's Purchases)</div>
          <div className="value blue">{taka(todayStockAddedAmt)}</div>
        </div>
      </div>

      {/* Summary Cards Row 2 */}
      <div className="grid cols-3 mt" style={{ marginTop: 12 }}>
        <div className="card" style={{ borderLeft: '4px solid #ef4444' }}>
          <div className="label">আজকের বাকি (Due)</div>
          <div className="value red">{taka(todaySalesDue)}</div>
        </div>
        <div className="card" style={{ borderLeft: '4px solid #a855f7' }}>
          <div className="label">আজকের রিচার্জ (Recharge)</div>
          <div className="value purple">{taka(todayRechargesAmt)}</div>
        </div>
        <div className="card" style={{ borderLeft: '4px solid #dc2626' }}>
          <div className="label">আজকের খরচ (Expense)</div>
          <div className="value red">{taka(todayExpensesAmt)}</div>
        </div>
      </div>

      {/* Breakdown grids */}
      <div className="grid cols-2 mt">
        {/* Sales */}
        <div className="card">
          <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>🛒 আজকের বিক্রি তালিকা ({sales.length} টি)</h3>
          <div className="table-wrap mt8" style={{ maxHeight: 300, overflowY: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>গ্রাহক</th>
                  <th>পদ্ধতি</th>
                  <th>মোট</th>
                  <th>বাকি</th>
                  <th>লাভ</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((s) => {
                  const saleProfit = s.items.reduce((sum, it) => sum + ((it.price - (it.buyPrice || 0)) * it.qty), 0) - s.discount;
                  return (
                    <tr key={s._id}>
                      <td><b>{s.customerName || 'ক্যাশ ক্রেতা'}</b></td>
                      <td><span className="badge gray">{s.paymentMethod}</span></td>
                      <td><b>{taka(s.totalAmount)}</b></td>
                      <td className={s.dueAmount > 0 ? 'red' : ''}>{s.dueAmount > 0 ? taka(s.dueAmount) : '—'}</td>
                      <td className="green"><b>{taka(saleProfit)}</b></td>
                    </tr>
                  );
                })}
                {sales.length === 0 && <tr><td colSpan={5} className="empty">আজ কোনো বিক্রি হয়নি</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recharges */}
        <div className="card">
          <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>⚡ আজকের রিচার্জ তালিকা ({recharges.length} টি)</h3>
          <div className="table-wrap mt8" style={{ maxHeight: 300, overflowY: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>মোবাইল নম্বর</th>
                  <th>অপারেটর</th>
                  <th>পরিমাণ</th>
                  <th>লাভ / কমিশন</th>
                </tr>
              </thead>
              <tbody>
                {recharges.map((r) => (
                  <tr key={r._id}>
                    <td><b>{r.phone}</b></td>
                    <td><span className="badge blue">{r.operator}</span></td>
                    <td><b>{taka(r.amount)}</b></td>
                    <td className="green"><b>{taka(r.commission)}</b></td>
                  </tr>
                ))}
                {recharges.length === 0 && <tr><td colSpan={4} className="empty">আজ কোনো রিচার্জ হয়নি</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="grid cols-2 mt">
        {/* Today's Stock Logs / Purchases */}
        <div className="card">
          <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>📦 আজকের মাল কেনা / স্টক যুক্ত তালিকা ({stockLogs.length} টি)</h3>
          <div className="table-wrap mt8" style={{ maxHeight: 300, overflowY: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>পণ্যের নাম</th>
                  <th>যুক্ত করা পরিমাণ</th>
                  <th>কেনার দাম (Buy)</th>
                  <th>মোট মূল্য (Total)</th>
                </tr>
              </thead>
              <tbody>
                {stockLogs.map((log) => (
                  <tr key={log._id}>
                    <td><b>{log.productName}</b></td>
                    <td>{log.qtyAdded} পিস</td>
                    <td>{taka(log.buyPrice)}</td>
                    <td><b>{taka(log.qtyAdded * log.buyPrice)}</b></td>
                  </tr>
                ))}
                {stockLogs.length === 0 && <tr><td colSpan={4} className="empty">আজ কোনো নতুন মাল কেনা হয়নি</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        {/* Expenses */}
        <div className="card">
          <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>💸 আজকের খরচ তালিকা ({expenses.length} টি)</h3>
          <div className="table-wrap mt8" style={{ maxHeight: 300, overflowY: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>ক্যাটাগরি</th>
                  <th>বিবরণ</th>
                  <th>মেথড</th>
                  <th>পরিমাণ</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((e) => (
                  <tr key={e._id}>
                    <td><b>{e.category}</b></td>
                    <td>{e.description || '—'}</td>
                    <td><span className="badge red">{e.paymentMethod}</span></td>
                    <td className="red"><b>{taka(e.amount)}</b></td>
                  </tr>
                ))}
                {expenses.length === 0 && <tr><td colSpan={4} className="empty">আজ কোনো খরচ হয়নি</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="grid cols-1 mt">
        {/* bKash Transactions */}
        <div className="card">
          <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>📱 আজকের বিকাশ লেনদেন ({bkash.length} টি)</h3>
          <div className="table-wrap mt8" style={{ maxHeight: 300, overflowY: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>বিবরণ ও টাইপ</th>
                  <th>পরিমাণ</th>
                  <th>কাস্টমার চার্জ</th>
                  <th>লাভ</th>
                </tr>
              </thead>
              <tbody>
                {bkash.map((b) => (
                  <tr key={b._id}>
                    <td>
                      <b>{b.description}</b>
                      <div className="muted" style={{ fontSize: 11 }}>
                        {b.bkashType} • {b.type}
                      </div>
                    </td>
                    <td><b>{taka(b.amount)}</b></td>
                    <td>{taka(b.customerCharge)}</td>
                    <td className="green"><b>{taka(b.profit)}</b></td>
                  </tr>
                ))}
                {bkash.length === 0 && <tr><td colSpan={4} className="empty">আজ কোনো বিকাশ লেনদেন হয়নি</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
