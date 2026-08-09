'use client';

import { useEffect, useState } from 'react';
import { taka, num } from '@/lib/money';

export default function ExpensePage() {
  const [expenses, setExpenses] = useState([]);
  const [form, setForm] = useState({ category: 'অন্যান্য', description: '', amount: '', paymentMethod: 'cash' });
  const [msg, setMsg] = useState(null);

  useEffect(() => { load(); }, []);
  function load() { fetch('/api/expense').then((r) => r.json()).then((d) => setExpenses(d.expenses || [])).catch(() => {}); }

  async function add(e) {
    e.preventDefault();
    setMsg(null);
    const res = await fetch('/api/expense', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (!res.ok) { setMsg({ type: 'err', text: 'সমস্যা হয়েছে' }); return; }
    setMsg({ type: 'ok', text: '✅ খরচ যোগ হয়েছে' });
    setForm({ category: 'অন্যান্য', description: '', amount: '', paymentMethod: 'cash' });
    load();
  }

  async function remove(id) {
    if (!confirm('খরচ মুছবেন?')) return;
    await fetch(`/api/expense?id=${id}`, { method: 'DELETE' });
    load();
  }

  const total = expenses.reduce((a, e) => a + e.amount, 0);

  return (
    <div>
      <div className="topbar">
        <div>
          <h2>💸 খরচ</h2>
          <div className="sub">মোট খরচ: <b className="red">{taka(total)}</b></div>
        </div>
      </div>

      <div className="grid cols-2">
        <div className="card">
          <h3>➕ নতুন খরচ</h3>
          <form className="form-grid two mt8" onSubmit={add}>
            <div>
              <label>ক্যাটাগরি</label>
              <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required />
            </div>
            <div>
              <label>পেমেন্ট</label>
              <select value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}>
                <option value="cash">নগদ (Cash)</option>
                <option value="bkash">bKash</option>
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label>বিবরণ</label>
              <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="যেমন: মাসিক ভাড়া" />
            </div>
            <div>
              <label>টাকা</label>
              <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
            </div>
            <button className="btn" style={{ alignSelf: 'end' }}>খরচ যোগ করুন</button>
          </form>
          <p className="muted" style={{ fontSize: 12.5, marginTop: 8 }}>
            bKash দিয়ে খরচ করলে তা bKash লেজারেও যুক্ত হবে।
          </p>
          {msg && <div className={`msg ${msg.type}`}>{msg.text}</div>}
        </div>

        <div className="card">
          <h3>📋 খরচের তালিকা</h3>
          <div className="table-wrap mt8">
            <table>
              <thead><tr><th>তারিখ</th><th>ক্যাটাগরি</th><th>বিবরণ</th><th>টাকা</th><th></th></tr></thead>
              <tbody>
                {expenses.map((e) => (
                  <tr key={e._id}>
                    <td>{new Date(e.date).toLocaleDateString('bn-BD')}</td>
                    <td><span className={`badge ${e.paymentMethod === 'bkash' ? 'blue' : 'gray'}`}>{e.category}</span></td>
                    <td className="muted">{e.description}</td>
                    <td className="red"><b>{taka(e.amount)}</b></td>
                    <td><button className="btn sm red" onClick={() => remove(e._id)}>🗑</button></td>
                  </tr>
                ))}
                {expenses.length === 0 && <tr><td colSpan={5} className="empty">কোনো খরচ নেই</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
