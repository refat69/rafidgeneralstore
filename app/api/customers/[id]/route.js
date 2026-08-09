import { NextResponse } from 'next/server';
import { connectDB, isUsingFallback, getLocalStore } from '@/lib/db';
import { Customer, Sale, Baki } from '@/lib/models';
import { getSessionUserId } from '@/lib/auth';

export async function GET(req, { params }) {
  if (!getSessionUserId()) return NextResponse.json({ error: 'না' }, { status: 401 });
  await connectDB();
  const { id } = params;

  try {
    let customer = null;
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(id);
    if (isValidObjectId) {
      customer = await Customer.findById(id);
    }
    if (!customer) {
      const decodedName = decodeURIComponent(id).trim();
      customer = await Customer.findOne({ name: decodedName });
      if (!customer && decodedName) {
        // Auto-create customer if they exist in baki but not registered as customer
        customer = await Customer.create({ name: decodedName, phone: '' });
      }
    }

    if (!customer) {
      return NextResponse.json({ error: 'গ্রাহক পাওয়া যায়নি' }, { status: 404 });
    }

    let sales = [];
    let bakiRecords = [];

    if (isUsingFallback()) {
      const allSales = getLocalStore().getCollection('Sale');
      sales = allSales.filter(s => s.customerName === customer.name);
      
      const allBaki = getLocalStore().getCollection('Baki');
      bakiRecords = allBaki.filter(b => b.customerName === customer.name);
    } else {
      sales = await Sale.find({ customerName: customer.name }).sort({ date: -1 }).lean();
      bakiRecords = await Baki.find({ customerName: customer.name }).sort({ date: -1 }).lean();
    }

    return NextResponse.json({ customer, sales, bakiRecords });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  if (!getSessionUserId()) return NextResponse.json({ error: 'না' }, { status: 401 });
  await connectDB();
  const { id } = params;
  const body = await req.json();
  const { name, phone } = body;

  if (!name || !name.trim()) {
    return NextResponse.json({ error: 'নাম আবশ্যক' }, { status: 400 });
  }

  try {
    let customer = null;
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(id);
    if (isValidObjectId) {
      customer = await Customer.findById(id);
    }
    if (!customer) {
      const decodedName = decodeURIComponent(id).trim();
      customer = await Customer.findOne({ name: decodedName });
    }

    if (!customer) {
      return NextResponse.json({ error: 'গ্রাহক পাওয়া যায়নি' }, { status: 404 });
    }

    const oldName = customer.name;

    // Update customer profile
    await Customer.findByIdAndUpdate(customer._id, { name: name.trim(), phone: (phone || '').trim() });

    // Propagate updates to matching Sale and Baki records
    if (isUsingFallback()) {
      const sales = getLocalStore().getCollection('Sale');
      sales.forEach(s => {
        if (s.customerName === oldName) {
          s.customerName = name.trim();
          s.customerPhone = (phone || '').trim();
        }
      });
      const baki = getLocalStore().getCollection('Baki');
      baki.forEach(b => {
        if (b.customerName === oldName) {
          b.customerName = name.trim();
          b.customerPhone = (phone || '').trim();
        }
      });
      getLocalStore().save();
    } else {
      await Sale.updateMany({ customerName: oldName }, { customerName: name.trim(), customerPhone: (phone || '').trim() });
      await Baki.updateMany({ customerName: oldName }, { customerName: name.trim(), customerPhone: (phone || '').trim() });
    }

    return NextResponse.json({ success: true, message: 'গ্রাহক তথ্য আপডেট করা হয়েছে' });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
