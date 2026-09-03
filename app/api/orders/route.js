import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Order, Product, Sale } from '@/lib/models';
import { getSessionUserId } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET: Admin fetch orders
export async function GET() {
  if (!getSessionUserId()) {
    return NextResponse.json({ error: 'অনুমতি নেই' }, { status: 401 });
  }
  await connectDB();
  const orders = await Order.find().sort({ createdAt: -1 }).lean();
  return NextResponse.json({ orders });
}

// POST: Public Customer place order
export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();

    const { customerName, customerPhone, deliveryAddress, area, items, note, paymentMethod } = body;

    if (!customerName || !customerPhone || !deliveryAddress) {
      return NextResponse.json({ error: 'নাম, মোবাইল নম্বর ও ঠিকানা পূরণ করা আবশ্যক' }, { status: 400 });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'কার্ট খালি! পণ্য সিলেক্ট করুন' }, { status: 400 });
    }

    // Jahangirnagar & Boalmari Home Delivery Fee = 20 Tk
    const deliveryFee = (area === 'jahangirnagar_boalmari' || !area) ? 20 : 20;

    let subtotal = 0;
    const processedItems = [];

    for (const item of items) {
      const p = await Product.findById(item.productId);
      const qty = Number(item.qty) || 1;
      const price = p ? p.sellPrice : Number(item.price) || 0;
      const itemTotal = price * qty;
      subtotal += itemTotal;

      processedItems.push({
        productId: item.productId,
        name: p ? p.name : item.name,
        qty: qty,
        price: price,
        unit: p ? p.unit : 'পিস',
        total: itemTotal,
        imageUrl: p ? p.imageUrl : '',
      });
    }

    const totalAmount = subtotal + deliveryFee;
    const orderNumber = 'ORD-' + Math.floor(100000 + Math.random() * 900000);

    const order = await Order.create({
      orderNumber,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      deliveryAddress: deliveryAddress.trim(),
      area: area || 'jahangirnagar_boalmari',
      deliveryFee,
      paymentMethod: paymentMethod || 'cod',
      items: processedItems,
      subtotal,
      totalAmount,
      status: 'pending',
      note: note || '',
      date: new Date(),
    });

    return NextResponse.json({ success: true, order }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: 'অর্ডার সংরক্ষণ করতে সমস্যা হয়েছে: ' + err.message }, { status: 500 });
  }
}

// PUT: Admin update order status
export async function PUT(req) {
  if (!getSessionUserId()) {
    return NextResponse.json({ error: 'অনুমতি নেই' }, { status: 401 });
  }
  await connectDB();
  const body = await req.json();
  const { id, status } = body;

  const order = await Order.findById(id);
  if (!order) {
    return NextResponse.json({ error: 'অর্ডার পাওয়া যায়নি' }, { status: 404 });
  }

  const prevStatus = order.status;
  order.status = status;
  await order.save();

  // If status changed to delivered, update stock & create Sale entry automatically
  if (status === 'delivered' && prevStatus !== 'delivered') {
    for (const item of order.items) {
      if (item.productId) {
        const p = await Product.findById(item.productId);
        if (p) {
          p.stockQty = Math.max(0, p.stockQty - item.qty);
          await p.save();
        }
      }
    }

    await Sale.create({
      items: order.items.map(i => ({
        productId: i.productId,
        name: i.name,
        qty: i.qty,
        price: i.price,
        total: i.total,
      })),
      totalAmount: order.totalAmount,
      discount: 0,
      paidAmount: order.totalAmount,
      dueAmount: 0,
      paymentMethod: order.paymentMethod === 'cod' ? 'cash' : 'bkash',
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      note: `অনলাইন অর্ডার #${order.orderNumber}`,
      date: new Date(),
    });
  }

  return NextResponse.json({ success: true, order });
}
