import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Sale, Bkash, Expense, Recharge, StockLog } from '@/lib/models';
import { getSessionUserId } from '@/lib/auth';

export async function GET() {
  if (!getSessionUserId()) return NextResponse.json({ error: 'না' }, { status: 401 });
  await connectDB();

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const sales = await Sale.find().lean();
  const bkashTx = await Bkash.find().lean();
  const expenses = await Expense.find().lean();
  const recharges = await Recharge.find().lean();
  const stockLogs = await StockLog.find().lean();

  const todaySales = sales.filter((s) => new Date(s.date) >= startOfToday);
  const todayBkash = bkashTx.filter((b) => new Date(b.date) >= startOfToday);
  const todayExpenses = expenses.filter((e) => new Date(e.date) >= startOfToday);
  const todayRecharges = recharges.filter((r) => new Date(r.date) >= startOfToday);
  const todayStockLogs = stockLogs.filter((s) => new Date(s.date) >= startOfToday);

  return NextResponse.json({
    sales: todaySales,
    bkash: todayBkash,
    expenses: todayExpenses,
    recharges: todayRecharges,
    stockLogs: todayStockLogs
  });
}
