'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function AdminOffersPage() {
  const [offers, setOffers] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  useEffect(() => {
    loadOffers();
  }, []);

  function loadOffers() {
    fetch('/api/offers')
      .then((res) => res.json())
      .then((data) => setOffers(data.offers || []))
      .catch((err) => console.error(err));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setMsg(null);
    if (!title.trim() || !description.trim()) {
      setMsg({ type: 'err', text: 'শিরোনাম ও বিবরণ দিন' });
      return;
    }
    setLoading(true);

    try {
      const res = await fetch('/api/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, imageUrl }),
      });
      const data = await res.json();
      setLoading(false);
      if (!res.ok) {
        setMsg({ type: 'err', text: data.error || 'সমস্যা হয়েছে' });
        return;
      }
      setMsg({ type: 'ok', text: '✅ অফার সফলভাবে তৈরি হয়েছে!' });
      setTitle('');
      setDescription('');
      setImageUrl('');
      loadOffers();
    } catch {
      setMsg({ type: 'err', text: 'সার্ভার সমস্যা হয়েছে' });
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('অফারটি মুছে ফেলতে চান?')) return;
    try {
      const res = await fetch(`/api/offers?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        loadOffers();
      }
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div>
      <div className="topbar">
        <div>
          <h2>🎁 অফার ম্যানেজার (Offers Management)</h2>
          <div className="sub">গ্রাহকদের জন্য বিশেষ অফার ও ক্যাম্পেইন তৈরি করুন</div>
        </div>
      </div>

      <div className="grid cols-2">
        {/* Create Offer Form */}
        <div className="card">
          <h3>➕ নতুন অফার যোগ করুন</h3>
          <form onSubmit={handleSubmit} className="form-grid mt">
            <div>
              <label>অফারের শিরোনাম (Title)</label>
              <input 
                placeholder="যেমন: ২টা বিস্কুট কিনলে ১টা শ্যাম্পু ফ্রি!" 
                value={title} 
                onChange={(e) => setTitle(e.target.value)} 
                required 
              />
            </div>
            <div>
              <label>অফারের বিবরণ (Description)</label>
              <textarea 
                rows="4" 
                placeholder="যেমন: ২টি ডাবর ভাটিকা বিস্কুট কিনলে ৫টি ২টাকার সানসিল্ক শ্যাম্পু একদম ফ্রি পাবেন।" 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                required 
                style={{ width: '100%', padding: '11px 13px', border: '1px solid var(--border)', borderRadius: 9, fontSize: 14.5, fontFamily: 'inherit', resize: 'vertical' }}
              />
            </div>
            <div>
              <label>ইমেজ লিংক / Image URL (ঐচ্ছিক)</label>
              <input 
                placeholder="https://example.com/image.jpg" 
                value={imageUrl} 
                onChange={(e) => setImageUrl(e.target.value)} 
              />
            </div>
            <button className="btn" style={{ width: '100%', marginTop: 8 }} disabled={loading}>
              {loading ? 'অফার তৈরি হচ্ছে...' : '✅ অফার প্রকাশ করুন'}
            </button>
            {msg && <div className={`msg ${msg.type}`}>{msg.text}</div>}
          </form>
        </div>

        {/* Offers List */}
        <div className="card">
          <h3>📋 বর্তমান অফারসমূহ</h3>
          <div className="mt" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {offers.length === 0 ? (
              <div className="empty">কোনো সক্রিয় অফার নেই।</div>
            ) : (
              offers.map((offer) => (
                <div key={offer._id} style={{ display: 'flex', gap: 12, padding: 12, border: '1px solid var(--border)', borderRadius: 10, background: '#f8fafc' }}>
                  {offer.imageUrl ? (
                    <img src={offer.imageUrl} alt={offer.title} style={{ width: 80, height: 80, borderRadius: 8, objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: 80, height: 80, borderRadius: 8, background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>
                      🎁
                    </div>
                  )}
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: 0, fontSize: 16 }}>{offer.title}</h4>
                    <p className="muted" style={{ fontSize: 13, marginTop: 4, lineHeight: 1.5 }}>{offer.description}</p>
                    <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                      <button className="btn sm red" onClick={() => handleDelete(offer._id)}>✕ মুছে ফেলুন</button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
