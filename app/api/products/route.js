import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Product, StockLog } from '@/lib/models';
import { getSessionUserId } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!getSessionUserId()) return NextResponse.json({ error: 'না' }, { status: 401 });
  await connectDB();
  const products = await Product.find().sort({ createdAt: -1 }).lean();
  return NextResponse.json({ products });
}

export async function POST(req) {
  if (!getSessionUserId()) return NextResponse.json({ error: 'না' }, { status: 401 });
  await connectDB();
  const body = await req.json();
  
  if (!body.name || !body.name.trim()) {
    return NextResponse.json({ error: 'পণ্যের নাম আবশ্যক' }, { status: 400 });
  }

  // Case-insensitive duplicate check
  const allProducts = await Product.find().lean();
  const exists = allProducts.some(p => p.name.trim().toLowerCase() === body.name.trim().toLowerCase());
  if (exists) {
    return NextResponse.json({ error: 'এই পণ্যটি ইতিমধ্যে যুক্ত করা আছে!' }, { status: 400 });
  }

  const p = await Product.create({
    name: body.name.trim(),
    category: body.category || 'সাধারণ',
    unit: body.unit || 'পিস',
    buyPrice: Number(body.buyPrice) || 0,
    sellPrice: Number(body.sellPrice) || 0,
    stockQty: Number(body.stockQty) || 0,
    lowStockAt: Number(body.lowStockAt) || 5,
  });
  if (p.stockQty > 0) {
    await StockLog.create({
      productId: p._id,
      productName: p.name,
      qtyAdded: p.stockQty,
      buyPrice: p.buyPrice,
    });
  }
  return NextResponse.json({ product: p }, { status: 201 });
}

export async function PUT(req) {
  if (!getSessionUserId()) return NextResponse.json({ error: 'না' }, { status: 401 });
  await connectDB();
  const body = await req.json();
  const oldProduct = await Product.findById(body.id);
  const p = await Product.findByIdAndUpdate(
    body.id,
    {
      name: body.name,
      category: body.category,
      unit: body.unit,
      buyPrice: Number(body.buyPrice) || 0,
      sellPrice: Number(body.sellPrice) || 0,
      stockQty: Number(body.stockQty) || 0,
      lowStockAt: Number(body.lowStockAt) || 5,
    },
    { new: true }
  );
  if (oldProduct && p) {
    const diff = p.stockQty - oldProduct.stockQty;
    if (diff > 0) {
      await StockLog.create({
        productId: p._id,
        productName: p.name,
        qtyAdded: diff,
        buyPrice: p.buyPrice,
      });
    }
  }
  return NextResponse.json({ product: p });
}

export async function DELETE(req) {
  if (!getSessionUserId()) return NextResponse.json({ error: 'না' }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  await connectDB();
  await Product.findByIdAndDelete(id);
  return NextResponse.json({ ok: true });
}
