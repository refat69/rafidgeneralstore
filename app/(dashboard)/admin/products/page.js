'use client';

import { useEffect, useState } from 'react';
import { taka, num } from '@/lib/money';
import toast from 'react-hot-toast';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    name: '',
    category: 'সাধারণ',
    unit: 'পিস',
    buyPrice: '',
    sellPrice: '',
    stockQty: '',
    lowStockAt: 5,
    imageUrl: '',
    description: ''
  });

  const [uploading, setUploading] = useState(false);

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

  const resetForm = () => {
    setForm({ name: '', category: 'সাধারণ', unit: 'পিস', buyPrice: '', sellPrice: '', stockQty: '', lowStockAt: 5, imageUrl: '', description: '' });
    setEditingId(null);
  };

  async function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Data = reader.result;
      try {
        const res = await fetch('/api/upload/cloudinary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64Data }),
        });
        const data = await res.json();
        if (res.ok && data.url) {
          set({ imageUrl: data.url });
          toast.success('📸 ছবি ক্লাউডিনারিতে আপলোড হয়েছে!');
        } else {
          set({ imageUrl: base64Data }); // Fallback to base64
          toast.success('📸 ছবি নির্বাচন করা হয়েছে');
        }
      } catch (err) {
        set({ imageUrl: base64Data });
        toast.error('আপলোডে সমস্যা, লোকাল প্রিভিউ সেভ করা হচ্ছে');
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const endpoint = '/api/products';
    const method = editingId ? 'PUT' : 'POST';
    const body = editingId ? { id: editingId, ...form } : form;

    const res = await fetch(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) { 
      toast.error(data.error || 'পণ্য সংরক্ষণ করতে সমস্যা হয়েছে'); 
      return; 
    }
    toast.success(editingId ? '✅ পণ্য আপডেট করা হয়েছে' : '✅ পণ্য সফলভাবে যোগ হয়েছে');
    resetForm();
    load();
  }

  function startEdit(p) {
    setEditingId(p._id);
    setForm({
      name: p.name || '',
      category: p.category || 'সাধারণ',
      unit: p.unit || 'পিস',
      buyPrice: p.buyPrice || '',
      sellPrice: p.sellPrice || '',
      stockQty: p.stockQty || '',
      lowStockAt: p.lowStockAt || 5,
      imageUrl: p.imageUrl || '',
      description: p.description || ''
    });
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

  const stockValue = products.reduce((a, p) => a + (p.stockQty || 0) * (p.buyPrice || 0), 0);
  const lowCount = products.filter((p) => (p.stockQty || 0) <= (p.lowStockAt || 5)).length;

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
          <h2>📦 স্টক / পণ্য ব্যবস্থাপনা</h2>
          <div className="sub">মোট পণ্য: <b>{products.length}টি</b> • স্টক মূল্য: {taka(stockValue)} • কম স্টক: <b className="red">{lowCount}</b></div>
        </div>
      </div>

      <div className="grid cols-2">
        <div className="card">
          <div className="flex between" style={{ alignItems: 'center' }}>
            <h3>{editingId ? '✏️ পণ্য এডিট করুন' : '➕ নতুন পণ্য যোগ করুন'}</h3>
            {editingId && (
              <button className="btn sm gray" onClick={resetForm}>বাতিল</button>
            )}
          </div>
          
          <form className="form-grid two mt8" onSubmit={handleSubmit}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label>পণ্যের নাম *</label>
              <input value={form.name} onChange={(e) => set({ name: e.target.value })} required placeholder="যেমন: চাল, ডাল, সরিষার তেল..." />
            </div>
            <div>
              <label>ক্যাটাগরি</label>
              <input value={form.category} onChange={(e) => set({ category: e.target.value })} placeholder="যেমন: মুদি, পানীয়..." />
            </div>
            <div>
              <label>একক (Unit)</label>
              <input value={form.unit} onChange={(e) => set({ unit: e.target.value })} placeholder="পিস / কেজি / লিটার" />
            </div>
            <div>
              <label>কেনার দাম (Buy)</label>
              <input type="number" value={form.buyPrice} onChange={(e) => set({ buyPrice: e.target.value })} placeholder="0" />
            </div>
            <div>
              <label>বিক্রির দাম (Sell) *</label>
              <input type="number" value={form.sellPrice} onChange={(e) => set({ sellPrice: e.target.value })} required placeholder="0" />
            </div>
            <div>
              <label>স্টক পরিমাণ</label>
              <input type="number" value={form.stockQty} onChange={(e) => set({ stockQty: e.target.value })} placeholder="0" />
            </div>
            <div>
              <label>কম স্টক সতর্কতা</label>
              <input type="number" value={form.lowStockAt} onChange={(e) => set({ lowStockAt: e.target.value })} placeholder="5" />
            </div>

            {/* Cloudinary Image & Description Section */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label>☁️ Cloudinary ইমেজ URL / ফাইল আপলোড</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                <input 
                  type="text" 
                  value={form.imageUrl} 
                  onChange={(e) => set({ imageUrl: e.target.value })} 
                  placeholder="https://res.cloudinary.com/..." 
                  style={{ flex: 1 }}
                />
                <label className="btn sm gray" style={{ cursor: 'pointer', margin: 0, whiteSpace: 'nowrap' }}>
                  {uploading ? 'আপলোড হচ্ছে...' : '📁 ফাইল বাছুন'}
                  <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} disabled={uploading} />
                </label>
              </div>
              {form.imageUrl && (
                <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <img src={form.imageUrl} alt="Preview" style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 6, border: '1px solid #cbd5e1' }} />
                  <span style={{ fontSize: 12, color: '#16a34a', fontWeight: 600 }}>✓ ইমেজের প্রিভিউ সফল</span>
                </div>
              )}
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label>পণ্যের বিবরণ (Description)</label>
              <textarea 
                value={form.description} 
                onChange={(e) => set({ description: e.target.value })} 
                placeholder="পণ্যের গুণাগুণ বা বিবরণ লিখুন..." 
                rows={2}
                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              />
            </div>

            <button className="btn" style={{ gridColumn: '1 / -1' }}>
              {editingId ? 'পণ্য আপডেট করুন' : 'পণ্য যোগ করুন'}
            </button>
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
              <thead><tr><th>ছবি</th><th>পণ্য</th><th>কিনা</th><th>বিক্রি</th><th>স্টক</th><th>অ্যাকশন</th></tr></thead>
              <tbody>
                {paginatedProducts.map((p) => {
                  const profit = p.sellPrice - p.buyPrice;
                  const low = p.stockQty <= p.lowStockAt;
                  return (
                    <tr key={p._id}>
                      <td>
                        {p.imageUrl ? (
                          <img src={p.imageUrl} alt={p.name} style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 8 }} />
                        ) : (
                          <div style={{ width: 40, height: 40, background: '#f1f5f9', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🛍️</div>
                        )}
                      </td>
                      <td>
                        <b>{p.name}</b>
                        <div className="muted" style={{ fontSize: 12 }}>{p.category} • {p.unit}</div>
                      </td>
                      <td>{taka(p.buyPrice)}</td>
                      <td><b>{taka(p.sellPrice)}</b></td>
                      <td>
                        <span className={`badge ${low ? 'red' : 'green'}`}>{p.stockQty} {p.unit}</span>
                        <button className="btn sm gray mt8" style={{ display: 'block' }} onClick={() => addStock(p._id)}>+ স্টক</button>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn sm blue" onClick={() => startEdit(p)}>✏️</button>
                          <button className="btn sm red" onClick={() => remove(p._id)}>🗑</button>
                        </div>
                      </td>
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
