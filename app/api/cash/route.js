import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { CashTransaction, Sale, Expense, Bkash, Recharge, StockLog } from '@/lib/models';
import { getSessionUserId } from '@/lib/auth';

export async function GET() {
  if (!getSessionUserId()) return NextResponse.json({ error: 'অনুমতি নেই' }, { status: 401 });
  await connectDB();

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const [cashTx, sales, expenses, bkash, recharges, stockLogs] = await Promise.all([
    CashTransaction.find().sort({ date: -1 }).limit(300).lean(),
    Sale.find().lean(),
    Expense.find().lean(),
    Bkash.find().lean(),
    Recharge.find().lean(),
    StockLog.find().lean(),
  ]);

  // Capital from Home (বাড়ি থেকে আনা ক্যাশ - বিকাশ ও মাল তোলার জন্য)
  const isHomeCapital = (t) =>
    t.type === 'in' &&
    (t.source === 'home_capital' || (t.category && (t.category.includes('বাড়ি') || t.category.includes('মূলধন'))));

  const capitalFromHome = cashTx.filter(isHomeCapital).reduce((a, t) => a + t.amount, 0);
  const todayCapitalFromHome = cashTx
    .filter((t) => isHomeCapital(t) && new Date(t.date) >= startOfToday)
    .reduce((a, t) => a + t.amount, 0);

  // Cash Withdrawn to Home (বাড়ি পাঠানো ক্যাশ / লাভ উত্তোলন)
  const isWithdrawnHome = (t) =>
    t.type === 'out' &&
    (t.source === 'withdraw_home' || (t.category && (t.category.includes('বাড়ি') || t.category.includes('উত্তোলন'))));

  const withdrawnToHome = cashTx.filter(isWithdrawnHome).reduce((a, t) => a + t.amount, 0);
  const todayWithdrawnToHome = cashTx
    .filter((t) => isWithdrawnHome(t) && new Date(t.date) >= startOfToday)
    .reduce((a, t) => a + t.amount, 0);

  // Other manual in/out
  const otherIn = cashTx
    .filter((t) => t.type === 'in' && !isHomeCapital(t))
    .reduce((a, t) => a + t.amount, 0);
  const todayOtherIn = cashTx
    .filter((t) => t.type === 'in' && !isHomeCapital(t) && new Date(t.date) >= startOfToday)
    .reduce((a, t) => a + t.amount, 0);

  const otherOut = cashTx
    .filter((t) => t.type === 'out' && !isWithdrawnHome(t))
    .reduce((a, t) => a + t.amount, 0);
  const todayOtherOut = cashTx
    .filter((t) => t.type === 'out' && !isWithdrawnHome(t) && new Date(t.date) >= startOfToday)
    .reduce((a, t) => a + t.amount, 0);

  // Cash from Sales (বিক্রি থেকে নগদ)
  const salesCash = sales
    .filter((s) => s.paymentMethod === 'cash' || s.paymentMethod === 'both')
    .reduce((a, s) => a + (s.paidAmount || 0), 0);

  const todaySalesCash = sales
    .filter((s) => (s.paymentMethod === 'cash' || s.paymentMethod === 'both') && new Date(s.date) >= startOfToday)
    .reduce((a, s) => a + (s.paidAmount || 0), 0);

  // Recharge Cash In (মোবাইল রিচার্জে কাস্টমার থেকে নগদ ক্যাশ গ্রহণ)
  const rechargeCash = recharges.reduce((a, r) => a + (r.amount || 0), 0);
  const todayRechargeCash = recharges
    .filter((r) => new Date(r.date) >= startOfToday)
    .reduce((a, r) => a + (r.amount || 0), 0);

  // bKash Cash In Received (কাস্টমার থেকে নগদ ক্যাশ গ্রহণ - ক্যাশইন / সেন্ডমানি বা নিজের সিম ক্যাশআউট)
  const bkashCashIn = bkash
    .filter((t) => ['cust_cashin', 'agent_cashin', 'self_cashout', 'balance_out'].includes(t.type))
    .reduce((a, t) => a + (typeof t.cashAmount === 'number' ? t.cashAmount : (t.cashAmount || t.amount)), 0);

  const todayBkashCashIn = bkash
    .filter((t) => ['cust_cashin', 'agent_cashin', 'self_cashout', 'balance_out'].includes(t.type) && new Date(t.date) >= startOfToday)
    .reduce((a, t) => a + (typeof t.cashAmount === 'number' ? t.cashAmount : (t.cashAmount || t.amount)), 0);

  // bKash Cash Out Given (কাস্টমারকে নগদ ক্যাশ প্রদান - ক্যাশআউট)
  const bkashCashOut = bkash
    .filter((t) => ['cust_cashout', 'agent_cashout', 'balance_in'].includes(t.type))
    .reduce((a, t) => a + (typeof t.cashAmount === 'number' ? t.cashAmount : (t.cashAmount || (t.amount - (t.profit || 0)))), 0);

  const todayBkashCashOut = bkash
    .filter((t) => ['cust_cashout', 'agent_cashout', 'balance_in'].includes(t.type) && new Date(t.date) >= startOfToday)
    .reduce((a, t) => a + (typeof t.cashAmount === 'number' ? t.cashAmount : (t.cashAmount || (t.amount - (t.profit || 0)))), 0);

  // bKash Bundle purchased with cash
  const bundleCashOut = bkash
    .filter((t) => t.type === 'bundle_expense' && t.paymentSource === 'cash')
    .reduce((a, t) => a + t.amount, 0);

  const todayBundleCashOut = bkash
    .filter((t) => t.type === 'bundle_expense' && t.paymentSource === 'cash' && new Date(t.date) >= startOfToday)
    .reduce((a, t) => a + t.amount, 0);

  // Stock / Goods Purchases Cash (নতুন মাল কেনার নগদ খরচ)
  const stockPurchaseCash = stockLogs.reduce((a, l) => a + (l.qtyAdded * l.buyPrice), 0);
  const todayStockPurchaseCash = stockLogs
    .filter((l) => new Date(l.date) >= startOfToday)
    .reduce((a, l) => a + (l.qtyAdded * l.buyPrice), 0);

  // Daily shop expenses in cash (দোকানের নগদ খরচ)
  const expensesCash = expenses
    .filter((e) => e.paymentMethod === 'cash')
    .reduce((a, e) => a + e.amount, 0);

  const todayExpensesCash = expenses
    .filter((e) => e.paymentMethod === 'cash' && new Date(e.date) >= startOfToday)
    .reduce((a, e) => a + e.amount, 0);

  // Totals
  const totalCashIn = capitalFromHome + otherIn + salesCash + rechargeCash + bkashCashIn;
  const totalCashOut = withdrawnToHome + otherOut + bkashCashOut + bundleCashOut + stockPurchaseCash + expensesCash;
  const cashInHand = totalCashIn - totalCashOut;

  // Today totals
  const todayCashIn = todayCapitalFromHome + todayOtherIn + todaySalesCash + todayRechargeCash + todayBkashCashIn;
  const todayCashOut = todayWithdrawnToHome + todayOtherOut + todayBkashCashOut + todayBundleCashOut + todayStockPurchaseCash + todayExpensesCash;
  const todayNetCashFlow = todayCashIn - todayCashOut;

  return NextResponse.json({
    transactions: cashTx,
    summary: {
      cashInHand,
      capitalFromHome,
      withdrawnToHome,
      salesCash,
      rechargeCash,
      bkashCashIn,
      bkashCashOut,
      bundleCashOut,
      stockPurchaseCash,
      expensesCash,
      totalCashIn,
      totalCashOut,
    },
    today: {
      todayCapitalFromHome,
      todayWithdrawnToHome,
      todaySalesCash,
      todayRechargeCash,
      todayBkashCashIn,
      todayBkashCashOut,
      todayBundleCashOut,
      todayStockPurchaseCash,
      todayExpensesCash,
      todayCashIn,
      todayCashOut,
      todayNetCashFlow,
    },
  });
}

export async function POST(req) {
  if (!getSessionUserId()) return NextResponse.json({ error: 'অনুমতি নেই' }, { status: 401 });
  await connectDB();
  const body = await req.json();
  const { type = 'in', source = 'home_capital', category = 'মূলধন', amount, description = '', date } = body;

  const amt = Number(amount) || 0;
  if (!amt || amt <= 0) {
    return NextResponse.json({ error: 'সঠিক টাকার পরিমাণ দিন' }, { status: 400 });
  }

  const tx = await CashTransaction.create({
    type,
    source,
    category: category || (type === 'in' ? 'বাড়ি থেকে আনা ক্যাশ' : 'ক্যাশ উত্তোলন'),
    amount: amt,
    description: description.trim(),
    date: date ? new Date(date) : new Date(),
  });

  return NextResponse.json({ transaction: tx }, { status: 201 });
}

export async function DELETE(req) {
  if (!getSessionUserId()) return NextResponse.json({ error: 'অনুমতি নেই' }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'আইডি প্রয়োজন' }, { status: 400 });
  await connectDB();
  await CashTransaction.findByIdAndDelete(id);
  return NextResponse.json({ ok: true });
}

