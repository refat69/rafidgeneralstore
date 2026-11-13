'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { taka } from '@/lib/money';
import toast from 'react-hot-toast';

export default function BkashB2BPage() {
  const [data, setData] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  // Selected partner ID
  const [selectedPartnerId, setSelectedPartnerId] = useState('');

  // Modals: null | 'send' | 'receive' | 'expense' | 'opening' | 'partner' | 'memo'
  const [activeModal, setActiveModal] = useState(null);

  // --- Form: Send bKash (বিকাশ পাঠালাম) ---
  const [sendPartnerId, setSendPartnerId] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [sendTargetNumber, setSendTargetNumber] = useState('');
  const [sendOurAccountId, setSendOurAccountId] = useState('');
  const [sendTrxId, setSendTrxId] = useState('');
  const [sendDate, setSendDate] = useState('');
  const [sendNote, setSendNote] = useState('');

  // --- Form: Receive Payment (পার্টনার ব্যাংকে পাঠালো) ---
  const [receivePartnerId, setReceivePartnerId] = useState('');
  const [receiveAmount, setReceiveAmount] = useState('');
  const [receiveBankName, setReceiveBankName] = useState('Islami Bank');
  const [receiveBankAccount, setReceiveBankAccount] = useState('');
  const [receivePaymentMethod, setReceivePaymentMethod] = useState('bank');
  const [receiveTrxId, setReceiveTrxId] = useState('');
  const [receiveDate, setReceiveDate] = useState('');
  const [receiveNote, setReceiveNote] = useState('');

  // --- Form: Daily Expense (আজকের খরচ যোগ) ---
  const [expensePartnerId, setExpensePartnerId] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseNote, setExpenseNote] = useState('আজকের দৈনিক খরচ');
  const [expenseDate, setExpenseDate] = useState('');

  // --- Form: Opening Due (আগের পাওনা সেট করা) ---
  const [openingPartnerId, setOpeningPartnerId] = useState('');
  const [openingAmount, setOpeningAmount] = useState('');

  // --- Form: Add / Edit Partner ---
  const [editPartnerId, setEditPartnerId] = useState(null);
  const [partnerName, setPartnerName] = useState('');
  const [partnerPhone, setPartnerPhone] = useState('');
  const [partnerOpeningDue, setPartnerOpeningDue] = useState('');
  const [partnerBkashNumbers, setPartnerBkashNumbers] = useState('');
  const [partnerBankDetails, setPartnerBankDetails] = useState('');
  const [partnerNotes, setPartnerNotes] = useState('');

  // --- Memo View Mode ---
  const [memoPeriod, setMemoPeriod] = useState('today'); // 'today' | 'all' | '7days' | 'month'

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
        if (d.partners && d.partners.length > 0 && !selectedPartnerId) {
          const firstId = d.partners[0]._id;
          setSelectedPartnerId(firstId);
          setSendPartnerId(firstId);
          setReceivePartnerId(firstId);
          setExpensePartnerId(firstId);
          setOpeningPartnerId(firstId);
          if (d.partners[0].bkashNumbers && d.partners[0].bkashNumbers[0]) {
            setSendTargetNumber(d.partners[0].bkashNumbers[0]);
          }
        }
      })
      .catch(() => { });
  }

  const currentPartner = data?.partners?.find((p) => p._id === selectedPartnerId);

  // Quick Open Modal Helpers
  function openSendModal() {
    const targetId = selectedPartnerId || (data?.partners[0]?._id || '');
    setSendPartnerId(targetId);
    const p = data?.partners?.find((x) => x._id === targetId);
    setSendTargetNumber(p?.bkashNumbers?.[0] || '');
    setSendAmount('');
    setSendOurAccountId(data?.accounts?.[0]?._id || '');
    setSendTrxId('');
    setSendNote('');
    setSendDate(new Date().toISOString().slice(0, 16));
    setActiveModal('send');
  }

  function openReceiveModal() {
    const targetId = selectedPartnerId || (data?.partners[0]?._id || '');
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

  function openExpenseModal() {
    const targetId = selectedPartnerId || (data?.partners[0]?._id || '');
    setExpensePartnerId(targetId);
    setExpenseAmount('');
    setExpenseNote('আজকের দৈনিক খরচ');
    setExpenseDate(new Date().toISOString().slice(0, 16));
    setActiveModal('expense');
  }

  function openOpeningDueModal() {
    const targetId = selectedPartnerId || (data?.partners[0]?._id || '');
    setOpeningPartnerId(targetId);
    const p = data?.partners?.find((x) => x._id === targetId);
    setOpeningAmount(p?.openingDue ? String(p.openingDue) : '');
    setActiveModal('opening');
  }

  function openNewPartnerModal() {
    setEditPartnerId(null);
    setPartnerName('');
    setPartnerPhone('');
    setPartnerOpeningDue('');
    setPartnerBkashNumbers('');
    setPartnerBankDetails('');
    setPartnerNotes('');
    setActiveModal('partner');
  }

  function openEditPartnerModal(p) {
    setEditPartnerId(p._id);
    setPartnerName(p.name || '');
    setPartnerPhone(p.phone || '');
    setPartnerOpeningDue(p.openingDue ? String(p.openingDue) : '');
    setPartnerBkashNumbers((p.bkashNumbers || []).join(', '));
    setPartnerBankDetails(p.bankDetails || '');
    setPartnerNotes(p.notes || '');
    setActiveModal('partner');
  }

  // --- Handlers: Save Partner ---
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
        openingDue: Number(partnerOpeningDue) || 0,
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

  // --- Handlers: Update Opening Due ---
  async function handleSaveOpeningDue(e) {
    e.preventDefault();
    if (!openingPartnerId) return;

    setLoading(true);
    const res = await fetch('/api/bkash-b2b', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'update_partner',
        id: openingPartnerId,
        openingDue: Number(openingAmount) || 0,
      }),
    });
    setLoading(false);

    if (!res.ok) {
      toast.error('আগের পাওনা আপডেট করতে সমস্যা হয়েছে');
      return;
    }

    toast.success('✅ আগের পাওনা সফলভাবে আপডেট হয়েছে!');
    setActiveModal(null);
    loadData();
  }

  // --- Handlers: Send bKash ---
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
      toast.error('পার্টনারের বিকাশ নম্বর লিখুন');
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
      toast.error('বিকাশ পাঠানো সংরক্ষণ করতে সমস্যা হয়েছে');
      return;
    }

    toast.success('✅ বিকাশ পাঠানো সফলভাবে যোগ হয়েছে! (+ পাওনা বৃদ্ধি)');
    setActiveModal(null);
    setSendAmount('');
    loadData();
  }

  // --- Handlers: Receive Bank Payment ---
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
      toast.error('পেমেন্ট সংরক্ষণ করতে সমস্যা হয়েছে');
      return;
    }

    toast.success('✅ ব্যাংকে পেমেন্ট প্রাপ্তি সফলভাবে সংরক্ষিত হয়েছে! (− পাওনা হ্রাস)');
    setActiveModal(null);
    setReceiveAmount('');
    loadData();
  }

  // --- Handlers: Add Daily Expense ---
  async function handleAddExpense(e) {
    e.preventDefault();
    const amt = Number(expenseAmount);
    if (!amt || amt <= 0) {
      toast.error('সঠিক খরচের পরিমাণ লিখুন');
      return;
    }
    if (!expensePartnerId) {
      toast.error('পার্টনার নির্বাচন করুন');
      return;
    }

    setLoading(true);
    const res = await fetch('/api/bkash-b2b', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'add_transaction',
        partnerId: expensePartnerId,
        type: 'expense',
        amount: amt,
        note: expenseNote.trim() || 'আজকের দৈনিক খরচ',
        date: expenseDate ? new Date(expenseDate) : new Date(),
      }),
    });
    setLoading(false);

    if (!res.ok) {
      toast.error('খরচ যোগ করতে সমস্যা হয়েছে');
      return;
    }

    toast.success('✅ দৈনিক খরচ সফলভাবে পার্টনারের পাওনায় যোগ হয়েছে!');
    setActiveModal(null);
    setExpenseAmount('');
    loadData();
  }

  // --- Delete Transaction ---
  async function handleDeleteTx(id) {
    if (!confirm('এই লেনদেনটি মুছে ফেলতে চান? সংশ্লিষ্ট হিসাব পূর্বাবস্থায় ফিরে যাবে।')) return;
    await fetch(`/api/bkash-b2b?id=${id}`, { method: 'DELETE' });
    toast.success('লেনদেন মুছে ফেলা হয়েছে');
    loadData();
  }

  // --- Delete Partner ---
  async function handleDeletePartner(id) {
    if (!confirm('সতর্কতা: এই পার্টনারকে মুছলে তার সম্পর্কিত সকল লেনদেনও মুছে যাবে! নিশ্চিত তো?')) return;
    await fetch(`/api/bkash-b2b?partnerId=${id}`, { method: 'DELETE' });
    toast.success('পার্টনার মুছে ফেলা হয়েছে');
    setSelectedPartnerId('');
    loadData();
  }

  if (!data) return <div className="empty mt">বিকাশ পার্টনার হিসাব লোড হচ্ছে...</div>;

  const { partners = [], transactions = [], accounts = [], summary } = data;

  // Selected partner or first
  const activeP = currentPartner || partners[0];

  // Transactions of active partner
  const partnerTxns = activeP
    ? transactions.filter((t) => t.partnerId === activeP._id)
    : transactions;

  // Today's filter
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const memoTxns = partnerTxns.filter((t) => {
    if (memoPeriod === 'today') return new Date(t.date) >= todayStart;
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
    return true; // 'all'
  });

  const memoSent = memoTxns.filter((t) => t.type === 'sent').reduce((a, t) => a + (t.amount || 0), 0);
  const memoExpense = memoTxns.filter((t) => t.type === 'expense').reduce((a, t) => a + (t.amount || 0), 0);
  const memoReceived = memoTxns.filter((t) => t.type === 'received').reduce((a, t) => a + (t.amount || 0), 0);
  const memoPrevDue = (memoPeriod === 'today' ? (activeP?.previousDue || 0) : (activeP?.openingDue || 0));
  const memoNetDue = memoPrevDue + memoSent + memoExpense - memoReceived;

  // --- WhatsApp Text Generator ---
  function generateWhatsAppText() {
    const shop = user?.shopName || 'আমার দোকান';
    const pName = activeP?.name || 'পার্টনার';
    const dateStr = new Date().toLocaleDateString('bn-BD');

    let text = `*🏪 ${shop} - বিকাশ পার্টনার দৈনিক হিসাব মেমো*\n`;
    text += `📅 তারিখ: ${dateStr}\n`;
    text += `👤 পার্টনার: ${pName} ${activeP?.phone ? `(${activeP.phone})` : ''}\n`;
    text += `-------------------------------------------\n`;
    text += `🔹 পূর্বের বকেয়া পাওনা: ${taka(memoPrevDue)}\n`;
    text += `➕ আজকের বিকাশ পাঠানো: ${taka(memoSent)}\n`;
    if (memoExpense > 0) {
      text += `➕ আজকের খরচ বাবদ: ${taka(memoExpense)}\n`;
    }
    text += `-------------------------------------------\n`;
    text += `📊 মোট পাওনা দাবি: ${taka(memoPrevDue + memoSent + memoExpense)}\n`;
    text += `➖ আজকে ব্যাংকে দিয়েছেন: ${taka(memoReceived)}\n`;
    text += `-------------------------------------------\n`;
    text += `💰 *আজকের অবশিষ্ট নিট পাওনা:* ${taka(memoNetDue)}\n\n`;

    if (memoTxns.length > 0) {
      text += `📋 *আজকের লেনদেন বিস্তারিত:*\n`;
      memoTxns.forEach((t, i) => {
        if (t.type === 'sent') {
          text += `${i + 1}. বিকাশ পাঠানো: ${taka(t.amount)} (${t.targetBkashNumber || 'বিকাশ নম্বর'})\n`;
        } else if (t.type === 'expense') {
          text += `${i + 1}. দৈনিক খরচ: ${taka(t.amount)} (${t.note || 'খরচ'})\n`;
        } else {
          text += `${i + 1}. ব্যাংকে জমা: ${taka(t.amount)} (${t.bankName || 'ব্যাংক'})\n`;
        }
      });
    }

    text += `\nঅনুগ্রহ করে হিসাবটি মিলিয়ে নিবেন। কোনো সমস্যা থাকলে জানাবেন। ধন্যবাদ!`;
    return text;
  }

  function handleShareWhatsApp() {
    const txt = generateWhatsAppText();
    const phone = activeP?.phone ? activeP.phone.replace(/[^0-9]/g, '') : '';
    const url = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(txt)}`
      : `https://wa.me/?text=${encodeURIComponent(txt)}`;
    window.open(url, '_blank');
  }

  function handleCopyMemoText() {
    const txt = generateWhatsAppText();
    navigator.clipboard.writeText(txt);
    toast.success('📋 মেমো টেক্সট ক্লিপবোর্ডে কপি হয়েছে!');
  }

  return (
    <div>
      {/* Top Header */}
      <div className="topbar no-print">
        <div>
          <h2>🤝 বিকাশ পার্টনার দৈনিক হিসাব (B2B)</h2>
          <div className="sub">
            আগের পাওনা, বিকাশ প্রেরণ, দৈনিক খরচ, ব্যাংক পেমেন্ট ও WhatsApp মেমো শেয়ার
          </div>
        </div>
        <div className="flex" style={{ gap: 8, flexWrap: 'wrap' }}>
          <button
            className="btn green"
            style={{ background: '#25D366', color: '#fff', fontWeight: 'bold' }}
            onClick={handleShareWhatsApp}
            title="পার্টনারকে হোয়াটসঅ্যাপে আজকের হিসাব মেমো পাঠান"
          >
            📲 WhatsApp-এ হিসাব পাঠান
          </button>
          <button className="btn blue" onClick={() => setActiveModal('memo')}>
            🧾 মেমো স্টেটমেন্ট
          </button>
          <button className="btn gray" onClick={openNewPartnerModal}>
            ➕ নতুন পার্টনার
          </button>
        </div>
      </div>

      {/* Partner Switcher Tabs */}
      <div className="card mb no-print" style={{ padding: '10px 14px', marginBottom: 16 }}>
        <div className="flex between align-center" style={{ flexWrap: 'wrap', gap: 8 }}>
          <div className="flex" style={{ gap: 6, overflowX: 'auto', flex: 1 }}>
            <span style={{ fontSize: 13, fontWeight: 'bold', color: 'var(--muted)', alignSelf: 'center', whiteSelf: 'nowrap' }}>
              পার্টনার:
            </span>
            {partners.map((p) => {
              const isSel = activeP?._id === p._id;
              return (
                <button
                  key={p._id}
                  type="button"
                  className={`btn sm ${isSel ? 'pink' : 'gray'}`}
                  style={{
                    borderRadius: 20,
                    whiteSpace: 'nowrap',
                    background: isSel ? '#be185d' : '#f1f5f9',
                    color: isSel ? '#fff' : 'var(--text)',
                    border: isSel ? 'none' : '1px solid var(--border)',
                  }}
                  onClick={() => setSelectedPartnerId(p._id)}
                >
                  👤 {p.name} • <b>{taka(p.currentDue || 0)}</b>
                </button>
              );
            })}
            {partners.length === 0 && (
              <span className="muted" style={{ fontSize: 13 }}>
                কোনো পার্টনার নেই। "নতুন পার্টনার" বাটনে ক্লিক করে যোগ করুন।
              </span>
            )}
          </div>

          {activeP && (
            <div className="flex" style={{ gap: 6 }}>
              <button className="btn sm text blue" onClick={() => openEditPartnerModal(activeP)}>
                ✏️ পার্টনার এডিট
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Daily Settlement Summary Card (বড় ও সহজ দৈনিক হিসাব) */}
      {activeP ? (
        <div
          className="card mb no-print"
          style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            border: '2px solid #cbd5e1',
            borderRadius: 14,
            padding: '18px 22px',
            marginBottom: 16,
            boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
          }}
        >
          {/* Top Title Row */}
          <div className="flex between align-center mb8" style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: 10 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 18, color: '#0f172a' }}>
                📅 {activeP.name} - আজকের সম্পূর্ণ হিসাব বিবরণী
              </h3>
              <div style={{ fontSize: 12.5, color: '#64748b', marginTop: 2 }}>
                মোবাইল: {activeP.phone || '—'} • আজকের তারিখ: {new Date().toLocaleDateString('bn-BD')}
              </div>
            </div>

            <div className="flex" style={{ gap: 8, flexWrap: 'wrap' }}>
              <button
                className="btn sm"
                style={{ background: '#be185d', color: '#fff' }}
                onClick={openSendModal}
              >
                📤 বিকাশ পাঠালাম
              </button>
              <button
                className="btn sm"
                style={{ background: '#f59e0b', color: '#fff' }}
                onClick={openExpenseModal}
              >
                💸 আজকের খরচ যোগ
              </button>
              <button
                className="btn sm green"
                onClick={openReceiveModal}
              >
                📥 পার্টনার টাকা দিলো
              </button>
            </div>
          </div>

          {/* Simple 5-Step Daily Math Breakdown Cards */}
          <div className="grid cols-4" style={{ gap: 12, marginTop: 12 }}>
            {/* 1. Previous Due */}
            <div style={{ background: '#eff6ff', padding: '12px 14px', borderRadius: 10, borderLeft: '4px solid #2563eb' }}>
              <div className="flex between align-center">
                <span style={{ fontSize: 12, color: '#1e40af', fontWeight: 'bold' }}>১. আগের পাওনা</span>
                <button
                  type="button"
                  className="btn sm text blue"
                  style={{ padding: 0, fontSize: 11 }}
                  onClick={openOpeningDueModal}
                  title="পূর্বের বকেয়া পরিবর্তন করুন"
                >
                  ✏️ এডিট
                </button>
              </div>
              <div style={{ fontSize: 22, fontWeight: 'bold', color: '#1d4ed8', marginTop: 4 }}>
                {taka(activeP.previousDue || 0)}
              </div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                আজকের দিনের আগের বকেয়া
              </div>
            </div>

            {/* 2. Today Sent + Today Expense */}
            <div style={{ background: '#fdf2f8', padding: '12px 14px', borderRadius: 10, borderLeft: '4px solid #be185d' }}>
              <div className="flex between align-center">
                <span style={{ fontSize: 12, color: '#9d174d', fontWeight: 'bold' }}>২. আজকের বিকাশ + খরচ</span>
                <button
                  type="button"
                  className="btn sm text pink"
                  style={{ padding: 0, fontSize: 11, color: '#be185d' }}
                  onClick={openExpenseModal}
                >
                  + খরচ
                </button>
              </div>
              <div style={{ fontSize: 22, fontWeight: 'bold', color: '#be185d', marginTop: 4 }}>
                {taka((activeP.todaySent || 0) + (activeP.todayExpense || 0))}
              </div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                বিকাশ {taka(activeP.todaySent || 0)} + খরচ {taka(activeP.todayExpense || 0)}
              </div>
            </div>

            {/* 3. Today Received */}
            <div style={{ background: '#f0fdf4', padding: '12px 14px', borderRadius: 10, borderLeft: '4px solid #16a34a' }}>
              <div className="flex between align-center">
                <span style={{ fontSize: 12, color: '#166534', fontWeight: 'bold' }}>৩. আজকে ব্যাংকে দিয়েছে</span>
                <button
                  type="button"
                  className="btn sm text green"
                  style={{ padding: 0, fontSize: 11 }}
                  onClick={openReceiveModal}
                >
                  + জমা
                </button>
              </div>
              <div style={{ fontSize: 22, fontWeight: 'bold', color: '#15803d', marginTop: 4 }}>
                {taka(activeP.todayReceived || 0)}
              </div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                পার্টনার আজকে যত টাকা শোধ করেছে
              </div>
            </div>

            {/* 4. Net Closing Due */}
            <div
              style={{
                background: (activeP.currentDue || 0) >= 0 ? '#ecfdf5' : '#fef2f2',
                padding: '12px 14px',
                borderRadius: 10,
                borderLeft: `4px solid ${(activeP.currentDue || 0) >= 0 ? '#059669' : '#dc2626'}`,
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 'bold', color: (activeP.currentDue || 0) >= 0 ? '#047857' : '#991b1b' }}>
                ৪. বর্তমান অবশিষ্ট পাওনা
              </div>
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 'bold',
                  color: (activeP.currentDue || 0) >= 0 ? '#047857' : '#dc2626',
                  marginTop: 4,
                }}
              >
                {taka(activeP.currentDue || 0)}
              </div>
              <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                মোট দাবি থেকে প্রাপ্তি বাদ দিয়ে
              </div>
            </div>
          </div>

          {/* Quick Action Bar under Daily Card */}
          <div
            className="flex between align-center mt8"
            style={{
              marginTop: 14,
              paddingTop: 12,
              borderTop: '1px dashed #e2e8f0',
              flexWrap: 'wrap',
              gap: 8,
            }}
          >
            <div style={{ fontSize: 13, color: '#334155' }}>
              💡 <b>হিসাব সমীকরণ:</b> আগের পাওনা ({taka(activeP.previousDue || 0)}) + আজকের বিকাশ ({taka(activeP.todaySent || 0)}) + আজকের খরচ ({taka(activeP.todayExpense || 0)}) − ব্যাংকে জমা ({taka(activeP.todayReceived || 0)}) = <b>অবশিষ্ট পাওনা {taka(activeP.currentDue || 0)}</b>
            </div>

            <div className="flex" style={{ gap: 8 }}>
              <button
                className="btn sm"
                style={{ background: '#25D366', color: '#fff', fontWeight: 'bold' }}
                onClick={handleShareWhatsApp}
              >
                📲 WhatsApp-এ হিসাব পাঠান
              </button>
              <button
                className="btn sm blue"
                onClick={handleCopyMemoText}
              >
                📋 টেক্সট কপি
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="card empty mb no-print">
          কোনো পার্টনার নেই। উপরের "➕ নতুন পার্টনার" বাটনে ক্লিক করে পার্টনার যুক্ত করুন।
        </div>
      )}

      {/* Transaction History Table for Active Partner */}
      <div className="card no-print">
        <div className="flex between align-center mb8">
          <div>
            <h3 style={{ margin: 0 }}>
              📋 {activeP ? `${activeP.name}-এর লেনদেন ইতিহাস` : 'লেনদেন তালিকা'}
            </h3>
            <span className="muted" style={{ fontSize: 12 }}>
              মোট {partnerTxns.length} টি লেনদেন রেকর্ড আছে
            </span>
          </div>

          <div className="flex" style={{ gap: 8 }}>
            <button className="btn sm pink" style={{ background: '#be185d' }} onClick={openSendModal}>
              + বিকাশ পাঠালাম
            </button>
            <button className="btn sm" style={{ background: '#f59e0b', color: '#fff' }} onClick={openExpenseModal}>
              + খরচ যোগ
            </button>
            <button className="btn sm green" onClick={openReceiveModal}>
              + পেমেন্ট পেলাম
            </button>
          </div>
        </div>

        <div className="table-wrap mt8">
          <table>
            <thead>
              <tr>
                <th>তারিখ ও সময়</th>
                <th>লেনদেনের ধরণ</th>
                <th>বিবরণ (নম্বর / ব্যাংক / খরচ)</th>
                <th>TrxID / রেফারেন্স</th>
                <th>টাকার পরিমাণ (৳)</th>
                <th>অবশিষ্ট পাওনা</th>
                <th>নোট</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {partnerTxns.map((t) => {
                const isSent = t.type === 'sent';
                const isExpense = t.type === 'expense';
                const isRec = t.type === 'received';
                return (
                  <tr key={t._id}>
                    <td>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                        {new Date(t.date).toLocaleDateString('bn-BD')} {new Date(t.date).toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td>
                      <span
                        className={`badge ${isSent ? 'pink' : isExpense ? 'amber' : 'green'}`}
                        style={{ fontSize: 11 }}
                      >
                        {isSent ? '📤 বিকাশ পাঠানো' : isExpense ? '💸 দৈনিক খরচ' : '📥 ব্যাংকে প্রাপ্তি'}
                      </span>
                    </td>
                    <td>
                      {isSent && (
                        <div>
                          <b style={{ color: '#be185d' }}>📱 {t.targetBkashNumber || 'নম্বর'}</b>
                          {t.ourAccountNumber && (
                            <span style={{ fontSize: 11, color: '#64748b', marginLeft: 6 }}>
                              (সিম: {t.ourAccountNumber})
                            </span>
                          )}
                        </div>
                      )}
                      {isExpense && (
                        <div>
                          <b style={{ color: '#b45309' }}>💸 {t.note || 'দৈনিক খরচ'}</b>
                        </div>
                      )}
                      {isRec && (
                        <div>
                          <b style={{ color: '#15803d' }}>🏦 {t.bankName || 'ব্যাংক'}</b>
                          {t.bankAccount && (
                            <span style={{ fontSize: 11, color: '#64748b', marginLeft: 6 }}>
                              (A/C: {t.bankAccount})
                            </span>
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
                      <b
                        style={{
                          fontSize: 14,
                          color: isSent ? '#be185d' : isExpense ? '#d97706' : '#16a34a',
                        }}
                      >
                        {isSent || isExpense ? '+' : '−'}{taka(t.amount)}
                      </b>
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
              {partnerTxns.length === 0 && (
                <tr>
                  <td colSpan={8} className="empty">
                    কোনো লেনদেনের রেকর্ড নেই। উপরের বাটনগুলো দিয়ে লেনদেন যুক্ত করুন।
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
          <div className="card" style={{ width: '480px', maxWidth: '94%', background: '#fff' }}>
            <div className="flex between align-center mb8">
              <h3 style={{ margin: 0, color: '#be185d' }}>📤 পার্টনারকে বিকাশ পাঠালাম</h3>
              <button className="btn sm text gray" onClick={() => setActiveModal(null)}>✕</button>
            </div>

            <form className="form-grid" onSubmit={handleSendBkash}>
              <div>
                <label style={{ fontWeight: 'bold' }}>পার্টনার</label>
                <select
                  value={sendPartnerId}
                  onChange={(e) => {
                    setSendPartnerId(e.target.value);
                    const p = partners.find((x) => x._id === e.target.value);
                    setSendTargetNumber(p?.bkashNumbers?.[0] || '');
                  }}
                  required
                >
                  {partners.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} {p.phone ? `(${p.phone})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontWeight: 'bold', color: '#be185d' }}>পাঠানো টাকা (৳) *</label>
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
                <label style={{ fontWeight: 'bold' }}>যে বিকাশ নম্বরে টাকা পাঠালেন *</label>
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
                <label>আমাদের কোন সিম থেকে গেল? (ঐচ্ছিক)</label>
                <select
                  value={sendOurAccountId}
                  onChange={(e) => setSendOurAccountId(e.target.value)}
                >
                  <option value="">-- সিম ছাড়া শুধু রেকর্ড রাখুন --</option>
                  {accounts.map((acc) => (
                    <option key={acc._id} value={acc._id}>
                      {acc.number} {acc.name ? `(${acc.name})` : ''} - ব্যালেন্স: {taka(acc.balance)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid cols-2" style={{ gap: 10 }}>
                <div>
                  <label>TrxID (ঐচ্ছিক)</label>
                  <input
                    placeholder="TrxID"
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
                <label>নোট / মন্তব্য</label>
                <input
                  placeholder="যেমন: দুপুরের লট"
                  value={sendNote}
                  onChange={(e) => setSendNote(e.target.value)}
                />
              </div>

              <div className="flex gap mt">
                <button
                  type="submit"
                  className="btn pink"
                  style={{ flex: 1, background: '#be185d' }}
                  disabled={loading}
                >
                  {loading ? 'সংরক্ষণ হচ্ছে...' : '📤 বিকাশ প্রেরণ নিশ্চিত করুন (+ পাওনা বৃদ্ধি)'}
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
          <div className="card" style={{ width: '480px', maxWidth: '94%', background: '#fff' }}>
            <div className="flex between align-center mb8">
              <h3 style={{ margin: 0, color: '#15803d' }}>📥 পার্টনার থেকে পেমেন্ট পেলাম</h3>
              <button className="btn sm text gray" onClick={() => setActiveModal(null)}>✕</button>
            </div>

            <form className="form-grid" onSubmit={handleReceiveBank}>
              <div>
                <label style={{ fontWeight: 'bold' }}>পার্টনার</label>
                <select
                  value={receivePartnerId}
                  onChange={(e) => setReceivePartnerId(e.target.value)}
                  required
                >
                  {partners.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} {p.phone ? `(${p.phone})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontWeight: 'bold', color: '#15803d' }}>প্রাপ্ত টাকা (৳) *</label>
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
                  <label style={{ fontWeight: 'bold' }}>কোন ব্যাংকে ঢুকলো? *</label>
                  <input
                    placeholder="Islami Bank, DBBL, Brac Bank"
                    value={receiveBankName}
                    onChange={(e) => setReceiveBankName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label>A/C নং বা স্লিপ নং</label>
                  <input
                    placeholder="অ্যাকাউন্ট নং"
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
                    <option value="bank">ব্যাংক ট্রান্সফার</option>
                    <option value="cash">নগদ ক্যাশ</option>
                    <option value="cheque">চেক</option>
                  </select>
                </div>
                <div>
                  <label>তারিখ ও সময়</label>
                  <input
                    type="datetime-local"
                    value={receiveDate}
                    onChange={(e) => setReceiveDate(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label>নোট / মন্তব্য</label>
                <input
                  placeholder="যেমন: ব্যাংকে জমা পাওয়া গেছে"
                  value={receiveNote}
                  onChange={(e) => setReceiveNote(e.target.value)}
                />
              </div>

              <div className="flex gap mt">
                <button
                  type="submit"
                  className="btn green"
                  style={{ flex: 1 }}
                  disabled={loading}
                >
                  {loading ? 'সংরক্ষণ হচ্ছে...' : '📥 পেমেন্ট নিশ্চিত করুন (− পাওনা হ্রাস)'}
                </button>
                <button type="button" className="btn gray" onClick={() => setActiveModal(null)}>
                  বাতিল
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD DAILY EXPENSE ================= */}
      {activeModal === 'expense' && (
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
          <div className="card" style={{ width: '460px', maxWidth: '94%', background: '#fff' }}>
            <div className="flex between align-center mb8">
              <h3 style={{ margin: 0, color: '#b45309' }}>💸 দৈনিক খরচ যোগ করুন</h3>
              <button className="btn sm text gray" onClick={() => setActiveModal(null)}>✕</button>
            </div>
            <div style={{ fontSize: 12.5, color: '#64748b', marginBottom: 12 }}>
              পার্টনার থেকে দৈনিক যে খরচ বা কমিশন বাবদ টাকা পান তা এখানে যোগ করুন। এটি পার্টনারের পাওনার সাথে যোগ হবে।
            </div>

            <form className="form-grid" onSubmit={handleAddExpense}>
              <div>
                <label style={{ fontWeight: 'bold' }}>পার্টনার</label>
                <select
                  value={expensePartnerId}
                  onChange={(e) => setExpensePartnerId(e.target.value)}
                  required
                >
                  {partners.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} {p.phone ? `(${p.phone})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontWeight: 'bold', color: '#b45309' }}>আজকের খরচের টাকা (৳) *</label>
                <input
                  type="number"
                  placeholder="যেমন: ১০০ বা ৫০"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  style={{ fontSize: 18, fontWeight: 'bold', borderColor: '#fcd34d', background: '#fffbeb' }}
                  required
                  autoFocus
                />
              </div>

              <div>
                <label>খরচের বিবরণ</label>
                <input
                  placeholder="যেমন: আজকের দৈনিক খরচ, সেন্ড মানি খরচ"
                  value={expenseNote}
                  onChange={(e) => setExpenseNote(e.target.value)}
                />
              </div>

              <div>
                <label>তারিখ ও সময়</label>
                <input
                  type="datetime-local"
                  value={expenseDate}
                  onChange={(e) => setExpenseDate(e.target.value)}
                />
              </div>

              <div className="flex gap mt">
                <button
                  type="submit"
                  className="btn"
                  style={{ flex: 1, background: '#f59e0b', color: '#fff' }}
                  disabled={loading}
                >
                  {loading ? 'সংরক্ষণ হচ্ছে...' : '➕ খরচ যোগ করুন (+ পাওনা বৃদ্ধি)'}
                </button>
                <button type="button" className="btn gray" onClick={() => setActiveModal(null)}>
                  বাতিল
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: EDIT OPENING DUE ================= */}
      {activeModal === 'opening' && (
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
          <div className="card" style={{ width: '440px', maxWidth: '94%', background: '#fff' }}>
            <div className="flex between align-center mb8">
              <h3 style={{ margin: 0, color: '#1e40af' }}>✏️ আগের বকেয়া পাওনা সেট করুন</h3>
              <button className="btn sm text gray" onClick={() => setActiveModal(null)}>✕</button>
            </div>
            <div style={{ fontSize: 12.5, color: '#64748b', marginBottom: 12 }}>
              পার্টনারের কাছে আগে থেকেই যে বকেয়া টাকা পাওনা আছে তা এখানে লিখে দিন। এটি পার্টনারের প্রারম্ভিক হিসাব হিসেবে জমা থাকবে।
            </div>

            <form className="form-grid" onSubmit={handleSaveOpeningDue}>
              <div>
                <label style={{ fontWeight: 'bold', color: '#1d4ed8' }}>পূর্বের পাওনা টাকা (৳) *</label>
                <input
                  type="number"
                  placeholder="যেমন: ১৫০০০"
                  value={openingAmount}
                  onChange={(e) => setOpeningAmount(e.target.value)}
                  style={{ fontSize: 18, fontWeight: 'bold', borderColor: '#93c5fd', background: '#eff6ff' }}
                  required
                  autoFocus
                />
              </div>

              <div className="flex gap mt">
                <button
                  type="submit"
                  className="btn blue"
                  style={{ flex: 1 }}
                  disabled={loading}
                >
                  {loading ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
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
                {editPartnerId ? '✏️ পার্টনারের তথ্য পরিবর্তন' : '➕ নতুন পার্টনার যুক্ত করুন'}
              </h3>
              <button className="btn sm text gray" onClick={() => setActiveModal(null)}>✕</button>
            </div>

            <form className="form-grid" onSubmit={handleSavePartner}>
              <div>
                <label style={{ fontWeight: 'bold' }}>পার্টনারের নাম *</label>
                <input
                  placeholder="যেমন: করিম ভাই"
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
                <label style={{ fontWeight: 'bold', color: '#2563eb' }}>আগের বকেয়া পাওনা (৳)</label>
                <input
                  type="number"
                  placeholder="আগে থেকে পাওনা থাকলে লিখুন (যেমন: ১০০০০)"
                  value={partnerOpeningDue}
                  onChange={(e) => setPartnerOpeningDue(e.target.value)}
                  style={{ background: '#eff6ff' }}
                />
              </div>

              <div>
                <label>বিকাশ নম্বরসমূহ (কমা দিয়ে একাধিক নম্বর)</label>
                <input
                  placeholder="01711XXXXXX, 01822XXXXXX"
                  value={partnerBkashNumbers}
                  onChange={(e) => setPartnerBkashNumbers(e.target.value)}
                />
              </div>

              <div>
                <label>ব্যাংক তথ্য (ঐচ্ছিক)</label>
                <input
                  placeholder="যেমন: Islami Bank, A/C: 2050XXXX"
                  value={partnerBankDetails}
                  onChange={(e) => setPartnerBankDetails(e.target.value)}
                />
              </div>

              <div className="flex gap mt">
                <button type="submit" className="btn green" style={{ flex: 1 }} disabled={loading}>
                  {loading ? 'সংরক্ষণ হচ্ছে...' : 'সংরক্ষণ করুন'}
                </button>
                {editPartnerId && (
                  <button
                    type="button"
                    className="btn red sm"
                    onClick={() => handleDeletePartner(editPartnerId)}
                  >
                    মুছুন
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

      {/* ================= MODAL: MEMO VIEW & PRINT ================= */}
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
              width: '800px',
              maxWidth: '100%',
              background: '#fff',
              borderRadius: 12,
              padding: 24,
              boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
              maxHeight: '94vh',
              overflowY: 'auto',
            }}
          >
            {/* Top Toolbar in Memo Modal */}
            <div className="flex between align-center mb8 no-print" style={{ borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>
              <div className="flex" style={{ gap: 6, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 13, fontWeight: 'bold' }}>মেমো সময়কাল:</span>
                <button
                  type="button"
                  className={`btn sm ${memoPeriod === 'today' ? 'blue' : 'gray'}`}
                  onClick={() => setMemoPeriod('today')}
                >
                  আজকের হিসাব
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
                <button
                  type="button"
                  className={`btn sm ${memoPeriod === 'all' ? 'blue' : 'gray'}`}
                  onClick={() => setMemoPeriod('all')}
                >
                  সর্বকালীন
                </button>
              </div>

              <div className="flex" style={{ gap: 8 }}>
                <button
                  className="btn sm"
                  style={{ background: '#25D366', color: '#fff', fontWeight: 'bold' }}
                  onClick={handleShareWhatsApp}
                >
                  📲 WhatsApp
                </button>
                <button className="btn sm blue" onClick={handleCopyMemoText}>
                  📋 কপি
                </button>
                <button className="btn sm pink" onClick={() => window.print()}>
                  🖨️ প্রিন্ট
                </button>
                <button className="btn sm text gray" onClick={() => setActiveModal(null)}>
                  ✕
                </button>
              </div>
            </div>

            {/* --- PRINTABLE MEMO PAPER --- */}
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
              {/* Header */}
              <div style={{ textAlign: 'center', borderBottom: '2px solid #0f172a', paddingBottom: 10, marginBottom: 14 }}>
                <h2 style={{ margin: 0, fontSize: 22, fontWeight: 'bold' }}>
                  🏪 {user?.shopName || 'আমার দোকান'}
                </h2>
                <div style={{ fontSize: 13, color: '#475569', marginTop: 2 }}>
                  বিকাশ পার্টনার দৈনিক হিসাব মেমো ও বিবরণী
                </div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                  তারিখ: {new Date().toLocaleDateString('bn-BD')} {new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })} • মেমো নং: #B2B-{Date.now().toString().slice(-6)}
                </div>
              </div>

              {/* Partner Box */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: 8,
                  padding: '10px 14px',
                  marginBottom: 14,
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 13,
                }}
              >
                <div>
                  <span style={{ color: '#64748b' }}>পার্টনার: </span>
                  <b style={{ fontSize: 15 }}>{activeP?.name || '—'}</b>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>মোবাইল: </span>
                  <b>{activeP?.phone || '—'}</b>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>সময়কাল: </span>
                  <b>{memoPeriod === 'today' ? 'আজকের দিন' : memoPeriod === '7days' ? 'গত ৭ দিন' : memoPeriod === 'month' ? 'চলতি মাস' : 'সর্বকালীন'}</b>
                </div>
              </div>

              {/* Calculations Box */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '2px solid #0f172a',
                  borderRadius: 8,
                  padding: '12px 16px',
                  marginBottom: 14,
                  fontSize: 13.5,
                  lineHeight: 2,
                }}
              >
                <div className="flex between" style={{ borderBottom: '1px dashed #cbd5e1' }}>
                  <span>🔹 আগের বকেয়া পাওনা:</span>
                  <b style={{ color: '#2563eb' }}>{taka(memoPrevDue)}</b>
                </div>
                <div className="flex between" style={{ borderBottom: '1px dashed #cbd5e1' }}>
                  <span>➕ আজকের বিকাশ পাঠানো:</span>
                  <b style={{ color: '#be185d' }}>+{taka(memoSent)}</b>
                </div>
                {memoExpense > 0 && (
                  <div className="flex between" style={{ borderBottom: '1px dashed #cbd5e1' }}>
                    <span>➕ আজকের খরচ বাবদ পাওনা:</span>
                    <b style={{ color: '#d97706' }}>+{taka(memoExpense)}</b>
                  </div>
                )}
                <div className="flex between" style={{ borderBottom: '1px solid #0f172a', fontWeight: 'bold' }}>
                  <span>📊 মোট পাওনা দাবি:</span>
                  <span>{taka(memoPrevDue + memoSent + memoExpense)}</span>
                </div>
                <div className="flex between" style={{ borderBottom: '2px solid #0f172a', color: '#16a34a', fontWeight: 'bold' }}>
                  <span>➖ আজকে ব্যাংকে পেমেন্ট পেয়েছেন:</span>
                  <span>−{taka(memoReceived)}</span>
                </div>
                <div
                  className="flex between mt8"
                  style={{
                    fontSize: 16,
                    fontWeight: 'bold',
                    paddingTop: 6,
                    color: memoNetDue >= 0 ? '#15803d' : '#dc2626',
                  }}
                >
                  <span>💰 {memoNetDue >= 0 ? 'আজকের অবশিষ্ট নিট পাওনা:' : 'পার্টনারের অতিরিক্ত জমা:'}</span>
                  <span style={{ fontSize: 20 }}>{taka(Math.abs(memoNetDue))}</span>
                </div>
              </div>

              {/* Table of Items */}
              {memoTxns.length > 0 && (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, marginBottom: 16 }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #cbd5e1' }}>
                      <th style={{ padding: '6px 8px', textAlign: 'center' }}>ক্র.</th>
                      <th style={{ padding: '6px 8px' }}>লেনদেনের ধরণ</th>
                      <th style={{ padding: '6px 8px' }}>বিবরণ</th>
                      <th style={{ padding: '6px 8px', textAlign: 'right' }}>টাকা (৳)</th>
                      <th style={{ padding: '6px 8px', textAlign: 'right' }}>অবশিষ্ট ব্যালেন্স</th>
                    </tr>
                  </thead>
                  <tbody>
                    {memoTxns.map((t, idx) => {
                      const isSent = t.type === 'sent';
                      const isExpense = t.type === 'expense';
                      return (
                        <tr key={t._id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '6px 8px', textAlign: 'center' }}>{idx + 1}</td>
                          <td style={{ padding: '6px 8px' }}>
                            {isSent ? 'বিকাশ পাঠানো' : isExpense ? 'দৈনিক খরচ' : 'ব্যাংক জমা'}
                          </td>
                          <td style={{ padding: '6px 8px' }}>
                            {isSent ? (t.targetBkashNumber || 'বিকাশ') : isExpense ? (t.note || 'খরচ') : (t.bankName || 'ব্যাংক')}
                          </td>
                          <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 'bold', color: isSent ? '#be185d' : isExpense ? '#d97706' : '#16a34a' }}>
                            {isSent || isExpense ? '+' : '−'}{taka(t.amount)}
                          </td>
                          <td style={{ padding: '6px 8px', textAlign: 'right', fontWeight: 'bold' }}>
                            {taka(t.balanceAfter || 0)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}

              {/* Signature */}
              <div className="flex between" style={{ marginTop: 28, paddingTop: 12, borderTop: '1px dashed #cbd5e1' }}>
                <div style={{ fontSize: 11, color: '#64748b' }}>
                  * অনুগ্রহ করে হিসাবটি মিলিয়ে নিবেন। ধন্যবাদ!
                </div>
                <div style={{ textAlign: 'center', minWidth: 140 }}>
                  <div style={{ borderTop: '1px solid #0f172a', paddingTop: 4, fontSize: 12, fontWeight: 'bold' }}>
                    প্রোপাইটর স্বাক্ষর
                  </div>
                  <div style={{ fontSize: 10.5, color: '#64748b' }}>{user?.shopName || 'আমার দোকান'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
