'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function PublicHomePage() {
  const [offers, setOffers] = useState([]);
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch offers
    fetch('/api/offers')
      .then((res) => res.json())
      .then((data) => setOffers(data.offers || []))
      .catch((err) => console.error(err));

    // Fetch customer session
    fetch('/api/customer/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.loggedIn) {
          setCustomer(data.user);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'system-ui, sans-serif' }}>
      {/* Navigation Header */}
      <nav style={{ background: '#0f172a', color: '#fff', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
            🏪 রাফিদ জেনারেল স্টোর
          </h1>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: '#94a3b8' }}>Rafid General Store | আপনার বিশ্বস্ত কেনাকাটার দোকান</p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {loading ? (
            <span style={{ fontSize: 14, color: '#94a3b8' }}>লোড হচ্ছে...</span>
          ) : customer ? (
            <>
              <span style={{ fontSize: 14, color: '#cbd5e1' }}>👤 {customer.name}</span>
              <Link href="/customer/dashboard" style={{ background: '#2563eb', color: '#fff', padding: '8px 16px', borderRadius: 8, fontSize: 14, fontWeight: 600 }}>
                আমার ড্যাশবোর্ড
              </Link>
            </>
          ) : (
            <>
              <Link href="/customer/login" style={{ color: '#cbd5e1', fontSize: 14, fontWeight: 600 }}>
                লগইন
              </Link>
              <Link href="/customer/register" style={{ background: '#2563eb', color: '#fff', padding: '8px 16px', borderRadius: 8, fontSize: 14, fontWeight: 600 }}>
                নিবন্ধন করুন
              </Link>
            </>
          )}
          <Link href="/login" style={{ border: '1px solid #334155', color: '#94a3b8', padding: '6px 12px', borderRadius: 8, fontSize: 13, marginLeft: 8 }}>
            অ্যাডমিন
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <header style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', color: '#fff', padding: '60px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <h2 style={{ fontSize: 36, fontWeight: 800, marginBottom: 16 }}>স্বাগতম রাফিদ জেনারেল স্টোরে!</h2>
          <p style={{ fontSize: 18, color: '#cbd5e1', lineHeight: 1.6, marginBottom: 24 }}>
            আমাদের দোকানে পাচ্ছেন আকর্ষণীয় সব স্পেশাল অফার এবং ডিল। আমাদের পাবলিক পোর্টালে যুক্ত হয়ে আপনার বকেয়া হিসাব এবং খরিদকৃত পণ্যের তালিকা যেকোনো সময় অনলাইনে দেখুন!
          </p>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.1)', padding: '12px 24px', borderRadius: 50 }}>
            <span style={{ fontSize: 18 }}>📞</span>
            <span style={{ fontWeight: 600, fontSize: 16 }}>যোগাযোগ: <a href="tel:01743476235" style={{ color: '#60a5fa' }}>01743476235</a></span>
          </div>
        </div>
      </header>

      {/* Offers Section */}
      <main style={{ maxWidth: 1000, margin: '40px auto', padding: '0 20px' }}>
        <h3 style={{ fontSize: 24, fontWeight: 700, color: '#1e293b', marginBottom: 24, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          🎁 আমাদের বর্তমান স্পেশাল অফারসমূহ
        </h3>

        {offers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: 40 }}>🎉</span>
            <p style={{ marginTop: 12, color: '#64748b' }}>এই মুহূর্তে কোনো সচল অফার নেই। নতুন অফার পেতে চোখ রাখুন!</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
            {offers.map((offer) => (
              <div key={offer._id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
                {offer.imageUrl ? (
                  <img src={offer.imageUrl} alt={offer.title} style={{ width: '100%', height: 180, objectFit: 'cover' }} />
                ) : (
                  <div style={{ height: 180, background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 48 }}>
                    🛍️
                  </div>
                )}
                <div style={{ padding: 20 }}>
                  <h4 style={{ margin: 0, fontSize: 18, color: '#0f172a', fontWeight: 700 }}>{offer.title}</h4>
                  <p style={{ marginTop: 8, color: '#64748b', fontSize: 14, lineHeight: 1.6 }}>{offer.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{ background: '#0f172a', color: '#94a3b8', padding: '30px 20px', textAlign: 'center', borderTop: '1px solid #1e293b', marginTop: 60 }}>
        <p style={{ margin: 0, fontSize: 14 }}>© {new Date().getFullYear()} রাফিদ জেনারেল স্টোর। সর্বস্বত্ব সংরক্ষিত।</p>
        <p style={{ margin: '8px 0 0', fontSize: 12 }}>ঠিকানা: আমাদের দোকান, বাংলাদেশ | হেল্পলাইন: 01743476235</p>
      </footer>
    </div>
  );
}
