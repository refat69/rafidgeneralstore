import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { BkashAccount } from '@/lib/models';
import { getSessionUserId } from '@/lib/auth';

export async function GET() {
  if (!getSessionUserId()) return NextResponse.json({ error: 'অনুমতি নেই' }, { status: 401 });
  await connectDB();
  const accounts = await BkashAccount.find().sort({ createdAt: 1 }).lean();
  return NextResponse.json({ accounts });
}

export async function POST(req) {
  if (!getSessionUserId()) return NextResponse.json({ error: 'অনুমতি নেই' }, { status: 401 });
  await connectDB();
  const body = await req.json();
  const { name, number, accountType, balance = 0, id } = body;

  if (!number) {
    return NextResponse.json({ error: 'মোবাইল নম্বর প্রদান করুন' }, { status: 400 });
  }

  if (id) {
    const updated = await BkashAccount.findByIdAndUpdate(
      id,
      { name: name || '', number, accountType: accountType || 'personal', balance: Number(balance) || 0 },
      { new: true }
    );
    return NextResponse.json({ account: updated });
  }

  const account = await BkashAccount.create({
    name: name || '',
    number,
    accountType: accountType || 'personal',
    balance: Number(balance) || 0,
  });

  return NextResponse.json({ account }, { status: 201 });
}

export async function PUT(req) {
  if (!getSessionUserId()) return NextResponse.json({ error: 'অনুমতি নেই' }, { status: 401 });
  await connectDB();
  const body = await req.json();
  const { id, name, number, accountType, balance } = body;

  if (!id) {
    return NextResponse.json({ error: 'অ্যাকাউন্ট আইডি প্রদান করুন' }, { status: 400 });
  }

  const updateFields = {};
  if (name !== undefined) updateFields.name = name;
  if (number !== undefined) updateFields.number = number;
  if (accountType !== undefined) updateFields.accountType = accountType;
  if (balance !== undefined) updateFields.balance = Number(balance) || 0;

  const updated = await BkashAccount.findByIdAndUpdate(id, updateFields, { new: true });
  if (!updated) {
    return NextResponse.json({ error: 'অ্যাকাউন্ট পাওয়া যায়নি' }, { status: 404 });
  }

  return NextResponse.json({ account: updated });
}

export async function DELETE(req) {
  if (!getSessionUserId()) return NextResponse.json({ error: 'অনুমতি নেই' }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  await connectDB();
  await BkashAccount.findByIdAndDelete(id);
  return NextResponse.json({ ok: true });
}
