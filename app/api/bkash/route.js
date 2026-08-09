import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Bkash } from '@/lib/models';
import { getSessionUserId } from '@/lib/auth';

export async function GET() {
  if (!getSessionUserId()) return NextResponse.json({ error: 'না' }, { status: 401 });
  await connectDB();
  const txns = await Bkash.find().sort({ date: -1 }).limit(200).lean();
  let balance = 0;
  for (const t of txns) {
    if (['income', 'sale', 'cashout', 'b2b_receive'].includes(t.type)) {
      balance += t.amount;
    } else if (['expense', 'cashin', 'b2b_send'].includes(t.type)) {
      balance -= t.amount;
    }
  }
  return NextResponse.json({ txns, balance });
}

export async function POST(req) {
  if (!getSessionUserId()) return NextResponse.json({ error: 'না' }, { status: 401 });
  await connectDB();
  const body = await req.json();
  const { bkashType, type, description, amount, customerCharge = 0, ourCost = 0, profit = 0, ref = '' } = body;

  const t = await Bkash.create({
    bkashType,
    type,
    description,
    amount: Number(amount) || 0,
    customerCharge: Number(customerCharge) || 0,
    ourCost: Number(ourCost) || 0,
    profit: Number(profit) || 0,
    ref,
  });
  return NextResponse.json({ txn: t }, { status: 201 });
}

export async function DELETE(req) {
  if (!getSessionUserId()) return NextResponse.json({ error: 'না' }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  await connectDB();
  await Bkash.findByIdAndDelete(id);
  return NextResponse.json({ ok: true });
}
