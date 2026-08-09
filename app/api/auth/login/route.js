import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/db';
import { User } from '@/lib/models';
import { setSession } from '@/lib/auth';
import { seedIfEmpty } from '@/lib/seed';

export async function POST(req) {
  try {
    const { username, password } = await req.json();
    if (!username || !password) {
      return NextResponse.json({ error: 'ইউজারনেম ও পাসওয়ার্ড দিন' }, { status: 400 });
    }
    await connectDB();
    await seedIfEmpty();
    const user = await User.findOne({ username: username.trim() });
    if (!user) {
      return NextResponse.json({ error: 'ভুল ইউজারনেম বা পাসওয়ার্ড' }, { status: 401 });
    }
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return NextResponse.json({ error: 'ভুল ইউজারনেম বা পাসওয়ার্ড' }, { status: 401 });
    }
    setSession(user._id.toString());
    return NextResponse.json({ ok: true, user: { username: user.username, name: user.name, shopName: user.shopName } });
  } catch (e) {
    console.error('Login Error:', e);
    return NextResponse.json({ error: e?.message || 'সার্ভার সমস্যা' }, { status: 500 });
  }
}

