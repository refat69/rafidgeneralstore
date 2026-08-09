'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'লগইন ব্যর্থ হয়েছে');
        setLoading(false);
        return;
      }
      router.push('/');
      router.refresh();
    } catch {
      setError('সার্ভার সমস্যা হয়েছে');
      setLoading(false);
    }
  }

  return (
    <div className="login-wrap">
      <form className="login-card" onSubmit={handleSubmit}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 42 }}>🏪</div>
          <h1>দোকান ড্যাশবোর্ড</h1>
          <div className="sub">আপনার দোকানের হিসাব সব এক জায়গায়</div>
        </div>
        <label>ইউজারনেম / Username</label>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="admin"
          required
        />
        <div className="mt8" />
        <label>পাসওয়ার্ড / Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••"
          required
        />
        <button className="btn" style={{ width: '100%', marginTop: 20 }} disabled={loading}>
          {loading ? 'লগইন হচ্ছে...' : 'লগইন করুন'}
        </button>
        {error && <div className="msg err">{error}</div>}
        <p className="muted center" style={{ fontSize: 13, marginTop: 18 }}>
          Demo login: <b>admin</b> / <b>admin123</b>
        </p>
      </form>
    </div>
  );
}
