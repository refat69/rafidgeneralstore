import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { BkashPartner, BkashB2BTransaction, BkashAccount, Bkash } from '@/lib/models';
import { getSessionUserId } from '@/lib/auth';

export async function GET(req) {
  if (!getSessionUserId()) return NextResponse.json({ error: 'অনুমতি নেই' }, { status: 401 });
  await connectDB();

  const { searchParams } = new URL(req.url);
  const partnerId = searchParams.get('partnerId');

  const [partners, allTxns, accounts] = await Promise.all([
    BkashPartner.find().sort({ createdAt: -1 }).lean(),
    BkashB2BTransaction.find().sort({ date: -1 }).lean(),
    BkashAccount.find().sort({ createdAt: 1 }).lean(),
  ]);

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Compute stats per partner
  const enrichedPartners = partners.map((p) => {
    const pId = p._id.toString();
    const pTxns = allTxns.filter((t) => t.partnerId === pId);
    const openingDue = Number(p.openingDue) || 0;

    const totalSent = pTxns.filter((t) => t.type === 'sent').reduce((a, t) => a + (t.amount || 0), 0);
    const totalExpense = pTxns.filter((t) => t.type === 'expense').reduce((a, t) => a + (t.amount || 0), 0);
    const totalReceived = pTxns.filter((t) => t.type === 'received').reduce((a, t) => a + (t.amount || 0), 0);
    const currentDue = openingDue + totalSent + totalExpense - totalReceived;

    // Today's stats
    const todayTxns = pTxns.filter((t) => new Date(t.date) >= startOfToday);
    const todaySent = todayTxns.filter((t) => t.type === 'sent').reduce((a, t) => a + (t.amount || 0), 0);
    const todayExpense = todayTxns.filter((t) => t.type === 'expense').reduce((a, t) => a + (t.amount || 0), 0);
    const todayReceived = todayTxns.filter((t) => t.type === 'received').reduce((a, t) => a + (t.amount || 0), 0);
    const previousDue = currentDue - (todaySent + todayExpense - todayReceived);

    const lastTx = pTxns.length > 0 ? pTxns[0].date : p.createdAt || p.date;

    return {
      ...p,
      openingDue,
      totalSent,
      totalExpense,
      totalReceived,
      currentDue,
      todaySent,
      todayExpense,
      todayReceived,
      previousDue,
      txCount: pTxns.length,
      lastTx,
    };
  });

  // Filter transactions if partnerId is specified
  const filteredTxns = partnerId
    ? allTxns.filter((t) => t.partnerId === partnerId)
    : allTxns;

  // Global summary
  const totalOpeningAll = partners.reduce((a, p) => a + (Number(p.openingDue) || 0), 0);
  const totalSentAll = allTxns.filter((t) => t.type === 'sent').reduce((a, t) => a + (t.amount || 0), 0);
  const totalExpenseAll = allTxns.filter((t) => t.type === 'expense').reduce((a, t) => a + (t.amount || 0), 0);
  const totalReceivedAll = allTxns.filter((t) => t.type === 'received').reduce((a, t) => a + (t.amount || 0), 0);
  const totalDueAll = totalOpeningAll + totalSentAll + totalExpenseAll - totalReceivedAll;

  return NextResponse.json({
    partners: enrichedPartners,
    transactions: filteredTxns,
    accounts,
    summary: {
      totalOpening: totalOpeningAll,
      totalSent: totalSentAll,
      totalExpense: totalExpenseAll,
      totalReceived: totalReceivedAll,
      totalDue: totalDueAll,
      partnerCount: partners.length,
      txCount: allTxns.length,
    },
  });
}

