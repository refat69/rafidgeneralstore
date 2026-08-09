'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function CustomerRegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/customer/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'register', name, phone, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'নিবন্ধন ব্যর্থ হয়েছে');
        setLoading(false);
        return;
      }
      router.push('/customer/dashboard');
      router.refresh();
    } catch {
      setError('সার্ভার সমস্যা হয়েছে');
      setLoading(false);
    }
  }

  return (
    <div className="login-wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)' }}>
      <form className="login-card" onSubmit={handleSubmit} style={{ background: '#fff', borderRadius: 16, padding: '36px 32px', width: '100%', maxWidth: 400, boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: 42 }}>📝</div>
          <h1 style={{ fontSize: 24, margin: '10px 0 4px' }}>কাস্টমার রেজিস্টার</h1>
          <div className="sub" style={{ color: '#64748b', fontSize: 14 }}>রাফিদ জেনারেল স্টোর কাস্টমার পোর্টাল</div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 13.5, color: '#64748b', marginBottom: 6, fontWeight: 600 }}>পূর্ণ নাম / Full Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="আপনার নাম লিখুন"
            required
            style={{ width: '100%', padding: '11px 13px', border: '1px solid #e2e8f0', borderRadius: 9, fontSize: 14.5 }}
          />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 13.5, color: '#64748b', marginBottom: 6, fontWeight: 600 }}>মোবাইল নম্বর / Phone</label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="01XXXXXXXXX"
            required
            style={{ width: '100%', padding: '11px 13px', border: '1px solid #e2e8f0', borderRadius: 9, fontSize: 14.5 }}
          />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 13.5, color: '#64748b', marginBottom: 6, fontWeight: 600 }}>পাসওয়ার্ড / Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••"
            required
            style={{ width: '100%', padding: '11px 13px', border: '1px solid #e2e8f0', borderRadius: 9, fontSize: 14.5 }}
          />
        </div>

        <button className="btn" style={{ width: '100%', marginTop: 10, background: '#2563eb', color: '#fff', border: 'none', padding: '11px', borderRadius: 9, fontWeight: 600, cursor: 'pointer' }} disabled={loading}>
          {loading ? 'নিবন্ধন হচ্ছে...' : 'নিবন্ধন করুন'}
        </button>

        {error && <div className="msg err" style={{ padding: '11px 14px', borderRadius: 9, background: '#fee2e2', color: '#dc2626', marginTop: 14, fontSize: 14 }}>{error}</div>}

        <p className="center" style={{ fontSize: 13.5, marginTop: 18, color: '#64748b', textAlign: 'center' }}>
          ইতিমধ্যে অ্যাকাউন্ট আছে? <Link href="/customer/login" style={{ color: '#2563eb', fontWeight: 600 }}>লগইন করুন</Link>
        </p>

        <p className="center" style={{ fontSize: 12, marginTop: 10, color: '#94a3b8', textAlign: 'center' }}>
          <Link href="/" style={{ color: '#64748b' }}>🏠 হোম পেইজে ফিরে যান</Link>
        </p>
      </form>
    </div>
  );
}
