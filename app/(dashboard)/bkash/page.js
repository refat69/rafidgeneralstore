'use client';

import { useEffect, useState } from 'react';
import { taka, num } from '@/lib/money';

export default function BkashPage() {
  const [txns, setTxns] = useState([]);
  const [balance, setBalance] = useState(0);

  // Form States
  const [bkashType, setBkashType] = useState('personal'); // personal | agent | b2b
  const [type, setType] = useState('cashout'); // cashin | cashout | b2b_send | b2b_receive | income | expense
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [customerCharge, setCustomerCharge] = useState('');
  const [ourCost, setOurCost] = useState('');
  const [profit, setProfit] = useState(0);

  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    load();
  }, []);

  function load() {
    fetch('/api/bkash')
      .then((r) => r.json())
      .then((d) => {
        setTxns(d.txns || []);
        setBalance(d.balance || 0);
      })
      .catch(() => {});
  }

  // Dynamic values calculation
  useEffect(() => {
    const amt = Number(amount) || 0;
    if (bkashType === 'b2b') {
      setCustomerCharge('0');
      setOurCost('0');
      setProfit(0);
    } else if (bkashType === 'agent') {
      if (type === 'cashout') {
        // Agent Cash Out profit (typically 4.10 tk per 1000 from bkash)
        const charge = (amt * 0.0041).toFixed(2);
        setCustomerCharge(charge);
        setOurCost('0');
        setProfit(Number(charge));
      } else {
        setCustomerCharge('0');
        setOurCost('0');
        setProfit(0);
      }
    } else if (bkashType === 'personal') {
      if (type === 'cashout') {
        // Personal Cash Out: customer fee is typically 18.5 tk/1000
        const charge = (amt * 0.0185).toFixed(2);
        setCustomerCharge(charge);
        // Default cost: 10 tk per 1000 (can be edited)
        const cost = (amt * 0.010).toFixed(2);
        setOurCost(cost);
        setProfit(Number((charge - cost).toFixed(2)));
      } else {
        setCustomerCharge('0');
        setOurCost('0');
        setProfit(0);
      }
    }
  }, [amount, bkashType, type]);

  // Sync profit when user edits charges manually
  useEffect(() => {
    const charge = Number(customerCharge) || 0;
    const cost = Number(ourCost) || 0;
    setProfit(Number((charge - cost).toFixed(2)));
  }, [customerCharge, ourCost]);

  async function add(e) {
    e.preventDefault();
    setMsg(null);
    if (!amount || !description) {
      setMsg({ type: 'err', text: 'পরিমাণ ও বিবরণ প্রদান করুন' });
      return;
    }
    setLoading(true);

    const res = await fetch('/api/bkash', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bkashType,
        type,
        description,
        amount: Number(amount),
        customerCharge: Number(customerCharge),
        ourCost: Number(ourCost),
        profit: Number(profit)
      }),
    });

    setLoading(false);
    if (!res.ok) {
      setMsg({ type: 'err', text: 'সমস্যা হয়েছে' });
      return;
    }

    setMsg({ type: 'ok', text: '✅ লেনদেন সফলভাবে যোগ হয়েছে' });
    setAmount('');
    setDescription('');
    setCustomerCharge('');
    setOurCost('');
    load();
  }

  async function remove(id) {
    if (!confirm('লেনদেনটি মুছে ফেলবেন?')) return;
    await fetch(`/api/bkash?id=${id}`, { method: 'DELETE' });
    load();
  }

  const totalBkashProfit = txns.reduce((a, t) => a + (t.profit || 0), 0);

  return (
    <div>
      <div className="topbar">
        <div>
          <h2>📱 bKash লেনদেন ও লেজার</h2>
          <div className="sub">ব্যালেন্স: <b className="blue">{taka(balance)}</b> • মোট অর্জিত লাভ: <b className="green">{taka(totalBkashProfit)}</b></div>
        </div>
      </div>

      <div className="grid cols-3">
        <div className="card">
          <div className="label">bKash ধরণ</div>
          <div className="value pink" style={{ fontSize: 16, marginTop: 8 }}>
            <button className={`btn sm ${bkashType === 'personal' ? 'pink' : 'gray'}`} onClick={() => setBkashType('personal')}>পার্সোনাল</button>
            <button className={`btn sm ${bkashType === 'agent' ? 'pink' : 'gray'}`} style={{ marginLeft: 8 }} onClick={() => setBkashType('agent')}>এজেন্ট</button>
            <button className={`btn sm ${bkashType === 'b2b' ? 'pink' : 'gray'}`} style={{ marginLeft: 8 }} onClick={() => setBkashType('b2b')}>B2B (ফ্রি)</button>
          </div>
        </div>
        <div className="card">
          <div className="label">বিকাশ ব্যালেন্স</div>
          <div className="value blue">{taka(balance)}</div>
        </div>
        <div className="card">
          <div className="label">মোট লাভ</div>
          <div className="value green">{taka(totalBkashProfit)}</div>
        </div>
      </div>

      <div className="grid cols-2 mt">
        {/* Form */}
        <div className="card">
          <h3>➕ লেনদেন যোগ করুন ({bkashType === 'personal' ? 'পার্সোনাল' : bkashType === 'agent' ? 'এজেন্ট' : 'B2B'})</h3>
          <form className="form-grid mt8" onSubmit={add}>
            <div>
              <label>লেনদেনের ধরণ</label>
              <select value={type} onChange={(e) => setType(e.target.value)}>
                {bkashType !== 'b2b' && <option value="cashout">ক্যাশ আউট (Cash Out)</option>}
                {bkashType !== 'b2b' && <option value="cashin">ক্যাশ ইন (Cash In)</option>}
                {bkashType === 'b2b' && <option value="b2b_send">B2B Send</option>}
                {bkashType === 'b2b' && <option value="b2b_receive">B2B Receive</option>}
                <option value="income">ক্যাশ লোড / আয় (Income)</option>
                <option value="expense">ক্যাশ খরচ / ব্যয় (Expense)</option>
              </select>
            </div>
            <div>
              <label>পরিমাণ (টাকা)</label>
              <input type="number" placeholder="যেমন: ১০০০" value={amount} onChange={(e) => setAmount(e.target.value)} required />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label>বিবরণ</label>
              <input value={description} onChange={(e) => setDescription(e.target.value)} required placeholder="যেমন: রানা ক্যাশ আউট, এজেন্ট লোড..." />
            </div>

            {bkashType !== 'b2b' && (
              <>
                <div>
                  <label>গ্রাহক চার্জ (৳)</label>
                  <input type="number" step="0.01" value={customerCharge} onChange={(e) => setCustomerCharge(e.target.value)} />
                </div>
                <div>
                  <label>আমাদের খরচ / কেনার দাম (৳)</label>
                  <input type="number" step="0.01" value={ourCost} onChange={(e) => setOurCost(e.target.value)} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <div className="flex between" style={{ padding: '8px 12px', background: 'var(--bg)', borderRadius: 6 }}>
                    <span className="muted">হিসাবকৃত লাভ:</span>
                    <b className={profit >= 0 ? 'green' : 'red'} style={{ fontSize: 18 }}>{taka(profit)}</b>
                  </div>
                </div>
              </>
            )}

            <button className="btn pink" style={{ gridColumn: '1 / -1', marginTop: 8 }} disabled={loading}>
              {loading ? 'সংরক্ষণ হচ্ছে...' : '✅ লেনদেন নিশ্চিত করুন'}
            </button>
          </form>
          {msg && <div className={`msg mt ${msg.type}`}>{msg.text}</div>}
        </div>

        {/* List */}
        <div className="card">
          <h3>📋 লেনদেনের তালিকা</h3>
          <div className="table-wrap mt8" style={{ maxHeight: 420, overflowY: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>তারিখ</th>
                  <th>টাইপ</th>
                  <th>বিবরণ ও টাকা</th>
                  <th>লাভ</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {txns.map((t) => {
                  const isExp = ['expense', 'cashin', 'b2b_send'].includes(t.type);
                  return (
                    <tr key={t._id}>
                      <td>{new Date(t.date).toLocaleDateString('bn-BD')}</td>
                      <td>
                        <span className={`badge ${t.bkashType === 'agent' ? 'blue' : t.bkashType === 'b2b' ? 'gray' : 'pink'}`}>
                          {t.bkashType === 'agent' ? 'Agent' : t.bkashType === 'b2b' ? 'B2B' : 'Personal'}
                        </span>
                        <div style={{ fontSize: 10, marginTop: 4, color: 'var(--muted)' }}>{t.type}</div>
                      </td>
                      <td>
                        <b>{t.description}</b>
                        <div style={{ fontWeight: 'bold', color: isExp ? 'red' : 'green' }}>
                          {isExp ? '−' : '+'}{taka(t.amount)}
                        </div>
                      </td>
                      <td className="green"><b>{t.profit ? taka(t.profit) : '—'}</b></td>
                      <td><button className="btn sm red" onClick={() => remove(t._id)}>🗑</button></td>
                    </tr>
                  );
                })}
                {txns.length === 0 && <tr><td colSpan={5} className="empty">কোনো লেনদেনের রেকর্ড নেই</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
