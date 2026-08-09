'use client';

import { useEffect, useState } from 'react';
import { taka, num } from '@/lib/money';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ name: '', category: 'সাধারণ', unit: 'পিস', buyPrice: '', sellPrice: '', stockQty: '', lowStockAt: 5 });
  const [msg, setMsg] = useState(null);

  useEffect(() => { load(); }, []);
  function load() { fetch('/api/products').then((r) => r.json()).then((d) => setProducts(d.products || [])).catch(() => {}); }

  function set(f) { setForm((p) => ({ ...p, ...f })); }

  async function add(e) {
    e.preventDefault();
    setMsg(null);
    const res = await fetch('/api/products', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) { setMsg({ type: 'err', text: data.error }); return; }
    setMsg({ type: 'ok', text: '✅ পণ্য যোগ হয়েছে' });
    setForm({ name: '', category: 'সাধারণ', unit: 'পিস', buyPrice: '', sellPrice: '', stockQty: '', lowStockAt: 5 });
    load();
  }

  async function addStock(id) {
    const qty = prompt('কতটা স্টক যোগ করবেন?');
    if (!qty) return;
    const p = products.find((x) => x._id === id);
    const res = await fetch('/api/products', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...p, stockQty: (num(p.stockQty) + num(qty)) }),
    });
    if (res.ok) load();
  }

  async function remove(id) {
    if (!confirm('পণ্যটি মুছে ফেলবেন?')) return;
    await fetch(`/api/products?id=${id}`, { method: 'DELETE' });
    load();
  }

  const stockValue = products.reduce((a, p) => a + p.stockQty * p.buyPrice, 0);
  const lowCount = products.filter((p) => p.stockQty <= p.lowStockAt).length;

  return (
    <div>
      <div className="topbar">
        <div>
          <h2>📦 স্টক / পণ্য</h2>
          <div className="sub">স্টক মূল্য: {taka(stockValue)} • কম স্টক: <b className="red">{lowCount}</b></div>
        </div>
      </div>

      <div className="grid cols-2">
        <div className="card">
          <h3>➕ নতুন পণ্য যোগ করুন</h3>
          <form className="form-grid two mt8" onSubmit={add}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label>পণ্যের নাম</label>
              <input value={form.name} onChange={(e) => set({ name: e.target.value })} required placeholder="যেমন: চাল, ডাল..." />
            </div>
            <div>
              <label>ক্যাটাগরি</label>
              <input value={form.category} onChange={(e) => set({ category: e.target.value })} />
            </div>
            <div>
              <label>একক (Unit)</label>
              <input value={form.unit} onChange={(e) => set({ unit: e.target.value })} />
            </div>
            <div>
              <label>কেনার দাম (Buy)</label>
              <input type="number" value={form.buyPrice} onChange={(e) => set({ buyPrice: e.target.value })} />
            </div>
            <div>
              <label>বিক্রির দাম (Sell)</label>
              <input type="number" value={form.sellPrice} onChange={(e) => set({ sellPrice: e.target.value })} required />
            </div>
            <div>
              <label>স্টক পরিমাণ</label>
              <input type="number" value={form.stockQty} onChange={(e) => set({ stockQty: e.target.value })} />
            </div>
            <div>
              <label>কম স্টক সতর্কতা</label>
              <input type="number" value={form.lowStockAt} onChange={(e) => set({ lowStockAt: e.target.value })} />
            </div>
            <button className="btn" style={{ gridColumn: '1 / -1' }}>পণ্য যোগ করুন</button>
          </form>
          {msg && <div className={`msg ${msg.type}`}>{msg.text}</div>}
        </div>

        <div className="card">
          <h3>📋 পণ্য তালিকা</h3>
          <div className="table-wrap mt8">
            <table>
              <thead><tr><th>পণ্য</th><th>কিনা</th><th>বিক্রি</th><th>স্টক</th><th>মুনাফা/ইউনিট</th><th></th></tr></thead>
              <tbody>
                {products.map((p) => {
                  const profit = p.sellPrice - p.buyPrice;
                  const low = p.stockQty <= p.lowStockAt;
                  return (
                    <tr key={p._id}>
                      <td><b>{p.name}</b><div className="muted" style={{ fontSize: 12 }}>{p.category} • {p.unit}</div></td>
                      <td>{taka(p.buyPrice)}</td>
                      <td>{taka(p.sellPrice)}</td>
                      <td>
                        <span className={`badge ${low ? 'red' : 'green'}`}>{p.stockQty} {p.unit}</span>
                        <button className="btn sm gray mt8" onClick={() => addStock(p._id)}>+ স্টক</button>
                      </td>
                      <td className={profit >= 0 ? 'green' : 'red'}>{taka(profit)}</td>
                      <td><button className="btn sm red" onClick={() => remove(p._id)}>🗑</button></td>
                    </tr>
                  );
                })}
                {products.length === 0 && <tr><td colSpan={6} className="empty">কোনো পণ্য নেই</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