export async function POST(req) {
  if (!getSessionUserId()) return NextResponse.json({ error: 'অনুমতি নেই' }, { status: 401 });
  await connectDB();

  const body = await req.json();
  const { action = 'add_transaction' } = body;

  // 1. Create Partner
  if (action === 'create_partner') {
    const { name, phone = '', openingDue = 0, bkashNumbers = [], bankDetails = '', notes = '' } = body;
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'পার্টনারের নাম আবশ্যক' }, { status: 400 });
    }

    let cleanNumbers = [];
    if (Array.isArray(bkashNumbers)) {
      cleanNumbers = bkashNumbers.map((n) => String(n).trim()).filter(Boolean);
    } else if (typeof bkashNumbers === 'string') {
      cleanNumbers = bkashNumbers.split(/[,;\s]+/).map((n) => n.trim()).filter(Boolean);
    }

    const partner = await BkashPartner.create({
      name: name.trim(),
      phone: phone.trim(),
      openingDue: Number(openingDue) || 0,
      bkashNumbers: cleanNumbers,
      bankDetails: bankDetails.trim(),
      notes: notes.trim(),
      date: new Date(),
    });

    return NextResponse.json({ partner }, { status: 201 });
  }

  // 2. Update Partner
  if (action === 'update_partner') {
    const { id, name, phone, openingDue, bkashNumbers, bankDetails, notes } = body;
    if (!id) return NextResponse.json({ error: 'পার্টনার আইডি প্রয়োজন' }, { status: 400 });

    let cleanNumbers = [];
    if (Array.isArray(bkashNumbers)) {
      cleanNumbers = bkashNumbers.map((n) => String(n).trim()).filter(Boolean);
    } else if (typeof bkashNumbers === 'string') {
      cleanNumbers = bkashNumbers.split(/[,;\s]+/).map((n) => n.trim()).filter(Boolean);
    }

    const updated = await BkashPartner.findByIdAndUpdate(
      id,
      {
        name: name ? name.trim() : undefined,
        phone: phone ? phone.trim() : undefined,
        openingDue: openingDue !== undefined ? Number(openingDue) || 0 : undefined,
        bkashNumbers: cleanNumbers.length > 0 ? cleanNumbers : undefined,
        bankDetails: bankDetails !== undefined ? bankDetails.trim() : undefined,
        notes: notes !== undefined ? notes.trim() : undefined,
      },
      { new: true }
    );

    return NextResponse.json({ partner: updated });
  }

  // 3. Add B2B Transaction (sent | received | expense)
  if (action === 'add_transaction') {
    const {
      partnerId,
      type, // 'sent' (আমি বিকাশ পাঠালাম) | 'received' (পার্টনার ব্যাংকে পাঠালো) | 'expense' (দৈনিক খরচ)
      amount,
      targetBkashNumber = '',
      ourAccountId = '',
      bankName = '',
      bankAccount = '',
      paymentMethod = 'bank',
      trxId = '',
      note = '',
      date,
    } = body;

    const amt = Number(amount) || 0;
    if (!partnerId) {
      return NextResponse.json({ error: 'পার্টনার নির্বাচন করুন' }, { status: 400 });
    }
    if (!type || !['sent', 'received', 'expense'].includes(type)) {
      return NextResponse.json({ error: 'লেনদেনের ধরণ সঠিক নয়' }, { status: 400 });
    }
    if (!amt || amt <= 0) {
      return NextResponse.json({ error: 'সঠিক টাকার পরিমাণ দিন' }, { status: 400 });
    }

    const partner = await BkashPartner.findById(partnerId);
    if (!partner) {
      return NextResponse.json({ error: 'পার্টনার পাওয়া যায়নি' }, { status: 404 });
    }

    // Auto append targetBkashNumber to partner's list if new
    if (type === 'sent' && targetBkashNumber && targetBkashNumber.trim()) {
      const cleanNum = targetBkashNumber.trim();
      const existing = partner.bkashNumbers || [];
      if (!existing.includes(cleanNum)) {
        partner.bkashNumbers = [...existing, cleanNum];
        await partner.save();
      }
    }

    // Auto save bankDetails if provided and partner didn't have it
    if (type === 'received' && bankName && !partner.bankDetails) {
      partner.bankDetails = `${bankName} ${bankAccount ? `(A/C: ${bankAccount})` : ''}`.trim();
      await partner.save();
    }

    // If sent from our SIM, deduct balance and log in Bkash
    let ourAccountNumber = '';
    let linkedBkashTxId = '';
    if (type === 'sent' && ourAccountId) {
      const ourAcc = await BkashAccount.findById(ourAccountId);
      if (ourAcc) {
        ourAccountNumber = ourAcc.number;
        ourAcc.balance = (ourAcc.balance || 0) - amt;
        await ourAcc.save();

        const bTx = await Bkash.create({
          bkashType: ourAcc.accountType || 'personal',
          accountId: ourAcc._id.toString(),
          accountNumber: ourAcc.number,
          type: 'b2b_send',
          description: `🤝 B2B বিকাশ পাঠানো: ${partner.name} [${targetBkashNumber || 'নম্বর'}]`,
          amount: amt,
          cashAmount: 0,
          profit: 0,
          balanceAfter: ourAcc.balance,
          ref: partner._id.toString(),
          date: date ? new Date(date) : new Date(),
        });
        linkedBkashTxId = bTx._id.toString();
      }
    }

    // Calculate new running balance for this partner
    const prevTxns = await BkashB2BTransaction.find({ partnerId }).lean();
    const prevSent = prevTxns.filter((t) => t.type === 'sent').reduce((a, t) => a + (t.amount || 0), 0);
    const prevExpense = prevTxns.filter((t) => t.type === 'expense').reduce((a, t) => a + (t.amount || 0), 0);
    const prevRec = prevTxns.filter((t) => t.type === 'received').reduce((a, t) => a + (t.amount || 0), 0);
    const openingDue = Number(partner.openingDue) || 0;
    const prevDue = openingDue + prevSent + prevExpense - prevRec;

    let balanceAfter = prevDue;
    if (type === 'sent' || type === 'expense') {
      balanceAfter += amt;
    } else if (type === 'received') {
      balanceAfter -= amt;
    }

    const tx = await BkashB2BTransaction.create({
      partnerId,
      partnerName: partner.name,
      partnerPhone: partner.phone || '',
      type,
      amount: amt,
      targetBkashNumber: targetBkashNumber ? targetBkashNumber.trim() : '',
      ourAccountId,
      ourAccountNumber,
      bankName: bankName ? bankName.trim() : '',
      bankAccount: bankAccount ? bankAccount.trim() : '',
      paymentMethod,
      trxId: trxId ? trxId.trim() : '',
      note: note ? note.trim() : (type === 'expense' ? 'দৈনিক খরচ বাবদ পাওনা' : ''),
      balanceAfter,
      ref: linkedBkashTxId,
      date: date ? new Date(date) : new Date(),
    });

    return NextResponse.json({ transaction: tx }, { status: 201 });
  }

  return NextResponse.json({ error: 'অজ্ঞাত অ্যাকশন' }, { status: 400 });
}

