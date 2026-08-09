import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/lib/models';
import { getSessionUserId } from '@/lib/auth';

export async function GET() {
  const uid = getSessionUserId();
  if (!uid) return NextResponse.json({ user: null }, { status: 401 });
  await connectDB();
  const user = await User.findById(uid);
  if (!user) return NextResponse.json({ user: null }, { status: 401 });
  return NextResponse.json({ user: { username: user.username, name: user.name, shopName: user.shopName } });
}
