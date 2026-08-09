import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Product, Sale, Bkash, Baki, Customer, StockLog } from '@/lib/models';
import { getSessionUserId } from '@/lib/auth';

export async function GET() {
  if (!getSessionUserId()) return NextResponse.json({ error: 'না' }, { status: 401 });
  await connectDB();
  const sales = await Sale.find().sort({ date: -1 }).limit(100).lean();
  return NextResponse.json({ sales });
}

export async function POST(req) {
  if (!getSessionUserId()) return NextResponse.json({ error: 'না' }, { status: 401 });
  await connectDB();
  const body = await req.json();
  const { items, discount = 0, paidAmount, paymentMethod = 'cash', customerName = '', customerPhone = '', note = '' } = body;

  if (!items || items.length === 0) {
    return NextResponse.json({ error: 'অন্তত একটি পণ্য দিন' }, { status: 400 });
  }

  const saleItems = [];
  let total = 0;

  for (const it of items) {
    let product;
    const qty = Number(it.qty) || 1;
    const price = Number(it.price) || 0;

    if (it.isNewProduct) {
      const initialStock = it.stock !== undefined ? Number(it.stock) : qty;
      // Auto-add new product to database
      product = await Product.create({
        name: it.name,
        category: 'সাধারণ',
        unit: 'পিস',
        buyPrice: Number(it.buyPrice) || 0,
        sellPrice: price,
        stockQty: initialStock,
        lowStockAt: 5
      });
      // Log stock added
      await StockLog.create({
        productId: product._id,
        productName: product.name,
        qtyAdded: initialStock,
        buyPrice: product.buyPrice,
      });
    } else {
      product = await Product.findById(it.productId);
      if (!product) return NextResponse.json({ error: 'পণ্য পাওয়া যায়নি' }, { status: 400 });
      if (qty > product.stockQty) {
        return NextResponse.json({ error: `"${product.name}" এর স্টক পর্যাপ্ত নয় (আছে ${product.stockQty})` }, { status: 400 });
      }
    }

    const lineTotal = qty * price;
    total += lineTotal;
    saleItems.push({
      productId: product._id,
      name: product.name,
      qty,
      price,
      buyPrice: product.buyPrice || 0,
      total: lineTotal
    });

    // reduce stock
    await Product.findByIdAndUpdate(product._id, { $inc: { stockQty: -qty } });
  }

  const disc = Number(discount) || 0;
  const grandTotal = Math.max(0, total - disc);
  const paid = Number(paidAmount) || 0;
  const due = Math.max(0, grandTotal - paid);

  const sale = await Sale.create({
    items: saleItems,
    totalAmount: grandTotal,
    discount: disc,
    paidAmount: paid,
    dueAmount: due,
    paymentMethod,
    customerName,
    customerPhone,
    note,
  });

  // Auto-add customer to Customer table if name is provided
  if (customerName && customerName.trim()) {
    const trimmedName = customerName.trim();
    const existing = await Customer.findOne({ name: trimmedName });
    if (!existing) {
      await Customer.create({
        name: trimmedName,
        phone: customerPhone ? customerPhone.trim() : ''
      });
    }
  }

  // bKash ledger if paid via bkash
  if (paymentMethod === 'bkash' && paid > 0) {
    await Bkash.create({ type: 'income', description: `বিক্রয় - ${customerName || 'ক্যাশ'}`, amount: paid, ref: 'sale' });
  }
  if (paymentMethod === 'both' && paid > 0) {
    // approximate: treat paid as bkash income note
    await Bkash.create({ type: 'income', description: `বিক্রয় (আংশিক) - ${customerName || 'ক্যাশ'}`, amount: paid, ref: 'sale' });
  }

  // Baki if due
  if (due > 0) {
    await Baki.create({ customerName: customerName || 'অজানা গ্রাহক', customerPhone, amount: due, note: 'বিক্রয় থেকে বাকি' });
  }

  return NextResponse.json({ sale }, { status: 201 });
}
