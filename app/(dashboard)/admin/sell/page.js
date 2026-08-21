'use client';

import { useEffect, useState } from 'react';
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
  const [note, setNote] = useState('');
  const [discount, setDiscount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [sales, setSales] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // States for searchable product dropdown
  const [productSearch, setProductSearch] = useState('');
  const [showProductSuggestions, setShowProductSuggestions] = useState(false);
  const [customerBakiMap, setCustomerBakiMap] = useState({});

  // States for custom unregistered products
  const [newProdName, setNewProdName] = useState('');
  const [newProdBuy, setNewProdBuy] = useState('');
  const [newProdSell, setNewProdSell] = useState('');
  const [newProdQty, setNewProdQty] = useState(1);
  const [newProdStock, setNewProdStock] = useState('');

  useEffect(() => {
    fetch('/api/products?t=' + Date.now()).then((r) => r.json()).then((d) => setProducts(d.products || [])).catch(() => {});
    fetch('/api/customers?t=' + Date.now()).then((r) => r.json()).then((d) => setCustomers(d.customers || [])).catch(() => {});
    fetch('/api/baki?t=' + Date.now()).then((r) => r.json()).then((d) => {
      const map = {};
      (d.baki || []).forEach(b => {
        const key = (b.customerName || '').trim().toLowerCase();
        map[key] = b.amount;
      });
      setCustomerBakiMap(map);
    }).catch(() => {});
    loadSales();
  }, []);

  function loadSales() {
    fetch('/api/sales?t=' + Date.now()).then((r) => r.json()).then((d) => setSales(d.sales || [])).catch(() => {});
  }

  function addProduct(id) {
    const p = products.find((x) => x._id === id);
    if (!p) return;
    setCart((prev) => {
      const ex = prev.find((c) => c.productId === id);
      if (ex) {
        return prev.map((c) =>
          c.productId === id
            ? { ...c, qty: Math.min(c.qty + 1, p.stockQty), total: Math.min(c.qty + 1, p.stockQty) * c.price }
            : c
        );
      }
      return [...prev, { productId: p._id, name: p.name, price: p.sellPrice, buyPrice: p.buyPrice, qty: 1, maxQty: p.stockQty, total: p.sellPrice }];
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
        stock: stock
      }
    ]);

    setNewProdName('');
    setNewProdBuy('');
    setNewProdSell('');
    setNewProdQty(1);
    setNewProdStock('');
  }

  function updateQty(id, qty) {
    setCart((prev) =>
      prev.map((c) => {
        if (c.productId !== id) return c;
        const q = Math.max(1, Math.min(qty, c.maxQty));
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

  function removeItem(id) {
    setCart((prev) => prev.filter((c) => c.productId !== id));
  }

  const subtotal = cart.reduce((a, c) => a + c.total, 0);
  const grandTotal = Math.max(0, subtotal - (num(discount) || 0));
  const due = Math.max(0, grandTotal - (num(paidAmount) || 0));

  const customerSuggestions = customers.filter(c => 
    !customerName.trim() || 
    c.name.toLowerCase().includes(customerName.toLowerCase()) || 
    (c.phone && c.phone.includes(customerName))
  );

  const filteredProducts = products.filter(p =>
    !productSearch.trim() ||
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    (p.category && p.category.toLowerCase().includes(productSearch.toLowerCase()))
  );

  async function submit() {
    if (cart.length === 0) { toast.error('অন্তত একটি পণ্য যোগ করুন'); return; }
    setLoading(true);
    const res = await fetch('/api/sales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: cart.map((c) => ({
          productId: c.isNewProduct ? undefined : c.productId,
          qty: c.qty,
          price: c.price,
          buyPrice: c.buyPrice,
          isNewProduct: c.isNewProduct,
          name: c.name,
          stock: c.stock
        })),
        discount: num(discount),
        paidAmount: num(paidAmount),
        paymentMethod,
        customerName,
        customerPhone,
        note,
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { toast.error(data.error || 'বিক্রি সম্পন্ন হতে সমস্যা হয়েছে'); return; }
    toast.success('✅ বিক্রি সফল হয়েছে!');
    setCart([]); setPaidAmount(0); setDiscount(0); setCustomerName(''); setCustomerPhone(''); setNote('');
    loadSales();
    // reload products and customers lists
    fetch('/api/products?t=' + Date.now()).then((r) => r.json()).then((d) => setProducts(d.products || [])).catch(() => {});
    fetch('/api/customers?t=' + Date.now()).then((r) => r.json()).then((d) => setCustomers(d.customers || [])).catch(() => {});
  }

  return (
    <div>
      <div className="topbar">
        <div>
          <h2>🛒 নতুন বিক্রি</h2>
          <div className="sub">বিক্রি করুন এবং হিসাব রাখুন</div>
        </div>
        <Link href="/admin/sales-history" className="btn gray">
          📜 বিক্রির ইতিহাস ও তালিকা ➔
        </Link>
      </div>

      <div className="grid cols-2">
        {/* Left: product picker + cart */}
        <div className="card">
          <h3>১. পণ্য যোগ করুন</h3>
          <div className="mt8" style={{ position: 'relative' }}>
            <label style={{ fontSize: 13, fontWeight: 'bold' }}>তালিকা থেকে বাছাই করুন:</label>
            <div style={{ position: 'relative' }}>
              <input 
                value={productSearch} 
                onChange={(e) => {
                  setProductSearch(e.target.value);
                  setShowProductSuggestions(true);
                }} 
                onFocus={() => setShowProductSuggestions(true)}
                onBlur={() => setTimeout(() => setShowProductSuggestions(false), 200)}
                placeholder="পণ্য খুঁজুন বা সিলেক্ট করুন" 
                autoComplete="off"
                style={{ paddingRight: '30px' }}
              />
              <button
                type="button"
                onClick={() => setShowProductSuggestions(!showProductSuggestions)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--muted)',
                  fontSize: '10px',
                  padding: '4px'
                }}
                onMouseDown={(e) => e.preventDefault()} // prevent blur
              >
                ▼
              </button>
            </div>
            {showProductSuggestions && filteredProducts.length > 0 && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                background: '#ffffff',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                zIndex: 50,
                maxHeight: '200px',
                overflowY: 'auto',
                marginTop: '4px'
              }}>
                {filteredProducts.map((p) => (
                  <div 
                    key={p._id}
                    onClick={() => {
                      addProduct(p._id);
                      setProductSearch('');
                      setShowProductSuggestions(false);
                    }}
                    style={{
                      padding: '8px 12px',
                      cursor: 'pointer',
                      borderBottom: '1px solid #f1f5f9',
                      fontSize: '14px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                    onMouseDown={(e) => e.preventDefault()} // prevent blur from closing before click
                  >
                    <span style={{ fontWeight: '600', color: 'var(--text)' }}>{p.name}</span>
                    <span className="muted" style={{ fontSize: '12px' }}>
                      {taka(p.sellPrice)} ({p.stockQty} {p.unit} আছে)
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ marginTop: 16, padding: 12, background: 'var(--bg)', borderRadius: 8, border: '1px dashed var(--border)' }}>
            <h4 style={{ margin: 0, fontSize: 14 }}>➕ নতুন পণ্য (তালিকায় নেই):</h4>
            <div className="form-grid two" style={{ gap: 8, marginTop: 8 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <input placeholder="নতুন পণ্যের নাম" value={newProdName} onChange={(e) => setNewProdName(e.target.value)} />
              </div>
              <div>
                <input type="number" placeholder="কেনার দাম (Buy)" value={newProdBuy} onChange={(e) => setNewProdBuy(e.target.value)} />
              </div>
              <div>
                <input type="number" placeholder="বিক্রির দাম (Sell)" value={newProdSell} onChange={(e) => setNewProdSell(e.target.value)} />
              </div>
              <div>
                <input type="number" placeholder="বিক্রির পরিমাণ" value={newProdQty} onChange={(e) => setNewProdQty(e.target.value)} />
              </div>
              <div>
                <input type="number" placeholder="মোট স্টক (ঐচ্ছিক)" value={newProdStock} onChange={(e) => setNewProdStock(e.target.value)} />
              </div>
              <button type="button" className="btn gray" style={{ gridColumn: '1 / -1' }} onClick={addCustomProduct}>+ কার্ট-এ যোগ করুন</button>
            </div>
          </div>

          <hr />
          <h3>২. কার্ট</h3>
          <div className="table-wrap mt8">
            <table>
              <thead><tr><th>পণ্য</th><th>দাম</th><th>পরিমাণ</th><th>মোট</th><th></th></tr></thead>
              <tbody>
                {cart.length === 0 && (
                  <tr><td colSpan={5} className="empty">কার্ট খালি</td></tr>
                )}
                {cart.map((c) => (
                  <tr key={c.productId}>
                    <td>
                      {c.name}
                      {c.isNewProduct && <span className="badge amber" style={{ fontSize: 10, marginLeft: 6 }}>নতুন</span>}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span>৳</span>
                        <input 
                          type="number" 
                          value={c.price} 
                          onChange={(e) => updatePrice(c.productId, e.target.value)} 
                          style={{ width: '65px', padding: '4px 6px', fontSize: '13.5px', borderRadius: '6px', border: '1px solid var(--border)' }}
                        />
                      </div>
                    </td>
                    <td>
                      <div className="flex">
                        <button className="btn sm gray" onClick={() => updateQty(c.productId, c.qty - 1)}>−</button>
                        <span style={{ minWidth: 30, textAlign: 'center' }}>{c.qty}</span>
                        <button className="btn sm gray" onClick={() => updateQty(c.productId, c.qty + 1)}>+</button>
                      </div>
                    </td>
                    <td><b>{taka(c.total)}</b></td>
                    <td><button className="btn sm red" onClick={() => removeItem(c.productId)}>✕</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: payment */}
        <div className="card">
          <h3>৩. পেমেন্ট ও গ্রাহক</h3>
          <div className="form-grid mt8">
            <div>
              <label>ডিসকাউন্ট (৳)</label>
              <input type="number" value={discount} onChange={(e) => setDiscount(e.target.value)} />
            </div>
            <div style={{ position: 'relative' }}>
              <label>গ্রাহকের নাম (ঐচ্ছিক)</label>
              <div style={{ position: 'relative' }}>
                <input 
                  value={customerName} 
                  onChange={(e) => {
                    setCustomerName(e.target.value);
                    setShowSuggestions(true);
                  }} 
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  placeholder="নাম লিখুন বা সিলেক্ট করুন" 
                  autoComplete="off"
                  style={{ paddingRight: '30px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowSuggestions(!showSuggestions)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: 'var(--muted)',
                    fontSize: '10px',
                    padding: '4px'
                  }}
                  onMouseDown={(e) => e.preventDefault()} // prevent blur
                >
                  ▼
                </button>
              </div>
              {customerName.trim() && (
                <div style={{ marginTop: 6, fontSize: 13, fontWeight: 'bold' }}>
                  {customerBakiMap[customerName.trim().toLowerCase()] > 0 ? (
                    <span className="amber" style={{ background: '#fef3c7', padding: '2px 8px', borderRadius: 4, border: '1px solid #f59e0b' }}>
                      ⚠️ এই কাস্টমারের পূর্বের বাকি: {taka(customerBakiMap[customerName.trim().toLowerCase()])}
                    </span>
                  ) : customerBakiMap[customerName.trim().toLowerCase()] < 0 ? (
                    <span className="blue" style={{ background: '#dbeafe', padding: '2px 8px', borderRadius: 4, border: '1px solid #3b82f6' }}>
                      ℹ️ কাস্টমারের এডভান্স/দেনা: {taka(-customerBakiMap[customerName.trim().toLowerCase()])}
                    </span>
                  ) : (
                    <span className="green" style={{ background: '#dcfce7', padding: '2px 8px', borderRadius: 4, border: '1px solid #22c55e' }}>
                      ✅ কোনো বাকি নেই (০ ৳)
                    </span>
                  )}
                </div>
              )}
              {showSuggestions && customerSuggestions.length > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: '#ffffff',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                  zIndex: 50,
                  maxHeight: '200px',
                  overflowY: 'auto',
                  marginTop: '4px'
                }}>
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
                        fontSize: '14px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                      onMouseDown={(e) => e.preventDefault()} // prevent blur from closing before click
                    >
                      <div>
                        <span style={{ fontWeight: '600', color: 'var(--text)' }}>{c.name}</span>
                        {c.phone && <span className="muted" style={{ fontSize: '11px', marginLeft: 6 }}>({c.phone})</span>}
                      </div>
                      {customerBakiMap[c.name.trim().toLowerCase()] > 0 && (
                        <span className="red" style={{ fontSize: '12px', fontWeight: 'bold' }}>
                          বাকি: {taka(customerBakiMap[c.name.trim().toLowerCase()])}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label>গ্রাহকের মোবাইল (ঐচ্ছিক)</label>
              <input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="01XXXXXXXXX" />
            </div>
            <div>
              <label>পেমেন্ট মেথড</label>
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                <option value="cash">নগদ (Cash)</option>
                <option value="bkash">bKash</option>
                <option value="both">নগদ + bKash</option>
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label>নোট</label>
              <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="ঐচ্ছিক নোট" />
            </div>
          </div>

          <hr />
          <div className="form-grid" style={{ gap: 8 }}>
            <div className="flex between"><span className="muted">সাবটোটাল</span><span>{taka(subtotal)}</span></div>
            <div className="flex between"><span className="muted">ডিসকাউন্ট</span><span>{taka(discount || 0)}</span></div>
            <div className="flex between" style={{ borderTop: '1px solid var(--border)', paddingTop: 8 }}>
              <b>সর্বমোট</b><b>{taka(grandTotal)}</b>
            </div>
            <div>
              <label>প্রদত্ত টাকা</label>
              <input type="number" value={paidAmount} onChange={(e) => setPaidAmount(e.target.value)} />
            </div>
            <div className="flex between">
              <span className="muted">বাকি (Due)</span>
              <span className={due > 0 ? 'value red' : 'value green'} style={{ fontSize: 20 }}>{taka(due)}</span>
            </div>
          </div>

          <button className="btn green" style={{ width: '100%', marginTop: 16 }} onClick={submit} disabled={loading}>
            {loading ? 'হিসাব হচ্ছে...' : '✅ বিক্রি নিশ্চিত করুন'}
          </button>
        </div>
      </div>

      {/* Recent sales */}
      <div className="card mt">
        <h3>সাম্প্রতিক বিক্রি</h3>
        <div className="table-wrap mt8">
          <table>
            <thead><tr><th>তারিখ</th><th>গ্রাহক</th><th>মেথড</th><th>মোট</th><th>প্রদত্ত</th><th>বাকি</th></tr></thead>
            <tbody>
              {sales.slice(0, 8).map((s) => (
                <tr key={s._id}>
                  <td>{new Date(s.date).toLocaleDateString('bn-BD')}</td>
                  <td>{s.customerName || 'ক্যাশ ক্রেতা (নামহীন)'}</td>
                  <td>
                    <span className={`badge ${s.paymentMethod === 'bkash' ? 'blue' : s.paymentMethod === 'both' ? 'amber' : 'gray'}`}>
                      {s.paymentMethod === 'bkash' ? 'bKash' : s.paymentMethod === 'both' ? 'নগদ+bKash' : 'নগদ'}
                    </span>
                  </td>
                  <td><b>{taka(s.totalAmount)}</b></td>
                  <td>{taka(s.paidAmount)}</td>
                  <td className={s.dueAmount > 0 ? 'red' : 'green'}>{s.dueAmount > 0 ? taka(s.dueAmount) : 'শেষ'}</td>
                </tr>
              ))}
              {sales.length === 0 && <tr><td colSpan={6} className="empty">কোনো বিক্রি নেই</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
