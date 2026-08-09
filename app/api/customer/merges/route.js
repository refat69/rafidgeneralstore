import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { CustomerUser, Customer } from '@/lib/models';
import { requireAuth } from '@/lib/auth';

export async function GET(req) {
  try {
    requireAuth();
    await connectDB();

    const onlineUsers = await CustomerUser.find({}).sort({ createdAt: -1 });
    const offlineCustomers = await Customer.find({}).sort({ name: 1 });

    return NextResponse.json({ onlineUsers, offlineCustomers });
  } catch (e) {
    console.error('Fetch Merges Error:', e);
    return NextResponse.json({ error: e?.message || 'সার্ভার সমস্যা' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    requireAuth();
    await connectDB();

    const { customerUserId, offlineCustomerId, action } = await req.json();
    if (!customerUserId) {
      return NextResponse.json({ error: 'অনলাইন ইউজার আইডি দেওয়া হয়নি' }, { status: 400 });
    }

    const onlineUser = await CustomerUser.findById(customerUserId);
    if (!onlineUser) {
      return NextResponse.json({ error: 'অনলাইন ইউজার পাওয়া যায়নি' }, { status: 404 });
    }

    let offlineCustomer;

    if (action === 'create_and_merge') {
      // Check if a customer with the same phone already exists offline
      let existing = null;
      if (onlineUser.phone) {
        existing = await Customer.findOne({ phone: onlineUser.phone });
      }
      if (existing) {
        offlineCustomer = existing;
      } else {
        offlineCustomer = await Customer.create({
          name: onlineUser.name,
          phone: onlineUser.phone,
        });
      }
    } else {
      if (!offlineCustomerId) {
        return NextResponse.json({ error: 'অফলাইন কাস্টমার প্রোফাইল সিলেক্ট করুন' }, { status: 400 });
      }
      offlineCustomer = await Customer.findById(offlineCustomerId);
      if (!offlineCustomer) {
        return NextResponse.json({ error: 'অফলাইন কাস্টমার প্রোফাইল পাওয়া যায়নি' }, { status: 404 });
      }
    }

    onlineUser.isMerged = true;
    onlineUser.mergedCustomerId = offlineCustomer._id.toString();
    onlineUser.mergedCustomerPhone = offlineCustomer.phone || '';
    onlineUser.mergedCustomerName = offlineCustomer.name || '';
    onlineUser.status = 'merged';
    await onlineUser.save();

    return NextResponse.json({ ok: true, message: 'মার্জ সফল হয়েছে!' });
  } catch (e) {
    console.error('Merge Action Error:', e);
    return NextResponse.json({ error: e?.message || 'সার্ভার সমস্যা' }, { status: 500 });
  }
}
