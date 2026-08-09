'use client';

import { useEffect, useState } from 'react';
import { taka } from '@/lib/money';

export default function ReportPage() {
  const [r, setR] = useState(null);

  useEffect(() => {
    fetch('/api/report').then((res) => res.json()).then(setR).catch(() => {});
  }, []);

  if (!r) return <div className="empty">রিপোর্ট লোড হচ্ছে...</div>;

  const maxTrend = Math.max(...r.trend.map((d) => d.value), 1);
  const maxExp = Math.max(...r.expenseByCategory.map((d) => d.value), 1);

  return (
    <div>
      <div className="topbar">
        <div>
          <h2>📈 রিপোর্ট ও হিসাব</h2>
          <div className="sub">বিক্রি, মুনাফা ও খরচের সারসংক্ষেপ</div>
        </div>
      </div>

      <div className="grid cols-4">
        <div className="card"><div className="label">মোট বিক্রি</div><div className="value blue">{taka(r.totalSales)}</div></div>
        <div className="card"><div className="label">মোট পণ্য খরচ (COGS)</div><div className="value">{taka(r.cogs)}</div></div>
        <div className="card"><div className="label">মোট খরচ</div><div className="value red">{taka(r.totalExpense)}</div></div>
        <div className="card"><div className="label">মোট লাভ (Net Profit)</div><div className={`value ${r.netProfit >= 0 ? 'green' : 'red'}`}>{taka(r.netProfit)}</div></div>
      </div>

      <div className="grid cols-2 mt">
        <div className="card">
          <h3>গত ১৪ দিনের বিক্রি</h3>
          <div className="bars mt8">
            {r.trend.map((d, i) => (
              <div key={i} className="bar" style={{ height: (d.value / maxTrend) * 100 + '%' }} title={`${d.label}: ${taka(d.value)}`}>
                <span className="bar-label">{d.label}</span>
              </div>
            ))}
          </div>
          <div className="flex between mt8" style={{ fontSize: 13 }}>
            <span className="muted">মোট পণ্য খরচ: {taka(r.cogs)}</span>
            <span className="muted">মোট প্রাপ্তি: {taka(r.totalPaid)}</span>
          </div>
        </div>

        <div className="card">
          <h3>বিক্রি ও খরচ বিবরণ</h3>
          <div className="form-grid mt8" style={{ gap: 10, fontSize: 14.5 }}>
            <div className="flex between"><span className="muted">মোট বিক্রি</span><b>{taka(r.totalSales)}</b></div>
            <div className="flex between"><span className="muted">মোট প্রদত্ত</span><b>{taka(r.totalPaid)}</b></div>
            <div className="flex between"><span className="muted">মোট বাকি (due)</span><b className="red">{taka(r.totalDue)}</b></div>
            <hr />
            <div className="flex between"><span className="muted">মোট পণ্য খরচ (COGS)</span><b>{taka(r.cogs)}</b></div>
            <div className="flex between"><span className="muted">গ্রস মুনাফা</span><b className="green">{taka(r.grossProfit)}</b></div>
            <hr />
            <div className="flex between"><span className="muted">অন্যান্য খরচ</span><b className="red">{taka(r.totalExpense)}</b></div>
            <div className="flex between" style={{ borderTop: '2px solid var(--primary)', paddingTop: 8 }}>
              <b>নিট মুনাফা</b>
              <b className={r.netProfit >= 0 ? 'green' : 'red'}>{taka(r.netProfit)}</b>
            </div>
          </div>
        </div>
      </div>

      <div className="grid cols-2 mt">
        <div className="card">
          <h3>🏆 সেরা বিক্রিত পণ্য</h3>
          <div className="table-wrap mt8">
            <table>
              <thead><tr><th>পণ্য</th><th>বিক্রি (৳)</th></tr></thead>
              <tbody>
                {r.topProducts.map((p) => (
                  <tr key={p.name}><td>{p.name}</td><td><b>{taka(p.value)}</b></td></tr>
                ))}
                {r.topProducts.length === 0 && <tr><td colSpan={2} className="empty">কোনো ডেটা নেই</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <h3>💸 খরচ ক্যাটাগরি অনুযায়ী</h3>
          {r.expenseByCategory.length > 0 ? (
            <>
              <div className="bars mt8">
                {r.expenseByCategory.map((e, i) => (
                  <div key={i} className="bar" style={{ height: (e.value / maxExp) * 100 + '%', background: '#dc2626' }} title={`${e.category}: ${taka(e.value)}`}>
                    <span className="bar-label">{e.category}</span>
                  </div>
                ))}
              </div>
              <div className="mt8" style={{ display: 'grid', gap: 6, fontSize: 14 }}>
                {r.expenseByCategory.map((e, i) => (
                  <div key={i} className="flex between">
                    <span className="muted">{e.category}</span><b>{taka(e.value)}</b>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="empty">কোনো খরচ নেই</div>
          )}
        </div>
      </div>
    </div>
  );
}
