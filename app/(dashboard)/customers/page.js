'use client';

import { useEffect, useState } from 'react';
import { taka } from '@/lib/money';

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState('');
  
  // Modal & Details States
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [salesHistory, setSalesHistory] = useState([]);
  const [bakiRecords, setBakiRecords] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [activeTab, setActiveTab] = useState('purchases'); // purchases | baki | edit
  
  // Edit Profile Form State
  const [editForm, setEditForm] = useState({ name: '', phone: '' });
  const [editMsg, setEditMsg] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);

  // New Baki Form State inside Profile
  const [newBakiForm, setNewBakiForm] = useState({ amount: '', note: '' });
  const [bakiMsg, setBakiMsg] = useState(null);
  const [savingBaki, setSavingBaki] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, []);

  function loadCustomers() {
    fetch('/api/customers')
      .then((r) => r.json())
      .then((d) => setCustomers(d.customers || []))
      .catch(() => {});
  }

  async function openCustomerProfile(customer) {
    setSelectedCustomer(customer);
    setEditForm({ name: customer.name, phone: customer.phone || '' });
    setNewBakiForm({ amount: '', note: '' });
    setActiveTab('purchases');
    setLoadingDetails(true);
    setEditMsg(null);
    setBakiMsg(null);

    try {
      const res = await fetch(`/api/customers/${customer._id}`);
      const data = await res.json();
      if (res.ok) {
        setSalesHistory(data.sales || []);
        setBakiRecords(data.bakiRecords || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDetails(false);
    }
  }

  async function handleUpdateProfile(e) {
    e.preventDefault();
    if (!editForm.name.trim()) return;
    setSavingProfile(true);
    setEditMsg(null);

    try {
      const res = await fetch(`/api/customers/${selectedCustomer._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (res.ok) {
        setEditMsg({ type: 'ok', text: '✅ প্রোফাইল সফলভাবে আপডেট হয়েছে!' });
        setSelectedCustomer({ ...selectedCustomer, name: editForm.name, phone: editForm.phone });
        loadCustomers();
      } else {
        setEditMsg({ type: 'err', text: data.error || 'আপডেট করতে সমস্যা হয়েছে' });
      }
    } catch (e) {
      setEditMsg({ type: 'err', text: 'সার্ভার সমস্যা হয়েছে' });
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleAddBaki(e) {
    e.preventDefault();
    if (!newBakiForm.amount) return;
    setSavingBaki(true);
    setBakiMsg(null);

    try {
      const res = await fetch('/api/baki', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: selectedCustomer.name,
          customerPhone: selectedCustomer.phone || '',
          amount: newBakiForm.amount,
          note: newBakiForm.note,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setBakiMsg({ type: 'ok', text: '✅ নতুন বাকি রেকর্ড যোগ হয়েছে' });
        setNewBakiForm({ amount: '', note: '' });
        // Reload details for this customer
        openCustomerProfile(selectedCustomer);
      } else {
        setBakiMsg({ type: 'err', text: data.error || 'সমস্যা হয়েছে' });
      }
    } catch (e) {
      setBakiMsg({ type: 'err', text: 'সার্ভার সমস্যা হয়েছে' });
    } finally {
      setSavingBaki(false);
    }
  }

  async function handleCollectBaki(id) {
    const amt = prompt('কত টাকা জমা পেলেন?');
    if (!amt) return;

    try {
      const res = await fetch('/api/baki', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, paid: Number(amt) }),
      });
      if (res.ok) {
        // Reload details for this customer
        openCustomerProfile(selectedCustomer);
      }
    } catch (e) {
      console.error(e);
    }
  }

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.phone && c.phone.includes(search))
  );

  return (
    <div>
      <div className="topbar">
        <div>
          <h2>👥 গ্রাহক তালিকা (Customers)</h2>
          <div className="sub">নিবন্ধিত ও অটো-অ্যাড হওয়া গ্রাহকদের তালিকা এবং তাদের বিস্তারিত লেনদেন</div>
        </div>
      </div>

      <div className="card">
        <div style={{ marginBottom: 16 }}>
          <input
            type="text"
            placeholder="🔍 গ্রাহকের নাম বা মোবাইল দিয়ে খুঁজুন..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', padding: '10px 14px', fontSize: 15 }}
          />
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>গ্রাহকের নাম</th>
                <th>মোবাইল নম্বর</th>
                <th>নিবন্ধন তারিখ</th>
                <th style={{ textAlign: 'right' }}>অ্যাকশন</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c._id}>
                  <td><b>{c.name}</b></td>
                  <td>{c.phone || <span className="muted">—</span>}</td>
                  <td>{new Date(c.createdAt).toLocaleDateString('bn-BD')}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button 
                      className="btn sm" 
                      onClick={() => openCustomerProfile(c)}
                    >
                      👁️ বিস্তারিত ও প্রোফাইল
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={4} className="empty">
                    কোনো গ্রাহক পাওয়া যায়নি
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Profile & Transaction History Modal */}
      {selectedCustomer && (
        <div className="modal-backdrop" onClick={() => setSelectedCustomer(null)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 style={{ margin: 0 }}>👤 {selectedCustomer.name} এর প্রোফাইল</h3>
                <span className="muted" style={{ fontSize: 13 }}>
                  মোবাইল: {selectedCustomer.phone || 'নাই'} • নিবন্ধিত: {new Date(selectedCustomer.createdAt).toLocaleDateString('bn-BD')}
                </span>
              </div>
              <button 
                className="btn sm red" 
                onClick={() => setSelectedCustomer(null)}
                style={{ padding: '4px 8px', borderRadius: '50%' }}
              >
                ✕
              </button>
            </div>

            <div style={{ background: '#f8fafc', borderBottom: '1px solid var(--border)', display: 'flex', gap: 12, padding: '0 24px' }}>
              <button 
                className={`tab-btn ${activeTab === 'purchases' ? 'active' : ''}`}
                onClick={() => setActiveTab('purchases')}
              >
                🛒 ক্রয় ইতিহাস
              </button>
              <button 
                className={`tab-btn ${activeTab === 'baki' ? 'active' : ''}`}
                onClick={() => setActiveTab('baki')}
              >
                🧾 বাকি লেনদেন ({bakiRecords.length})
              </button>
              <button 
                className={`tab-btn ${activeTab === 'edit' ? 'active' : ''}`}
                onClick={() => setActiveTab('edit')}
              >
                ✏️ প্রোফাইল এডিট
              </button>
            </div>

            <div className="modal-body">
              {loadingDetails ? (
                <div style={{ textAlign: 'center', padding: 24 }} className="muted">তথ্য লোড হচ্ছে...</div>
              ) : (
                <>
                  {/* TAB 1: PURCHASES */}
                  {activeTab === 'purchases' && (
                    <div>
                      <h4 style={{ marginBottom: 12 }}>পণ্য ক্রয়ের তালিকা (নগদ ও বাকি)</h4>
                      <div className="table-wrap">
                        <table style={{ fontSize: 13.5 }}>
                          <thead>
                            <tr>
                              <th>তারিখ ও সময়</th>
                              <th>পণ্যসমূহ</th>
                              <th>পেমেন্ট মেথড</th>
                              <th style={{ textAlign: 'right' }}>মোট টাকা</th>
                              <th style={{ textAlign: 'right' }}>পরিশোধ</th>
                              <th style={{ textAlign: 'right' }}>বাকি</th>
                            </tr>
                          </thead>
                          <tbody>
                            {salesHistory.map((s) => (
                              <tr key={s._id}>
                                <td>
                                  <div><b>{new Date(s.date || s.createdAt).toLocaleDateString('bn-BD')}</b></div>
                                  <div className="muted" style={{ fontSize: 11 }}>
                                    {new Date(s.date || s.createdAt).toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit', hour12: true })}
                                  </div>
                                </td>
                                <td>
                                  <ul style={{ margin: 0, paddingLeft: 16 }}>
                                    {(s.items || []).map((it, idx) => (
                                      <li key={idx}>
                                        {it.name} ({it.qty} {it.unit || 'পিস'} × {taka(it.price)})
                                      </li>
                                    ))}
                                  </ul>
                                </td>
                                <td>
                                  <span className={`badge ${s.paymentMethod === 'bkash' ? 'blue' : s.paymentMethod === 'both' ? 'amber' : 'gray'}`}>
                                    {s.paymentMethod === 'bkash' ? 'bKash' : s.paymentMethod === 'both' ? 'নগদ+bKash' : 'নগদ'}
                                  </span>
                                </td>
                                <td style={{ textAlign: 'right' }}><b>{taka(s.totalAmount)}</b></td>
                                <td style={{ textAlign: 'right' }}>{taka(s.paidAmount)}</td>
                                <td style={{ textAlign: 'right', color: s.dueAmount > 0 ? 'var(--red)' : 'var(--green)' }}>
                                  {s.dueAmount > 0 ? taka(s.dueAmount) : 'পরিশোধিত'}
                                </td>
                              </tr>
                            ))}
                            {salesHistory.length === 0 && (
                              <tr>
                                <td colSpan={6} className="empty">কোনো কেনাকাটার রেকর্ড নেই</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: BAKI/CREDIT */}
                  {activeTab === 'baki' && (
                    <div className="grid cols-2" style={{ gap: 20 }}>
                      <div>
                        <h4>🧾 বাকি খতিয়ান</h4>
                        <div className="table-wrap mt8">
                          <table style={{ fontSize: 13 }}>
                            <thead>
                              <tr>
                                <th>তারিখ</th>
                                <th>টাকা</th>
                                <th>নোট</th>
                                <th>অ্যাকশন</th>
                              </tr>
                            </thead>
                            <tbody>
                              {bakiRecords.map((b) => (
                                <tr key={b._id}>
                                  <td>{new Date(b.date || b.createdAt).toLocaleDateString('bn-BD')}</td>
                                  <td className={b.amount > 0 ? 'amber' : 'red'}>
                                    <b>{b.amount > 0 ? taka(b.amount) : '−' + taka(-b.amount)}</b>
                                  </td>
                                  <td className="muted">{b.note || '—'}</td>
                                  <td>
                                    {b.amount > 0 && (
                                      <button 
                                        className="btn sm green" 
                                        onClick={() => handleCollectBaki(b._id)}
                                      >
                                        জমা নিন
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              ))}
                              {bakiRecords.length === 0 && (
                                <tr>
                                  <td colSpan={4} className="empty">কোনো বাকি পাওয়া যায়নি</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div style={{ background: '#f8fafc', padding: 16, borderRadius: 10, border: '1px solid var(--border)' }}>
                        <h4>➕ এখান থেকে নতুন বাকি দিন</h4>
                        <form className="form-grid mt8" onSubmit={handleAddBaki}>
                          <div>
                            <label style={{ fontSize: 12 }}>টাকার পরিমাণ (+ পাওনা, − দেনা)</label>
                            <input 
                              type="number" 
                              value={newBakiForm.amount} 
                              onChange={(e) => setNewBakiForm({ ...newBakiForm, amount: e.target.value })} 
                              required 
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: 12 }}>নোট</label>
                            <input 
                              value={newBakiForm.note} 
                              onChange={(e) => setNewBakiForm({ ...newBakiForm, note: e.target.value })} 
                              placeholder="বাকি লেনদেনের বিবরণ"
                            />
                          </div>
                          <button className="btn green" style={{ width: '100%', marginTop: 8 }} disabled={savingBaki}>
                            {savingBaki ? 'যোগ হচ্ছে...' : 'বাকি যোগ করুন'}
                          </button>
                        </form>
                        {bakiMsg && <div className={`msg ${bakiMsg.type}`} style={{ marginTop: 10 }}>{bakiMsg.text}</div>}
                      </div>
                    </div>
                  )}

                  {/* TAB 3: EDIT PROFILE */}
                  {activeTab === 'edit' && (
                    <div style={{ maxWidth: 500, margin: '0 auto' }}>
                      <h4>✏️ গ্রাহকের তথ্য পরিবর্তন করুন</h4>
                      <form className="form-grid mt8" onSubmit={handleUpdateProfile}>
                        <div>
                          <label>গ্রাহকের নাম</label>
                          <input 
                            value={editForm.name} 
                            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} 
                            required 
                          />
                        </div>
                        <div>
                          <label>মোবাইল নম্বর</label>
                          <input 
                            value={editForm.phone} 
                            onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} 
                          />
                        </div>
                        <button className="btn" style={{ width: '100%', marginTop: 12 }} disabled={savingProfile}>
                          {savingProfile ? 'সংরক্ষণ হচ্ছে...' : 'আপডেট করুন'}
                        </button>
                      </form>
                      {editMsg && <div className={`msg ${editMsg.type}`} style={{ marginTop: 12 }}>{editMsg.text}</div>}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Embedded CSS for Modern Backdrop & Tabs */}
      <style jsx global>{`
        .modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 16px;
        }
        .modal-container {
          background: #ffffff;
          border-radius: 16px;
          width: 100%;
          max-width: 800px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          border: 1px solid var(--border);
        }
        .modal-header {
          padding: 20px 24px;
          border-bottom: 1px solid var(--border);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .modal-body {
          padding: 24px;
        }
        .tab-btn {
          padding: 14px 16px;
          border-bottom: 2px solid transparent;
          background: transparent;
          border-top: none;
          border-left: none;
          border-right: none;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          color: var(--muted);
          transition: all 0.2s;
        }
        .tab-btn:hover {
          color: var(--primary);
        }
        .tab-btn.active {
          border-bottom-color: var(--primary);
          color: var(--primary);
        }
      `}</style>
    </div>
  );
}
