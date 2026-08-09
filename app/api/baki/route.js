import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Baki } from '@/lib/models';
import { getSessionUserId } from '@/lib/auth';

export async function GET() {
  if (!getSessionUserId()) return NextResponse.json({ error: 'না' }, { status: 401 });
  await connectDB();
  const baki = await Baki.find().sort({ date: -1 }).lean();
  return NextResponse.json({ baki });
}

export async function POST(req) {
  if (!getSessionUserId()) return NextResponse.json({ error: 'না' }, { status: 401 });
  await connectDB();
  const body = await req.json();
  const b = await Baki.create({
    customerName: body.customerName,
    customerPhone: body.customerPhone || '',
    amount: Number(body.amount) || 0,
    note: body.note || '',
  });
  return NextResponse.json({ baki: b }, { status: 201 });
}

// record payment towards a baki entry
export async function PUT(req) {
  if (!getSessionUserId()) return NextResponse.json({ error: 'না' }, { status: 401 });
  await connectDB();
  const body = await req.json();
  const existing = await Baki.findById(body.id);
  if (!existing) return NextResponse.json({ error: 'রেকর্ড নেই' }, { status: 404 });

  const paid = Number(body.paid) || 0;
  const newAmount = existing.amount - paid;
  if (newAmount <= 0) {
    await Baki.findByIdAndDelete(body.id);
    return NextResponse.json({ ok: true, deleted: true, remaining: 0 });
  }
  await Baki.findByIdAndUpdate(body.id, { amount: newAmount });
  return NextResponse.json({ ok: true, remaining: newAmount });
}

export async function DELETE(req) {
  if (!getSessionUserId()) return NextResponse.json({ error: 'না' }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  await connectDB();
  await Baki.findByIdAndDelete(id);
  return NextResponse.json({ ok: true });
}
