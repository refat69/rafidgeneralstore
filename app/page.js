'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function StorefrontHomePage() {
  const [products, setProducts] = useState([]);
  const [offers, setOffers] = useState([]);
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filter & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Shopping Cart State
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // Checkout Form State
  const [checkoutForm, setCheckoutForm] = useState({
    customerName: '',
    customerPhone: '',
    deliveryAddress: '',
    area: 'jahangirnagar_boalmari', // Jahangirnagar & Boalmari area home delivery
    paymentMethod: 'cod', // Cash on Delivery
    note: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(null);

  useEffect(() => {
    // Load products
    fetch('/api/products?t=' + Date.now())
      .then((r) => r.json())
      .then((d) => setProducts(d.products || []))
      .catch((err) => console.error('Error fetching products:', err));

    // Load offers
    fetch('/api/offers?t=' + Date.now())
      .then((r) => r.json())
      .then((d) => setOffers(d.offers || []))
      .catch((err) => console.error('Error fetching offers:', err));

    // Load customer auth state
    fetch('/api/customer/me')
      .then((r) => r.json())
      .then((d) => {
        if (d.loggedIn && d.user) {
          setCustomer(d.user);
          setCheckoutForm((prev) => ({
            ...prev,
            customerName: d.user.name || '',
            customerPhone: d.user.phone || ''
          }));
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Cart operations
  const addToCart = (product) => {
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.productId === product._id);
      if (existing) {
        return prevCart.map((item) =>
          item.productId === product._id
            ? { ...item, qty: item.qty + 1 }
            : item
        );
      }
      return [
        ...prevCart,
        {
          productId: product._id,
          name: product.name,
          price: product.sellPrice,
          unit: product.unit || 'পিস',
          imageUrl: product.imageUrl || '',
          qty: 1
        }
      ];
    });
    setIsCartOpen(true);
  };

  const updateQty = (productId, delta) => {
    setCart((prevCart) =>
      prevCart
        .map((item) => {
          if (item.productId === productId) {
            const newQty = item.qty + delta;
            return newQty > 0 ? { ...item, qty: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const removeFromCart = (productId) => {
    setCart((prevCart) => prevCart.filter((item) => item.productId !== productId));
  };

  const cartSubtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const deliveryFee = 20; // Fixed 20 Tk for Jahangirnagar & Boalmari
  const cartTotal = cartSubtotal + (cart.length > 0 ? deliveryFee : 0);
  const totalItemsCount = cart.reduce((sum, item) => sum + item.qty, 0);

  // Get list of unique categories
  const categories = ['all', ...Array.from(new Set(products.map((p) => p.category || 'সাধারণ').filter(Boolean)))];

  // Filter products
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.category && p.category.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCat = selectedCategory === 'all' || (p.category || 'সাধারণ') === selectedCategory;
    return matchesSearch && matchesCat;
  });

  // Handle Order Submit
  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!checkoutForm.customerName.trim() || !checkoutForm.customerPhone.trim() || !checkoutForm.deliveryAddress.trim()) {
      alert('অনুগ্রহ করে নাম, ফোন নম্বর এবং সম্পূর্ণ ঠিকানা টাইপ করুন।');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...checkoutForm,
          items: cart
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setOrderSuccess(data.order);
        setCart([]);
        setIsCheckoutOpen(false);
      } else {
        alert(data.error || 'অর্ডার সম্পন্ন করতে সমস্যা হয়েছে');
      }
    } catch (err) {
      alert('অর্ডার তৈরিতে ত্রুটি দেখা দিয়েছে');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* 1. Header Navigation */}
      <nav className="glass-nav" style={{ position: 'sticky', top: 0, zIndex: 100, color: '#fff', padding: '14px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
          <div>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ background: '#2563eb', padding: '8px 12px', borderRadius: 12, fontSize: 20 }}>🏪</div>
              <div>
                <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em', color: '#fff' }}>
                  রাফিদ জেনারেল স্টোর
                </h1>
                <p style={{ margin: 0, fontSize: 11, color: '#94a3b8' }}>Rafid General Store • অনলাইন কেনাকাটা</p>
              </div>
            </Link>
          </div>

          {/* Search bar inside header for wide screen */}
          <div style={{ flex: '1 1 300px', maxWidth: 450, position: 'relative' }}>
            <input
              type="text"
              placeholder="🔍 পণ্য খুঁজুন (যেমন: চাল, তেল, ডাল...)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 16px',
                borderRadius: 50,
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'rgba(255,255,255,0.1)',
                color: '#fff',
                fontSize: 14,
                outline: 'none',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            {/* Cart Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              style={{
                position: 'relative',
                background: '#2563eb',
                color: '#fff',
                border: 'none',
                padding: '10px 18px',
                borderRadius: 50,
                fontSize: 14,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: '0 4px 12px rgba(37,99,235,0.3)',
              }}
            >
              <span>🛒 কার্ট</span>
              {totalItemsCount > 0 && (
                <span
                  style={{
                    background: '#ef4444',
                    color: '#fff',
                    borderRadius: 50,
                    padding: '2px 8px',
                    fontSize: 12,
                    fontWeight: 800,
                  }}
                >
                  {totalItemsCount}
                </span>
              )}
            </button>

            {loading ? (
              <span style={{ fontSize: 13, color: '#94a3b8' }}>লোড হচ্ছে...</span>
            ) : customer ? (
              <Link href="/customer/dashboard" style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', padding: '8px 14px', borderRadius: 50, fontSize: 13, fontWeight: 600 }}>
                👤 {customer.name}
              </Link>
            ) : (
              <Link href="/customer/login" style={{ color: '#cbd5e1', fontSize: 13, fontWeight: 600 }}>
                লগইন
              </Link>
            )}

            <Link href="/login" style={{ border: '1px solid rgba(255,255,255,0.2)', color: '#94a3b8', padding: '6px 12px', borderRadius: 8, fontSize: 12 }}>
              অ্যাডমিন
            </Link>
          </div>
        </div>
      </nav>

      {/* 2. Dynamic Banner & Announcements */}
      <header style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #090d16 100%)', color: '#fff', padding: '48px 20px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ maxWidth: 850, margin: '0 auto', position: 'relative', zIndex: 2 }} className="animate-slide-up">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(37, 99, 235, 0.2)', border: '1px solid rgba(37, 99, 235, 0.4)', padding: '6px 16px', borderRadius: 50, fontSize: 13, color: '#60a5fa', marginBottom: 16, fontWeight: 600 }}>
            <span>⚡ জাহাঙ্গীরনগর ও বোয়ালমারী এলাকায় হোম ডেলিভারি মাত্র ২০ টাকা!</span>
          </div>

          <h2 style={{ fontSize: 36, fontWeight: 900, marginBottom: 14, lineHeight: 1.2, letterSpacing: '-0.02em' }}>
            আপনার পছন্দের সব পণ্য এখন ঘরে বসেই অর্ডার করুন!
          </h2>
          <p style={{ fontSize: 16, color: '#cbd5e1', lineHeight: 1.6, marginBottom: 24, maxWidth: 700, margin: '0 auto 24px' }}>
            রাফিদ জেনারেল স্টোর - ক্যাশ অন ডেলিভারিতে ঝামেলামুক্ত কেনাকাটার সেরা ঠিকানা।
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ background: 'rgba(255,255,255,0.06)', padding: '10px 20px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>🚚</span> <b>হোম ডেলিভারি (৳২০)</b>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.06)', padding: '10px 20px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>💵</span> <b>ক্যাশ অন ডেলিভারি</b>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.06)', padding: '10px 20px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>📞</span> <b>01743476235</b>
            </div>
          </div>
        </div>
      </header>

      {/* 3. Offers Carousel / Grid */}
      {offers.length > 0 && (
        <section style={{ maxWidth: 1200, margin: '32px auto 0', padding: '0 20px' }}>
          <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            🎁 স্পেশাল অফারসমূহ
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {offers.map((offer) => (
              <div key={offer._id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, overflow: 'hidden', display: 'flex', gap: 12, padding: 12, alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                {offer.imageUrl ? (
                  <img src={offer.imageUrl} alt={offer.title} style={{ width: 70, height: 70, objectFit: 'cover', borderRadius: 10 }} />
                ) : (
                  <div style={{ width: 70, height: 70, background: '#eff6ff', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>🎁</div>
                )}
                <div>
                  <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#1e293b' }}>{offer.title}</h4>
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: '#64748b', lineHeight: 1.4 }}>{offer.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 4. Main Product Storefront Section */}
      <main style={{ maxWidth: 1200, margin: '36px auto', padding: '0 20px' }}>
        
        {/* Category Filters Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h3 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', margin: 0 }}>
              🛍️ আমাদের পণ্যসমূহ ({filteredProducts.length} টি)
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
              {products.length > 0 ? `মোট ${products.length} টি পণ্যের মধ্যে প্রদর্শন করা হচ্ছে` : 'পণ্য তালিকা লোড হচ্ছে...'}
            </p>
          </div>

          {/* Category Badges */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 50,
                  fontSize: 13,
                  fontWeight: 600,
                  border: '1px solid',
                  borderColor: selectedCategory === cat ? '#2563eb' : '#cbd5e1',
                  background: selectedCategory === cat ? '#2563eb' : '#fff',
                  color: selectedCategory === cat ? '#fff' : '#475569',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                {cat === 'all' ? `সব পণ্য (${products.length})` : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Cards Grid */}
        {filteredProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: 20, border: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: 48 }}>📦</span>
            <h4 style={{ marginTop: 12, fontSize: 18, color: '#334155' }}>কোনো পণ্য পাওয়া যায়নি</h4>
            <p style={{ color: '#94a3b8', fontSize: 14, marginTop: 4 }}>সার্চ পরিবর্তন করুন অথবা নতুন পণ্যের জন্য কিছুক্ষণ পর চেষ্টা করুন</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 }}>
            {filteredProducts.map((product) => {
              const inStock = product.stockQty > 0;
              const cartItem = cart.find((i) => i.productId === product._id);

              return (
                <div
                  key={product._id}
                  className="product-card"
                  style={{
                    background: '#fff',
                    border: '1px solid #e2e8f0',
                    borderRadius: 18,
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    justify: 'space-between',
                    position: 'relative'
                  }}
                >
                  {/* Category Badge */}
                  <span
                    style={{
                      position: 'absolute',
                      top: 12,
                      left: 12,
                      background: 'rgba(15, 23, 42, 0.75)',
                      backdropFilter: 'blur(4px)',
                      color: '#fff',
                      padding: '4px 10px',
                      borderRadius: 50,
                      fontSize: 11,
                      fontWeight: 600,
                      zIndex: 2,
                    }}
                  >
                    {product.category || 'সাধারণ'}
                  </span>

                  <div>
                    {/* Image */}
                    <div style={{ width: '100%', height: 180, background: '#f1f5f9', position: 'relative', overflow: 'hidden' }}>
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 54, background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)' }}>
                          🛒
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div style={{ padding: 16 }}>
                      <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a', lineHeight: 1.3 }}>
                        {product.name}
                      </h4>

                      {product.description && (
                        <p style={{ margin: '6px 0 0', fontSize: 12, color: '#64748b', lineHeight: 1.4, height: 34, overflow: 'hidden' }}>
                          {product.description}
                        </p>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
                        <div>
                          <span style={{ fontSize: 20, fontWeight: 900, color: '#16a34a' }}>
                            ৳{product.sellPrice}
                          </span>
                          <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 4 }}>/ {product.unit || 'পিস'}</span>
                        </div>

                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: 6,
                            background: inStock ? '#dcfce7' : '#fee2e2',
                            color: inStock ? '#16a34a' : '#dc2626',
                          }}
                        >
                          {inStock ? `স্টকে আছে (${product.stockQty})` : 'স্টক শেষ'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Add to Cart Button */}
                  <div style={{ padding: '0 16px 16px' }}>
                    {cartItem ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f1f5f9', borderRadius: 10, padding: 4 }}>
                        <button
                          onClick={() => updateQty(product._id, -1)}
                          style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: '#fff', color: '#0f172a', fontWeight: 800, cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}
                        >
                          -
                        </button>
                        <span style={{ fontWeight: 800, fontSize: 14 }}>{cartItem.qty} {product.unit || 'পিস'}</span>
                        <button
                          onClick={() => updateQty(product._id, 1)}
                          style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: '#2563eb', color: '#fff', fontWeight: 800, cursor: 'pointer' }}
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => addToCart(product)}
                        disabled={!inStock}
                        style={{
                          width: '100%',
                          padding: '10px',
                          borderRadius: 10,
                          border: 'none',
                          background: inStock ? '#2563eb' : '#cbd5e1',
                          color: '#fff',
                          fontWeight: 700,
                          fontSize: 14,
                          cursor: inStock ? 'pointer' : 'not-allowed',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <span>🛒 কার্টে যোগ করুন</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* 5. Cart Drawer Modal */}
      {isCartOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', justifyContent: 'flex-end' }}>
          {/* Backdrop */}
          <div
            onClick={() => setIsCartOpen(false)}
            style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)' }}
          />

          {/* Drawer Panel */}
          <div
            className="animate-slide-up"
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: 420,
              background: '#fff',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '-4px 0 24px rgba(0,0,0,0.15)',
              zIndex: 2,
            }}
          >
            {/* Drawer Header */}
            <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#0f172a', color: '#fff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 24 }}>🛒</span>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>আপনার শপিং কার্ট ({totalItemsCount})</h3>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: 22, cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Cart Items List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
              {cart.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
                  <span style={{ fontSize: 50 }}>🛒</span>
                  <p style={{ marginTop: 12, fontSize: 16, fontWeight: 600 }}>আপনার কার্ট বর্তমানে খালি</p>
                  <p style={{ fontSize: 13, color: '#cbd5e1' }}>পণ্য পছন্দ করে "কার্টে যোগ করুন" এ চাপ দিন</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {cart.map((item) => (
                    <div key={item.productId} style={{ display: 'flex', gap: 12, alignItems: 'center', background: '#f8fafc', padding: 12, borderRadius: 12, border: '1px solid #e2e8f0' }}>
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 8 }} />
                      ) : (
                        <div style={{ width: 50, height: 50, background: '#e2e8f0', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>📦</div>
                      )}
                      <div style={{ flex: 1 }}>
                        <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{item.name}</h4>
                        <div style={{ fontSize: 12, color: '#16a34a', fontWeight: 700, marginTop: 2 }}>
                          ৳{item.price} × {item.qty} = ৳{item.price * item.qty}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <button onClick={() => updateQty(item.productId, -1)} style={{ width: 26, height: 26, borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}>-</button>
                        <span style={{ fontSize: 13, fontWeight: 700 }}>{item.qty}</span>
                        <button onClick={() => updateQty(item.productId, 1)} style={{ width: 26, height: 26, borderRadius: 6, border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}>+</button>
                      </div>
                      <button onClick={() => removeFromCart(item.productId)} style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', padding: 4, fontSize: 16 }}>🗑</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Drawer Footer & Checkout Button */}
            {cart.length > 0 && (
              <div style={{ padding: 20, borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
                <div style={{ fontSize: 13, color: '#64748b', display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span>পণ্য সাবটোটাল:</span> <span>৳{cartSubtotal}</span>
                </div>
                <div style={{ fontSize: 13, color: '#64748b', display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span>ডেলিভারি চার্জ (জাহাঙ্গীরনগর/বোয়ালমারী):</span> <span>৳{deliveryFee}</span>
                </div>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#0f172a', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #cbd5e1', paddingTop: 10, marginBottom: 16 }}>
                  <span>সর্বমোট:</span> <span style={{ color: '#2563eb' }}>৳{cartTotal}</span>
                </div>

                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    setIsCheckoutOpen(true);
                  }}
                  style={{
                    width: '100%',
                    background: '#2563eb',
                    color: '#fff',
                    border: 'none',
                    padding: '14px',
                    borderRadius: 12,
                    fontSize: 16,
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(37,99,235,0.3)',
                  }}
                >
                  ক্যাশ অন ডেলিভারিতে চেকআউট করুন 🚀
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 6. Checkout Modal */}
      {isCheckoutOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 210, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div onClick={() => setIsCheckoutOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(4px)' }} />

          <div
            className="animate-modal"
            style={{
              position: 'relative',
              background: '#fff',
              borderRadius: 20,
              maxWidth: 500,
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: 24,
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              zIndex: 2,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', pb: 12, marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: '#0f172a' }}>
                🚚 অর্ডার নিশ্চিতকরণ (Checkout)
              </h3>
              <button onClick={() => setIsCheckoutOpen(false)} style={{ background: 'transparent', border: 'none', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handlePlaceOrder}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: '#334155' }}>
                    আপনার নাম *
                  </label>
                  <input
                    type="text"
                    required
                    value={checkoutForm.customerName}
                    onChange={(e) => setCheckoutForm({ ...checkoutForm, customerName: e.target.value })}
                    placeholder="আপনার পুরো নাম লিখুন"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: '#334155' }}>
                    মোবাইল নম্বর *
                  </label>
                  <input
                    type="tel"
                    required
                    value={checkoutForm.customerPhone}
                    onChange={(e) => setCheckoutForm({ ...checkoutForm, customerPhone: e.target.value })}
                    placeholder="017XXXXXXXX"
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: '#334155' }}>
                    ডেলিভারি এলাকা *
                  </label>
                  <select
                    value={checkoutForm.area}
                    onChange={(e) => setCheckoutForm({ ...checkoutForm, area: e.target.value })}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14, background: '#fff' }}
                  >
                    <option value="jahangirnagar_boalmari">🏠 জাহাঙ্গীরনগর / বোয়ালমারী (হোম ডেলিভারি - ২০ টাকা)</option>
                    <option value="other">🚚 অন্যান্য এলাকা (হোম ডেলিভারি - ২০ টাকা)</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: '#334155' }}>
                    সম্পূর্ণ ঠিকানা / হল / বাসা নম্বর *
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={checkoutForm.deliveryAddress}
                    onChange={(e) => setCheckoutForm({ ...checkoutForm, deliveryAddress: e.target.value })}
                    placeholder="যেমন: আল বেরুনী হল, রুম ২০২ / রোড ৫, বাসা ১০..."
                    style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 14 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: '#334155' }}>
                    পেমেন্ট অপশন
                  </label>
                  <div style={{ background: '#f0fdf4', border: '1px solid #86efac', padding: 12, borderRadius: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 22 }}>💵</span>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 14, color: '#166534' }}>Cash on Delivery (ক্যাশ অন ডেলিভারি)</div>
                      <div style={{ fontSize: 12, color: '#15803d' }}>পণ্য হাতে পেয়ে টাকা পরিশোধ করুন</div>
                    </div>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6, color: '#334155' }}>
                    অতিরিক্ত নোট (ঐচ্ছিক)
                  </label>
                  <input
                    type="text"
                    value={checkoutForm.note}
                    onChange={(e) => setCheckoutForm({ ...checkoutForm, note: e.target.value })}
                    placeholder="জরুরি কোনো নির্দেশ থাকলে লিখুন"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: 13 }}
                  />
                </div>

                {/* Summary Box */}
                <div style={{ background: '#f8fafc', padding: 14, borderRadius: 12, border: '1px solid #e2e8f0', marginTop: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#64748b' }}>
                    <span>পণ্যের দাম:</span> <span>৳{cartSubtotal}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#64748b', marginTop: 4 }}>
                    <span>ডেলিভারি চার্জ:</span> <span>৳{deliveryFee}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 900, color: '#0f172a', borderTop: '1px solid #cbd5e1', paddingTop: 8, marginTop: 8 }}>
                    <span>সর্বমোট টাকা:</span> <span style={{ color: '#2563eb' }}>৳{cartTotal}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    width: '100%',
                    background: '#16a34a',
                    color: '#fff',
                    border: 'none',
                    padding: '14px',
                    borderRadius: 12,
                    fontSize: 16,
                    fontWeight: 800,
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    marginTop: 8,
                    boxShadow: '0 4px 12px rgba(22,163,74,0.3)',
                  }}
                >
                  {submitting ? 'অর্ডার প্রসেস হচ্ছে...' : 'অর্ডার নিশ্চিত করুন (Confirm Order)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Order Success Confirmation Modal */}
      {orderSuccess && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(15, 23, 42, 0.8)', backdropFilter: 'blur(6px)' }} />

          <div
            className="animate-modal"
            style={{
              position: 'relative',
              background: '#fff',
              borderRadius: 24,
              maxWidth: 450,
              width: '100%',
              padding: 32,
              textAlign: 'center',
              boxShadow: '0 24px 48px rgba(0,0,0,0.3)',
              zIndex: 2,
            }}
          >
            <div style={{ width: 70, height: 70, background: '#dcfce7', color: '#16a34a', borderRadius: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, margin: '0 auto 16px' }}>
              ✓
            </div>

            <h3 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: '#0f172a' }}>
              অর্ডার সফলভাবে সম্পন্ন হয়েছে!
            </h3>
            <p style={{ color: '#64748b', fontSize: 14, marginTop: 8 }}>
              ধন্যবাদ <b>{orderSuccess.customerName}</b>, আপনার অর্ডারটি আমরা গ্রহণ করেছি।
            </p>

            <div style={{ background: '#f1f5f9', padding: 16, borderRadius: 16, margin: '20px 0', textAlign: 'left', fontSize: 14, lineHeight: 1.6 }}>
              <div><b>অর্ডার নম্বর:</b> #{orderSuccess.orderNumber}</div>
              <div><b>সর্বমোট টাকা:</b> <span style={{ color: '#16a34a', fontWeight: 800 }}>৳{orderSuccess.totalAmount}</span> (Cash on Delivery)</div>
              <div><b>ডেলিভারি এলাকা:</b> জাহাঙ্গীরনগর / বোয়ালমারী</div>
              <div><b>মোবাইল:</b> {orderSuccess.customerPhone}</div>
            </div>

            <button
              onClick={() => setOrderSuccess(null)}
              style={{
                width: '100%',
                background: '#2563eb',
                color: '#fff',
                border: 'none',
                padding: '12px 24px',
                borderRadius: 12,
                fontSize: 15,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              ঠিক আছে
            </button>
          </div>
        </div>
      )}

      {/* 8. Footer */}
      <footer style={{ background: '#0f172a', color: '#94a3b8', padding: '40px 20px', textAlign: 'center', borderTop: '1px solid #1e293b', marginTop: 80 }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h4 style={{ color: '#fff', fontSize: 18, margin: 0 }}>🏪 রাফিদ জেনারেল স্টোর</h4>
          <p style={{ margin: '8px 0 0', fontSize: 13, color: '#64748b' }}>আপনার নিত্যপ্রয়োজনীয় সব কেনাকাটায় আপনার বিশ্বস্ত সঙ্গী</p>
          <p style={{ margin: '16px 0 0', fontSize: 12, color: '#475569' }}>
            © {new Date().getFullYear()} রাফিদ জেনারেল স্টোর। সর্বস্বত্ব সংরক্ষিত। হেল্পলাইন: 01743476235
          </p>
        </div>
      </footer>
    </div>
  );
}
