'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { taka, num } from '@/lib/money';
import toast from 'react-hot-toast';

export default function SellPage() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]); // {productId, name, price, qty, maxQty, total, buyPrice, isNewProduct}
  const [paidAmount, setPaidAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [discount, setDiscount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [sales, setSales] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('most_sold'); // 'most_sold' | 'name' | 'price_low' | 'price_high' | 'stock'
  const [customerBakiMap, setCustomerBakiMap] = useState({});

  // States for custom unregistered products
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdBuy, setNewProdBuy] = useState('');
  const [newProdSell, setNewProdSell] = useState('');
  const [newProdQty, setNewProdQty] = useState(1);
  const [newProdStock, setNewProdStock] = useState('');

  useEffect(() => {
    loadProducts();
    loadCustomers();
    loadBaki();
    loadSales();
  }, []);

  function loadProducts() {
    fetch('/api/products?t=' + Date.now())
      .then((r) => r.json())
      .then((d) => setProducts(d.products || []))
      .catch(() => {});
  }

  function loadCustomers() {
    fetch('/api/customers?t=' + Date.now())
      .then((r) => r.json())
      .then((d) => setCustomers(d.customers || []))
      .catch(() => {});
  }

  function loadBaki() {
    fetch('/api/baki?t=' + Date.now())
      .then((r) => r.json())
      .then((d) => {
        const map = {};
        (d.baki || []).forEach((b) => {
          const key = (b.customerName || '').trim().toLowerCase();
          map[key] = b.amount;
        });
        setCustomerBakiMap(map);
      })
      .catch(() => {});
  }

  function loadSales() {
    fetch('/api/sales?t=' + Date.now())
      .then((r) => r.json())
      .then((d) => setSales(d.sales || []))
      .catch(() => {});
  }

  // Add Product to Cart on Card Click
  function addProduct(id) {
    const p = products.find((x) => x._id === id);
    if (!p) return;

    if (p.stockQty <= 0) {
      toast('⚠️ এই পণ্যটির কোনো স্টক নেই, তবুও কার্টে যোগ করা হচ্ছে', { icon: '⚠️' });
    }

    setCart((prev) => {
      const ex = prev.find((c) => c.productId === id);
      if (ex) {
        toast.success(`"${p.name}" (+১ টি যোগ হয়েছে)`, { duration: 1200 });
        return prev.map((c) =>
          c.productId === id
            ? { ...c, qty: c.qty + 1, total: (c.qty + 1) * c.price }
            : c
        );
      }
      toast.success(`"${p.name}" কার্টে যোগ হয়েছে`, { duration: 1200 });
      return [
        ...prev,
        {
          productId: p._id,
          name: p.name,
          price: p.sellPrice,
          buyPrice: p.buyPrice,
          qty: 1,
          maxQty: p.stockQty || 999999,
          total: p.sellPrice,
          imageUrl: p.imageUrl,
          unit: p.unit || 'পিস',
        },
      ];
    });
  }

  function addCustomProduct() {
    if (!newProdName.trim() || !newProdSell) {
      toast.error('নতুন পণ্যের নাম ও বিক্রির দাম আবশ্যক!');
      return;
    }
    const tempId = 'new-' + Date.now();
    const qty = Number(newProdQty) || 1;
    const sellPrice = Number(newProdSell) || 0;
    const buyPrice = Number(newProdBuy) || 0;
    const stock = newProdStock === '' ? qty : Number(newProdStock);

    setCart((prev) => [
      ...prev,
      {
        productId: tempId,
        name: newProdName.trim(),
        price: sellPrice,
        buyPrice: buyPrice,
        qty: qty,
        maxQty: 999999,
        total: sellPrice * qty,
        isNewProduct: true,
        stock: stock,
      },
    ]);

    setNewProdName('');
    setNewProdBuy('');
    setNewProdSell('');
    setNewProdQty(1);
    setNewProdStock('');
    setShowCustomForm(false);
    toast.success('কাস্টম পণ্য কার্টে যোগ হয়েছে');
  }

  function updateQty(id, qty) {
    setCart((prev) =>
      prev.map((c) => {
        if (c.productId !== id) return c;
        const q = Math.max(1, qty);
        return { ...c, qty: q, total: q * c.price };
      })
    );
  }

  function updatePrice(id, price) {
    setCart((prev) =>
      prev.map((c) => {
        if (c.productId !== id) return c;
        const p = Number(price) || 0;
        return { ...c, price: p, total: c.qty * p };
      })
    );
  }

  function updateTotal(id, totalVal) {
    setCart((prev) =>
      prev.map((c) => {
        if (c.productId !== id) return c;
        const tot = Number(totalVal) || 0;
        const p = c.qty > 0 ? tot / c.qty : tot;
        return { ...c, total: tot, price: p };
      })
    );
  }

  function removeItem(id) {
    setCart((prev) => prev.filter((c) => c.productId !== id));
  }

  function clearCart() {
    if (cart.length === 0) return;
    if (confirm('সম্পূর্ণ কার্ট খালি করবেন?')) {
      setCart([]);
      setPaidAmount(0);
      setDiscount(0);
    }
  }

  // Categories list
  const categories = useMemo(() => {
    const set = new Set();
    products.forEach((p) => {
      if (p.category && p.category.trim()) set.add(p.category.trim());
    });
    return Array.from(set);
  }, [products]);

  // Filter & Sort Products (Most Sold first by default!)
  const displayProducts = useMemo(() => {
    return products
      .filter((p) => {
        const matchesQuery =
          !searchQuery.trim() ||
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesCat = selectedCategory === 'all' || p.category === selectedCategory;

        return matchesQuery && matchesCat;
      })
      .sort((a, b) => {
        if (sortBy === 'most_sold') {
          // Most sold items come first
          const diff = (b.soldCount || 0) - (a.soldCount || 0);
          if (diff !== 0) return diff;
          return (a.name || '').localeCompare(b.name || '');
        }
        if (sortBy === 'name') {
          return (a.name || '').localeCompare(b.name || '');
        }
        if (sortBy === 'price_low') {
          return a.sellPrice - b.sellPrice;
        }
        if (sortBy === 'price_high') {
          return b.sellPrice - a.sellPrice;
        }
        if (sortBy === 'stock') {
          return b.stockQty - a.stockQty;
        }
        return 0;
      });
  }, [products, searchQuery, selectedCategory, sortBy]);

  // Cart item count map for instant visual indicator on cards
  const cartQtyMap = useMemo(() => {
    const map = {};
    cart.forEach((c) => {
      map[c.productId] = c.qty;
    });
    return map;
  }, [cart]);

  const subtotal = cart.reduce((a, c) => a + (Number(c.total) || 0), 0);
  const grandTotal = Math.max(0, subtotal - (num(discount) || 0));
  const due = Math.max(0, grandTotal - (num(paidAmount) || 0));

  const customerSuggestions = customers.filter(
    (c) =>
      !customerName.trim() ||
      c.name.toLowerCase().includes(customerName.toLowerCase()) ||
      (c.phone && c.phone.includes(customerName))
  );

  async function submit() {
    if (cart.length === 0) {
      toast.error('অন্তত একটি পণ্য নির্বাচন করুন');
      return;
    }
    setLoading(true);
    const res = await fetch('/api/sales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: cart.map((c) => ({
          productId: c.isNewProduct ? undefined : c.productId,
          qty: c.qty,
          price: c.price,
          total: c.total,
          buyPrice: c.buyPrice,
          isNewProduct: c.isNewProduct,
          name: c.name,
          stock: c.stock,
        })),
        discount: num(discount),
        paidAmount: num(paidAmount),
        paymentMethod,
        customerName,
        customerPhone,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      toast.error(data.error || 'বিক্রি সম্পন্ন হতে সমস্যা হয়েছে');
      return;
    }
    toast.success('✅ বিক্রি সফল হয়েছে!');
    setCart([]);
    setPaidAmount(0);
    setDiscount(0);
    setCustomerName('');
    setCustomerPhone('');
    loadSales();
    loadProducts();
    loadCustomers();
    loadBaki();
  }

  return (
    <div>
      {/* Top Header */}
      <div className="topbar">
        <div>
          <h2>🛒 পয়েন্ট অব সেল (বিক্রি পেজ)</h2>
          <div className="sub">পণ্য বক্সে ক্লিক করে নির্বাচন করুন এবং সহজে দ্রুত বিক্রি সম্পন্ন করুন</div>
        </div>
        <div className="flex" style={{ gap: 10 }}>
          <Link href="/admin/sales-history" className="btn gray">
            📜 বিক্রির ইতিহাস ➔
          </Link>
          <Link href="/admin/products" className="btn gray">
            📦 স্টক ও পণ্য তালিকা
          </Link>
        </div>
      </div>

      {/* Main 2-Column POS Layout */}
      <div className="grid cols-2" style={{ alignItems: 'start' }}>
        {/* Left Column: Product Photo Grid & Search */}
        <div className="card" style={{ padding: '16px 18px' }}>
          {/* Search Bar & Sorting */}
          <div className="flex between align-center gap mb8" style={{ flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
              <input
                type="text"
                placeholder="🔍 পণ্যের নাম বা ক্যাটাগরি দিয়ে খুঁজুন..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  paddingLeft: 34,
                  paddingRight: searchQuery ? 30 : 12,
                  fontSize: 14,
                  borderRadius: 8,
                }}
              />
              <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', opacity: 0.6 }}>
                🔍
              </span>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    right: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--muted)',
                    fontSize: 14,
                  }}
                >
                  ✕
                </button>
              )}
            </div>

            {/* Sort Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="muted" style={{ fontSize: 12 }}>সর্ট:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{ padding: '7px 10px', fontSize: 13, borderRadius: 8 }}
              >
                <option value="most_sold">🔥 সর্বাধিক বিক্রিত আগে</option>
                <option value="name">🔤 নাম অনুযায়ী (A-Z)</option>
                <option value="price_low">💰 দাম: কম থেকে বেশি</option>
                <option value="price_high">💰 দাম: বেশি থেকে কম</option>
                <option value="stock">📦 বেশি স্টক আগে</option>
              </select>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div
            style={{
              display: 'flex',
              gap: 8,
              overflowX: 'auto',
              paddingBottom: 6,
              marginBottom: 12,
              scrollbarWidth: 'thin',
            }}
          >
            <button
              type="button"
              className={`btn sm ${selectedCategory === 'all' ? 'blue' : 'gray'}`}
              style={{
                borderRadius: 20,
                padding: '4px 14px',
                whiteSpace: 'nowrap',
                fontWeight: selectedCategory === 'all' ? 'bold' : 'normal',
              }}
              onClick={() => setSelectedCategory('all')}
            >
              সব পণ্য ({products.length})
            </button>
            {categories.map((cat) => {
              const count = products.filter((p) => p.category === cat).length;
              return (
                <button
                  key={cat}
                  type="button"
                  className={`btn sm ${selectedCategory === cat ? 'blue' : 'gray'}`}
                  style={{
                    borderRadius: 20,
                    padding: '4px 14px',
                    whiteSpace: 'nowrap',
                    fontWeight: selectedCategory === cat ? 'bold' : 'normal',
                  }}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat} ({count})
                </button>
              );
            })}
          </div>

          {/* Product Cards Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(115px, 1fr))',
              gap: 10,
              maxHeight: '580px',
              overflowY: 'auto',
              padding: '2px',
              paddingRight: 6,
            }}
          >
            {displayProducts.map((p) => {
              const selectedQty = cartQtyMap[p._id] || 0;
              const isSelected = selectedQty > 0;
              const isOut = p.stockQty <= 0;
              const isLow = p.stockQty > 0 && p.stockQty <= (p.lowStockAt || 5);

              return (
                <div
                  key={p._id}
                  onClick={() => addProduct(p._id)}
                  style={{
                    position: 'relative',
                    background: isSelected ? '#eff6ff' : '#ffffff',
                    border: isSelected ? '2px solid #2563eb' : '1px solid var(--border)',
                    borderRadius: 12,
                    padding: 8,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: isSelected ? '0 4px 12px rgba(37,99,235,0.15)' : '0 1px 3px rgba(0,0,0,0.04)',
                    transition: 'transform 0.1s ease, box-shadow 0.1s ease',
                    userSelect: 'none',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    if (!isSelected) e.currentTarget.style.boxShadow = '0 4px 10px rgba(0,0,0,0.08)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    if (!isSelected) e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)';
                  }}
                >
                  {/* Floating Badges */}
                  <div style={{ position: 'absolute', top: 6, left: 6, right: 6, display: 'flex', justifyContent: 'space-between', zIndex: 2, pointerEvents: 'none' }}>
                    {p.soldCount > 0 ? (
                      <span
                        style={{
                          background: 'rgba(234, 88, 12, 0.95)',
                          color: '#fff',
                          fontSize: 9.5,
                          fontWeight: 'bold',
                          padding: '2px 6px',
                          borderRadius: 6,
                          boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
                        }}
                        title={`এই পণ্যটি সর্বমোট ${p.soldCount} বার বিক্রি হয়েছে`}
                      >
                        🔥 {p.soldCount}
                      </span>
                    ) : <span />}

                    {isSelected && (
                      <span
                        style={{
                          background: '#2563eb',
                          color: '#fff',
                          fontSize: 10,
                          fontWeight: 'bold',
                          padding: '2px 7px',
                          borderRadius: 6,
                          boxShadow: '0 2px 4px rgba(37,99,235,0.3)',
                        }}
                      >
                        ✓ {selectedQty} টি
                      </span>
                    )}
                  </div>

                  {/* Photo Box */}
                  <div
                    style={{
                      width: '100%',
                      height: 95,
                      borderRadius: 8,
                      overflow: 'hidden',
                      background: '#f1f5f9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      marginBottom: 8,
                    }}
                  >
                    {p.imageUrl ? (
                      <img
                        src={p.imageUrl}
                        alt={p.name}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                        loading="lazy"
                      />
                    ) : (
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#94a3b8',
                        }}
                      >
                        <span style={{ fontSize: 32 }}>📦</span>
                        <span style={{ fontSize: 10, marginTop: 2, color: '#64748b' }}>{p.category || 'পণ্য'}</span>
                      </div>
                    )}
                  </div>

                  {/* Product Details */}
                  <div>
                    <div
                      style={{
                        fontWeight: '600',
                        fontSize: 13,
                        lineHeight: 1.3,
                        color: 'var(--text)',
                        minHeight: 34,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                      title={p.name}
                    >
                      {p.name}
                    </div>

                    <div className="flex between align-center mt8" style={{ marginTop: 6 }}>
                      <b style={{ color: '#16a34a', fontSize: 14 }}>
                        {taka(p.sellPrice)}
                      </b>
                      <span
                        style={{
                          fontSize: 10.5,
                          padding: '1px 5px',
                          borderRadius: 4,
                          fontWeight: 'bold',
                          background: isOut ? '#fee2e2' : isLow ? '#fef3c7' : '#dcfce7',
                          color: isOut ? '#dc2626' : isLow ? '#b45309' : '#15803d',
                        }}
                      >
                        {isOut ? 'স্টক ০' : `${p.stockQty} ${p.unit || ''}`}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

            {displayProducts.length === 0 && (
              <div
                className="empty"
                style={{
                  gridColumn: '1 / -1',
                  padding: '36px 12px',
                  textAlign: 'center',
                }}
              >
                🔍 কোনো পণ্য পাওয়া যায়নি।
                {searchQuery && (
                  <div style={{ marginTop: 6 }}>
                    <button className="btn sm gray" onClick={() => setSearchQuery('')}>
                      সার্চ ক্লিয়ার করুন
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Quick Add Custom Unregistered Product Button */}
          <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px dashed var(--border)' }}>
            <button
              type="button"
              className="btn sm gray"
              style={{ width: '100%', fontSize: 13 }}
              onClick={() => setShowCustomForm(!showCustomForm)}
            >
              {showCustomForm ? '▲ কাস্টম পণ্য ফর্ম বন্ধ করুন' : '➕ তালিকায় নেই এমন পণ্য দ্রুত যোগ করুন'}
            </button>

            {showCustomForm && (
              <div
                style={{
                  marginTop: 10,
                  padding: 12,
                  background: 'var(--bg)',
                  borderRadius: 8,
                  border: '1px dashed var(--border)',
                }}
              >
                <h4 style={{ margin: 0, fontSize: 13 }}>নতুন অনিবন্ধিত পণ্য কার্টে যুক্ত করুন:</h4>
                <div className="form-grid two" style={{ gap: 8, marginTop: 8 }}>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <input
                      placeholder="পণ্যের নাম *"
                      value={newProdName}
                      onChange={(e) => setNewProdName(e.target.value)}
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      placeholder="কেনার দাম (Buy)"
                      value={newProdBuy}
                      onChange={(e) => setNewProdBuy(e.target.value)}
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      placeholder="বিক্রির দাম (Sell) *"
                      value={newProdSell}
                      onChange={(e) => setNewProdSell(e.target.value)}
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      placeholder="বিক্রির পরিমাণ"
                      value={newProdQty}
                      onChange={(e) => setNewProdQty(e.target.value)}
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      placeholder="মোট স্টক (ঐচ্ছিক)"
                      value={newProdStock}
                      onChange={(e) => setNewProdStock(e.target.value)}
                    />
                  </div>
                  <button
                    type="button"
                    className="btn green"
                    style={{ gridColumn: '1 / -1' }}
                    onClick={addCustomProduct}
                  >
                    + কার্টে যোগ করুন
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Cart & Checkout Section */}
        <div className="card" style={{ padding: '16px 18px' }}>
          {/* Cart Header */}
          <div className="flex between align-center mb8" style={{ borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
            <h3 style={{ margin: 0, fontSize: 17 }}>
              🛒 কার্ট ({cart.reduce((a, c) => a + c.qty, 0)} টি পণ্য)
            </h3>
            {cart.length > 0 && (
              <button
                type="button"
                className="btn sm text red"
                style={{ padding: '2px 8px', fontSize: 12 }}
                onClick={clearCart}
              >
                🗑️ কার্ট খালি করুন
              </button>
            )}
          </div>

          {/* Cart Items Table */}
          <div className="table-wrap" style={{ maxHeight: 250, overflowY: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>পণ্য</th>
                  <th>দর</th>
                  <th>পরিমাণ</th>
                  <th>মোট</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {cart.length === 0 && (
                  <tr>
                    <td colSpan={5} className="empty" style={{ padding: '28px 12px' }}>
                      বাম পাশের পণ্যের ছবিতে ক্লিক করে কার্টে যোগ করুন
                    </td>
                  </tr>
                )}
                {cart.map((c) => (
                  <tr key={c.productId}>
                    <td style={{ maxWidth: 140, whiteSpace: 'normal' }}>
                      <div style={{ fontWeight: '600', fontSize: 13, lineHeight: 1.2 }}>{c.name}</div>
                      {c.isNewProduct && (
                        <span className="badge amber" style={{ fontSize: 9, marginTop: 2 }}>
                          নতুন
                        </span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <span>৳</span>
                        <input
                          type="number"
                          value={c.price}
                          onChange={(e) => updatePrice(c.productId, e.target.value)}
                          style={{
                            width: 58,
                            padding: '3px 4px',
                            fontSize: 12.5,
                            borderRadius: 4,
                            border: '1px solid var(--border)',
                          }}
                        />
                      </div>
                    </td>
                    <td>
                      <div className="flex align-center" style={{ gap: 2 }}>
                        <button
                          type="button"
                          className="btn sm gray"
                          style={{ padding: '1px 6px', fontSize: 12 }}
                          onClick={() => updateQty(c.productId, c.qty - 1)}
                        >
                          −
                        </button>
                        <span style={{ minWidth: 24, textAlign: 'center', fontWeight: 'bold', fontSize: 13 }}>
                          {c.qty}
                        </span>
                        <button
                          type="button"
                          className="btn sm gray"
                          style={{ padding: '1px 6px', fontSize: 12 }}
                          onClick={() => updateQty(c.productId, c.qty + 1)}
                        >
                          +
                        </button>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <span>৳</span>
                        <input
                          type="number"
                          value={c.total}
                          onChange={(e) => updateTotal(c.productId, e.target.value)}
                          style={{
                            width: 70,
                            padding: '3px 4px',
                            fontSize: 13,
                            fontWeight: 'bold',
                            borderRadius: 4,
                            border: '1px solid var(--border)',
                          }}
                        />
                      </div>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn sm red"
                        style={{ padding: '2px 6px' }}
                        onClick={() => removeItem(c.productId)}
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <hr style={{ margin: '12px 0' }} />

          {/* Customer & Payment Form */}
          <div className="form-grid" style={{ gap: 10 }}>
            {/* Customer Search / Selection */}
            <div style={{ position: 'relative' }}>
              <label style={{ fontSize: 12.5 }}>গ্রাহকের নাম (ঐচ্ছিক)</label>
              <div style={{ position: 'relative' }}>
                <input
                  value={customerName}
                  onChange={(e) => {
                    setCustomerName(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  placeholder="গ্রাহকের নাম লিখুন বা সিলেক্ট করুন"
                  autoComplete="off"
                  style={{ paddingRight: 30 }}
                />
                <button
                  type="button"
                  onClick={() => setShowSuggestions(!showSuggestions)}
                  style={{
                    position: 'absolute',
                    right: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--muted)',
                    fontSize: 10,
                  }}
                  onMouseDown={(e) => e.preventDefault()}
                >
                  ▼
                </button>
              </div>

              {/* Customer Previous Due Alert */}
              {customerName.trim() && (
                <div style={{ marginTop: 4, fontSize: 12, fontWeight: 'bold' }}>
                  {customerBakiMap[customerName.trim().toLowerCase()] > 0 ? (
                    <span className="amber" style={{ background: '#fef3c7', padding: '2px 8px', borderRadius: 4, border: '1px solid #f59e0b' }}>
                      ⚠️ পূর্বের বকেয়া বাকি: {taka(customerBakiMap[customerName.trim().toLowerCase()])}
                    </span>
                  ) : customerBakiMap[customerName.trim().toLowerCase()] < 0 ? (
                    <span className="blue" style={{ background: '#dbeafe', padding: '2px 8px', borderRadius: 4, border: '1px solid #3b82f6' }}>
                      ℹ️ পূর্বের অগ্রিম/দেনা: {taka(-customerBakiMap[customerName.trim().toLowerCase()])}
                    </span>
                  ) : (
                    <span className="green" style={{ background: '#dcfce7', padding: '2px 8px', borderRadius: 4, border: '1px solid #22c55e' }}>
                      ✅ কোনো বকেয়া বাকি নেই (০ ৳)
                    </span>
                  )}
                </div>
              )}

              {/* Autocomplete Dropdown */}
              {showSuggestions && customerSuggestions.length > 0 && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    background: '#ffffff',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                    zIndex: 50,
                    maxHeight: 180,
                    overflowY: 'auto',
                    marginTop: 4,
                  }}
                >
                  {customerSuggestions.map((c) => (
                    <div
                      key={c._id}
                      onClick={() => {
                        setCustomerName(c.name);
                        setCustomerPhone(c.phone || '');
                        setShowSuggestions(false);
                      }}
                      style={{
                        padding: '8px 12px',
                        cursor: 'pointer',
                        borderBottom: '1px solid #f1f5f9',
                        fontSize: 13.5,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                      onMouseDown={(e) => e.preventDefault()}
                    >
                      <div>
                        <b>{c.name}</b>
                        {c.phone && <span className="muted" style={{ fontSize: 11, marginLeft: 6 }}>({c.phone})</span>}
                      </div>
                      {customerBakiMap[c.name.trim().toLowerCase()] > 0 && (
                        <span className="red" style={{ fontSize: 11, fontWeight: 'bold' }}>
                          বাকি: {taka(customerBakiMap[c.name.trim().toLowerCase()])}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid cols-2" style={{ gap: 10 }}>
              <div>
                <label style={{ fontSize: 12.5 }}>গ্রাহকের মোবাইল</label>
                <input
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="01XXXXXXXXX"
                />
              </div>

              <div>
                <label style={{ fontSize: 12.5 }}>পেমেন্ট মাধ্যম</label>
                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                  <option value="cash">💵 নগদ (Cash)</option>
                  <option value="bkash">📱 bKash</option>
                  <option value="both">💵+📱 নগদ + bKash</option>
                </select>
              </div>
            </div>

            {/* Calculations Row */}
            <div
              style={{
                background: '#f8fafc',
                padding: '10px 14px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                marginTop: 4,
              }}
            >
              <div className="flex between" style={{ fontSize: 13.5, marginBottom: 4 }}>
                <span className="muted">সাবটোটাল:</span>
                <b>{taka(subtotal)}</b>
              </div>

              <div className="flex between align-center" style={{ fontSize: 13.5, marginBottom: 4 }}>
                <span className="muted">ডিসকাউন্ট (৳):</span>
                <input
                  type="number"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  style={{ width: 80, padding: '3px 6px', fontSize: 13, textAlign: 'right' }}
                />
              </div>

              <div
                className="flex between align-center"
                style={{
                  borderTop: '1px solid #e2e8f0',
                  paddingTop: 6,
                  marginTop: 6,
                  fontSize: 16,
                }}
              >
                <b>সর্বমোট প্রদেয়:</b>
                <b style={{ color: '#2563eb', fontSize: 20 }}>{taka(grandTotal)}</b>
              </div>

              <div className="flex between align-center" style={{ marginTop: 8 }}>
                <span style={{ fontWeight: 'bold', fontSize: 13.5 }}>জমা / প্রদত্ত টাকা (৳):</span>
                <input
                  type="number"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  style={{ width: 100, padding: '5px 8px', fontSize: 15, fontWeight: 'bold', textAlign: 'right' }}
                />
              </div>

              <div
                className="flex between align-center"
                style={{
                  borderTop: '1px dashed #e2e8f0',
                  paddingTop: 6,
                  marginTop: 8,
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 'bold' }}>বকেয়া বাকি (Due):</span>
                <span className={due > 0 ? 'red' : 'green'} style={{ fontSize: 17, fontWeight: 'bold' }}>
                  {due > 0 ? taka(due) : '✅ পরিশোধ'}
                </span>
              </div>
            </div>

            <button
              className="btn green"
              style={{
                width: '100%',
                padding: '12px',
                fontSize: 16,
                fontWeight: 'bold',
                marginTop: 6,
                borderRadius: 8,
              }}
              onClick={submit}
              disabled={loading || cart.length === 0}
            >
              {loading ? 'বিক্রি হিসাব হচ্ছে...' : `✅ বিক্রি নিশ্চিত করুন (${taka(grandTotal)})`}
            </button>
          </div>
        </div>
      </div>

      {/* Recent Sales History */}
      <div className="card mt" style={{ marginTop: 18 }}>
        <div className="flex between align-center mb8">
          <h3>📜 সাম্প্রতিক বিক্রি</h3>
          <Link href="/admin/sales-history" className="blue" style={{ fontSize: 13 }}>
            সকল বিক্রির ইতিহাস →
          </Link>
        </div>

        <div className="table-wrap mt8">
          <table>
            <thead>
              <tr>
                <th>তারিখ</th>
                <th>গ্রাহক</th>
                <th>পণ্যসমূহ</th>
                <th>মেথড</th>
                <th>মোট</th>
                <th>প্রদত্ত</th>
                <th>বাকি</th>
              </tr>
            </thead>
            <tbody>
              {sales.slice(0, 8).map((s) => (
                <tr key={s._id}>
                  <td>{new Date(s.date).toLocaleDateString('bn-BD')}</td>
                  <td><b>{s.customerName || 'ক্যাশ ক্রেতা'}</b></td>
                  <td style={{ maxWidth: 220, whiteSpace: 'normal', fontSize: 12.5 }} className="muted">
                    {(s.items || []).map((it) => `${it.name} (${it.qty})`).join(', ')}
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        s.paymentMethod === 'bkash' ? 'blue' : s.paymentMethod === 'both' ? 'amber' : 'gray'
                      }`}
                    >
                      {s.paymentMethod === 'bkash' ? 'bKash' : s.paymentMethod === 'both' ? 'নগদ+bKash' : 'নগদ'}
                    </span>
                  </td>
                  <td><b>{taka(s.totalAmount)}</b></td>
                  <td>{taka(s.paidAmount)}</td>
                  <td className={s.dueAmount > 0 ? 'red' : 'green'}>
                    {s.dueAmount > 0 ? taka(s.dueAmount) : 'পরিশোধ'}
                  </td>
                </tr>
              ))}
              {sales.length === 0 && (
                <tr>
                  <td colSpan={7} className="empty">
                    কোনো বিক্রির রেকর্ড পাওয়া যায়নি
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
