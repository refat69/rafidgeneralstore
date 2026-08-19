'use client';

import { useEffect, useState } from 'react';
import { taka, num } from '@/lib/money';
import toast from 'react-hot-toast';

export default function BakiPage() {
  const [baki, setBaki] = useState([]);
  const [form, setForm] = useState({ customerName: '', customerPhone: '', amount: '', note: '' });
  const [msg, setMsg] = useState(null);

  // Modal & Details States for Baki Page
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [salesHistory, setSalesHistory] = useState([]);
  const [customerBakiRecords, setCustomerBakiRecords] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [activeTab, setActiveTab] = useState('purchases'); // purchases | baki | edit
  
  // Edit Profile Form State
  const [editForm, setEditForm] = useState({ name: '', phone: '' });
  const [editMsg, setEditMsg] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);

  // Custom Digital Payment Modal State
  const [collectModal, setCollectModal] = useState({ open: false, customerName: '', amount: '', id: null, isModalContext: false });

  // New Baki Form State inside Profile Modal
  const [newBakiForm, setNewBakiForm] = useState({ amount: '', note: '' });
  const [bakiMsg, setBakiMsg] = useState(null);
  const [savingBaki, setSavingBaki] = useState(false);

  useEffect(() => { load(); }, []);
  
  function load() { 
    fetch('/api/baki')
      .then((r) => r.json())
      .then((d) => setBaki(d.baki || []))
      .catch(() => {}); 
  }

  async function openCustomerProfile(customerName) {
    setActiveTab('purchases');
    setLoadingDetails(true);
    setEditMsg(null);
    setBakiMsg(null);
    setNewBakiForm({ amount: '', note: '' });

    // Since we only have the name from Baki record initially, fetch customer info by name
    const encodedName = encodeURIComponent(customerName);
    // Setting a temporary object until fetched
    setSelectedCustomer({ name: customerName, phone: '' });

    try {
      const res = await fetch(`/api/customers/${encodedName}`);
      const data = await res.json();
      if (res.ok && data.customer) {
        setSelectedCustomer(data.customer);
        setEditForm({ name: data.customer.name, phone: data.customer.phone || '' });
        setSalesHistory(data.sales || []);
        setCustomerBakiRecords(data.bakiRecords || []);
      } else {
        // Fallback if API couldn't find/create
        setSelectedCustomer({ name: customerName, phone: '' });
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

    const identifier = selectedCustomer._id || encodeURIComponent(selectedCustomer.name);

    try {
      const res = await fetch(`/api/customers/${identifier}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (res.ok) {
        setEditMsg({ type: 'ok', text: '✅ প্রোফাইল সফলভাবে আপডেট হয়েছে!' });
        setSelectedCustomer({ ...selectedCustomer, name: editForm.name, phone: editForm.phone });
        load(); // Refresh main baki list
      } else {
        setEditMsg({ type: 'err', text: data.error || 'আপডেট করতে সমস্যা হয়েছে' });
      }
    } catch (e) {
      setEditMsg({ type: 'err', text: 'সার্ভার সমস্যা হয়েছে' });
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleAddBakiInModal(e) {
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
        load(); // Refresh main baki list
        openCustomerProfile(selectedCustomer.name); // Refresh modal data
      } else {
        setBakiMsg({ type: 'err', text: data.error || 'সমস্যা হয়েছে' });
      }
    } catch (e) {
      setBakiMsg({ type: 'err', text: 'সার্ভার সমস্যা হয়েছে' });
    } finally {
      setSavingBaki(false);
    }
  }

  function openCollectModal(customerName, id = null, isModalContext = false) {
    setCollectModal({ open: true, customerName, amount: '', id, isModalContext });
  }

  async function submitCollectModal(e) {
    e.preventDefault();
    const amt = Number(collectModal.amount);
    if (!amt || isNaN(amt) || amt <= 0) {
      toast.error('সঠিক টাকার পরিমাণ দিন');
      return;
    }

    try {
      const res = await fetch('/api/baki', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerName: collectModal.customerName, id: collectModal.id, paid: amt }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`✅ ${taka(amt)} জমা গ্রহণ করা হয়েছে!`);
        const cName = collectModal.customerName;
        const wasInModal = collectModal.isModalContext;
        setCollectModal({ open: false, customerName: '', amount: '', id: null, isModalContext: false });
        load(); // Refresh main list
        if (wasInModal && cName) {
          openCustomerProfile(cName); // Refresh modal data
        }
      } else {
        toast.error(data.error || 'জমা নিতে সমস্যা হয়েছে');
      }
    } catch (e) {
      toast.error('সার্ভার সমস্যা হয়েছে');
    }
  }

  async function add(e) {
    e.preventDefault();
    setMsg(null);
    const res = await fetch('/api/baki', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    if (!res.ok) { setMsg({ type: 'err', text: 'সমস্যা হয়েছে' }); toast.error('বাকি যোগ করতে সমস্যা হয়েছে'); return; }
    setMsg({ type: 'ok', text: '✅ বাকি যোগ হয়েছে' });
    toast.success('✅ বাকি যোগ হয়েছে');
    setForm({ customerName: '', customerPhone: '', amount: '', note: '' });
    load();
  }

  async function remove(id) {
    if (!confirm('মুছে ফেলবেন?')) return;
    await fetch(`/api/baki?id=${id}`, { method: 'DELETE' });
    load();
  }

  const owe = baki.filter((b) => b.amount > 0).reduce((a, b) => a + b.amount, 0); // পাওনা
  const given = baki.filter((b) => b.amount < 0).reduce((a, b) => a - b.amount, 0); // দেনা

  return (
    <div>
      <div className="topbar">
        <div>
          <h2>🧾 বাকি / পাওনা</h2>
          <div className="sub">
            আমাদের পাওনা: <b className="green">{taka(owe)}</b> &nbsp;•&nbsp; আমাদের দেনা: <b className="red">{taka(given)}</b>
          </div>
        </div>
      </div>

      <div className="grid cols-2">
        <div className="card">
          <h3>➕ নতুন বাকি/লেনদেন</h3>
          <form className="form-grid two mt8" onSubmit={add}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label>নাম</label>
              <input value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} required />
            </div>
            <div>
              <label>মোবাইল</label>
              <input value={form.customerPhone} onChange={(e) => setForm({ ...form, customerPhone: e.target.value })} />
            </div>
            <div>
              <label>টাকা (+ পাওনা, − দেনা)</label>
              <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label>নোট</label>
              <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
            </div>
            <button className="btn" style={{ gridColumn: '1 / -1' }}>যোগ করুন</button>
          </form>
          <p className="muted" style={{ fontSize: 12.5, marginTop: 8 }}>
            ধনাত্মক (+) = গ্রাহক আমাদের কাছে বাকি • ঋণাত্মক (−) = আমরা সাপ্লায়ারকে দেনা
          </p>
          {msg && <div className={`msg ${msg.type}`}>{msg.text}</div>}
        </div>

        <div className="card">
          <h3>📋 তালিকা</h3>
          <div className="table-wrap mt8">
            <table>
              <thead><tr><th>নাম</th><th>টাকা</th><th>নোট</th><th>অ্যাকশন</th></tr></thead>
              <tbody>
                {baki.map((b) => (
                  <tr key={b._id}>
                    <td>
                      <b 
                        style={{ cursor: 'pointer', color: 'var(--primary)', textDecoration: 'underline' }} 
                        onClick={() => openCustomerProfile(b.customerName)}
                        title="কাস্টমার প্রোফাইল ও ক্রয় ইতিহাস দেখতে ক্লিক করুন"
                      >
                        {b.customerName}
                      </b>
                      <div className="muted" style={{ fontSize: 12 }}>{b.customerPhone}</div>
                    </td>
                    <td className={b.amount > 0 ? 'amber' : 'red'}>
                      <b>{b.amount > 0 ? taka(b.amount) : '−' + taka(-b.amount)}</b>
                    </td>
                    <td className="muted">{b.note}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button 
                          className="btn sm" 
                          onClick={() => openCustomerProfile(b.customerName)}
                          title="বিস্তারিত খতিয়ান"
                        >
                          👁️
                        </button>
                        {b.amount > 0 && <button className="btn sm green" onClick={() => openCollectModal(b.customerName, b._id, false)}>জমা</button>}
                        <button className="btn sm red" onClick={() => remove(b._id)}>🗑</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {baki.length === 0 && <tr><td colSpan={4} className="empty">কোনো বাকি নেই</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Custom Digital Payment Collection Popup Modal */}
      {collectModal.open && (
        <div className="modal-backdrop" style={{ zIndex: 1100 }} onClick={() => setCollectModal({ ...collectModal, open: false })}>
          <div className="modal-container" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header" style={{ background: '#f8fafc', padding: '16px 20px' }}>
              <h3 style={{ margin: 0, fontSize: 17, display: 'flex', alignItems: 'center', gap: 8 }}>
                💰 বকেয়া জমা গ্রহণ
              </h3>
              <button 
                className="btn sm red" 
                onClick={() => setCollectModal({ ...collectModal, open: false })}
                style={{ padding: '4px 8px', borderRadius: '50%' }}
              >
                ✕
              </button>
            </div>
            <form onSubmit={submitCollectModal} style={{ padding: 20 }}>
              <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 8, padding: 12, marginBottom: 16 }}>
                <div style={{ fontSize: 13, color: '#1e40af' }}>গ্রাহকের নাম:</div>
                <div style={{ fontSize: 16, fontWeight: 'bold', color: '#1e3a8a' }}>👤 {collectModal.customerName}</div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 14, fontWeight: '600', color: '#334155', display: 'block', marginBottom: 6 }}>
                  জমা প্রাপ্ত টাকার পরিমাণ (৳)
                </label>
                <input 
                  type="number"
                  autoFocus
                  required
                  placeholder="যেমন: ৫০০"
                  value={collectModal.amount}
                  onChange={(e) => setCollectModal({ ...collectModal, amount: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    fontSize: 18,
                    fontWeight: 'bold',
                    borderRadius: 8,
                    border: '2px solid #3b82f6',
                    outline: 'none'
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
                <button 
                  type="button" 
                  className="btn gray" 
                  onClick={() => setCollectModal({ ...collectModal, open: false })}
                  style={{ padding: '10px 18px', fontSize: 14 }}
                >
                  বাতিল
                </button>
                <button 
                  type="submit" 
                  className="btn green"
                  style={{ padding: '10px 22px', fontSize: 14, fontWeight: 'bold' }}
                >
                  ✅ জমা নিশ্চিত করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {selectedCustomer && (
        <div className="modal-backdrop" onClick={() => setSelectedCustomer(null)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 style={{ margin: 0 }}>👤 {selectedCustomer.name} এর প্রোফাইল</h3>
                <span className="muted" style={{ fontSize: 13 }}>
                  মোবাইল: {selectedCustomer.phone || 'নাই'} • আইডি: {selectedCustomer._id || 'অনিবন্ধিত'}
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
                🧾 বাকি লেনদেন ({customerBakiRecords.length})
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
                        {(() => {
                          const totalCustomerBaki = customerBakiRecords.reduce((sum, r) => sum + r.amount, 0);
                          return (
                            <div className="table-wrap mt8">
                              <table style={{ fontSize: 13 }}>
                                <thead>
                                  <tr>
                                    <th>তারিখ</th>
                                    <th>টাকা (মোট)</th>
                                    <th>বিবরণ/নোটস</th>
                                    <th>অ্যাকশন</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {customerBakiRecords.length > 0 && (
                                    <tr style={{ background: '#fefce8', fontWeight: 'bold' }}>
                                      <td>
                                        {new Date(customerBakiRecords[0].date || customerBakiRecords[0].createdAt).toLocaleDateString('bn-BD')}
                                        <div className="muted" style={{ fontSize: 11, fontWeight: 'normal' }}>
                                          ({customerBakiRecords.length} টি এন্ট্রি একসাথে)
                                        </div>
                                      </td>
                                      <td className={totalCustomerBaki > 0 ? 'amber' : 'red'} style={{ fontSize: 15 }}>
                                        <b>{totalCustomerBaki > 0 ? taka(totalCustomerBaki) : '−' + taka(-totalCustomerBaki)}</b>
                                      </td>
                                      <td className="muted">
                                        <ul style={{ margin: 0, paddingLeft: 14, fontSize: 12, lineHeight: 1.4 }}>
                                          {customerBakiRecords.map((b, idx) => (
                                            <li key={b._id || idx}>
                                              {b.note || 'বাকি'} ({taka(b.amount)}) - {new Date(b.date || b.createdAt).toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })}
                                            </li>
                                          ))}
                                        </ul>
                                      </td>
                                      <td>
                                        {totalCustomerBaki > 0 && (
                                          <button 
                                            className="btn sm green" 
                                            onClick={() => openCollectModal(selectedCustomer.name, customerBakiRecords[0]._id, true)}
                                          >
                                            জমা নিন
                                          </button>
                                        )}
                                      </td>
                                    </tr>
                                  )}
                                  {customerBakiRecords.length === 0 && (
                                    <tr>
                                      <td colSpan={4} className="empty">কোনো বাকি পাওয়া যায়নি</td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          );
                        })()}
                      </div>

                      <div style={{ background: '#f8fafc', padding: 16, borderRadius: 10, border: '1px solid var(--border)' }}>
                        <h4>➕ এখান থেকে নতুন বাকি দিন</h4>
                        <form className="form-grid mt8" onSubmit={handleAddBakiInModal}>
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
