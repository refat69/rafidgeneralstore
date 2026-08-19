import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Baki } from '@/lib/models';
import { getSessionUserId } from '@/lib/auth';

export async function GET() {
  if (!getSessionUserId()) return NextResponse.json({ error: 'না' }, { status: 401 });
  await connectDB();
  const rawBaki = await Baki.find().sort({ date: -1 }).lean();
  
  // Consolidate baki records by customerName
  const MapByCustomer = new Map();
  for (const b of rawBaki) {
    const key = (b.customerName || '').trim().toLowerCase();
    if (!MapByCustomer.has(key)) {
      MapByCustomer.set(key, {
        _id: b._id,
        customerName: b.customerName,
        customerPhone: b.customerPhone || '',
        amount: b.amount,
        notes: b.note ? [b.note] : [],
        date: b.date,
        records: [b]
      });
    } else {
      const existing = MapByCustomer.get(key);
      existing.amount += b.amount;
      if (b.customerPhone && !existing.customerPhone) {
        existing.customerPhone = b.customerPhone;
      }
      if (b.note) {
        existing.notes.push(b.note);
      }
      existing.records.push(b);
    }
  }

  const baki = Array.from(MapByCustomer.values()).map(item => ({
    ...item,
    note: item.notes.filter(Boolean).join(', ')
  }));

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

// record payment towards a baki entry or customer
export async function PUT(req) {
  if (!getSessionUserId()) return NextResponse.json({ error: 'না' }, { status: 401 });
  await connectDB();
  const body = await req.json();
  let paid = Number(body.paid) || 0;
  if (paid <= 0) return NextResponse.json({ error: 'সঠিক পরিমাণ দিন' }, { status: 400 });

  if (body.customerName) {
    const key = body.customerName.trim();
    const records = await Baki.find({ customerName: new RegExp(`^${key}$`, 'i') }).sort({ date: 1 });
    let remainingPaid = paid;
    for (const rec of records) {
      if (remainingPaid <= 0) break;
      if (rec.amount <= remainingPaid) {
        remainingPaid -= rec.amount;
        await Baki.findByIdAndDelete(rec._id);
      } else {
        await Baki.findByIdAndUpdate(rec._id, { $inc: { amount: -remainingPaid } });
        remainingPaid = 0;
      }
    }
    return NextResponse.json({ ok: true });
  }

  const existing = await Baki.findById(body.id);
  if (!existing) return NextResponse.json({ error: 'রেকর্ড নেই' }, { status: 404 });

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
