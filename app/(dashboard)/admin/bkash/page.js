'use client';

import { useEffect, useState } from 'react';
import { taka, num } from '@/lib/money';
import toast from 'react-hot-toast';

export default function BkashPage() {
  const [txns, setTxns] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [totalBalance, setTotalBalance] = useState(0);

  // Profit stats
  const [stats, setStats] = useState({
    monthlyProfit: 0,
    monthlyGrossProfit: 0,
    monthlyBundleExpenses: 0,
    totalProfit: 0,
    totalGrossProfit: 0,
    totalBundleExpenses: 0,
  });

  // Cash summary from cash ledger
  const [cashSummary, setCashSummary] = useState({ cashInHand: 0, capitalFromHome: 0 });
  const [showAddCashModal, setShowAddCashModal] = useState(false);
  const [homeCashAmount, setHomeCashAmount] = useState('');
  const [homeCashDesc, setHomeCashDesc] = useState('বিকাশের ক্যাশ আউট ও নতুন মাল কেনার জন্য বাড়ি থেকে আনা ক্যাশ');

  // Form Mode & Tab: 'personal' | 'agent' | 'bundle'
  const [bkashType, setBkashType] = useState('personal');
  const [selectedAccountId, setSelectedAccountId] = useState('');

  // Personal Transaction States
  // personal types: 'cust_cashout' | 'self_cashout' | 'cust_cashin' | 'income' | 'expense'
  const [personalTxType, setPersonalTxType] = useState('cust_cashout');
  const [cashGivenToCust, setCashGivenToCust] = useState(''); // e.g. 10000 cash given
  const [personalAmount, setPersonalAmount] = useState(''); // total digital received e.g. 10100
  const [ratePerThousand, setRatePerThousand] = useState('10'); // default 10 tk per 1000
  const [customerCharge, setCustomerCharge] = useState(''); // profit e.g. 100
  const [personalDesc, setPersonalDesc] = useState('');

  // Personal Cash In (Send Money) specific states
  const [cashInDigitalAmount, setCashInDigitalAmount] = useState('');
  const [cashInReceivedCash, setCashInReceivedCash] = useState('');
  const [cashInFee, setCashInFee] = useState('');

  // Agent Transaction States
  // agent types: 'agent_cashin' | 'agent_cashout'
  const [agentTxType, setAgentTxType] = useState('agent_cashin');
  const [agentAmount, setAgentAmount] = useState('');
  const [agentCommRate, setAgentCommRate] = useState('4.14'); // 4.14 tk per 1000
  const [agentCommAmount, setAgentCommAmount] = useState('');
  const [agentDesc, setAgentDesc] = useState('');

  // Bundle Expense States
  const [bundleAccountId, setBundleAccountId] = useState('');
  const [bundleAmount, setBundleAmount] = useState('');
  const [bundlePaymentSource, setBundlePaymentSource] = useState('sim_balance'); // 'sim_balance' | 'cash'
  const [bundleDesc, setBundleDesc] = useState('সেন্ড মানি বান্ডেল প্যাক কেনা হলো');

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
        setStats({
          monthlyProfit: d.monthlyProfit || 0,
          monthlyGrossProfit: d.monthlyGrossProfit || 0,
          monthlyBundleExpenses: d.monthlyBundleExpenses || 0,
          totalProfit: d.totalProfit || 0,
          totalGrossProfit: d.totalGrossProfit || 0,
          totalBundleExpenses: d.totalBundleExpenses || 0,
        });

        // Auto select first account if available
        if (d.accounts && d.accounts.length > 0) {
          const pers = d.accounts.find((a) => a.accountType === 'personal');
          if (pers && !selectedAccountId) {
            setSelectedAccountId(pers._id);
            setBundleAccountId(pers._id);
          } else if (!selectedAccountId) {
            setSelectedAccountId(d.accounts[0]._id);
            setBundleAccountId(d.accounts[0]._id);
          }
        }
      })
      .catch(() => {});

    fetch('/api/cash?t=' + Date.now())
      .then((r) => r.json())
      .then((d) => {
        if (d && d.summary) {
          setCashSummary({
            cashInHand: d.summary.cashInHand || 0,
            capitalFromHome: d.summary.capitalFromHome || 0,
          });
        }
      })
      .catch(() => {});
  }

  // Quick Add Capital From Home directly from bKash page
  async function handleAddHomeCash(e) {
    e.preventDefault();
    const amt = Number(homeCashAmount);
    if (!amt || amt <= 0) {
      toast.error('সঠিক টাকার পরিমাণ লিখুন');
      return;
    }
    setLoading(true);
    const res = await fetch('/api/cash', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'in',
        source: 'home_capital',
        category: 'বাড়ি থেকে আনা (বিকাশ ও মাল কেনা)',
        amount: amt,
        description: homeCashDesc.trim() || 'বিকাশ ও মাল রাখার জন্য বাড়ি থেকে আনা ক্যাশ',
      }),
    });
    setLoading(false);
    if (!res.ok) {
      toast.error('ক্যাশ জমা করতে সমস্যা হয়েছে');
      return;
    }
    toast.success('✅ বাড়ি থেকে আনা ক্যাশ সফলভাবে ক্যাশবাক্সে জমা হয়েছে!');
    setShowAddCashModal(false);
    setHomeCashAmount('');
    loadData();
  }

  // Personal Cash In / Send Money calculations
  // Scenario: shopkeeper sends 5000 from SIM to customer, takes 5010 cash from customer (10 profit),
  // OR takes exact 5000 cash from customer (0 profit).
  const handleCashInDigitalChange = (val) => {
    setCashInDigitalAmount(val);
    const digital = Number(val) || 0;
    const fee = Number(cashInFee) || 0;
    const totalCash = digital + fee;
    setCashInReceivedCash(totalCash ? String(totalCash) : '');
    setPersonalAmount(val);
    setPersonalDesc(`কাস্টমার ক্যাশ-ইন / সেন্ড মানি (সিমে -${digital}৳, ক্যাশ পাওয়া +${totalCash}৳, লাভ +${fee}৳)`);
  };

  const handleCashInFeeChange = (val) => {
    setCashInFee(val);
    const digital = Number(cashInDigitalAmount) || 0;
    const fee = Number(val) || 0;
    const totalCash = digital + fee;
    setCashInReceivedCash(totalCash ? String(totalCash) : '');
    setPersonalDesc(`কাস্টমার ক্যাশ-ইন / সেন্ড মানি (সিমে -${digital}৳, ক্যাশ পাওয়া +${totalCash}৳, লাভ +${fee}৳)`);
  };

  const handleCashInReceivedChange = (val) => {
    setCashInReceivedCash(val);
    const received = Number(val) || 0;
    const digital = Number(cashInDigitalAmount) || 0;
    const fee = Math.max(0, received - digital);
    setCashInFee(fee ? String(fee) : '');
    setPersonalDesc(`কাস্টমার ক্যাশ-ইন / সেন্ড মানি (সিমে -${digital}৳, ক্যাশ পাওয়া +${received}৳, লাভ +${fee}৳)`);
  };

  // Personal Customer Cash Out calculations
  // Scenario: customer sends 10100 to SIM, shop gives 10000 cash, profit is 100.
  const handleCashGivenChange = (val) => {
    setCashGivenToCust(val);
    const cash = Number(val) || 0;
    const rate = Number(ratePerThousand) || 0;
    const chg = Math.round((cash / 1000) * rate);
    setCustomerCharge(chg ? String(chg) : '');
    const totalDigital = cash + chg;
    setPersonalAmount(totalDigital ? String(totalDigital) : '');
    setPersonalDesc(`কাস্টমার ক্যাশআউট (সিমে ${totalDigital}৳, ক্যাশ দেওয়া ${cash}৳, লাভ ${chg}৳)`);
  };

  const handleRateChange = (val) => {
    setRatePerThousand(val);
    const cash = Number(cashGivenToCust) || 0;
    const rate = Number(val) || 0;
    const chg = Math.round((cash / 1000) * rate);
    setCustomerCharge(chg ? String(chg) : '');
    const totalDigital = cash + chg;
    setPersonalAmount(totalDigital ? String(totalDigital) : '');
    setPersonalDesc(`কাস্টমার ক্যাশআউট (সিমে ${totalDigital}৳, ক্যাশ দেওয়া ${cash}৳, লাভ ${chg}৳)`);
  };

  const handleProfitChange = (val) => {
    setCustomerCharge(val);
    const cash = Number(cashGivenToCust) || 0;
    const chg = Number(val) || 0;
    const totalDigital = cash + chg;
    setPersonalAmount(totalDigital ? String(totalDigital) : '');
    setPersonalDesc(`কাস্টমার ক্যাশআউট (সিমে ${totalDigital}৳, ক্যাশ দেওয়া ${cash}৳, লাভ ${chg}৳)`);
  };

  const handleDigitalAmountChange = (val) => {
    setPersonalAmount(val);
    if (personalTxType !== 'cust_cashout') return;
    const totalDigital = Number(val) || 0;
    const rate = Number(ratePerThousand) || 0;
    // total = cash * (1 + rate/1000)
    const factor = 1 + rate / 1000;
    const cash = Math.round(totalDigital / factor);
    const chg = totalDigital - cash;
    setCashGivenToCust(cash ? String(cash) : '');
    setCustomerCharge(chg ? String(chg) : '');
    setPersonalDesc(`কাস্টমার ক্যাশআউট (সিমে ${totalDigital}৳, ক্যাশ দেওয়া ${cash}৳, লাভ ${chg}৳)`);
  };

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
    const isCashout = personalTxType === 'cust_cashout';
    const isCashin = personalTxType === 'cust_cashin';

    let digitalAmt = Number(personalAmount);
    let cashAmt = digitalAmt;
    let profit = 0;
    let rate = 0;
    let chg = 0;

    if (isCashout) {
      digitalAmt = Number(personalAmount);
      cashAmt = Number(cashGivenToCust) || digitalAmt;
      chg = Number(customerCharge) || 0;
      rate = Number(ratePerThousand) || 0;
      profit = chg;
    } else if (isCashin) {
      digitalAmt = Number(cashInDigitalAmount || personalAmount);
      cashAmt = Number(cashInReceivedCash || personalAmount);
      profit = Number(cashInFee) || 0;
      chg = profit;
    }

    if (!digitalAmt || digitalAmt <= 0) {
      toast.error('সঠিক টাকার পরিমাণ লিখুন');
      return;
    }

    const selectedAcc = accounts.find((a) => a._id === selectedAccountId);

    setLoading(true);
    const res = await fetch('/api/bkash', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bkashType: 'personal',
        accountId: selectedAccountId,
        accountNumber: selectedAcc ? selectedAcc.number : '',
        type: personalTxType,
        description: personalDesc || (isCashin ? 'কাস্টমার সেন্ড মানি / ক্যাশ ইন' : 'পার্সোনাল লেনদেন'),
        amount: digitalAmt, // digital amount credited to or debited from SIM balance
        cashAmount: cashAmt, // physical cash handed out or taken
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
    setCashGivenToCust('');
    setCustomerCharge('');
    setCashInDigitalAmount('');
    setCashInReceivedCash('');
    setCashInFee('');
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
        cashAmount: amt,
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

  async function submitBundleTx(e) {
    e.preventDefault();
    const amt = Number(bundleAmount);
    if (!amt || amt <= 0) {
      toast.error('বান্ডেলের সঠিক খরচ লিখুন');
      return;
    }
    if (!bundleAccountId) {
      toast.error('যে সিমের জন্য বান্ডেল কিনেছেন সেটি নির্বাচন করুন');
      return;
    }

    const targetAcc = accounts.find((a) => a._id === bundleAccountId);

    setLoading(true);
    const res = await fetch('/api/bkash', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bkashType: 'personal',
        accountId: bundleAccountId,
        accountNumber: targetAcc ? targetAcc.number : '',
        type: 'bundle_expense',
        description: `[${targetAcc ? targetAcc.number : 'সিম'}] সেন্ড মানি বান্ডেল ক্রয় (${bundleDesc.trim() || 'বান্ডেল প্যাক'})`,
        amount: amt,
        cashAmount: bundlePaymentSource === 'cash' ? amt : 0,
        profit: -amt, // negatively impacts profit
        paymentSource: bundlePaymentSource,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      toast.error('বান্ডেল খরচ সংরক্ষণ করতে সমস্যা হয়েছে');
      return;
    }
    toast.success('✅ সেন্ড মানি বান্ডেল খরচ সংরক্ষিত হয়েছে এবং নিট লাভ থেকে বিয়োগ হয়েছে!');
    setBundleAmount('');
    loadData();
  }

  async function handleDeleteTx(id) {
    if (!confirm('লেনদেনটি মুছে ফেলবেন? এটি সম্পর্কিত ব্যালেন্সও পূর্বের অবস্থায় ফিরে যাবে।')) return;
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

  return (
    <div>
      {/* Top Header */}
      <div className="topbar">
        <div>
          <h2>📱 bKash ও ক্যাশ সার্ভিস ড্যাশবোর্ড</h2>
          <div className="sub">
            বিকাশ ক্যাশআউট, ক্যাশইন, বাড়ি থেকে আনা মূলধন ও সেন্ড মানি বান্ডেল হিসাব
          </div>
        </div>
        <div className="flex" style={{ gap: 8 }}>
          <button className="btn green" onClick={() => setShowAddCashModal(true)}>
            🏠 বাড়ি থেকে ক্যাশ ড্রয়ারে আনুন
          </button>
          <button className="btn pink" onClick={() => setShowAccModal(true)}>
            ➕ নতুন bKash নম্বর যোগ করুন
          </button>
        </div>
      </div>

      {/* Top 4 Key KPI Cards: Cash In Hand, SIM Wallets, Capital from Home, Net Profit */}
      <div className="grid cols-4 mb" style={{ marginBottom: 16 }}>
        <div
          className="card"
          style={{
            borderLeft: `5px solid ${cashSummary.cashInHand >= 0 ? '#16a34a' : '#dc2626'}`,
            background: cashSummary.cashInHand >= 0 ? '#f0fdf4' : '#fef2f2',
          }}
        >
          <div className="flex between align-center">
            <span className="label" style={{ fontWeight: 'bold' }}>💰 ক্যাশবাক্সে নগদ টাকা</span>
            <button
              className="btn sm green"
              style={{ padding: '2px 8px', fontSize: 11 }}
              onClick={() => setShowAddCashModal(true)}
            >
              + ক্যাশ আনুন
            </button>
          </div>
          <div className={`value ${cashSummary.cashInHand >= 0 ? 'green' : 'red'}`} style={{ fontSize: 28, marginTop: 4 }}>
            {taka(cashSummary.cashInHand)}
          </div>
          <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
            ক্যাশআউটে কাস্টমারকে দেওয়ার জন্য নগদ ক্যাশ
          </div>
        </div>

        <div className="card" style={{ borderLeft: '4px solid #ec4899', background: '#fdf2f8' }}>
          <div className="label">📱 মোট বিকাশ ব্যালেন্স (All SIMs)</div>
          <div className="value pink" style={{ fontSize: 28 }}>{taka(totalBalance)}</div>
          <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
            নিবন্ধিত {accounts.length} টি সিমে মোট ডিজিটাল ব্যালেন্স
          </div>
        </div>

        <div className="card" style={{ borderLeft: '4px solid #2563eb' }}>
          <div className="label">🏠 বাড়ি থেকে আনা মোট ক্যাশ</div>
          <div className="value blue" style={{ fontSize: 28 }}>{taka(cashSummary.capitalFromHome)}</div>
          <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
            বিকাশ ও মাল কেনার মূলধন
          </div>
        </div>

        <div className="card" style={{ borderLeft: '4px solid #10b981' }}>
          <div className="label">📈 চলতি মাসের নিট লাভ (Net)</div>
          <div className={`value ${stats.monthlyProfit >= 0 ? 'green' : 'red'}`} style={{ fontSize: 28 }}>
            {taka(stats.monthlyProfit)}
          </div>
          <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
            গ্রস {taka(stats.monthlyGrossProfit)} − বান্ডেল {taka(stats.monthlyBundleExpenses)}
          </div>
        </div>
      </div>

      {/* Cash Flow Interactive Rules & Mechanics Guide */}
      <div
        className="card mb"
        style={{
          background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
          border: '1px solid #cbd5e1',
          padding: '12px 18px',
          marginBottom: 16,
        }}
      >
        <div style={{ fontWeight: 'bold', color: '#0f172a', fontSize: 14, marginBottom: 6 }}>
          🔄 বিকাশ ও ক্যাশবাক্সের লেনদেন নিয়ম (Cash vs Digital Balance Guide):
        </div>
        <div className="grid cols-3" style={{ gap: 10, fontSize: 12.5, lineHeight: 1.6 }}>
          <div style={{ background: '#ffffff', padding: '8px 12px', borderRadius: 8, borderLeft: '3px solid #16a34a' }}>
            <b style={{ color: '#15803d' }}>📥 কাস্টমার ক্যাশআউট (টাকা তুললে):</b>
            <div>• কাস্টমার সিমে ব্যালেন্স পাঠাবে ➜ <b className="pink">+সিমে ব্যালেন্স বাড়বে</b></div>
            <div>• ক্যাশবাক্স থেকে নগদ ক্যাশ দিবেন ➜ <b className="red">−ক্যাশবাক্স কমবে</b></div>
            <div>• কাস্টমার থেকে অতিরিক্ত ফি ➜ <b className="green">+আপনার লাভ</b></div>
          </div>
          <div style={{ background: '#ffffff', padding: '8px 12px', borderRadius: 8, borderLeft: '3px solid #2563eb' }}>
            <b style={{ color: '#1d4ed8' }}>📤 কাস্টমার ক্যাশইন / সেন্ড মানি:</b>
            <div>• কাস্টমার আপনাকে নগদ ক্যাশ দেবে ➜ <b className="green">+ক্যাশবাক্স বাড়বে</b></div>
            <div>• সিম থেকে ব্যালেন্স পাঠাবেন ➜ <b className="red">−সিমে ব্যালেন্স কমবে</b></div>
            <div>• কাস্টমার ফি দিলে ➜ <b className="green">+আপনার লাভ</b></div>
          </div>
          <div style={{ background: '#ffffff', padding: '8px 12px', borderRadius: 8, borderLeft: '3px solid #f59e0b' }}>
            <b style={{ color: '#b45309' }}>🏠 বাড়ি থেকে ক্যাশ আনা ও মাল কেনা:</b>
            <div>• ক্যাশআউট বা মাল কেনার জন্য ক্যাশ আনলে ➜ <b className="blue">+ক্যাশবাক্সে জমা</b></div>
            <div>• পাইকারি মাল কেনা ও খরচ ➜ <b className="red">−ক্যাশবাক্স কমবে</b></div>
            <div>• সেন্ড মানি বান্ডেল ক্রয় ➜ <b className="amber">−বিকাশ লাভ থেকে বাদ</b></div>
          </div>
        </div>
      </div>

      {/* Account Cards Section */}
      <div className="card mb" style={{ background: '#fdf2f8', border: '1px dashed #f472b6', padding: '14px 18px', marginBottom: 16 }}>
        <div className="flex between align-center mb8">
          <h4 style={{ margin: 0, fontSize: 15, fontWeight: 'bold', color: '#831843' }}>
            💳 নিবন্ধিত bKash মোবাইল নম্বর ও ব্যালেন্স
          </h4>
          <span className="muted" style={{ fontSize: 12 }}>
            পার্সোনাল সিম: {personalAccounts.length} টি • এজেন্ট নম্বর: {agentAccounts.length} টি
          </span>
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
                setBundleAccountId(acc._id);
                if (acc.accountType === 'agent' && bkashType !== 'bundle') setBkashType('agent');
                else if (acc.accountType === 'personal' && bkashType !== 'bundle') setBkashType('personal');
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
          <div className="flex gap mb8" style={{ borderBottom: '2px solid var(--border)', paddingBottom: 10 }}>
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
              👤 পার্সোনাল
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
              🏪 এজেন্ট
            </button>
            <button
              type="button"
              className={`btn ${bkashType === 'bundle' ? 'pink' : 'gray'}`}
              style={{ flex: 1 }}
              onClick={() => {
                setBkashType('bundle');
                if (!bundleAccountId && personalAccounts[0]) {
                  setBundleAccountId(personalAccounts[0]._id);
                }
              }}
            >
              📦 বান্ডেল খরচ
            </button>
          </div>

          {/* Account Selector (for Personal & Agent) */}
          {bkashType !== 'bundle' && (
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
          )}

          {/* Personal Transaction Form */}
          {bkashType === 'personal' && (
            <form className="form-grid mt8" onSubmit={submitPersonalTx}>
              <div>
                <label>লেনদেনের ধরণ</label>
                <select
                  value={personalTxType}
                  onChange={(e) => {
                    setPersonalTxType(e.target.value);
                    if (e.target.value === 'cust_cashout') {
                      setPersonalDesc('কাস্টমার ক্যাশআউট');
                    } else if (e.target.value === 'self_cashout') {
                      setPersonalDesc('পার্সোনাল সিম ব্যালেন্স ক্যাশআউট / উইথড্র');
                    } else if (e.target.value === 'cust_cashin') {
                      setPersonalDesc('কাস্টমার সেন্ড মানি / ক্যাশ ইন');
                    } else {
                      setPersonalDesc('');
                    }
                  }}
                >
                  <option value="cust_cashout">📥 কাস্টমার ক্যাশআউট (ক্যাশ সার্ভিস - ব্যালেন্সে বেশি নিবেন)</option>
                  <option value="self_cashout">💸 সিম ব্যালেন্স ক্যাশআউট / উইথড্র</option>
                  <option value="cust_cashin">📤 কাস্টমার সেন্ড মানি / ক্যাশ ইন</option>
                  <option value="income">💰 ক্যাশ লোড / আয়</option>
                  <option value="expense">🔻 অন্যান্য খরচ</option>
                </select>
              </div>

              {personalTxType === 'cust_cashout' ? (
                <>
                  <div>
                    <label>কাস্টমারকে দেওয়া নগদ ক্যাশ (৳) *</label>
                    <input
                      type="number"
                      placeholder="যেমন: ১০০০০"
                      value={cashGivenToCust}
                      onChange={(e) => handleCashGivenChange(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label>হাজার প্রতি লাভ / চার্জ (৳)</label>
                    <input
                      type="number"
                      step="0.5"
                      placeholder="যেমন: ১০"
                      value={ratePerThousand}
                      onChange={(e) => handleRateChange(e.target.value)}
                    />
                  </div>

                  <div>
                    <label>আপনার লাভ / চার্জ (৳)</label>
                    <input
                      type="number"
                      step="1"
                      placeholder="যেমন: ১০০"
                      value={customerCharge}
                      onChange={(e) => handleProfitChange(e.target.value)}
                    />
                  </div>

                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ fontWeight: 'bold', color: '#be185d' }}>
                      📲 কাস্টমার থেকে সিমে প্রাপ্ত মোট ব্যালেন্স (৳) *
                    </label>
                    <input
                      type="number"
                      style={{ fontSize: 16, fontWeight: 'bold', background: '#fdf2f8', borderColor: '#f472b6' }}
                      placeholder="যেমন: ১০১০০"
                      value={personalAmount}
                      onChange={(e) => handleDigitalAmountChange(e.target.value)}
                      required
                    />
                    <small className="muted" style={{ display: 'block', marginTop: 4 }}>
                      কাস্টমার লাভ সহ মোট যে টাকা সিমে পাঠিয়েছে (যেমন: ১০০০০ ক্যাশ + ১০০ লাভ = ১০১০০ ৳)
                    </small>
                  </div>

                  {/* Visual calculation preview */}
                  <div
                    style={{
                      gridColumn: '1 / -1',
                      background: '#f0fdf4',
                      padding: '12px 16px',
                      borderRadius: 10,
                      border: '1px solid #86efac',
                    }}
                  >
                    <div style={{ fontWeight: 'bold', color: '#166534', marginBottom: 6 }}>
                      💡 লেনদেনের নিখুঁত হিসাব বিবরণী:
                    </div>
                    <div style={{ fontSize: 13, lineHeight: 1.8, color: '#14532d' }}>
                      • আপনার বিকাশ সিমে ঢুকবে: <b style={{ color: '#15803d' }}>+{taka(Number(personalAmount) || 0)}</b> (ডিজিটাল ব্যালেন্স বাড়বে)
                      <br />• ক্যাশবাক্স থেকে কাস্টমারকে নগদ ক্যাশ দেবেন: <b style={{ color: '#dc2626' }}>-{taka(Number(cashGivenToCust) || 0)}</b> (ক্যাশ কমবে)
                      <br />• আপনার নিট লাভ: <b style={{ color: '#16a34a' }}>+{taka(Number(customerCharge) || 0)}</b>
                    </div>
                  </div>
                </>
              ) : personalTxType === 'cust_cashin' ? (
                <>
                  <div>
                    <label>সিমে প্রেরিত ডিজিটাল ব্যালেন্স (৳) *</label>
                    <input
                      type="number"
                      placeholder="যেমন: ৫০০০"
                      value={cashInDigitalAmount}
                      onChange={(e) => handleCashInDigitalChange(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label>আপনার লাভ / চার্জ (৳)</label>
                    <input
                      type="number"
                      placeholder="যেমন: ১০ (বা ০)"
                      value={cashInFee}
                      onChange={(e) => handleCashInFeeChange(e.target.value)}
                    />
                  </div>

                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ fontWeight: 'bold', color: '#15803d' }}>
                      💵 কাস্টমার থেকে প্রাপ্ত মোট নগদ ক্যাশ (৳) *
                    </label>
                    <input
                      type="number"
                      style={{ fontSize: 16, fontWeight: 'bold', background: '#f0fdf4', borderColor: '#86efac' }}
                      placeholder="যেমন: ৫০১০"
                      value={cashInReceivedCash}
                      onChange={(e) => handleCashInReceivedChange(e.target.value)}
                      required
                    />
                    <small className="muted" style={{ display: 'block', marginTop: 4 }}>
                      কাস্টমার আপনাকে নগদ যে টাকা হাতে দিলো (যা সরাসরি দোকানের ক্যাশবাক্সে জমা হবে)
                    </small>
                  </div>

                  {/* Visual calculation preview for Cash In */}
                  <div
                    style={{
                      gridColumn: '1 / -1',
                      background: '#f0fdf4',
                      padding: '12px 16px',
                      borderRadius: 10,
                      border: '1px solid #86efac',
                    }}
                  >
                    <div style={{ fontWeight: 'bold', color: '#166534', marginBottom: 6 }}>
                      💡 ক্যাশ-ইন / সেন্ড মানি হিসাব বিবরণী:
                    </div>
                    <div style={{ fontSize: 13, lineHeight: 1.8, color: '#14532d' }}>
                      • কাস্টমার থেকে নগদ ক্যাশ পাবেন: <b style={{ color: '#16a34a' }}>+{taka(Number(cashInReceivedCash) || 0)}</b> (ক্যাশবাক্সে নগদ টাকা বাড়বে)
                      <br />• আপনার বিকাশ সিম থেকে ব্যালেন্স কমবে: <b style={{ color: '#dc2626' }}>-{taka(Number(cashInDigitalAmount) || 0)}</b> (ডিজিটাল ব্যালেন্স কমবে)
                      <br />• আপনার লাভ / ফি: <b style={{ color: '#16a34a' }}>+{taka(Number(cashInFee) || 0)}</b>
                    </div>
                  </div>
                </>
              ) : (
                <div>
                  <label>টাকার পরিমাণ (৳) *</label>
                  <input
                    type="number"
                    placeholder="যেমন: ৫০০০"
                    value={personalAmount}
                    onChange={(e) => setPersonalAmount(e.target.value)}
                    required
                  />
                </div>
              )}

              {personalTxType === 'self_cashout' && (
                <div style={{ gridColumn: '1 / -1', background: '#eff6ff', padding: '10px 14px', borderRadius: 8, border: '1px solid #bfdbfe' }}>
                  <div style={{ fontSize: 13, color: '#1e40af', lineHeight: 1.8 }}>
                    ℹ️ পার্সোনাল নম্বর থেকে ব্যালেন্স ক্যাশ করা হলে সিম থেকে ব্যালেন্স <b>-{taka(Number(personalAmount) || 0)}</b> কমে যাবে এবং ক্যাশবাক্সে নগদ ক্যাশ <b>+{taka(Number(personalAmount) || 0)}</b> জমা হবে।
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
                <div style={{ fontSize: 13, color: '#86198f', lineHeight: 1.8 }}>
                  {agentTxType === 'agent_cashin' ? (
                    <>
                      • কাস্টমার থেকে নগদ ক্যাশ পাবেন: <b className="green">+{taka(Number(agentAmount) || 0)}</b> (ক্যাশবাক্স বাড়বে)
                      <br />• এজেন্টের ডিজিটাল ওয়ালেট থেকে ব্যালেন্স কমবে: <b className="red">-{taka(Number(agentAmount) || 0)}</b>
                    </>
                  ) : (
                    <>
                      • কাস্টমারকে নগদ ক্যাশ দেবেন: <b className="red">-{taka(Number(agentAmount) || 0)}</b> (ক্যাশবাক্স কমবে)
                      <br />• এজেন্টের ডিজিটাল ওয়ালেটে ব্যালেন্স বাড়বে: <b className="pink">+{taka(Number(agentAmount) || 0)}</b>
                    </>
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

          {/* Bundle Expense Form */}
          {bkashType === 'bundle' && (
            <form className="form-grid mt8" onSubmit={submitBundleTx}>
              <div style={{ gridColumn: '1 / -1', background: '#fffbeb', border: '1px solid #fde68a', padding: '12px 14px', borderRadius: 8 }}>
                <div style={{ fontWeight: 'bold', color: '#92400e', fontSize: 14 }}>
                  📦 সেন্ড মানি বান্ডেল ক্রয় / সিম খরচ এন্ট্রি
                </div>
                <div style={{ fontSize: 12.5, color: '#b45309', marginTop: 4 }}>
                  পার্সোনাল সিমে সেন্ড মানি করতে বিকাশ যে বান্ডেল প্যাক কিনতে হয়, তার খরচ এখানে যুক্ত করুন। এটি সংশ্লিষ্ট সিম এবং চলতি মাসের বিকাশ নিট লাভ থেকে স্বয়ংক্রিয়ভাবে বিয়োগ (-) হবে।
                </div>
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontWeight: 'bold' }}>কোন সিমের জন্য বান্ডেল কেনা হলো? *</label>
                <select value={bundleAccountId} onChange={(e) => setBundleAccountId(e.target.value)} required>
                  <option value="">-- বিকাশ সিম নির্বাচন করুন --</option>
                  {accounts.map((acc) => (
                    <option key={acc._id} value={acc._id}>
                      {acc.number} {acc.name ? `(${acc.name})` : ''} [{acc.accountType === 'agent' ? 'এজেন্ট' : 'পার্সোনাল'}] - বর্তমান ব্যালেন্স: {taka(acc.balance)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label>বান্ডেল প্যাকের খরচ (৳) *</label>
                <input
                  type="number"
                  placeholder="যেমন: ৫০ বা ৭৫"
                  value={bundleAmount}
                  onChange={(e) => setBundleAmount(e.target.value)}
                  required
                />
              </div>

              <div>
                <label>পেমেন্ট মাধ্যম *</label>
                <select value={bundlePaymentSource} onChange={(e) => setBundlePaymentSource(e.target.value)}>
                  <option value="sim_balance">📱 এই সিমের বিকাশ ব্যালেন্স থেকে কাটা হয়েছে</option>
                  <option value="cash">💵 দোকানের নগদ ক্যাশ দিয়ে কেনা হয়েছে</option>
                </select>
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label>বান্ডেল বিবরণ / নোট</label>
                <input
                  value={bundleDesc}
                  onChange={(e) => setBundleDesc(e.target.value)}
                  placeholder="যেমন: ৫০ টি সেন্ড মানি বান্ডেল প্যাক"
                />
              </div>

              <button className="btn pink" style={{ gridColumn: '1 / -1', marginTop: 6 }} disabled={loading}>
                {loading ? 'সংরক্ষণ হচ্ছে...' : '📦 বান্ডেল খরচ সংরক্ষণ করুন (- লাভ থেকে কাটুন)'}
              </button>
            </form>
          )}
        </div>

        {/* Right: History & Ledger Table */}
        <div className="card">
          <div className="flex between align-center mb8">
            <h3>📋 সাম্প্রতিক bKash লেনদেন ও লেজার</h3>
          </div>

          <div className="table-wrap mt8" style={{ maxHeight: 520, overflowY: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>তারিখ ও নম্বর</th>
                  <th>টাইপ ও বিবরণ</th>
                  <th>টাকা</th>
                  <th>লাভ / খরচ</th>
                  <th>অবশিষ্ট ব্যালেন্স</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {txns.map((t) => {
                  const isPlus = ['cust_cashout', 'agent_cashout', 'income', 'sale', 'b2b_receive', 'cashout'].includes(t.type);
                  const isBundle = t.type === 'bundle_expense';
                  return (
                    <tr key={t._id}>
                      <td>
                        <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                          {new Date(t.date).toLocaleDateString('bn-BD')} {new Date(t.date).toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <b>{t.accountNumber || 'মূল অ্যাকাউন্ট'}</b>
                      </td>
                      <td>
                        <span
                          className={`badge ${isBundle ? 'amber' : t.bkashType === 'agent' ? 'blue' : 'pink'}`}
                          style={{ fontSize: 10 }}
                        >
                          {isBundle ? 'বান্ডেল খরচ' : t.bkashType === 'agent' ? 'Agent' : 'Personal'}
                        </span>
                        <div style={{ fontSize: 12, fontWeight: 'bold', marginTop: 2 }}>{t.description}</div>
                        {t.cashAmount > 0 && t.type === 'cust_cashout' && (
                          <div style={{ fontSize: 11, color: '#dc2626' }}>
                            💸 ক্যাশ প্রদান: {taka(t.cashAmount)}
                          </div>
                        )}
                        {t.cashAmount > 0 && t.type === 'cust_cashin' && (
                          <div style={{ fontSize: 11, color: '#16a34a' }}>
                            💵 ক্যাশ গ্রহণ: {taka(t.cashAmount)}
                          </div>
                        )}
                      </td>
                      <td>
                        <b style={{ color: isPlus ? 'green' : 'red' }}>
                          {isPlus ? '+' : '−'}{taka(t.amount)}
                        </b>
                      </td>
                      <td>
                        {isBundle ? (
                          <b className="red">-{taka(t.amount)}</b>
                        ) : t.profit > 0 ? (
                          <b className="green">+{taka(t.profit)}</b>
                        ) : t.profit < 0 ? (
                          <b className="red">{taka(t.profit)}</b>
                        ) : (
                          '—'
                        )}
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

      {/* Quick Add Capital From Home Modal directly from bKash counter */}
      {showAddCashModal && (
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
          <div className="card" style={{ width: '460px', maxWidth: '92%', background: '#fff' }}>
            <div className="flex between align-center mb8">
              <h3 style={{ margin: 0 }}>🏠 বাড়ি থেকে আনা ক্যাশ ড্রয়ারে জমা করুন</h3>
              <button className="btn sm text gray" onClick={() => setShowAddCashModal(false)}>✕</button>
            </div>
            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 12 }}>
              বিকাশ ক্যাশআউট সার্ভিস দেওয়া এবং পাইকারি নতুন মাল কেনার জন্য বাড়ি থেকে আনা নগদ টাকা ক্যাশবাক্সে জমা করুন।
            </div>
            <form className="form-grid mt8" onSubmit={handleAddHomeCash}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontWeight: 'bold' }}>টাকার পরিমাণ (৳) *</label>
                <input
                  type="number"
                  placeholder="যেমন: ২০০০০"
                  value={homeCashAmount}
                  onChange={(e) => setHomeCashAmount(e.target.value)}
                  style={{ fontSize: 17, fontWeight: 'bold' }}
                  required
                  autoFocus
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label>বিবরণ / উদ্দেশ্য</label>
                <input
                  value={homeCashDesc}
                  onChange={(e) => setHomeCashDesc(e.target.value)}
                  placeholder="বিকাশের ক্যাশ আউট ও নতুন মাল কেনার জন্য বাড়ি থেকে আনা ক্যাশ"
                />
              </div>

              <div
                style={{
                  gridColumn: '1 / -1',
                  background: '#f0fdf4',
                  padding: '10px 14px',
                  borderRadius: 8,
                  fontSize: 12.5,
                  color: '#166534',
                }}
              >
                💡 এই টাকাটি আপনার বর্তমান ক্যাশবাক্স এবং বাড়ি থেকে আনা মূলধনের সাথে সরাসরি যোগ হবে।
              </div>

              <div className="flex gap mt" style={{ gridColumn: '1 / -1' }}>
                <button type="submit" className="btn green" style={{ flex: 1 }} disabled={loading}>
                  {loading ? 'সংরক্ষণ হচ্ছে...' : '➕ ক্যাশবাক্সে জমা নিশ্চিত করুন'}
                </button>
                <button type="button" className="btn gray" onClick={() => setShowAddCashModal(false)}>
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
