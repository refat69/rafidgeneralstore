import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Bkash, BkashAccount } from '@/lib/models';
import { getSessionUserId } from '@/lib/auth';

export async function GET() {
  if (!getSessionUserId()) return NextResponse.json({ error: 'অনুমতি নেই' }, { status: 401 });
  await connectDB();
  const txns = await Bkash.find().sort({ date: -1 }).limit(200).lean();
  const accounts = await BkashAccount.find().sort({ createdAt: 1 }).lean();

  let totalBalance = 0;
  if (accounts.length > 0) {
    totalBalance = accounts.reduce((a, acc) => a + (acc.balance || 0), 0);
  } else {
    // calculate legacy total balance from txns
    for (const t of txns) {
      if (['income', 'sale', 'cust_cashout', 'agent_cashout', 'b2b_receive', 'cashout'].includes(t.type)) {
        totalBalance += t.amount;
      } else if (['expense', 'self_cashout', 'cust_cashin', 'agent_cashin', 'b2b_send', 'cashin'].includes(t.type)) {
        totalBalance -= t.amount;
      }
    }
  }

  return NextResponse.json({ txns, accounts, balance: totalBalance });
}

export async function POST(req) {
  if (!getSessionUserId()) return NextResponse.json({ error: 'অনুমতি নেই' }, { status: 401 });
  await connectDB();
  const body = await req.json();
  const {
    bkashType = 'personal',
    accountId = '',
    accountNumber = '',
    type,
    description,
    amount,
    ratePerThousand = 0,
    customerCharge = 0,
    ourCost = 0,
    profit = 0,
    ref = '',
  } = body;

  const amt = Number(amount) || 0;
  let balanceAfter = 0;
  let targetAccount = null;

  if (accountId) {
    targetAccount = await BkashAccount.findById(accountId);
  } else if (accountNumber) {
    targetAccount = await BkashAccount.findOne({ number: accountNumber });
  }

  // Calculate balance change direction
  // + balance: cust_cashout (personal receives bKash), agent_cashout (agent receives bKash), income, b2b_receive
  // - balance: self_cashout (personal withdraws bKash), cust_cashin (personal sends bKash), agent_cashin (agent sends bKash), expense, b2b_send
  const isPlus = ['cust_cashout', 'agent_cashout', 'income', 'sale', 'b2b_receive', 'cashout'].includes(type);
  const isMinus = ['self_cashout', 'cust_cashin', 'agent_cashin', 'expense', 'b2b_send', 'cashin'].includes(type);

  if (targetAccount) {
    let current = targetAccount.balance || 0;
    if (isPlus) current += amt;
    else if (isMinus) current -= amt;

    targetAccount.balance = current;
    await targetAccount.save();
    balanceAfter = current;
  }

  const t = await Bkash.create({
    bkashType,
    accountId: targetAccount ? targetAccount._id.toString() : '',
    accountNumber: targetAccount ? targetAccount.number : accountNumber,
    type,
    description,
    amount: amt,
    ratePerThousand: Number(ratePerThousand) || 0,
    customerCharge: Number(customerCharge) || 0,
    ourCost: Number(ourCost) || 0,
    profit: Number(profit) || 0,
    balanceAfter,
    ref,
  });

  return NextResponse.json({ txn: t, account: targetAccount }, { status: 201 });
}

export async function DELETE(req) {
  if (!getSessionUserId()) return NextResponse.json({ error: 'অনুমতি নেই' }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  await connectDB();
  
  const txn = await Bkash.findById(id);
  if (txn && txn.accountId) {
    // Revert balance change on delete
    const account = await BkashAccount.findById(txn.accountId);
    if (account) {
      const isPlus = ['cust_cashout', 'agent_cashout', 'income', 'sale', 'b2b_receive', 'cashout'].includes(txn.type);
      const isMinus = ['self_cashout', 'cust_cashin', 'agent_cashin', 'expense', 'b2b_send', 'cashin'].includes(txn.type);
      if (isPlus) account.balance = (account.balance || 0) - txn.amount;
      else if (isMinus) account.balance = (account.balance || 0) + txn.amount;
      await account.save();
    }
  }

  await Bkash.findByIdAndDelete(id);
  return NextResponse.json({ ok: true });
}
