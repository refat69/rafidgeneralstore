'use client';

import { useEffect, useState } from 'react';
import { taka, num } from '@/lib/money';

export default function RechargePage() {
  const [recharges, setRecharges] = useState([]);
  const [phone, setPhone] = useState('');
  const [operator, setOperator] = useState('GP');
  const [rechargeType, setRechargeType] = useState('regular'); // regular | package
  const [amount, setAmount] = useState('');
  const [commission, setCommission] = useState('');
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    load();
  }, []);

  function load() {
    fetch('/api/recharges')
      .then((r) => r.json())
      .then((d) => setRecharges(d.recharges || []))
      .catch(() => {});
  }

  // Auto calculate commission when amount changes
  useEffect(() => {
    if (rechargeType === 'regular' && amount) {
      const comm = (Number(amount) * 0.028).toFixed(2); // 2.8% commission
      setCommission(comm);
    }
  }, [amount, rechargeType]);

  async function submit(e) {
    e.preventDefault();
    setMsg(null);
    if (!phone || !amount) {
      setMsg({ type: 'err', text: 'ফোন নম্বর এবং রিচার্জের পরিমাণ দিন' });
      return;
    }
    setLoading(true);

    const res = await fetch('/api/recharges', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phone,
        operator,
        amount: Number(amount),
        commission: Number(commission),
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setMsg({ type: 'err', text: data.error || 'সমস্যা হয়েছে' });
      return;
    }

    setMsg({ type: 'ok', text: '⚡ রিচার্জ সফলভাবে যোগ হয়েছে!' });
    setPhone('');
    setAmount('');
    setCommission('');
    load();
  }

  const totalRechargeAmt = recharges.reduce((a, r) => a + r.amount, 0);
  const totalCommAmt = recharges.reduce((a, r) => a + r.commission, 0);

  return (
    <div>
      <div className="topbar">
        <div>
          <h2>⚡ মোবাইল রিচার্জ লেজার (Mobile Recharge)</h2>
          <div className="sub">রিচার্জের হিসাব রাখুন এবং কমিশন/লাভ ট্র্যাক করুন</div>
        </div>
      </div>

      <div className="grid cols-2">
        {/* Left: Add Recharge */}
        <div className="card">
          <h3>➕ নতুন রিচার্জ যোগ করুন</h3>
          <form className="form-grid mt8" onSubmit={submit}>
            <div>
              <label>মোবাইল নম্বর</label>
              <input
                required
                placeholder="01XXXXXXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div>
              <label>অপারেটর</label>
              <select value={operator} onChange={(e) => setOperator(e.target.value)}>
                <option value="GP">Grameenphone (GP)</option>
                <option value="Robi">Robi</option>
                <option value="Banglalink">Banglalink</option>
                <option value="Airtel">Airtel</option>
                <option value="Teletalk">Teletalk</option>
              </select>
            </div>
            <div>
              <label>রিচার্জের ধরণ</label>
              <select
                value={rechargeType}
                onChange={(e) => {
                  setRechargeType(e.target.value);
                  if (e.target.value === 'package') {
                    setCommission('');
                  }
                }}
              >
                <option value="regular">সাধারণ রিচার্জ (২.৮% কমিশন)</option>
                <option value="package">প্যাকেজ / এমবি অফার (কাস্টম কমিশন)</option>
              </select>
            </div>
            <div>
              <label>পরিমাণ (৳)</label>
              <input
                type="number"
                required
                placeholder="যেমন: ৫০০"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
            <div>
              <label>লাভ / কমিশন (৳)</label>
              <input
                type="number"
                step="0.01"
                placeholder="অটো হিসাবকৃত / কাস্টম"
                value={commission}
                onChange={(e) => setCommission(e.target.value)}
              />
            </div>

            <button className="btn green" style={{ gridColumn: '1 / -1', marginTop: 8 }} disabled={loading}>
              {loading ? 'সংরক্ষণ হচ্ছে...' : '⚡ রিচার্জ নিশ্চিত করুন'}
            </button>
          </form>
          {msg && <div className={`msg mt ${msg.type}`}>{msg.text}</div>}
        </div>

        {/* Right: History */}
        <div className="card">
          <div className="flex between">
            <h3>📋 সাম্প্রতিক রিচার্জসমূহ</h3>
            <div className="muted" style={{ fontSize: 13 }}>
              মোট: <b>{taka(totalRechargeAmt)}</b> • কমিশন: <b className="green">{taka(totalCommAmt)}</b>
            </div>
          </div>

          <div className="table-wrap mt8" style={{ maxHeight: 380, overflowY: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>তারিখ</th>
                  <th>মোবাইল নম্বর</th>
                  <th>অপারেটর</th>
                  <th>পরিমাণ</th>
                  <th>কমিশন</th>
                </tr>
              </thead>
              <tbody>
                {recharges.map((r) => (
                  <tr key={r._id}>
                    <td>{new Date(r.date).toLocaleDateString('bn-BD')}</td>
                    <td><b>{r.phone}</b></td>
                    <td><span className="badge blue">{r.operator}</span></td>
                    <td><b>{taka(r.amount)}</b></td>
                    <td className="green"><b>{taka(r.commission)}</b></td>
                  </tr>
                ))}
                {recharges.length === 0 && (
                  <tr>
                    <td colSpan={5} className="empty">
                      কোনো রিচার্জের রেকর্ড পাওয়া যায়নি
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
