import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Product, Sale, Baki, Bkash, BkashAccount, Expense, StockLog, Recharge, CashTransaction } from '@/lib/models';
import { getSessionUserId } from '@/lib/auth';

export async function GET() {
  if (!getSessionUserId()) return NextResponse.json({ error: 'না' }, { status: 401 });
  await connectDB();

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Sales totals
  const salesAll = await Sale.find().lean();
  const todaySales = salesAll.filter((s) => new Date(s.date) >= startOfToday);
  const totalSales = salesAll.reduce((a, s) => a + s.totalAmount, 0);
  const totalDue = salesAll.reduce((a, s) => a + s.dueAmount, 0);
  const todaySalesAmt = todaySales.reduce((a, s) => a + s.totalAmount, 0);
  const todayDue = todaySales.reduce((a, s) => a + s.dueAmount, 0);

  // Recharge profits
  const rechargesAll = await Recharge.find().lean();
  const todayRecharges = rechargesAll.filter((r) => new Date(r.date) >= startOfToday);
  const todayRechargeProfit = todayRecharges.reduce((a, r) => a + r.commission, 0);
  const rechargeProfitAll = rechargesAll.reduce((a, r) => a + r.commission, 0);

  // bKash profits & accounts
  const bkashAll = await Bkash.find().lean();
  const bkashAccounts = await BkashAccount.find().lean();
  const todayBkash = bkashAll.filter((t) => new Date(t.date) >= startOfToday);
  const todayBkashProfit = todayBkash.reduce((a, t) => a + (t.profit || 0), 0);
  const bkashProfitAll = bkashAll.reduce((a, t) => a + (t.profit || 0), 0);

  let bkashBalance = 0;
  if (bkashAccounts.length > 0) {
    bkashBalance = bkashAccounts.reduce((a, acc) => a + (acc.balance || 0), 0);
  } else {
    const bkashIn = bkashAll.filter((t) => ['income', 'sale', 'cust_cashout', 'agent_cashout', 'b2b_receive', 'cashout'].includes(t.type)).reduce((a, t) => a + t.amount, 0);
    const bkashOut = bkashAll.filter((t) => ['expense', 'self_cashout', 'cust_cashin', 'agent_cashin', 'b2b_send', 'cashin'].includes(t.type) || (t.type === 'bundle_expense' && t.paymentSource !== 'cash')).reduce((a, t) => a + t.amount, 0);
    bkashBalance = bkashIn - bkashOut;
  }

  // Today's bkash in / out
  const todayBkashIn = bkashAll
    .filter((t) => ['income', 'sale', 'cust_cashout', 'agent_cashout', 'b2b_receive', 'cashout'].includes(t.type) && new Date(t.date) >= startOfToday)
    .reduce((a, t) => a + t.amount, 0);

  const todayBkashOut = bkashAll
    .filter((t) => (['expense', 'self_cashout', 'cust_cashin', 'agent_cashin', 'b2b_send', 'cashin'].includes(t.type) || (t.type === 'bundle_expense' && t.paymentSource !== 'cash')) && new Date(t.date) >= startOfToday)
    .reduce((a, t) => a + t.amount, 0);

  // Expense
  const expenses = await Expense.find().lean();
  const todayExpenses = expenses.filter((e) => new Date(e.date) >= startOfToday);
  const todayExpensesAmt = todayExpenses.reduce((a, e) => a + e.amount, 0);
  const totalExpense = expenses.reduce((a, e) => a + e.amount, 0);

  // Profit calculation
  const todaySalesProfit = todaySales.reduce((acc, s) => {
    const saleItemsProfit = s.items.reduce((sum, it) => {
      return sum + ((it.price - (it.buyPrice || 0)) * it.qty);
    }, 0);
    return acc + saleItemsProfit - s.discount;
  }, 0);

  const grossProfitAll = salesAll.reduce((acc, s) => {
    const saleItemsProfit = s.items.reduce((sum, it) => {
      return sum + ((it.price - (it.buyPrice || 0)) * it.qty);
    }, 0);
    return acc + saleItemsProfit - s.discount;
  }, 0);

  const todayProfit = todaySalesProfit + todayRechargeProfit + todayBkashProfit - todayExpensesAmt;
  const totalProfit = grossProfitAll + rechargeProfitAll + bkashProfitAll - totalExpense;

  // Stock
  const products = await Product.find().lean();
  const stockValue = products.reduce((a, p) => a + p.stockQty * p.buyPrice, 0);
  const lowStock = products.filter((p) => p.stockQty <= p.lowStockAt);

  // Today's Stock Added
  const stockLogs = await StockLog.find().lean();
  const todayStockLogs = stockLogs.filter((log) => new Date(log.date) >= startOfToday);
  const todayStockAdded = todayStockLogs.reduce((a, log) => a + (log.qtyAdded * log.buyPrice), 0);

  // Baki
  const bakiAll = await Baki.find().lean();
  const bakiOwe = bakiAll.filter((b) => b.amount > 0).reduce((a, b) => a + b.amount, 0); // পাওনা
  const bakiGiven = bakiAll.filter((b) => b.amount < 0).reduce((a, b) => a - b.amount, 0); // আমাদের দেনা

  // Cash In Hand & Capital from Home calculation
  const cashTx = await CashTransaction.find().lean();
  const capitalFromHome = cashTx
    .filter((t) => t.type === 'in' && t.source === 'home_capital')
    .reduce((a, t) => a + t.amount, 0);
  const withdrawnToHome = cashTx
    .filter((t) => t.type === 'out' && t.source === 'withdraw_home')
    .reduce((a, t) => a + t.amount, 0);
  const otherCashIn = cashTx
    .filter((t) => t.type === 'in' && t.source !== 'home_capital')
    .reduce((a, t) => a + t.amount, 0);
  const otherCashOut = cashTx
    .filter((t) => t.type === 'out' && t.source !== 'withdraw_home')
    .reduce((a, t) => a + t.amount, 0);

  const salesCash = salesAll
    .filter((s) => s.paymentMethod === 'cash' || s.paymentMethod === 'both')
    .reduce((a, s) => a + (s.paidAmount || 0), 0);
  const rechargeCash = rechargesAll.reduce((a, r) => a + (r.amount || 0), 0);
  const bkashCashIn = bkashAll
    .filter((t) => ['cust_cashin', 'agent_cashin'].includes(t.type))
    .reduce((a, t) => a + t.amount, 0);
  const bkashCashOut = bkashAll
    .filter((t) => ['cust_cashout', 'agent_cashout'].includes(t.type))
    .reduce((a, t) => a + (t.cashAmount || (t.amount - (t.profit || 0))), 0);
  const bundleCashOut = bkashAll
    .filter((t) => t.type === 'bundle_expense' && t.paymentSource === 'cash')
    .reduce((a, t) => a + t.amount, 0);
  const stockPurchaseCash = stockLogs.reduce((a, l) => a + (l.qtyAdded * l.buyPrice), 0);
  const expensesCash = expenses
    .filter((e) => e.paymentMethod === 'cash')
    .reduce((a, e) => a + e.amount, 0);

  const totalCashIn = capitalFromHome + otherCashIn + salesCash + rechargeCash + bkashCashIn;
  const totalCashOut = withdrawnToHome + otherCashOut + bkashCashOut + bundleCashOut + stockPurchaseCash + expensesCash;
  const cashInHand = totalCashIn - totalCashOut;

  return NextResponse.json({
    totalSales,
    todaySales: todaySalesAmt,
    totalDue,
    todayDue,
    stockValue,
    todayStockAdded,
    lowStockCount: lowStock.length,
    bakiOwe,
    bakiGiven,
    bkashBalance,
    todayBkashIn,
    todayBkashOut,
    totalExpense,
    productCount: products.length,
    todayProfit,
    totalProfit,
    cashInHand,
    capitalFromHome,
  });
}
