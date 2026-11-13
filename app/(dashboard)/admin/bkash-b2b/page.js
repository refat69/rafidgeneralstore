'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { taka } from '@/lib/money';
import toast from 'react-hot-toast';

export default function BkashB2BPage() {
  const [data, setData] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  // Selected partner filter: '' means all, or partnerId
  const [selectedPartnerId, setSelectedPartnerId] = useState('');

  // Search & Type filters for the ledger
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all'); // 'all' | 'sent' | 'received'

  // Modals: null | 'send' | 'receive' | 'partner' | 'memo'
  const [activeModal, setActiveModal] = useState(null);

  // --- Form: Send bKash (আমি বিকাশ পাঠালাম) ---
  const [sendPartnerId, setSendPartnerId] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [sendTargetNumber, setSendTargetNumber] = useState('');
  const [sendOurAccountId, setSendOurAccountId] = useState('');
  const [sendTrxId, setSendTrxId] = useState('');
  const [sendDate, setSendDate] = useState('');
  const [sendNote, setSendNote] = useState('');

  // --- Form: Receive Bank Payment (পার্টনার ব্যাংকে পাঠালো) ---
  const [receivePartnerId, setReceivePartnerId] = useState('');
  const [receiveAmount, setReceiveAmount] = useState('');
  const [receiveBankName, setReceiveBankName] = useState('Islami Bank');
  const [receiveBankAccount, setReceiveBankAccount] = useState('');
  const [receivePaymentMethod, setReceivePaymentMethod] = useState('bank');
  const [receiveTrxId, setReceiveTrxId] = useState('');
  const [receiveDate, setReceiveDate] = useState('');
  const [receiveNote, setReceiveNote] = useState('');

  // --- Form: Add / Edit Partner ---
  const [editPartnerId, setEditPartnerId] = useState(null);
  const [partnerName, setPartnerName] = useState('');
  const [partnerPhone, setPartnerPhone] = useState('');
  const [partnerBkashNumbers, setPartnerBkashNumbers] = useState('');
  const [partnerBankDetails, setPartnerBankDetails] = useState('');
  const [partnerNotes, setPartnerNotes] = useState('');

  // --- Memo / Statement Filters ---
  const [memoPeriod, setMemoPeriod] = useState('all'); // 'all' | 'today' | '7days' | 'month' | 'custom'
  const [memoStartDate, setMemoStartDate] = useState('');
  const [memoEndDate, setMemoEndDate] = useState('');

  useEffect(() => {
    loadData();
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => d.user && setUser(d.user))
      .catch(() => { });
  }, []);

  function loadData() {
    fetch('/api/bkash-b2b?t=' + Date.now())
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        // Auto select first partner if not set and available
        if (d.partners && d.partners.length > 0 && !selectedPartnerId) {
          setSelectedPartnerId(d.partners[0]._id);
          setSendPartnerId(d.partners[0]._id);
          setReceivePartnerId(d.partners[0]._id);
          if (d.partners[0].bkashNumbers && d.partners[0].bkashNumbers[0]) {
            setSendTargetNumber(d.partners[0].bkashNumbers[0]);
          }
        }
      })
      .catch(() => { });
  }

  // Quick Open Modal Helpers
  function openSendModal(pId) {
    const targetId = pId || selectedPartnerId || (data?.partners[0]?._id || '');
    setSendPartnerId(targetId);
    const p = data?.partners?.find((x) => x._id === targetId);
    if (p && p.bkashNumbers && p.bkashNumbers.length > 0) {
      setSendTargetNumber(p.bkashNumbers[0]);
    } else {
      setSendTargetNumber('');
    }
    setSendAmount('');
    setSendOurAccountId(data?.accounts && data.accounts.length > 0 ? data.accounts[0]._id : '');
    setSendTrxId('');
    setSendNote('');
    setSendDate(new Date().toISOString().slice(0, 16));
    setActiveModal('send');
  }

  function openReceiveModal(pId) {
    const targetId = pId || selectedPartnerId || (data?.partners[0]?._id || '');
    setReceivePartnerId(targetId);
    const p = data?.partners?.find((x) => x._id === targetId);
    if (p && p.bankDetails) {
      setReceiveBankName(p.bankDetails.split(',')[0] || 'Islami Bank');
    }
    setReceiveAmount('');
    setReceiveBankAccount('');
    setReceivePaymentMethod('bank');
    setReceiveTrxId('');
    setReceiveNote('');
    setReceiveDate(new Date().toISOString().slice(0, 16));
    setActiveModal('receive');
  }

  function openNewPartnerModal() {
    setEditPartnerId(null);
    setPartnerName('');
    setPartnerPhone('');
    setPartnerBkashNumbers('');
    setPartnerBankDetails('');
    setPartnerNotes('');
    setActiveModal('partner');
  }

  function openEditPartnerModal(p) {
    setEditPartnerId(p._id);
    setPartnerName(p.name || '');
    setPartnerPhone(p.phone || '');
    setPartnerBkashNumbers((p.bkashNumbers || []).join(', '));
    setPartnerBankDetails(p.bankDetails || '');
    setPartnerNotes(p.notes || '');
    setActiveModal('partner');
  }

  // --- Handlers: Submit Partner ---
  async function handleSavePartner(e) {
    e.preventDefault();
    if (!partnerName.trim()) {
      toast.error('পার্টনারের নাম লিখুন');
      return;
    }

    setLoading(true);
    const res = await fetch('/api/bkash-b2b', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: editPartnerId ? 'update_partner' : 'create_partner',
        id: editPartnerId,
        name: partnerName.trim(),
        phone: partnerPhone.trim(),
        bkashNumbers: partnerBkashNumbers,
        bankDetails: partnerBankDetails.trim(),
        notes: partnerNotes.trim(),
      }),
    });
    setLoading(false);

    if (!res.ok) {
      toast.error('পার্টনার সংরক্ষণ করতে সমস্যা হয়েছে');
      return;
    }

    toast.success(editPartnerId ? '✅ পার্টনারের তথ্য আপডেট হয়েছে' : '✅ নতুন পার্টনার সফলভাবে যুক্ত হয়েছে');
    setActiveModal(null);
    loadData();
  }

  // --- Handlers: Submit Send bKash ---
  async function handleSendBkash(e) {
    e.preventDefault();
    const amt = Number(sendAmount);
    if (!amt || amt <= 0) {
      toast.error('সঠিক টাকার পরিমাণ লিখুন');
      return;
    }
    if (!sendPartnerId) {
      toast.error('পার্টনার নির্বাচন করুন');
      return;
    }
    if (!sendTargetNumber.trim()) {
      toast.error('যে বিকাশ নম্বরে টাকা পাঠিয়েছেন তা লিখুন');
      return;
    }

    setLoading(true);
    const res = await fetch('/api/bkash-b2b', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'add_transaction',
        partnerId: sendPartnerId,
        type: 'sent',
        amount: amt,
        targetBkashNumber: sendTargetNumber.trim(),
        ourAccountId: sendOurAccountId,
        trxId: sendTrxId.trim(),
        note: sendNote.trim(),
        date: sendDate ? new Date(sendDate) : new Date(),
      }),
    });
    setLoading(false);

    if (!res.ok) {
      toast.error('বিকাশ পাঠানোর তথ্য সংরক্ষণে সমস্যা হয়েছে');
      return;
    }

    toast.success('✅ বিকাশ পাঠানো সফলভাবে সংরক্ষিত হয়েছে! (পাওনা বৃদ্ধি পেয়েছে)');
    setActiveModal(null);
    setSendAmount('');
    loadData();
  }

  // --- Handlers: Submit Receive Bank Payment ---
  async function handleReceiveBank(e) {
    e.preventDefault();
    const amt = Number(receiveAmount);
    if (!amt || amt <= 0) {
      toast.error('সঠিক টাকার পরিমাণ লিখুন');
      return;
    }
    if (!receivePartnerId) {
      toast.error('পার্টনার নির্বাচন করুন');
      return;
    }

    setLoading(true);
    const res = await fetch('/api/bkash-b2b', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'add_transaction',
        partnerId: receivePartnerId,
        type: 'received',
        amount: amt,
        bankName: receiveBankName.trim(),
        bankAccount: receiveBankAccount.trim(),
        paymentMethod: receivePaymentMethod,
        trxId: receiveTrxId.trim(),
        note: receiveNote.trim(),
        date: receiveDate ? new Date(receiveDate) : new Date(),
      }),
    });
    setLoading(false);

    if (!res.ok) {
      toast.error('ব্যাংক পেমেন্ট সংরক্ষণে সমস্যা হয়েছে');
      return;
    }

    toast.success('✅ ব্যাংকে পেমেন্ট প্রাপ্তি সফলভাবে সংরক্ষিত হয়েছে! (পাওনা হ্রাস পেয়েছে)');
    setActiveModal(null);
    setReceiveAmount('');
    loadData();
  }

  // --- Handlers: Delete Transaction ---
  async function handleDeleteTx(id) {
    if (!confirm('এই লেনদেনটি মুছে ফেলতে চান? সংশ্লিষ্ট পাওনা ও ব্যালেন্স পূর্বাবস্থায় ফিরে যাবে।')) return;
    await fetch(`/api/bkash-b2b?id=${id}`, { method: 'DELETE' });
    toast.success('লেনদেন মুছে ফেলা হয়েছে');
    loadData();
  }

  // --- Handlers: Delete Partner ---
  async function handleDeletePartner(id) {
    if (!confirm('সতর্কতা: এই পার্টনারকে মুছলে তার সম্পর্কিত সকল লেনদেনও মুছে যাবে! নিশ্চিত তো?')) return;
    await fetch(`/api/bkash-b2b?partnerId=${id}`, { method: 'DELETE' });
    toast.success('পার্টনার ও তার সকল লেনদেন মুছে ফেলা হয়েছে');
    setSelectedPartnerId('');
    loadData();
  }

  if (!data) return <div className="empty mt">বিকাশ পার্টনার হিসাব লোড হচ্ছে...</div>;

  const { partners = [], transactions = [], accounts = [], summary } = data;

  // Selected partner object
  const currentPartner = partners.find((p) => p._id === selectedPartnerId);

  // Filtered transactions for the main table
  const ledgerTxns = transactions.filter((t) => {
    // Partner filter
    if (selectedPartnerId && t.partnerId !== selectedPartnerId) return false;
    // Type filter
    if (typeFilter !== 'all' && t.type !== typeFilter) return false;
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNum = (t.targetBkashNumber || '').toLowerCase().includes(q);
      const matchBank = (t.bankName || '').toLowerCase().includes(q);
      const matchTrx = (t.trxId || '').toLowerCase().includes(q);
      const matchNote = (t.note || '').toLowerCase().includes(q);
      const matchPartner = (t.partnerName || '').toLowerCase().includes(q);
      if (!matchNum && !matchBank && !matchTrx && !matchNote && !matchPartner) return false;
    }
    return true;
  });

  // Partner specific or global active stats
  const activeStats = currentPartner
    ? {
      name: currentPartner.name,
      phone: currentPartner.phone,
      totalSent: currentPartner.totalSent || 0,
      totalReceived: currentPartner.totalReceived || 0,
      currentDue: currentPartner.currentDue || 0,
      count: currentPartner.txCount || 0,
    }
    : {
      name: 'সকল পার্টনার (All Partners)',
      phone: `${partners.length} জন পার্টনার`,
      totalSent: summary.totalSent || 0,
      totalReceived: summary.totalReceived || 0,
      currentDue: summary.totalDue || 0,
      count: summary.txCount || 0,
    };

  // --- Memo Calculations ---
  const memoTxns = (selectedPartnerId
    ? transactions.filter((t) => t.partnerId === selectedPartnerId)
    : transactions
  ).filter((t) => {
    if (memoPeriod === 'today') {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      return new Date(t.date) >= todayStart;
    }
    if (memoPeriod === '7days') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      return new Date(t.date) >= d;
    }
    if (memoPeriod === 'month') {
      const m = new Date();
      m.setDate(1);
      m.setHours(0, 0, 0, 0);
      return new Date(t.date) >= m;
    }
    if (memoPeriod === 'custom') {
      if (memoStartDate && new Date(t.date) < new Date(memoStartDate)) return false;
      if (memoEndDate) {
        const end = new Date(memoEndDate);
        end.setHours(23, 59, 59, 999);
        if (new Date(t.date) > end) return false;
      }
    }
    return true;
  });

  const memoTotalSent = memoTxns.filter((t) => t.type === 'sent').reduce((a, t) => a + (t.amount || 0), 0);
  const memoTotalReceived = memoTxns.filter((t) => t.type === 'received').reduce((a, t) => a + (t.amount || 0), 0);
  const memoNetDue = memoTotalSent - memoTotalReceived;

  // WhatsApp formatted text generator
  function generateWhatsAppText() {
    const shop = user?.shopName || 'আমার দোকান';
    const pName = currentPartner ? currentPartner.name : 'পার্টনার';
    const dateStr = new Date().toLocaleDateString('bn-BD');

    let text = `*🏪 ${shop} - বিকাশ B2B হিসাব মেমো*\n`;
    text += `📅 তারিখ: ${dateStr}\n`;
    text += `👤 গ্রাহক / পার্টনার: ${pName}\n`;
    text += `----------------------------------\n`;
    text += `📤 মোট বিকাশ পাঠানো: ${taka(memoTotalSent)}\n`;
    text += `📥 মোট ব্যাংকে জমা: ${taka(memoTotalReceived)}\n`;
    text += `----------------------------------\n`;
    text += `💰 *বর্তমান অবশিষ্ট পাওনা:* ${taka(memoNetDue)}\n\n`;
    text += `📋 *লেনদেন বিবরণী (${memoTxns.length} টি):*\n`;

    memoTxns.slice(0, 15).forEach((t, i) => {
      const d = new Date(t.date).toLocaleDateString('bn-BD');
      if (t.type === 'sent') {
        text += `${i + 1}. [${d}] বিকাশ পাঠানো: ${taka(t.amount)} (${t.targetBkashNumber || 'বিকাশ'})\n`;
      } else {
        text += `${i + 1}. [${d}] ব্যাংক জমা: ${taka(t.amount)} (${t.bankName || 'ব্যাংক'})\n`;
      }
    });

    if (memoTxns.length > 15) {
      text += `... আরও ${memoTxns.length - 15} টি লেনদেন রয়েছে।\n`;
    }

    text += `\nঅনুগ্রহ করে হিসাবটি মিলিয়ে নিবেন। ধন্যবাদ!`;
    return text;
  }

  function handleCopyMemoText() {
    const txt = generateWhatsAppText();
    navigator.clipboard.writeText(txt);
    toast.success('📋 মেমো টেক্সট ক্লিপবোর্ডে কপি হয়েছে!');
  }

  function handleShareWhatsApp() {
    const txt = generateWhatsAppText();
    const phone = currentPartner?.phone ? currentPartner.phone.replace(/[^0-9]/g, '') : '';
    const url = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(txt)}`
      : `https://wa.me/?text=${encodeURIComponent(txt)}`;
    window.open(url, '_blank');
  }

  return (
    <div>
      {/* Top Bar */}
      <div className="topbar no-print">
        <div>
          <h2>🤝 বিকাশ পার্টনার ও ব্যাংক হিসাব (bKash B2B)</h2>
          <div className="sub">
            পার্টনারকে বিকাশ প্রেরণ, ব্যাংকে পেমেন্ট গ্রহণ, বকেয়া পাওনা ও মেমো স্টেটমেন্ট তৈরি
          </div>
        </div>
        <div className="flex" style={{ gap: 8, flexWrap: 'wrap' }}>
          <button className="btn green" onClick={() => openReceiveModal(selectedPartnerId)}>
            📥 ব্যাংকে পেমেন্ট পেলাম
          </button>
          <button className="btn pink" style={{ background: '#be185d' }} onClick={() => openSendModal(selectedPartnerId)}>
            📤 বিকাশ পাঠালাম
          </button>
          <button className="btn blue" onClick={() => setActiveModal('memo')}>
            🧾 হিসাব মেমো / স্টেটমেন্ট
          </button>
          <button className="btn gray" onClick={openNewPartnerModal}>
            ➕ নতুন পার্টনার
          </button>
        </div>
      </div>

      {/* Rules / Explanation Guide Card */}
      <div
        className="card mb no-print"
        style={{
          background: 'linear-gradient(135deg, #f0fdf4 0%, #e0f2fe 100%)',
          border: '1px solid #bae6fd',
          padding: '12px 18px',
          marginBottom: 16,
        }}
      >
        <div className="flex between align-center" style={{ flexWrap: 'wrap', gap: 8 }}>
          <div style={{ fontSize: 13, color: '#0369a1', lineHeight: 1.6 }}>
            💡 <b>হিসাব নিয়ম:</b> আপনি পার্টনারকে বিকাশ পাঠালে তার কাছে আপনার <b>পাওনা বাড়বে (+)</b> এবং আপনার সিম থেকে ব্যালেন্স কমবে। পার্টনার ব্যাংকে টাকা পাঠালে তার <b>পাওনা কমবে (−)</b>। যেকোনো সময় <b>"হিসাব মেমো"</b> থেকে পূর্ণাঙ্গ স্টেটমেন্ট প্রিন্ট বা হোয়াটসঅ্যাপে মেমো পাঠাতে পারবেন।
          </div>
          <Link href="/admin/bkash" className="btn sm pink" style={{ textDecoration: 'none' }}>
            📱 মূল বিকাশ পেইজ →
          </Link>
        </div>
      </div>

      {/* Partner Selector Pills */}
      <div className="card mb no-print" style={{ padding: '12px 16px', marginBottom: 16 }}>
        <div className="flex between align-center mb8">
          <span style={{ fontSize: 13, fontWeight: 'bold', color: 'var(--muted)' }}>
            👥 পার্টনার বাছাই করুন:
          </span>
          <button className="btn sm text blue" style={{ padding: 0 }} onClick={openNewPartnerModal}>
            + নতুন পার্টনার যুক্ত করুন
          </button>
        </div>

        <div className="flex" style={{ gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
          <button
            type="button"
            className={`btn sm ${selectedPartnerId === '' ? 'blue' : 'gray'}`}
            onClick={() => setSelectedPartnerId('')}
            style={{ borderRadius: 20, whiteSpace: 'nowrap' }}
          >
            🌐 সকল পার্টনার ({partners.length})
          </button>
          {partners.map((p) => {
            const isSel = selectedPartnerId === p._id;
            const due = p.currentDue || 0;
            return (
              <button
                key={p._id}
                type="button"
                className={`btn sm ${isSel ? 'pink' : 'gray'}`}
                style={{
                  borderRadius: 20,
                  whiteSpace: 'nowrap',
                  background: isSel ? '#be185d' : '#f1f5f9',
                  color: isSel ? '#ffffff' : 'var(--text)',
                  border: isSel ? 'none' : '1px solid var(--border)',
                }}
                onClick={() => setSelectedPartnerId(p._id)}
              >
                👤 {p.name} {p.phone ? `(${p.phone})` : ''} •{' '}
                <b style={{ color: isSel ? '#fef08a' : due >= 0 ? '#16a34a' : '#dc2626' }}>
                  {taka(due)}
                </b>
              </button>
            );
          })}
          {partners.length === 0 && (
            <span className="muted" style={{ fontSize: 13, padding: '4px 0' }}>
              এখনো কোনো পার্টনার যুক্ত করা হয়নি। "নতুন পার্টনার" বাটনে ক্লিক করে যুক্ত করুন।
            </span>
          )}
        </div>
      </div>

      {/* Top 4 KPI Cards for Active Partner */}
      <div className="grid cols-4 mb no-print" style={{ marginBottom: 16 }}>
        <div className="card" style={{ borderLeft: '4px solid #2563eb' }}>
          <div className="flex between align-center">
            <span className="label">👤 নির্বাচিত পার্টনার</span>
            {currentPartner && (
              <button
                className="btn sm text blue"
                style={{ padding: 0, fontSize: 12 }}
                onClick={() => openEditPartnerModal(currentPartner)}
              >
                ✏️ এডিট
              </button>
            )}
          </div>
          <div className="value blue" style={{ fontSize: 22 }}>
            {activeStats.name}
          </div>
          <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
            {activeStats.phone}
            {currentPartner?.bkashNumbers?.length > 0 && ` • বিকাশ: ${currentPartner.bkashNumbers[0]}`}
          </div>
        </div>

        <div className="card" style={{ borderLeft: '4px solid #be185d', background: '#fdf2f8' }}>
          <div className="label">📤 মোট বিকাশ পাঠানো (Sent)</div>
          <div className="value" style={{ color: '#be185d', fontSize: 26 }}>
            {taka(activeStats.totalSent)}
          </div>
          <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
            পার্টনারের নম্বরে পাঠানো মোট টাকা
          </div>
        </div>

        <div className="card" style={{ borderLeft: '4px solid #16a34a', background: '#f0fdf4' }}>
          <div className="label">📥 মোট ব্যাংকে প্রাপ্ত (Received)</div>
          <div className="value green" style={{ fontSize: 26 }}>
            {taka(activeStats.totalReceived)}
          </div>
          <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
            পার্টনার থেকে ব্যাংকে পাওয়া মোট টাকা
          </div>
        </div>

        <div
          className="card"
          style={{
            borderLeft: `5px solid ${activeStats.currentDue >= 0 ? '#16a34a' : '#dc2626'}`,
            background: activeStats.currentDue >= 0 ? '#ecfdf5' : '#fef2f2',
          }}
        >
          <div className="label" style={{ fontWeight: 'bold' }}>
            {activeStats.currentDue >= 0 ? '💰 বর্তমান নিট পাওনা (Receivable)' : '⚠️ পার্টনারের অ্যাডভান্স (Payable)'}
          </div>
          <div
            className="value"
            style={{
              fontSize: 28,
              color: activeStats.currentDue >= 0 ? '#15803d' : '#dc2626',
            }}
          >
            {taka(Math.abs(activeStats.currentDue))}
          </div>
          <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
            {activeStats.currentDue >= 0
              ? 'পার্টনার এই টাকা আপনাকে ব্যাংকে পরিশোধ করবে'
              : 'পার্টনার বেশি দিয়েছে (অ্যাডভান্স)'}
          </div>
        </div>
      </div>

      {/* Main Ledger Section */}
      <div className="card no-print">
        {/* Ledger Header & Search/Filter Controls */}
        <div className="flex between align-center mb8" style={{ flexWrap: 'wrap', gap: 10 }}>
          <div>
            <h3 style={{ margin: 0 }}>📋 বিকাশ ও ব্যাংক লেনদেন লেজার (Transaction Ledger)</h3>
            <span className="muted" style={{ fontSize: 12 }}>
              মোট {ledgerTxns.length} টি লেনদেন প্রদর্শিত হচ্ছে
            </span>
          </div>

          <div className="flex" style={{ gap: 8, flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="🔍 নম্বর, ব্যাংক, বা TrxID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ width: 190, padding: '7px 10px', fontSize: 13 }}
            />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              style={{ width: 140, padding: '7px 10px', fontSize: 13 }}
            >
              <option value="all">সব ধরণ</option>
              <option value="sent">📤 শুধু বিকাশ পাঠানো</option>
              <option value="received">📥 শুধু ব্যাংক প্রাপ্তি</option>
            </select>
            <button className="btn sm blue" onClick={() => setActiveModal('memo')}>
              🧾 মেমো ভিউ
            </button>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="table-wrap mt8">
          <table>
            <thead>
              <tr>
                <th>তারিখ ও সময়</th>
                <th>পার্টনার</th>
                <th>লেনদেনের ধরণ</th>
                <th>বিকাশ নম্বর / ব্যাংকের বিবরণ</th>
                <th>রেফারেন্স / TrxID</th>
                <th>প্রেরিত বিকাশ (৳)</th>
                <th>ব্যাংক জমা (৳)</th>
                <th>অবশিষ্ট পাওনা</th>
                <th>নোট</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {ledgerTxns.map((t) => {
                const isSent = t.type === 'sent';
                return (
                  <tr key={t._id}>
                    <td>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                        {new Date(t.date).toLocaleDateString('bn-BD')} {new Date(t.date).toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td>
                      <b>{t.partnerName}</b>
                      {t.partnerPhone && (
                        <div style={{ fontSize: 11, color: 'var(--muted)' }}>{t.partnerPhone}</div>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${isSent ? 'pink' : 'green'}`} style={{ fontSize: 11 }}>
                        {isSent ? '📤 বিকাশ প্রেরণ' : '📥 ব্যাংক প্রাপ্তি'}
                      </span>
                    </td>
                    <td>
                      {isSent ? (
                        <div>
                          <b style={{ color: '#be185d' }}>📱 {t.targetBkashNumber || 'নম্বর'}</b>
                          {t.ourAccountNumber && (
                            <div style={{ fontSize: 11, color: '#64748b' }}>
                              আমাদের সিম: {t.ourAccountNumber}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div>
                          <b style={{ color: '#15803d' }}>🏦 {t.bankName || 'ব্যাংক'}</b>
                          {t.bankAccount && (
                            <div style={{ fontSize: 11, color: '#64748b' }}>
                              A/C: {t.bankAccount}
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className="muted" style={{ fontSize: 12 }}>
                        {t.trxId || '—'}
                      </span>
                    </td>
                    <td>
                      {isSent ? (
                        <b style={{ color: '#be185d', fontSize: 14 }}>{taka(t.amount)}</b>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>
                      {!isSent ? (
                        <b style={{ color: '#16a34a', fontSize: 14 }}>{taka(t.amount)}</b>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>
                      <b
                        style={{
                          fontSize: 14,
                          color: (t.balanceAfter || 0) >= 0 ? '#15803d' : '#dc2626',
                        }}
                      >
                        {taka(t.balanceAfter || 0)}
                      </b>
                    </td>
                    <td>
                      <span className="muted" style={{ fontSize: 12 }}>
                        {t.note || '—'}
                      </span>
                    </td>
                    <td>
                      <button className="btn sm red" onClick={() => handleDeleteTx(t._id)} title="মুছে ফেলুন">
                        🗑
                      </button>
                    </td>
                  </tr>
                );
              })}
              {ledgerTxns.length === 0 && (
                <tr>
                  <td colSpan={10} className="empty">
                    কোনো লেনদেনের রেকর্ড পাওয়া যায়নি। উপরের "বিকাশ পাঠালাম" বা "ব্যাংকে পেমেন্ট পেলাম" বাটন ব্যবহার করে এন্ট্রি দিন।
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= MODAL: SEND BKASH ================= */}
      {activeModal === 'send' && (
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
          <div className="card" style={{ width: '520px', maxWidth: '94%', background: '#fff' }}>
            <div className="flex between align-center mb8">
              <h3 style={{ margin: 0, color: '#be185d' }}>📤 পার্টনারকে বিকাশ পাঠালাম</h3>
              <button className="btn sm text gray" onClick={() => setActiveModal(null)}>✕</button>
            </div>
            <div style={{ fontSize: 12.5, color: '#64748b', marginBottom: 12 }}>
              পার্টনারের বিকাশ নম্বরে টাকা পাঠালে এন্ট্রি দিন। এটি সংশ্লিষ্ট পার্টনারের কাছে আপনার পাওনা হিসেবে যোগ হবে।
            </div>

            <form className="form-grid" onSubmit={handleSendBkash}>
              <div>
                <label style={{ fontWeight: 'bold' }}>কোন পার্টনারকে পাঠালেন? *</label>
                <select
                  value={sendPartnerId}
                  onChange={(e) => {
                    setSendPartnerId(e.target.value);
                    const p = partners.find((x) => x._id === e.target.value);
                    if (p && p.bkashNumbers && p.bkashNumbers.length > 0) {
                      setSendTargetNumber(p.bkashNumbers[0]);
                    }
                  }}
                  required
                >
                  <option value="">-- পার্টনার বাছাই করুন --</option>
                  {partners.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} {p.phone ? `(${p.phone})` : ''} - বর্তমান পাওনা: {taka(p.currentDue || 0)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontWeight: 'bold', color: '#be185d' }}>পাঠানো টাকার পরিমাণ (৳) *</label>
                <input
                  type="number"
                  placeholder="যেমন: ৫০০০০"
                  value={sendAmount}
                  onChange={(e) => setSendAmount(e.target.value)}
                  style={{ fontSize: 18, fontWeight: 'bold', borderColor: '#f472b6', background: '#fdf2f8' }}
                  required
                  autoFocus
                />
              </div>

              <div>
                <label style={{ fontWeight: 'bold' }}>পার্টনারের যে বিকাশ নম্বরে টাকা ঢুকলো *</label>
                <input
                  placeholder="01XXXXXXXXX"
                  value={sendTargetNumber}
                  onChange={(e) => setSendTargetNumber(e.target.value)}
                  required
                />
                {(() => {
                  const p = partners.find((x) => x._id === sendPartnerId);
                  if (p && p.bkashNumbers && p.bkashNumbers.length > 0) {
                    return (
                      <div className="flex" style={{ gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 11, color: 'var(--muted)' }}>সেভ করা নম্বর:</span>
                        {p.bkashNumbers.map((num) => (
                          <button
                            key={num}
                            type="button"
                            className="btn sm text blue"
                            style={{ padding: '0 4px', fontSize: 11 }}
                            onClick={() => setSendTargetNumber(num)}
                          >
                            {num}
                          </button>
                        ))}
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>

              <div>
                <label>আমাদের কোন সিম থেকে পাঠানো হলো? (ঐচ্ছিক)</label>
                <select
                  value={sendOurAccountId}
                  onChange={(e) => setSendOurAccountId(e.target.value)}
                >
                  <option value="">-- সিম ছাড়া শুধু রেকর্ড রাখুন --</option>
                  {accounts.map((acc) => (
                    <option key={acc._id} value={acc._id}>
                      {acc.number} {acc.name ? `(${acc.name})` : ''} - বর্তমান ব্যালেন্স: {taka(acc.balance)}
                    </option>
                  ))}
                </select>
                <small className="muted" style={{ fontSize: 11 }}>
                  সিম নির্বাচন করলে ওই সিমের ডিজিটাল ব্যালেন্স থেকে স্বয়ংক্রিয়ভাবে মাইনাস হবে।
                </small>
              </div>

              <div className="grid cols-2" style={{ gap: 10 }}>
                <div>
                  <label>TrxID / লেনদেন আইডি</label>
                  <input
                    placeholder="যেমন: BL9X..."
                    value={sendTrxId}
                    onChange={(e) => setSendTrxId(e.target.value)}
                  />
                </div>
                <div>
                  <label>তারিখ ও সময়</label>
                  <input
                    type="datetime-local"
                    value={sendDate}
                    onChange={(e) => setSendDate(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label>বিবরণ / নোট</label>
                <input
                  placeholder="যেমন: দুপুরের লট, বান্ডেল দিয়ে সেন্ড মানি"
                  value={sendNote}
                  onChange={(e) => setSendNote(e.target.value)}
                />
              </div>

              <div className="flex gap mt" style={{ marginTop: 8 }}>
                <button
                  type="submit"
                  className="btn pink"
                  style={{ flex: 1, background: '#be185d' }}
                  disabled={loading}
                >
                  {loading ? 'সংরক্ষণ হচ্ছে...' : '📤 বিকাশ প্রেরণ নিশ্চিত করুন (+ পাওনা যোগ)'}
                </button>
                <button type="button" className="btn gray" onClick={() => setActiveModal(null)}>
                  বাতিল
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: RECEIVE BANK PAYMENT ================= */}
      {activeModal === 'receive' && (
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
          <div className="card" style={{ width: '520px', maxWidth: '94%', background: '#fff' }}>
            <div className="flex between align-center mb8">
              <h3 style={{ margin: 0, color: '#15803d' }}>📥 পার্টনার থেকে ব্যাংকে পেমেন্ট পেলাম</h3>
              <button className="btn sm text gray" onClick={() => setActiveModal(null)}>✕</button>
            </div>
            <div style={{ fontSize: 12.5, color: '#64748b', marginBottom: 12 }}>
              পার্টনার আপনার ব্যাংক অ্যাকাউন্টে টাকা পাঠালে বা ক্যাশ পরিশোধ করলে এন্ট্রি দিন। এটি তার কাছে থাকা পাওনা কমিয়ে দিবে।
            </div>

            <form className="form-grid" onSubmit={handleReceiveBank}>
              <div>
                <label style={{ fontWeight: 'bold' }}>কোন পার্টনার টাকা দিলো? *</label>
                <select
                  value={receivePartnerId}
                  onChange={(e) => setReceivePartnerId(e.target.value)}
                  required
                >
                  <option value="">-- পার্টনার বাছাই করুন --</option>
                  {partners.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} {p.phone ? `(${p.phone})` : ''} - বর্তমান পাওনা: {taka(p.currentDue || 0)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontWeight: 'bold', color: '#15803d' }}>প্রাপ্ত টাকার পরিমাণ (৳) *</label>
                <input
                  type="number"
                  placeholder="যেমন: ৪০০০০"
                  value={receiveAmount}
                  onChange={(e) => setReceiveAmount(e.target.value)}
                  style={{ fontSize: 18, fontWeight: 'bold', borderColor: '#86efac', background: '#f0fdf4' }}
                  required
                  autoFocus
                />
              </div>

              <div className="grid cols-2" style={{ gap: 10 }}>
                <div>
                  <label style={{ fontWeight: 'bold' }}>কোন ব্যাংকে টাকা ঢুকলো? *</label>
                  <input
                    placeholder="যেমন: Islami Bank, DBBL, Brac Bank"
                    value={receiveBankName}
                    onChange={(e) => setReceiveBankName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label>ব্যাংক অ্যাকাউন্ট নং / চেক নং</label>
                  <input
                    placeholder="যেমন: 2050XXXXXXXX"
                    value={receiveBankAccount}
                    onChange={(e) => setReceiveBankAccount(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid cols-2" style={{ gap: 10 }}>
                <div>
                  <label>পেমেন্ট মাধ্যম</label>
                  <select
                    value={receivePaymentMethod}
                    onChange={(e) => setReceivePaymentMethod(e.target.value)}
                  >
                    <option value="bank">ব্যাংক ট্রান্সফার / এনপিএসবি</option>
                    <option value="cash">নগদ ক্যাশ গ্রহণ</option>
                    <option value="cheque">ব্যাংক চেক</option>
                    <option value="other">অন্যান্য</option>
                  </select>
                </div>
                <div>
                  <label>TrxID / ডিপোজিট স্লিপ নং</label>
                  <input
                    placeholder="স্লিপ / ট্রানজেকশন আইডি"
                    value={receiveTrxId}
                    onChange={(e) => setReceiveTrxId(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label>তারিখ ও সময়</label>
                <input
                  type="datetime-local"
                  value={receiveDate}
                  onChange={(e) => setReceiveDate(e.target.value)}
                />
              </div>

              <div>
                <label>বিবরণ / নোট</label>
                <input
                  placeholder="যেমন: দুপুরের লটের পেমেন্ট পরিশোধ"
                  value={receiveNote}
                  onChange={(e) => setReceiveNote(e.target.value)}
                />
              </div>

              <div className="flex gap mt" style={{ marginTop: 8 }}>
                <button
                  type="submit"
                  className="btn green"
                  style={{ flex: 1 }}
                  disabled={loading}
                >
                  {loading ? 'সংরক্ষণ হচ্ছে...' : '📥 ব্যাংক পেমেন্ট নিশ্চিত করুন (− পাওনা হ্রাস)'}
                </button>
                <button type="button" className="btn gray" onClick={() => setActiveModal(null)}>
                  বাতিল
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD / EDIT PARTNER ================= */}
      {activeModal === 'partner' && (
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
          <div className="card" style={{ width: '480px', maxWidth: '94%', background: '#fff' }}>
            <div className="flex between align-center mb8">
              <h3 style={{ margin: 0 }}>
                {editPartnerId ? '✏️ পার্টনারের তথ্য পরিবর্তন করুন' : '➕ নতুন বিকাশ পার্টনার যুক্ত করুন'}
              </h3>
              <button className="btn sm text gray" onClick={() => setActiveModal(null)}>✕</button>
            </div>

            <form className="form-grid" onSubmit={handleSavePartner}>
              <div>
                <label style={{ fontWeight: 'bold' }}>পার্টনারের নাম *</label>
                <input
                  placeholder="যেমন: করিম ভাই, ডিলার রাজিব, রনি এন্টারপ্রাইজ"
                  value={partnerName}
                  onChange={(e) => setPartnerName(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div>
                <label>মোবাইল / WhatsApp নম্বর</label>
                <input
                  placeholder="01XXXXXXXXX"
                  value={partnerPhone}
                  onChange={(e) => setPartnerPhone(e.target.value)}
                />
              </div>

              <div>
                <label>পার্টনারের বিকাশ নম্বরসমূহ (কমা দিয়ে একাধিক নম্বর দেওয়া যাবে)</label>
                <input
                  placeholder="যেমন: 01711XXXXXX, 01822XXXXXX"
                  value={partnerBkashNumbers}
                  onChange={(e) => setPartnerBkashNumbers(e.target.value)}
                />
                <small className="muted" style={{ fontSize: 11 }}>
                  বিকাশ পাঠানোর সময় এই নম্বরগুলো ড্রপডাউনে দ্রুত বাছাই করতে পারবেন।
                </small>
              </div>

              <div>
                <label>পার্টনারের ব্যাংক তথ্য (ঐচ্ছিক)</label>
                <input
                  placeholder="যেমন: Islami Bank, A/C: 2050XXXX, Banani"
                  value={partnerBankDetails}
                  onChange={(e) => setPartnerBankDetails(e.target.value)}
                />
              </div>

              <div>
                <label>অতিরিক্ত নোট / ঠিকানা</label>
                <input
                  placeholder="যেমন: নিয়মিত B2B কাস্টমার"
                  value={partnerNotes}
                  onChange={(e) => setPartnerNotes(e.target.value)}
                />
              </div>

              <div className="flex gap mt" style={{ marginTop: 8 }}>
                <button type="submit" className="btn green" style={{ flex: 1 }} disabled={loading}>
                  {loading ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
                </button>
                {editPartnerId && (
                  <button
                    type="button"
                    className="btn red sm"
                    onClick={() => handleDeletePartner(editPartnerId)}
                  >
                    পার্টনার মুছুন
                  </button>
                )}
                <button type="button" className="btn gray" onClick={() => setActiveModal(null)}>
                  বাতিল
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: PRINTABLE MEMO & STATEMENT ================= */}
      {activeModal === 'memo' && (
        <div
          className="modal-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.65)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
            padding: 16,
            overflowY: 'auto',
          }}
        >
          <div
            className="printable-area"
            style={{
              width: '840px',
              maxWidth: '100%',
              background: '#fff',
              borderRadius: 12,
              padding: 24,
              boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
              maxHeight: '94vh',
              overflowY: 'auto',
            }}
          >
            {/* Memo Modal Action Controls (Hidden when printed) */}
            <div className="flex between align-center mb8 no-print" style={{ borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>
              <div className="flex" style={{ gap: 6, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 13, fontWeight: 'bold' }}>মেমো সময়কাল:</span>
                <button
                  type="button"
                  className={`btn sm ${memoPeriod === 'all' ? 'blue' : 'gray'}`}
                  onClick={() => setMemoPeriod('all')}
                >
                  সর্বকালীন
                </button>
                <button
                  type="button"
                  className={`btn sm ${memoPeriod === 'today' ? 'blue' : 'gray'}`}
                  onClick={() => setMemoPeriod('today')}
                >
                  আজকের
                </button>
                <button
                  type="button"
                  className={`btn sm ${memoPeriod === '7days' ? 'blue' : 'gray'}`}
                  onClick={() => setMemoPeriod('7days')}
                >
                  গত ৭ দিন
                </button>
                <button
                  type="button"
                  className={`btn sm ${memoPeriod === 'month' ? 'blue' : 'gray'}`}
                  onClick={() => setMemoPeriod('month')}
                >
                  চলতি মাস
                </button>
              </div>

              <div className="flex" style={{ gap: 8 }}>
                <button className="btn sm green" onClick={handleShareWhatsApp}>
                  📲 WhatsApp-এ পাঠান
                </button>
                <button className="btn sm blue" onClick={handleCopyMemoText}>
                  📋 টেক্সট কপি
                </button>
                <button className="btn sm pink" onClick={() => window.print()}>
                  🖨️ প্রিন্ট / PDF
                </button>
                <button className="btn sm text gray" onClick={() => setActiveModal(null)}>
                  ✕ বন্ধ করুন
                </button>
              </div>
            </div>

            {/* --- ACTUAL PRINTABLE MEMO CONTENT --- */}
            <div
              id="printable-memo"
              style={{
                background: '#fff',
                color: '#0f172a',
                padding: '16px 20px',
                border: '1px solid #e2e8f0',
                borderRadius: 8,
              }}
            >
              {/* Memo Header */}
              <div style={{ textAlign: 'center', borderBottom: '2px solid #0f172a', paddingBottom: 12, marginBottom: 16 }}>
                <h2 style={{ margin: 0, fontSize: 24, fontWeight: 'bold', color: '#0f172a' }}>
                  🏪 {user?.shopName || 'আমার দোকান'}
                </h2>
                <div style={{ fontSize: 13, color: '#475569', marginTop: 2 }}>
                  বিকাশ B2B ও ব্যাংক লেনদেন মেমো ও হিসাব বিবরণী
                </div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                  তারিখ: {new Date().toLocaleDateString('bn-BD')} {new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })} • মেমো নং: #B2B-{Date.now().toString().slice(-6)}
                </div>
              </div>

              {/* Partner Info Box */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: 8,
                  padding: '12px 16px',
                  marginBottom: 16,
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: 8,
                  fontSize: 13,
                }}
              >
                <div>
                  <span style={{ color: '#64748b' }}>গ্রাহক / পার্টনার: </span>
                  <b style={{ fontSize: 15 }}>{currentPartner ? currentPartner.name : 'সকল পার্টনার'}</b>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>মোবাইল / WhatsApp: </span>
                  <b>{currentPartner?.phone || '—'}</b>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>বিকাশ নম্বরসমূহ: </span>
                  <span>{currentPartner?.bkashNumbers?.join(', ') || '—'}</span>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>ব্যাংক বিবরণ: </span>
                  <span>{currentPartner?.bankDetails || '—'}</span>
                </div>
              </div>

              {/* Memo Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginBottom: 16 }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
                    <th style={{ padding: '8px 10px', textAlign: 'center' }}>ক্র.</th>
                    <th style={{ padding: '8px 10px' }}>তারিখ ও সময়</th>
                    <th style={{ padding: '8px 10px' }}>বিবরণ (বিকাশ নম্বর / ব্যাংক নাম)</th>
                    <th style={{ padding: '8px 10px' }}>TrxID / রেফারেন্স</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right' }}>প্রেরিত বিকাশ (৳)</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right' }}>ব্যাংক জমা (৳)</th>
                    <th style={{ padding: '8px 10px', textAlign: 'right' }}>অবশিষ্ট পাওনা</th>
                  </tr>
                </thead>
                <tbody>
                  {memoTxns.map((t, idx) => {
                    const isSent = t.type === 'sent';
                    return (
                      <tr key={t._id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '7px 10px', textAlign: 'center' }}>{idx + 1}</td>
                        <td style={{ padding: '7px 10px', fontSize: 12 }}>
                          {new Date(t.date).toLocaleDateString('bn-BD')} {new Date(t.date).toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td style={{ padding: '7px 10px' }}>
                          {isSent ? (
                            <span>📤 বিকাশ পাঠানো: <b>{t.targetBkashNumber || 'নম্বর'}</b></span>
                          ) : (
                            <span>📥 ব্যাংক জমা: <b>{t.bankName || 'ব্যাংক'}</b> {t.bankAccount ? `(${t.bankAccount})` : ''}</span>
                          )}
                          {t.note && <div style={{ fontSize: 11, color: '#64748b' }}>নোট: {t.note}</div>}
                        </td>
                        <td style={{ padding: '7px 10px', fontSize: 11, color: '#64748b' }}>
                          {t.trxId || '—'}
                        </td>
                        <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: isSent ? 'bold' : 'normal', color: isSent ? '#be185d' : 'inherit' }}>
                          {isSent ? taka(t.amount) : '—'}
                        </td>
                        <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: !isSent ? 'bold' : 'normal', color: !isSent ? '#16a34a' : 'inherit' }}>
                          {!isSent ? taka(t.amount) : '—'}
                        </td>
                        <td style={{ padding: '7px 10px', textAlign: 'right', fontWeight: 'bold' }}>
                          {taka(t.balanceAfter || 0)}
                        </td>
                      </tr>
                    );
                  })}
                  {memoTxns.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                        নির্বাচিত সময়কালে কোনো লেনদেনের রেকর্ড নেই
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Memo Summary Footer Box */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '2px solid #0f172a',
                  borderRadius: 8,
                  padding: '14px 18px',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 12,
                  textAlign: 'center',
                  marginBottom: 20,
                }}
              >
                <div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>সর্বমোট প্রেরিত বিকাশ</div>
                  <div style={{ fontSize: 18, fontWeight: 'bold', color: '#be185d', marginTop: 4 }}>
                    {taka(memoTotalSent)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>সর্বমোট ব্যাংকে প্রাপ্ত</div>
                  <div style={{ fontSize: 18, fontWeight: 'bold', color: '#16a34a', marginTop: 4 }}>
                    {taka(memoTotalReceived)}
                  </div>
                </div>
                <div style={{ borderLeft: '2px dashed #cbd5e1' }}>
                  <div style={{ fontSize: 12, fontWeight: 'bold', color: '#0f172a' }}>
                    {memoNetDue >= 0 ? '💰 মোট অবশিষ্ট পাওনা' : '⚠️ পার্টনারের পাওনা / দেনা'}
                  </div>
                  <div
                    style={{
                      fontSize: 22,
                      fontWeight: 'bold',
                      color: memoNetDue >= 0 ? '#15803d' : '#dc2626',
                      marginTop: 2,
                    }}
                  >
                    {taka(Math.abs(memoNetDue))}
                  </div>
                </div>
              </div>

              {/* Signature and Notes */}
              <div className="flex between" style={{ marginTop: 36, paddingTop: 16, borderTop: '1px dashed #cbd5e1' }}>
                <div style={{ fontSize: 12, color: '#64748b' }}>
                  * অনুগ্রহ করে উপরিউক্ত হিসাবটি আপনার রেকর্ডের সাথে মিলিয়ে নিবেন।
                  <br />যেকোনো প্রয়োজনে যোগাযোগ করবেন। ধন্যবাদ!
                </div>
                <div style={{ textAlign: 'center', minWidth: 160 }}>
                  <div style={{ borderTop: '1px solid #0f172a', paddingTop: 6, fontSize: 13, fontWeight: 'bold' }}>
                    প্রোপাইটর স্বাক্ষর
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>{user?.shopName || 'আমার দোকান'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
