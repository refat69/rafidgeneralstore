import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Product, Sale, Baki, Bkash, Expense, StockLog, Recharge } from '@/lib/models';
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

  // bKash profits & txns
  const bkashAll = await Bkash.find().lean();
  const todayBkash = bkashAll.filter((t) => new Date(t.date) >= startOfToday);
  const todayBkashProfit = todayBkash.reduce((a, t) => a + (t.profit || 0), 0);
  const bkashProfitAll = bkashAll.reduce((a, t) => a + (t.profit || 0), 0);

  const bkashIn = bkashAll.filter((t) => ['income', 'sale', 'cashout', 'b2b_receive'].includes(t.type)).reduce((a, t) => a + t.amount, 0);
  const bkashOut = bkashAll.filter((t) => ['expense', 'cashin', 'b2b_send'].includes(t.type)).reduce((a, t) => a + t.amount, 0);
  const bkashBalance = bkashIn - bkashOut;

  // Today's bkash in / out
  const todayBkashIn = bkashAll
    .filter((t) => ['income', 'sale', 'cashout', 'b2b_receive'].includes(t.type) && new Date(t.date) >= startOfToday)
    .reduce((a, t) => a + t.amount, 0);

  const todayBkashOut = bkashAll
    .filter((t) => ['expense', 'cashin', 'b2b_send'].includes(t.type) && new Date(t.date) >= startOfToday)
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
  });
}
