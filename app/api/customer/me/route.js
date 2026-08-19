import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { CustomerUser, Baki, Sale } from '@/lib/models';
import { getCustomerSessionId } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const cid = getCustomerSessionId();
    if (!cid) {
      return NextResponse.json({ loggedIn: false });
    }

    await connectDB();
    const user = await CustomerUser.findById(cid);
    if (!user) {
      return NextResponse.json({ loggedIn: false });
    }

    // If merged, fetch ledger data
    let ledger = { due: 0, transactions: [] };
    if (user.isMerged) {
      const phone = user.mergedCustomerPhone;
      const name = user.mergedCustomerName;

      let query = {};
      if (phone) {
        query = { customerPhone: phone };
      } else if (name) {
        query = { customerName: name };
      } else {
        query = { _id: null };
      }

      const dueRecords = query._id === null ? [] : await Baki.find(query);
      const due = dueRecords.reduce((sum, r) => sum + r.amount, 0);

      const transactions = query._id === null ? [] : await Sale.find(query).sort({ date: -1 });

      ledger = { due, transactions };
    }


    return NextResponse.json({
      loggedIn: true,
      user: {
        name: user.name,
        phone: user.phone,
        isMerged: user.isMerged,
        status: user.status,
        mergedCustomerPhone: user.mergedCustomerPhone,
      },
      ledger,
    });
  } catch (e) {
    console.error('Customer Me API Error:', e);
    return NextResponse.json({ error: e?.message || 'সার্ভার সমস্যা' }, { status: 500 });
  }
}
