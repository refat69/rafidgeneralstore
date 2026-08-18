'use client';

import { useEffect, useState } from 'react';
import { taka, num } from '@/lib/money';
import toast from 'react-hot-toast';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ name: '', category: 'সাধারণ', unit: 'পিস', buyPrice: '', sellPrice: '', stockQty: '', lowStockAt: 5 });

  // Search & Pagination States
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => { load(); }, []);
  function load() { 
    fetch('/api/products?t=' + Date.now())
      .then((r) => r.json())
      .then((d) => setProducts(d.products || []))
      .catch(() => {}); 
  }

  function set(f) { setForm((p) => ({ ...p, ...f })); }

  async function add(e) {
    e.preventDefault();
    const res = await fetch('/api/products', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) { 
      toast.error(data.error || 'পণ্য যোগ করতে সমস্যা হয়েছে'); 
      return; 
    }
    toast.success('✅ পণ্য সফলভাবে যোগ হয়েছে');
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
    const data = await res.json();
    if (res.ok) {
      toast.success('✅ স্টক সফলভাবে আপডেট করা হয়েছে');
      load();
    } else {
      toast.error(data.error || 'স্টক আপডেট করতে সমস্যা হয়েছে');
    }
  }

  async function remove(id) {
    if (!confirm('পণ্যটি মুছে ফেলবেন?')) return;
    const res = await fetch(`/api/products?id=${id}`, { method: 'DELETE' });
    if (res.ok) {
      toast.success('🗑 পণ্যটি মুছে ফেলা হয়েছে');
      load();
    } else {
      toast.error('মুছে ফেলতে সমস্যা হয়েছে');
    }
  }

  const stockValue = products.reduce((a, p) => a + p.stockQty * p.buyPrice, 0);
  const lowCount = products.filter((p) => p.stockQty <= p.lowStockAt).length;

  // Filter & Paginate Products
  const filtered = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p.category && p.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const activePage = Math.min(currentPage, Math.max(1, totalPages));
  const paginatedProducts = filtered.slice((activePage - 1) * itemsPerPage, activePage * itemsPerPage);

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
        </div>

        <div className="card">
          <div className="flex between" style={{ alignItems: 'center', marginBottom: 12, gap: 10, flexWrap: 'wrap' }}>
            <h3>📋 পণ্য তালিকা ({filtered.length} টি)</h3>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <select 
                value={itemsPerPage} 
                onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                style={{ padding: '6px 10px', width: '80px', fontSize: '13px' }}
              >
                <option value={10}>10টি</option>
                <option value={20}>20টি</option>
                <option value={50}>50টি</option>
                <option value={100}>100টি</option>
              </select>
            </div>
          </div>
          
          <div style={{ marginBottom: 16 }}>
            <input 
              placeholder="🔍 পণ্য খুঁজুন (নাম বা ক্যাটাগরি)..." 
              value={searchTerm} 
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              style={{ padding: '8px 12px', fontSize: '14px' }}
            />
          </div>

          <div className="table-wrap mt8">
            <table>
              <thead><tr><th>পণ্য</th><th>কিনা</th><th>বিক্রি</th><th>স্টক</th><th>মুনাফা/ইউনিট</th><th></th></tr></thead>
              <tbody>
                {paginatedProducts.map((p) => {
                  const profit = p.sellPrice - p.buyPrice;
                  const low = p.stockQty <= p.lowStockAt;
                  return (
                    <tr key={p._id}>
                      <td><b>{p.name}</b><div className="muted" style={{ fontSize: 12 }}>{p.category} • {p.unit}</div></td>
                      <td>{taka(p.buyPrice)}</td>
                      <td>{taka(p.sellPrice)}</td>
                      <td>
                        <span className={`badge ${low ? 'red' : 'green'}`}>{p.stockQty} {p.unit}</span>
                        <button className="btn sm gray mt8" style={{ display: 'block' }} onClick={() => addStock(p._id)}>+ স্টক</button>
                      </td>
                      <td className={profit >= 0 ? 'green' : 'red'}>{taka(profit)}</td>
                      <td><button className="btn sm red" onClick={() => remove(p._id)}>🗑</button></td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && <tr><td colSpan={6} className="empty">কোনো পণ্য নেই</td></tr>}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex center" style={{ gap: 12, justifyContent: 'center', marginTop: 20, alignItems: 'center' }}>
              <button 
                className="btn sm gray" 
                disabled={activePage === 1} 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              >
                ◀ পূর্ববর্তী
              </button>
              <span style={{ fontSize: 14, fontWeight: '600' }}>
                পৃষ্ঠা {activePage} / {totalPages}
              </span>
              <button 
                className="btn sm gray" 
                disabled={activePage === totalPages} 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              >
                পরবর্তী ▶
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
