'use client';

import { useEffect, useState } from 'react';

export default function AdminMergesPage() {
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [offlineCustomers, setOfflineCustomers] = useState([]);
  const [selectedOffline, setSelectedOffline] = useState({}); // { onlineUserId: offlineCustomerId }
  const [loadingId, setLoadingId] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  function loadData() {
    fetch('/api/customer/merges')
      .then((res) => res.json())
      .then((data) => {
        setOnlineUsers(data.onlineUsers || []);
        setOfflineCustomers(data.offlineCustomers || []);
      })
      .catch((err) => console.error(err));
  }

  async function handleMerge(onlineUserId) {
    const offlineCustomerId = selectedOffline[onlineUserId];
    if (!offlineCustomerId) {
      alert('অনুগ্রহ করে একটি অফলাইন প্রোফাইল সিলেক্ট করুন!');
      return;
    }
    setLoadingId(onlineUserId);

    try {
      const res = await fetch('/api/customer/merges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerUserId: onlineUserId, offlineCustomerId }),
      });
      const data = await res.json();
      setLoadingId(null);
      if (!res.ok) {
        alert(data.error || 'মার্জ সম্পন্ন করা যায়নি');
        return;
      }
      alert('✅ মার্জ সফল হয়েছে!');
      loadData();
    } catch {
      setLoadingId(null);
      alert('সার্ভার সমস্যা হয়েছে');
    }
  }

  async function handleCreateAndMerge(onlineUserId) {
    if (!confirm('এই গ্রাহককে আপনার দোকানের খাতায় সম্পূর্ণ নতুন কাস্টমার হিসেবে যুক্ত করতে চান?')) return;
    setLoadingId(onlineUserId);

    try {
      const res = await fetch('/api/customer/merges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerUserId: onlineUserId, action: 'create_and_merge' }),
      });
      const data = await res.json();
      setLoadingId(null);
      if (!res.ok) {
        alert(data.error || 'নতুন কাস্টমার তৈরি করা যায়নি');
        return;
      }
      alert('✅ নতুন কাস্টমার হিসেবে যুক্ত ও মার্জ করা সফল হয়েছে!');
      loadData();
    } catch {
      setLoadingId(null);
      alert('সার্ভার সমস্যা হয়েছে');
    }
  }

  return (
    <div>
      <div className="topbar">
        <div>
          <h2>🔗 কাস্টমার মার্জ প্যানেল (Customer Account Merging)</h2>
          <div className="sub">অনলাইন নিবন্ধিত গ্রাহকদের সাথে আপনার দোকানের খাতার অফলাইন গ্রাহক প্রোফাইল সংযুক্ত করুন</div>
        </div>
      </div>

      <div className="card mt">
        <h3>অনলাইন নিবন্ধিত গ্রাহক তালিকা ({onlineUsers.length} জন)</h3>
        <p className="muted" style={{ fontSize: 13, marginBottom: 16 }}>
          গ্রাহকরা সাইটে রেজিস্টার করলে এখানে দেখতে পাবেন। তাদেরকে দোকানের অফলাইন খাতার সাথে যুক্ত (Merge) করে দিলে তারা তাদের বকেয়া টাকা ও কেনা পণ্যের তালিকা দেখতে পাবে।
        </p>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>অনলাইন নাম ও মোবাইল</th>
                <th>রেজিস্ট্রেশন তারিখ</th>
                <th>স্ট্যাটাস</th>
                <th>অফলাইন খাতার প্রোফাইল লিংক</th>
                <th>অ্যাকশন</th>
              </tr>
            </thead>
            <tbody>
              {onlineUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="empty">কোনো অনলাইন কাস্টমার রেজিস্ট্রেশন পাওয়া যায়নি।</td>
                </tr>
              )}
              {onlineUsers.map((user) => (
                <tr key={user._id}>
                  <td>
                    <b>{user.name}</b>
                    <div className="muted" style={{ fontSize: 12 }}>📞 {user.phone}</div>
                  </td>
                  <td>{new Date(user.createdAt).toLocaleDateString('bn-BD')}</td>
                  <td>
                    <span className={`badge ${user.status === 'merged' ? 'green' : 'amber'}`}>
                      {user.status === 'merged' ? 'সংযুক্ত (Merged)' : 'অপেক্ষমান (Pending)'}
                    </span>
                  </td>
                  <td>
                    {user.status === 'merged' ? (
                      <span className="badge blue" style={{ fontSize: 13.5 }}>
                        🔗 সংযুক্ত কাস্টমার: {user.mergedCustomerName} {user.mergedCustomerPhone ? `(${user.mergedCustomerPhone})` : ''}
                      </span>
                    ) : (
                      <select 
                        style={{ maxWidth: 260, fontSize: 13.5, padding: 8 }}
                        value={selectedOffline[user._id] || ''}
                        onChange={(e) => setSelectedOffline({ ...selectedOffline, [user._id]: e.target.value })}
                      >
                        <option value="">— অফলাইন কাস্টমার সিলেক্ট করুন —</option>
                        {offlineCustomers.map((off) => (
                          <option key={off._id} value={off._id}>
                            👤 {off.name} {off.phone ? `(${off.phone})` : ''}
                          </option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td>
                    {user.status !== 'merged' && (
                      <div className="flex" style={{ gap: 8 }}>
                        <button 
                          className="btn sm"
                          onClick={() => handleMerge(user._id)}
                          disabled={loadingId === user._id}
                          style={{ background: 'var(--green)' }}
                        >
                          🔗 মার্জ করুন
                        </button>
                        <button 
                          className="btn sm gray"
                          onClick={() => handleCreateAndMerge(user._id)}
                          disabled={loadingId === user._id}
                        >
                          ➕ নতুন হিসেবে যোগ করুন
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