export async function DELETE(req) {
  if (!getSessionUserId()) return NextResponse.json({ error: 'অনুমতি নেই' }, { status: 401 });
  await connectDB();

  const { searchParams } = new URL(req.url);
  const txId = searchParams.get('id');
  const partnerId = searchParams.get('partnerId');

  // Delete individual transaction
  if (txId) {
    const tx = await BkashB2BTransaction.findById(txId);
    if (!tx) return NextResponse.json({ error: 'লেনদেন পাওয়া যায়নি' }, { status: 404 });

    // If it was sent from our SIM, revert SIM balance and delete linked Bkash record
    if (tx.type === 'sent' && tx.ourAccountId) {
      const ourAcc = await BkashAccount.findById(tx.ourAccountId);
      if (ourAcc) {
        ourAcc.balance = (ourAcc.balance || 0) + (tx.amount || 0);
        await ourAcc.save();
      }
      if (tx.ref) {
        try {
          await Bkash.findByIdAndDelete(tx.ref);
        } catch (_) {}
      }
    }

    await BkashB2BTransaction.findByIdAndDelete(txId);
    return NextResponse.json({ ok: true });
  }

  // Delete partner & all their transactions
  if (partnerId) {
    await Promise.all([
      BkashPartner.findByIdAndDelete(partnerId),
      BkashB2BTransaction.deleteMany({ partnerId }),
    ]);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: 'আইডি প্রয়োজন' }, { status: 400 });
}
