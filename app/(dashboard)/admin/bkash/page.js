'use client';

import { useEffect, useState } from 'react';
import { taka, num } from '@/lib/money';
import toast from 'react-hot-toast';

export default function BkashPage() {
  const [txns, setTxns] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [totalBalance, setTotalBalance] = useState(0);

  // Form Mode & Tab
  const [bkashType, setBkashType] = useState('personal'); // personal | agent
  const [selectedAccountId, setSelectedAccountId] = useState('');

  // Personal Transaction States
  // personal types: 'cust_cashout' | 'self_cashout' | 'cust_cashin' | 'income' | 'expense'
  const [personalTxType, setPersonalTxType] = useState('cust_cashout');
  const [personalAmount, setPersonalAmount] = useState('');
  const [ratePerThousand, setRatePerThousand] = useState('13'); // default 13 tk per 1000
  const [customerCharge, setCustomerCharge] = useState('');
  const [personalDesc, setPersonalDesc] = useState('');

  // Agent Transaction States
  // agent types: 'agent_cashin' | 'agent_cashout' | 'b2b_load' | 'b2b_withdraw'
  const [agentTxType, setAgentTxType] = useState('agent_cashin');
  const [agentAmount, setAgentAmount] = useState('');
  const [agentCommRate, setAgentCommRate] = useState('4.14'); // 4.14 tk per 1000
  const [agentCommAmount, setAgentCommAmount] = useState('');
  const [agentDesc, setAgentDesc] = useState('');

  // Account Modal / Form state
  const [showAccModal, setShowAccModal] = useState(false);
  const [newAccName, setNewAccName] = useState('');
  const [newAccNumber, setNewAccNumber] = useState('');
  const [newAccType, setNewAccType] = useState('personal');
  const [newAccBalance, setNewAccBalance] = useState('0');

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  function loadData() {
    fetch('/api/bkash?t=' + Date.now())
      .then((r) => r.json())
      .then((d) => {
        setTxns(d.txns || []);
        setAccounts(d.accounts || []);
        setTotalBalance(d.balance || 0);

        // Auto select first account if available
        if (d.accounts && d.accounts.length > 0) {
          const pers = d.accounts.find((a) => a.accountType === 'personal');
          if (pers && !selectedAccountId) setSelectedAccountId(pers._id);
          else if (!selectedAccountId) setSelectedAccountId(d.accounts[0]._id);
        }
      })
      .catch(() => {});
  }

  // Personal Customer Cash Out calculations
  useEffect(() => {
    const amt = Number(personalAmount) || 0;
    if (personalTxType === 'cust_cashout') {
      const rate = Number(ratePerThousand) || 0;
      const chg = ((amt / 1000) * rate).toFixed(2);
      setCustomerCharge(chg);
      if (!personalDesc || personalDesc.startsWith('কাস্টমার ক্যাশআউট')) {
        setPersonalDesc(`কাস্টমার ক্যাশআউট (হাজার: ৳${rate})`);
      }
    } else if (personalTxType === 'self_cashout') {
      setCustomerCharge('0');
      setPersonalDesc('পার্সোনাল সিম ব্যালেন্স ক্যাশআউট / উইথড্র');
    } else if (personalTxType === 'cust_cashin') {
      setCustomerCharge('0');
      setPersonalDesc('কাস্টমার সেন্ড মানি / ক্যাশ ইন');
    }
  }, [personalAmount, ratePerThousand, personalTxType]);

  // Agent Commission calculations
  useEffect(() => {
    const amt = Number(agentAmount) || 0;
    const rate = Number(agentCommRate) || 0;
    const comm = ((amt / 1000) * rate).toFixed(2);
    setAgentCommAmount(comm);
    if (agentTxType === 'agent_cashin') {
      setAgentDesc('এজেন্ট ক্যাশ-ইন (কমিশন অর্জিত)');
    } else if (agentTxType === 'agent_cashout') {
      setAgentDesc('এজেন্ট ক্যাশ-আউট (কমিশন অর্জিত)');
    }
  }, [agentAmount, agentCommRate, agentTxType]);

  async function handleAddAccount(e) {
    e.preventDefault();
    if (!newAccNumber.trim()) {
      toast.error('মোবাইল নম্বর লিখুন');
      return;
    }
    setLoading(true);
    const res = await fetch('/api/bkash/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newAccName.trim(),
        number: newAccNumber.trim(),
        accountType: newAccType,
        balance: Number(newAccBalance) || 0,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      toast.error('অ্যাকাউন্ট যোগ করতে সমস্যা হয়েছে');
      return;
    }
    toast.success('✅ বিকাশ নম্বর সফলভাবে যোগ হয়েছে');
    setShowAccModal(false);
    setNewAccName('');
    setNewAccNumber('');
    setNewAccBalance('0');
    loadData();
  }

  async function submitPersonalTx(e) {
    e.preventDefault();
    if (!personalAmount || Number(personalAmount) <= 0) {
      toast.error('সঠিক পরিমাণ লিখুন');
      return;
    }

    const selectedAcc = accounts.find((a) => a._id === selectedAccountId);

    setLoading(true);
    const amt = Number(personalAmount);
    const chg = Number(customerCharge) || 0;
    const rate = Number(ratePerThousand) || 0;
    const profit = personalTxType === 'cust_cashout' ? chg : 0;

    const res = await fetch('/api/bkash', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bkashType: 'personal',
        accountId: selectedAccountId,
        accountNumber: selectedAcc ? selectedAcc.number : '',
        type: personalTxType,
        description: personalDesc || 'পার্সোনাল লেনদেন',
        amount: amt,
        ratePerThousand: rate,
        customerCharge: chg,
        profit: profit,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      toast.error('লেনদেন সংরক্ষণ করতে সমস্যা হয়েছে');
      return;
    }
    toast.success('✅ পার্সোনাল লেনদেন সফল হয়েছে!');
    setPersonalAmount('');
    setPersonalDesc('');
    loadData();
  }

  async function submitAgentTx(e) {
    e.preventDefault();
    if (!agentAmount || Number(agentAmount) <= 0) {
      toast.error('সঠিক পরিমাণ লিখুন');
      return;
    }

    const selectedAcc = accounts.find((a) => a._id === selectedAccountId);

    setLoading(true);
    const amt = Number(agentAmount);
    const profit = Number(agentCommAmount) || 0;

    const res = await fetch('/api/bkash', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bkashType: 'agent',
        accountId: selectedAccountId,
        accountNumber: selectedAcc ? selectedAcc.number : '',
        type: agentTxType,
        description: agentDesc || 'এজেন্ট লেনদেন',
        amount: amt,
        customerCharge: 0,
        profit: profit,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      toast.error('এজেন্ট লেনদেন সংরক্ষণ করতে সমস্যা হয়েছে');
      return;
    }
    toast.success('✅ এজেন্ট লেনদেন সফল হয়েছে!');
    setAgentAmount('');
    setAgentDesc('');
    loadData();
  }

  async function handleDeleteTx(id) {
    if (!confirm('লেনদেনটি মুছে ফেলবেন? এটি সম্পর্কিত ব্যালেন্সও রিসেট হবে।')) return;
    await fetch(`/api/bkash?id=${id}`, { method: 'DELETE' });
    toast.success('লেনদেন মুছে ফেলা হয়েছে');
    loadData();
  }

  async function handleDeleteAccount(id) {
    if (!confirm('এই অ্যাকাউন্টটি মুছে ফেলবেন?')) return;
    await fetch(`/api/bkash/accounts?id=${id}`, { method: 'DELETE' });
    toast.success('অ্যাকাউন্ট মুছে ফেলা হয়েছে');
    loadData();
  }

  const personalAccounts = accounts.filter((a) => a.accountType === 'personal');
  const agentAccounts = accounts.filter((a) => a.accountType === 'agent');
  const totalBkashProfit = txns.reduce((a, t) => a + (t.profit || 0), 0);

  return (
    <div>
      {/* Top Header */}
      <div className="topbar">
        <div>
          <h2>📱 bKash ডিজিটাল হিসাব ও লেজার</h2>
          <div className="sub">
            মোট ব্যালেন্স: <b className="blue">{taka(totalBalance)}</b> • মোট অর্জিত লাভ: <b className="green">{taka(totalBkashProfit)}</b>
          </div>
        </div>
        <button className="btn pink" onClick={() => setShowAccModal(true)}>
          ➕ নতুন bKash নম্বর যোগ করুন
        </button>
      </div>

      {/* Account Cards Section */}
      <div className="card mb" style={{ background: 'var(--bg)', border: '1px dashed var(--border)', padding: '14px 18px' }}>
        <div className="flex between align-center mb8">
          <h4 style={{ margin: 0, fontSize: 15, fontWeight: 'bold' }}>💳 নিবন্ধিত bKash মোবাইল নম্বর ও ব্যালেন্স</h4>
          <span className="muted" style={{ fontSize: 12 }}>পার্সোনাল সিম: {personalAccounts.length} টি • এজেন্ট নম্বর: {agentAccounts.length} টি</span>
        </div>

        <div className="grid cols-3" style={{ gap: 12 }}>
          {accounts.map((acc) => (
            <div
              key={acc._id}
              style={{
                background: '#ffffff',
                borderRadius: 10,
                padding: '12px 14px',
                border: selectedAccountId === acc._id ? '2px solid #ec4899' : '1px solid var(--border)',
                boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
                cursor: 'pointer',
              }}
              onClick={() => {
                setSelectedAccountId(acc._id);
                setBkashType(acc.accountType);
              }}
            >
              <div className="flex between align-center">
                <span className={`badge ${acc.accountType === 'agent' ? 'blue' : 'pink'}`} style={{ fontSize: 10 }}>
                  {acc.accountType === 'agent' ? 'এজেন্ট' : 'পার্সোনাল'}
                </span>
                <button
                  className="btn sm text red"
                  style={{ padding: '0 4px', fontSize: 11 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteAccount(acc._id);
                  }}
                >
                  ✕
                </button>
              </div>
              <div style={{ fontWeight: 'bold', fontSize: 16, marginTop: 6, color: 'var(--text)' }}>
                {acc.number} {acc.name ? `(${acc.name})` : ''}
              </div>
              <div className="flex between align-center mt8" style={{ borderTop: '1px solid #f1f5f9', paddingTop: 6 }}>
                <span className="muted" style={{ fontSize: 12 }}>ব্যালেন্স:</span>
                <b className={acc.balance < 0 ? 'red' : 'green'} style={{ fontSize: 16 }}>
                  {taka(acc.balance)}
                </b>
              </div>
            </div>
          ))}

          {accounts.length === 0 && (
            <div className="empty" style={{ gridColumn: '1 / -1', padding: '16px' }}>
              কোনো বিকাশ নম্বর যুক্ত নেই। "নতুন bKash নম্বর যোগ করুন" বাটনে ক্লিক করে নম্বর যোগ করুন।
            </div>
          )}
        </div>
      </div>

      {/* Main Form & Ledger Grid */}
      <div className="grid cols-2">
        {/* Left: Transaction Form */}
        <div className="card">
          {/* Mode selector */}
          <div className="flex gap mb8" style={{ borderBottom: '2px solid var(--border)', pb: 8 }}>
            <button
              type="button"
              className={`btn ${bkashType === 'personal' ? 'pink' : 'gray'}`}
              style={{ flex: 1 }}
              onClick={() => {
                setBkashType('personal');
                const p = personalAccounts[0];
                if (p) setSelectedAccountId(p._id);
              }}
            >
              👤 পার্সোনাল লেনদেন (Personal)
            </button>
            <button
              type="button"
              className={`btn ${bkashType === 'agent' ? 'pink' : 'gray'}`}
              style={{ flex: 1 }}
              onClick={() => {
                setBkashType('agent');
                const a = agentAccounts[0];
                if (a) setSelectedAccountId(a._id);
              }}
            >
              🏪 এজেন্ট লেনদেন (Agent)
            </button>
          </div>

          {/* Account Selector */}
          <div className="form-grid mt8">
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontWeight: 'bold' }}>মোবাইল নম্বর / অ্যাকাউন্ট বাছাই করুন</label>
              <select value={selectedAccountId} onChange={(e) => setSelectedAccountId(e.target.value)}>
                <option value="">-- নম্বর সিলেক্ট করুন --</option>
                {(bkashType === 'personal' ? personalAccounts : agentAccounts).map((acc) => (
                  <option key={acc._id} value={acc._id}>
                    {acc.number} {acc.name ? `(${acc.name})` : ''} - ব্যালেন্স: {taka(acc.balance)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Personal Transaction Form */}
          {bkashType === 'personal' && (
            <form className="form-grid mt8" onSubmit={submitPersonalTx}>
              <div>
                <label>লেনদেনের ধরণ</label>
                <select value={personalTxType} onChange={(e) => setPersonalTxType(e.target.value)}>
                  <option value="cust_cashout">📥 কাস্টমার ক্যাশআউট (ক্যাশ সার্ভিস)</option>
                  <option value="self_cashout">💸 সিম ব্যালেন্স ক্যাশআউট / উইথড্র</option>
                  <option value="cust_cashin">📤 কাস্টমার সেন্ড মানি / ক্যাশ ইন</option>
                  <option value="income">💰 ক্যাশ লোড / আয়</option>
                  <option value="expense">🔻 খরচ / ব্যয়</option>
                </select>
              </div>

              <div>
                <label>টাকার পরিমাণ (৳)</label>
                <input
                  type="number"
                  placeholder="যেমন: ২০০০০"
                  value={personalAmount}
                  onChange={(e) => setPersonalAmount(e.target.value)}
                  required
                />
              </div>

              {personalTxType === 'cust_cashout' && (
                <>
                  <div>
                    <label>হাজার প্রতি কাস্টমার খরচ (৳)</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="যেমন: ১৩"
                      value={ratePerThousand}
                      onChange={(e) => setRatePerThousand(e.target.value)}
                    />
                  </div>

                  <div>
                    <label>মোট কাস্টমার চার্জ / লাভ (৳)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={customerCharge}
                      onChange={(e) => setCustomerCharge(e.target.value)}
                    />
                  </div>

                  <div style={{ gridColumn: '1 / -1', background: '#f0fdf4', padding: '10px 14px', borderRadius: 8, border: '1px solid #bbf7d0' }}>
                    <div className="flex between align-center">
                      <span style={{ fontSize: 13, color: '#166534' }}>💡 কাস্টমার থেকে মোট নগদে নিবেন:</span>
                      <b style={{ fontSize: 18, color: '#15803d' }}>
                        {taka((Number(personalAmount) || 0) + (Number(customerCharge) || 0))}
                      </b>
                    </div>
                    <div style={{ fontSize: 11, color: '#166534', marginTop: 4 }}>
                      • সিমে বিকাশ ডিজিটাল জমা হবে: <b>+{taka(Number(personalAmount) || 0)}</b>
                      <br />• আপনার নিট লাভ: <b>+{taka(Number(customerCharge) || 0)}</b>
                    </div>
                  </div>
                </>
              )}

              {personalTxType === 'self_cashout' && (
                <div style={{ gridColumn: '1 / -1', background: '#eff6ff', padding: '10px 14px', borderRadius: 8, border: '1px solid #bfdbfe' }}>
                  <div style={{ fontSize: 13, color: '#1e40af' }}>
                    ℹ️ পার্সোনাল নম্বর থেকে ব্যালেন্স ক্যাশ করা হলে সংশ্লিষ্ট মোবাইল নম্বরের ব্যালেন্স <b>-{taka(Number(personalAmount) || 0)}</b> কমে যাবে।
                  </div>
                </div>
              )}

              <div style={{ gridColumn: '1 / -1' }}>
                <label>বিবরণ (নোট)</label>
                <input value={personalDesc} onChange={(e) => setPersonalDesc(e.target.value)} placeholder="বিবরণ লিখুন" />
              </div>

              <button className="btn pink" style={{ gridColumn: '1 / -1', marginTop: 6 }} disabled={loading}>
                {loading ? 'সংরক্ষণ হচ্ছে...' : '✅ পার্সোনাল লেনদেন নিশ্চিত করুন'}
              </button>
            </form>
          )}

          {/* Agent Transaction Form */}
          {bkashType === 'agent' && (
            <form className="form-grid mt8" onSubmit={submitAgentTx}>
              <div>
                <label>এজেন্ট লেনদেনের ধরণ</label>
                <select value={agentTxType} onChange={(e) => setAgentTxType(e.target.value)}>
                  <option value="agent_cashin">📤 এজেন্ট ক্যাশ-ইন (Customer Cash In)</option>
                  <option value="agent_cashout">📥 এজেন্ট ক্যাশ-আউট (Customer Cash Out)</option>
                </select>
              </div>

              <div>
                <label>টাকার পরিমাণ (৳)</label>
                <input
                  type="number"
                  placeholder="যেমন: ৫০০০"
                  value={agentAmount}
                  onChange={(e) => setAgentAmount(e.target.value)}
                  required
                />
              </div>

              <div>
                <label>হাজারে এজেন্ট কমিশন (৳)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="৪.১৪"
                  value={agentCommRate}
                  onChange={(e) => setAgentCommRate(e.target.value)}
                />
              </div>

              <div>
                <label>হিসাবকৃত অর্জিত কমিশন (৳)</label>
                <input
                  type="number"
                  step="0.01"
                  value={agentCommAmount}
                  onChange={(e) => setAgentCommAmount(e.target.value)}
                />
              </div>

              <div style={{ gridColumn: '1 / -1', background: '#fdf4ff', padding: '10px 14px', borderRadius: 8, border: '1px solid #f5d0fe' }}>
                <div style={{ fontSize: 13, color: '#86198f' }}>
                  {agentTxType === 'agent_cashin' ? (
                    <>• কাস্টমার থেকে পাবেন ক্যাশ, এজেন্টের ডিজিটাল ওয়ালেট থেকে কমবে: <b>-{taka(Number(agentAmount) || 0)}</b></>
                  ) : (
                    <>• কাস্টমারকে দিবেন ক্যাশ, এজেন্টের ডিজিটাল ওয়ালেটে বাড়বে: <b>+{taka(Number(agentAmount) || 0)}</b></>
                  )}
                  <br />• বিকাশ থেকে আপনার অর্জিত কমিশন/লাভ: <b className="green">+{taka(Number(agentCommAmount) || 0)}</b>
                </div>
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label>বিবরণ</label>
                <input value={agentDesc} onChange={(e) => setAgentDesc(e.target.value)} placeholder="বিবরণ লিখুন" />
              </div>

              <button className="btn pink" style={{ gridColumn: '1 / -1', marginTop: 6 }} disabled={loading}>
                {loading ? 'সংরক্ষণ হচ্ছে...' : '✅ এজেন্ট লেনদেন নিশ্চিত করুন'}
              </button>
            </form>
          )}
        </div>

        {/* Right: History & Ledger Table */}
        <div className="card">
          <div className="flex between align-center mb8">
            <h3>📋 সাম্প্রতিক bKash লেনদেন ও লেজার</h3>
          </div>

          <div className="table-wrap mt8" style={{ maxHeight: 480, overflowY: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>তারিখ ও নম্বর</th>
                  <th>টাইপ ও বিবরণ</th>
                  <th>টাকা</th>
                  <th>লাভ</th>
                  <th>অবশিষ্ট ব্যালেন্স</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {txns.map((t) => {
                  const isPlus = ['cust_cashout', 'agent_cashout', 'income', 'sale', 'b2b_receive', 'cashout'].includes(t.type);
                  return (
                    <tr key={t._id}>
                      <td>
                        <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                          {new Date(t.date).toLocaleDateString('bn-BD')} {new Date(t.date).toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <b>{t.accountNumber || 'মূল অ্যাকাউন্ট'}</b>
                      </td>
                      <td>
                        <span className={`badge ${t.bkashType === 'agent' ? 'blue' : 'pink'}`} style={{ fontSize: 10 }}>
                          {t.bkashType === 'agent' ? 'Agent' : 'Personal'}
                        </span>
                        <div style={{ fontSize: 12, fontWeight: 'bold', marginTop: 2 }}>{t.description}</div>
                      </td>
                      <td>
                        <b style={{ color: isPlus ? 'green' : 'red' }}>
                          {isPlus ? '+' : '−'}{taka(t.amount)}
                        </b>
                      </td>
                      <td className="green">
                        <b>{t.profit ? taka(t.profit) : '—'}</b>
                      </td>
                      <td>
                        <span className="muted">{t.balanceAfter !== undefined ? taka(t.balanceAfter) : '—'}</span>
                      </td>
                      <td>
                        <button className="btn sm red" onClick={() => handleDeleteTx(t._id)}>🗑</button>
                      </td>
                    </tr>
                  );
                })}
                {txns.length === 0 && (
                  <tr>
                    <td colSpan={6} className="empty">
                      কোনো লেনদেনের রেকর্ড পাওয়া যায়নি
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add New Account Modal */}
      {showAccModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
          }}
        >
          <div className="card" style={{ width: '420px', maxWidth: '90%', background: '#fff' }}>
            <h3>➕ নতুন bKash নম্বর যুক্ত করুন</h3>
            <form className="form-grid mt8" onSubmit={handleAddAccount}>
              <div>
                <label>অ্যাকাউন্ট টাইপ</label>
                <select value={newAccType} onChange={(e) => setNewAccType(e.target.value)}>
                  <option value="personal">পার্সোনাল (Personal SIM)</option>
                  <option value="agent">এজেন্ট (Agent Wallet)</option>
                </select>
              </div>

              <div>
                <label>মোবাইল নম্বর *</label>
                <input
                  placeholder="01XXXXXXXXX"
                  value={newAccNumber}
                  onChange={(e) => setNewAccNumber(e.target.value)}
                  required
                />
              </div>

              <div>
                <label>লেবেল / নাম (ঐচ্ছিক)</label>
                <input
                  placeholder="যেমন: সিম ১, মেইন শপ"
                  value={newAccName}
                  onChange={(e) => setNewAccName(e.target.value)}
                />
              </div>

              <div>
                <label>বর্তমান প্রাথমিক ব্যালেন্স (৳)</label>
                <input
                  type="number"
                  value={newAccBalance}
                  onChange={(e) => setNewAccBalance(e.target.value)}
                />
              </div>

              <div className="flex gap mt" style={{ gridColumn: '1 / -1' }}>
                <button type="submit" className="btn green" style={{ flex: 1 }} disabled={loading}>
                  সংরক্ষণ করুন
                </button>
                <button type="button" className="btn gray" onClick={() => setShowAccModal(false)}>
                  বাতিল
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
