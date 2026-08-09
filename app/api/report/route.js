import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Product, Sale, Bkash, Expense } from '@/lib/models';
import { getSessionUserId } from '@/lib/auth';

export async function GET() {
  if (!getSessionUserId()) return NextResponse.json({ error: 'না' }, { status: 401 });
  await connectDB();

  const products = await Product.find().lean();
  const sales = await Sale.find().lean();
  const expenses = await Expense.find().lean();

  const totalSales = sales.reduce((a, s) => a + s.totalAmount, 0);
  const totalPaid = sales.reduce((a, s) => a + s.paidAmount, 0);
  const totalDue = sales.reduce((a, s) => a + s.dueAmount, 0);
  const totalExpense = expenses.reduce((a, e) => a + e.amount, 0);

  // COGS from sale items
  let cogs = 0;
  for (const s of sales) {
    for (const it of s.items) {
      const p = products.find((pp) => pp._id.toString() === String(it.productId));
      if (p) cogs += (p.buyPrice || 0) * it.qty;
    }
  }
  const grossProfit = totalSales - cogs;
  const netProfit = grossProfit - totalExpense;

  // Last 14 days sales trend
  const map = {};
  for (const s of sales) {
    const d = new Date(s.date);
    const key = `${d.getDate()}/${d.getMonth() + 1}`;
    map[key] = (map[key] || 0) + s.totalAmount;
  }
  const days = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = `${d.getDate()}/${d.getMonth() + 1}`;
    days.push({ label: key, value: map[key] || 0 });
  }

  // Top products by revenue
  const prodMap = {};
  for (const s of sales) {
    for (const it of s.items) {
      const k = it.name || 'অন্যান্য';
      prodMap[k] = (prodMap[k] || 0) + it.total;
    }
  }
  const topProducts = Object.entries(prodMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  // Expense by category
  const catMap = {};
  for (const e of expenses) {
    catMap[e.category] = (catMap[e.category] || 0) + e.amount;
  }
  const expenseByCategory = Object.entries(catMap).map(([category, value]) => ({ category, value }));

  return NextResponse.json({
    totalSales,
    totalPaid,
    totalDue,
    totalExpense,
    cogs,
    grossProfit,
    netProfit,
    trend: days,
    topProducts,
    expenseByCategory,
  });
}
