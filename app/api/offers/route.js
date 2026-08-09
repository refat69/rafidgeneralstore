import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Offer } from '@/lib/models';
import { getSessionUserId } from '@/lib/auth';

export async function GET(req) {
  try {
    await connectDB();
    // Public can view active offers
    const offers = await Offer.find({ active: true }).sort({ createdAt: -1 });
    return NextResponse.json({ offers });
  } catch (e) {
    console.error('Fetch Offers Error:', e);
    return NextResponse.json({ error: e?.message || 'সার্ভার সমস্যা' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    // Check admin auth
    const adminId = getSessionUserId();
    if (!adminId) {
      return NextResponse.json({ error: 'অননুমোদিত এক্সেস' }, { status: 401 });
    }

    await connectDB();
    const { title, description, imageUrl, active } = await req.json();

    if (!title || !description) {
      return NextResponse.json({ error: 'অফারের শিরোনাম ও বিবরণ লিখুন' }, { status: 400 });
    }

    const offer = await Offer.create({
      title: title.trim(),
      description: description.trim(),
      imageUrl: imageUrl || '',
      active: active !== undefined ? active : true,
    });

    return NextResponse.json({ ok: true, offer });
  } catch (e) {
    console.error('Create Offer Error:', e);
    return NextResponse.json({ error: e?.message || 'সার্ভার সমস্যা' }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const adminId = getSessionUserId();
    if (!adminId) {
      return NextResponse.json({ error: 'অননুমোদিত এক্সেস' }, { status: 401 });
    }

    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'আইডি দেওয়া হয়নি' }, { status: 400 });
    }

    await Offer.findByIdAndDelete(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('Delete Offer Error:', e);
    return NextResponse.json({ error: e?.message || 'সার্ভার সমস্যা' }, { status: 500 });
  }
}
