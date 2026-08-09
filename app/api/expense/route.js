import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Expense, Bkash } from '@/lib/models';
import { getSessionUserId } from '@/lib/auth';

export async function GET() {
  if (!getSessionUserId()) return NextResponse.json({ error: 'না' }, { status: 401 });
  await connectDB();
  const expenses = await Expense.find().sort({ date: -1 }).limit(200).lean();
  return NextResponse.json({ expenses });
}

export async function POST(req) {
  if (!getSessionUserId()) return NextResponse.json({ error: 'না' }, { status: 401 });
  await connectDB();
  const body = await req.json();
  const e = await Expense.create({
    category: body.category || 'অন্যান্য',
    description: body.description || '',
    amount: Number(body.amount) || 0,
    paymentMethod: body.paymentMethod || 'cash',
  });
  if (body.paymentMethod === 'bkash') {
    await Bkash.create({ type: 'expense', description: `খরচ - ${body.category || 'অন্যান্য'}`, amount: e.amount, ref: 'expense' });
  }
  return NextResponse.json({ expense: e }, { status: 201 });
}

export async function DELETE(req) {
  if (!getSessionUserId()) return NextResponse.json({ error: 'না' }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  await connectDB();
  await Expense.findByIdAndDelete(id);
  return NextResponse.json({ ok: true });
}
