import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Recharge } from '@/lib/models';
import { getSessionUserId } from '@/lib/auth';

export async function GET() {
  if (!getSessionUserId()) return NextResponse.json({ error: 'না' }, { status: 401 });
  await connectDB();
  const recharges = await Recharge.find().sort({ date: -1 }).limit(100).lean();
  return NextResponse.json({ recharges });
}

export async function POST(req) {
  if (!getSessionUserId()) return NextResponse.json({ error: 'না' }, { status: 401 });
  await connectDB();
  const body = await req.json();
  const { phone, operator, amount, commission } = body;

  if (!operator || !amount) {
    return NextResponse.json({ error: 'সকল তথ্য প্রদান করুন' }, { status: 400 });
  }

  const amt = Number(amount) || 0;
  const comm = commission !== undefined ? Number(commission) : (amt * 0.028); // 28 tk commission per 1000 recharge

  const rec = await Recharge.create({
    phone: phone || '',
    operator,
    amount: amt,
    commission: comm,
  });

  return NextResponse.json({ recharge: rec }, { status: 201 });
}
