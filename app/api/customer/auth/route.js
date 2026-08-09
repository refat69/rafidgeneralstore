import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/db';
import { CustomerUser } from '@/lib/models';
import { setCustomerSession, clearCustomerSession } from '@/lib/auth';

export async function POST(req) {
  try {
    const body = await req.json();
    const { action } = body;

    await connectDB();

    if (action === 'register') {
      const { name, phone, password } = body;
      if (!name || !phone || !password) {
        return NextResponse.json({ error: 'সবগুলো ঘর পূরণ করুন' }, { status: 400 });
      }

      // Check if user already exists
      const existing = await CustomerUser.findOne({ phone: phone.trim() });
      if (existing) {
        return NextResponse.json({ error: 'এই মোবাইল নম্বরটি ইতিমধ্যে নিবন্ধিত' }, { status: 400 });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      const customer = await CustomerUser.create({
        name: name.trim(),
        phone: phone.trim(),
        password: hashedPassword,
        isMerged: false,
        mergedCustomerPhone: '',
        status: 'pending',
      });

      setCustomerSession(customer._id.toString());
      return NextResponse.json({ ok: true, user: { name: customer.name, phone: customer.phone } });
    }

    if (action === 'login') {
      const { phone, password } = body;
      if (!phone || !password) {
        return NextResponse.json({ error: 'মোবাইল নম্বর ও পাসওয়ার্ড দিন' }, { status: 400 });
      }

      const customer = await CustomerUser.findOne({ phone: phone.trim() });
      if (!customer) {
        return NextResponse.json({ error: 'ভুল মোবাইল নম্বর বা পাসওয়ার্ড' }, { status: 401 });
      }

      const ok = await bcrypt.compare(password, customer.password);
      if (!ok) {
        return NextResponse.json({ error: 'ভুল মোবাইল নম্বর বা পাসওয়ার্ড' }, { status: 401 });
      }

      setCustomerSession(customer._id.toString());
      return NextResponse.json({ ok: true, user: { name: customer.name, phone: customer.phone, status: customer.status } });
    }

    if (action === 'logout') {
      clearCustomerSession();
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'অকার্যকর অ্যাকশন' }, { status: 400 });
  } catch (e) {
    console.error('Customer Auth Error:', e);
    return NextResponse.json({ error: e?.message || 'সার্ভার সমস্যা' }, { status: 500 });
  }
}
