'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { taka, num } from '@/lib/money';
import toast from 'react-hot-toast';

export default function SellPage() {
  // Wizard Step: 1 = Product Selection & Cart, 2 = Customer & Payment Checkout
  const [currentStep, setCurrentStep] = useState(1);

  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]); // {productId, name, price, qty, maxQty, total, buyPrice, isNewProduct}

  // Payment & Customer States (NO 0s prefilled in input boxes!)
  const [paidAmount, setPaidAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [discount, setDiscount] = useState('');
  const [loading, setLoading] = useState(false);
  const [sales, setSales] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('most_sold'); // 'most_sold' | 'name' | 'price_low' | 'price_high' | 'stock'
  const [customerBakiMap, setCustomerBakiMap] = useState({});

  // Full product creation form (same as Stock Page)
  const initialProductForm = {
    name: '',
    category: '',
    unit: 'পিস',
    buyPrice: '',
    sellPrice: '',
    stockQty: '',
    lowStockAt: 5,
    imageUrl: '',
    description: '',
    purchaseType: 'packet', // 'packet' | 'piece'
    packetUnit: 'কার্টন',
    packetQty: '',
    packetBuyPrice: '',
    piecesPerPacket: '',
    packetSellPrice: '',
    isExistingStock: false,
  };

  const [showProductModal, setShowProductModal] = useState(false);
  const [newProductForm, setNewProductForm] = useState(initialProductForm);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [productSubmitting, setProductSubmitting] = useState(false);

  // States for custom unregistered products
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdBuy, setNewProdBuy] = useState('');
  const [newProdSell, setNewProdSell] = useState('');
  const [newProdQty, setNewProdQty] = useState('');
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
      .catch(() => { });
  }

  function loadCustomers() {
    fetch('/api/customers?t=' + Date.now())
      .then((r) => r.json())
      .then((d) => setCustomers(d.customers || []))
      .catch(() => { });
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
      .catch(() => { });
  }

  function loadSales() {
    fetch('/api/sales?t=' + Date.now())
      .then((r) => r.json())
      .then((d) => setSales(d.sales || []))
      .catch(() => { });
  }

  // Add Product to Cart on Card Click
  function addProduct(id) {
    const p = products.find((x) => x._id === id);
    if (!p) return;

    if (p.stockQty <= 0) {
      toast('⚠️ এই পণ্যটির কোনো স্টক নেই, তবুও কার্টে যোগ করা হয়েছে', { icon: '⚠️' });
    }

    setCart((prev) => {
      const ex = prev.find((c) => c.productId === id);
      if (ex) {
        toast.success(`"${p.name}" (+১ টি)`, { duration: 1000 });
        return prev.map((c) =>
          c.productId === id
            ? { ...c, qty: c.qty + 1, total: (c.qty + 1) * c.price }
            : c
        );
      }
      toast.success(`"${p.name}" যোগ হয়েছে`, { duration: 1000 });
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
      toast.error('নতুন পণ্যের নাম ও বিক্রির দাম লিখুন');
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
    setNewProdQty('');
    setNewProdStock('');
    setShowCustomForm(false);
    toast.success('কাস্টম পণ্য কার্টে যোগ হয়েছে');
  }

  // Full Product Modal Handlers (identical to Stock page)
  const handlePurchaseTypeChange = (type) => {
    setNewProductForm((prev) => {
      const isPacket = type === 'packet';
      const pieces = Number(prev.piecesPerPacket) || 1;

      if (isPacket) {
        const pQty = prev.packetQty ? Number(prev.packetQty) : (prev.stockQty ? Math.floor(Number(prev.stockQty) / pieces) : '');
        const pBuy = prev.packetBuyPrice ? Number(prev.packetBuyPrice) : (prev.buyPrice ? Math.round(Number(prev.buyPrice) * pieces) : '');
        const pSell = prev.packetSellPrice ? Number(prev.packetSellPrice) : (prev.sellPrice ? Math.round(Number(prev.sellPrice) * pieces) : '');
        return {
          ...prev,
          purchaseType: 'packet',
          packetQty: pQty ? String(pQty) : '',
          packetBuyPrice: pBuy ? String(pBuy) : '',
          packetSellPrice: pSell ? String(pSell) : '',
        };
      } else {
        return {
          ...prev,
          purchaseType: 'piece',
        };
      }
    });
  };

  const handlePacketQtyChange = (val) => {
    setNewProductForm((prev) => {
      const pQty = Number(val) || 0;
      const pieces = Number(prev.piecesPerPacket) || 1;
      const totalPieces = pQty > 0 ? pQty * pieces : '';
      return {
        ...prev,
        packetQty: val,
        stockQty: totalPieces ? String(totalPieces) : '',
      };
    });
  };

  const handlePacketBuyPriceChange = (val) => {
    setNewProductForm((prev) => {
      const pBuy = Number(val) || 0;
      const pieces = Number(prev.piecesPerPacket) || 1;
      const pieceBuy = pBuy > 0 && pieces > 0 ? (pBuy / pieces).toFixed(2) : '';
      return {
        ...prev,
        packetBuyPrice: val,
        buyPrice: pieceBuy ? String(Number(pieceBuy)) : '',
      };
    });
  };

  const handlePiecesPerPacketChange = (val) => {
    setNewProductForm((prev) => {
      const pieces = Number(val) || 0;
      const pQty = Number(prev.packetQty) || 0;
      const pBuy = Number(prev.packetBuyPrice) || 0;
      const pSell = Number(prev.packetSellPrice) || 0;

      const totalPieces = pieces > 0 && pQty > 0 ? pieces * pQty : prev.stockQty;
      const pieceBuy = pieces > 0 && pBuy > 0 ? (pBuy / pieces).toFixed(2) : prev.buyPrice;
      const pieceSell = pieces > 0 && pSell > 0 ? (pSell / pieces).toFixed(2) : prev.sellPrice;

      return {
        ...prev,
        piecesPerPacket: val,
        stockQty: totalPieces ? String(totalPieces) : prev.stockQty,
        buyPrice: pieceBuy ? String(Number(pieceBuy)) : prev.buyPrice,
        sellPrice: pieceSell ? String(Number(pieceSell)) : prev.sellPrice,
      };
    });
  };

  const handlePieceBuyPriceChange = (val) => {
    setNewProductForm((prev) => {
      const pieceBuy = Number(val) || 0;
      const pieces = Number(prev.piecesPerPacket) || 1;
      const pBuy = pieceBuy > 0 && pieces > 0 ? Math.round(pieceBuy * pieces) : '';
      return {
        ...prev,
        buyPrice: val,
        packetBuyPrice: prev.purchaseType === 'packet' && pBuy ? String(pBuy) : prev.packetBuyPrice,
      };
    });
  };

  const handlePieceSellPriceChange = (val) => {
    setNewProductForm((prev) => {
      const pieceSell = Number(val) || 0;
      const pieces = Number(prev.piecesPerPacket) || 1;
      const pSell = pieceSell > 0 && pieces > 0 ? Math.round(pieceSell * pieces) : '';
      return {
        ...prev,
        sellPrice: val,
        packetSellPrice: prev.purchaseType === 'packet' && pSell ? String(pSell) : prev.packetSellPrice,
      };
    });
  };

  const handlePacketSellPriceChange = (val) => {
    setNewProductForm((prev) => {
      const pSell = Number(val) || 0;
      const pieces = Number(prev.piecesPerPacket) || 1;
      const pieceSell = pSell > 0 && pieces > 0 ? (pSell / pieces).toFixed(2) : '';
      return {
        ...prev,
        packetSellPrice: val,
        sellPrice: pieceSell ? String(Number(pieceSell)) : prev.sellPrice,
      };
    });
  };

  const handlePieceStockChange = (val) => {
    setNewProductForm((prev) => {
      const totalPieces = Number(val) || 0;
      const pieces = Number(prev.piecesPerPacket) || 1;
      const pQty = totalPieces > 0 && pieces > 0 ? Math.floor(totalPieces / pieces) : '';
      return {
        ...prev,
        stockQty: val,
        packetQty: pQty ? String(pQty) : '',
      };
    });
  };

  async function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Data = reader.result;
      try {
        const res = await fetch('/api/upload/cloudinary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64Data }),
        });
        const data = await res.json();
        if (res.ok && data.url) {
          setNewProductForm((prev) => ({ ...prev, imageUrl: data.url }));
          toast.success('📸 ছবি আপলোড হয়েছে!');
        } else {
          setNewProductForm((prev) => ({ ...prev, imageUrl: base64Data }));
          toast.success('📸 ছবি নির্বাচন করা হয়েছে');
        }
      } catch (err) {
        setNewProductForm((prev) => ({ ...prev, imageUrl: base64Data }));
        toast.error('আপলোডে সমস্যা, লোকাল প্রিভিউ সেভ করা হচ্ছে');
      } finally {
        setUploadingImage(false);
      }
    };
    reader.readAsDataURL(file);
  }

  async function handleCreateProductSubmit(e) {
    e.preventDefault();
    if (!newProductForm.name || !newProductForm.name.trim()) {
      toast.error('পণ্যের নাম আবশ্যক');
      return;
    }
    if (!newProductForm.sellPrice || Number(newProductForm.sellPrice) < 0) {
      toast.error('সঠিক বিক্রির দাম লিখুন');
      return;
    }

    setProductSubmitting(true);
    const payload = {
      name: newProductForm.name.trim(),
      category: newProductForm.category || 'সাধারণ',
      unit: newProductForm.unit || 'পিস',
      buyPrice: Number(newProductForm.buyPrice) || 0,
      sellPrice: Number(newProductForm.sellPrice) || 0,
      stockQty: Number(newProductForm.stockQty) || 0,
      lowStockAt: Number(newProductForm.lowStockAt) || 5,
      imageUrl: newProductForm.imageUrl || '',
      description: newProductForm.description || '',
      purchaseType: newProductForm.purchaseType || 'packet',
      packetUnit: newProductForm.packetUnit || 'কার্টন',
      piecesPerPacket: Number(newProductForm.piecesPerPacket) || 1,
      packetBuyPrice: Number(newProductForm.packetBuyPrice) || 0,
      packetSellPrice: Number(newProductForm.packetSellPrice) || 0,
      isExistingStock: Boolean(newProductForm.isExistingStock),
    };

    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setProductSubmitting(false);

    if (!res.ok) {
      toast.error(data.error || 'পণ্য সংরক্ষণ করতে সমস্যা হয়েছে');
      return;
    }

    const createdProd = data.product;
    toast.success('✅ নতুন পণ্য সংরক্ষিত হয়েছে এবং কার্টে যুক্ত করা হয়েছে!');

    // Reset new product form
    setNewProductForm(initialProductForm);
    setShowProductModal(false);

    // Refresh products list
    loadProducts();

    // Auto-add this newly created product to cart!
    if (createdProd) {
      setCart((prev) => {
        const ex = prev.find((c) => c.productId === createdProd._id);
        if (ex) {
          return prev.map((c) =>
            c.productId === createdProd._id
              ? { ...c, qty: c.qty + 1, total: (c.qty + 1) * c.price }
              : c
          );
        }
        return [
          ...prev,
          {
            productId: createdProd._id,
            name: createdProd.name,
            price: createdProd.sellPrice,
            buyPrice: createdProd.buyPrice,
            qty: 1,
            maxQty: createdProd.stockQty || 999999,
            total: createdProd.sellPrice,
            imageUrl: createdProd.imageUrl,
            unit: createdProd.unit || 'পিস',
          },
        ];
      });
    }
  }

  function updateQty(id, qty) {
    if (qty <= 0) {
      removeItem(id);
      return;
    }
    setCart((prev) =>
      prev.map((c) => {
        if (c.productId !== id) return c;
        return { ...c, qty: qty, total: qty * c.price };
      })
    );
  }

  function updatePrice(id, priceVal) {
    const p = priceVal === '' ? '' : Number(priceVal);
    setCart((prev) =>
      prev.map((c) => {
        if (c.productId !== id) return c;
        const priceNum = Number(p) || 0;
        return { ...c, price: p, total: c.qty * priceNum };
      })
    );
  }

  function updateTotal(id, totalVal) {
    const tot = totalVal === '' ? '' : Number(totalVal);
    setCart((prev) =>
      prev.map((c) => {
        if (c.productId !== id) return c;
        const totNum = Number(tot) || 0;
        const p = c.qty > 0 ? Math.round(totNum / c.qty) : totNum;
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
      setPaidAmount('');
      setDiscount('');
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

  // Cart item count map for instant visual badge on cards
  const cartQtyMap = useMemo(() => {
    const map = {};
    cart.forEach((c) => {
      map[c.productId] = c.qty;
    });
    return map;
  }, [cart]);

  const totalCartItems = cart.reduce((a, c) => a + c.qty, 0);
  const subtotal = cart.reduce((a, c) => a + (Number(c.total) || 0), 0);
  const discValue = discount === '' ? 0 : Number(discount) || 0;
  const grandTotal = Math.max(0, subtotal - discValue);
  const paidValue = paidAmount === '' ? 0 : Number(paidAmount) || 0;
  const due = Math.max(0, grandTotal - paidValue);

  const customerSuggestions = customers.filter(
    (c) =>
      !customerName.trim() ||
      c.name.toLowerCase().includes(customerName.toLowerCase()) ||
      (c.phone && c.phone.includes(customerName))
  );

  function goToStep2() {
    if (cart.length === 0) {
      toast.error('প্রথমে অন্তত একটি পণ্য সিলেক্ট করুন');
      return;
    }
    setCurrentStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

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
          price: Number(c.price) || 0,
          total: Number(c.total) || 0,
          buyPrice: c.buyPrice,
          isNewProduct: c.isNewProduct,
          name: c.name,
          stock: c.stock,
        })),
        discount: discValue,
        paidAmount: paidValue,
        paymentMethod,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
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
    setPaidAmount('');
    setDiscount('');
    setCustomerName('');
    setCustomerPhone('');
    setCurrentStep(1);
    loadSales();
    loadProducts();
    loadCustomers();
    loadBaki();
  }

  return (
    <div style={{ paddingBottom: cart.length > 0 && currentStep === 1 ? 84 : 20 }}>
      {/* Top Header */}
      <div className="topbar">
        <div>
          <h2>🛒 পয়েন্ট অব সেল (বিক্রি পেজ)</h2>
          <div className="sub">পণ্য নির্বাচন করুন এবং সহজে পরবর্তী ধাপে গিয়ে বিক্রি সম্পন্ন করুন</div>
        </div>
        <div className="flex" style={{ gap: 8, flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn green"
            onClick={() => {
              setNewProductForm(initialProductForm);
              setShowProductModal(true);
            }}
          >
            ➕ নতুন পণ্য যোগ করুন
          </button>
          <Link href="/admin/sales-history" className="btn gray">
            📜 বিক্রির ইতিহাস ➔
          </Link>
          <Link href="/admin/products" className="btn gray">
            📦 পণ্য তালিকা
          </Link>
        </div>
      </div>

      {/* Step Progress / Navigation Tabs */}
      <div
        className="card mb"
        style={{
          padding: '8px 12px',
          display: 'flex',
          gap: 8,
          background: '#fff',
          borderRadius: 12,
          marginBottom: 16,
        }}
      >
        <button
          type="button"
          onClick={() => setCurrentStep(1)}
          className={`btn ${currentStep === 1 ? 'blue' : 'gray'}`}
          style={{
            flex: 1,
            padding: '10px 14px',
            fontSize: 14,
            fontWeight: 'bold',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          <span>📦 ধাপ ১: পণ্য নির্বাচন</span>
          {totalCartItems > 0 && (
            <span
              style={{
                background: currentStep === 1 ? '#fff' : '#2563eb',
                color: currentStep === 1 ? '#2563eb' : '#fff',
                fontSize: 11,
                padding: '1px 7px',
                borderRadius: 12,
              }}
            >
              {totalCartItems} টি
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={goToStep2}
          className={`btn ${currentStep === 2 ? 'green' : 'gray'}`}
          style={{
            flex: 1,
            padding: '10px 14px',
            fontSize: 14,
            fontWeight: 'bold',
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          <span>👤 ধাপ ২: কাস্টমার ও পেমেন্ট</span>
          {grandTotal > 0 && (
            <span
              style={{
                background: currentStep === 2 ? '#fff' : '#16a34a',
                color: currentStep === 2 ? '#16a34a' : '#fff',
                fontSize: 11,
                padding: '1px 7px',
                borderRadius: 12,
              }}
            >
              {taka(grandTotal)}
            </span>
          )}
        </button>
      </div>

      {/* STEP 1: Product Selection & Cart Review */}
      {currentStep === 1 && (
        <div style={{ display: 'grid', gap: 16 }}>
          {/* Product Search & Grid Card */}
          <div className="card" style={{ padding: '14px 16px' }}>
            {/* Search Bar & Sorting */}
            <div className="flex between align-center gap mb8" style={{ flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
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
                gridTemplateColumns: 'repeat(auto-fill, minmax(118px, 1fr))',
                gap: 10,
                maxHeight: '520px',
                overflowY: 'auto',
                padding: '2px',
                paddingRight: 4,
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
                  >
                    {/* Floating Badges */}
                    <div style={{ position: 'absolute', top: 5, left: 5, right: 5, display: 'flex', justifyContent: 'space-between', zIndex: 2, pointerEvents: 'none' }}>
                      {p.soldCount > 0 ? (
                        <span
                          style={{
                            background: 'rgba(234, 88, 12, 0.95)',
                            color: '#fff',
                            fontSize: 9.5,
                            fontWeight: 'bold',
                            padding: '2px 5px',
                            borderRadius: 6,
                          }}
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
                            padding: '2px 6px',
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
                        height: 90,
                        borderRadius: 8,
                        overflow: 'hidden',
                        background: '#f1f5f9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                        marginBottom: 6,
                      }}
                    >
                      {p.imageUrl ? (
                        <img
                          src={p.imageUrl}
                          alt={p.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
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
                          <span style={{ fontSize: 30 }}>📦</span>
                          <span style={{ fontSize: 9.5, marginTop: 2, color: '#64748b' }}>{p.category || 'পণ্য'}</span>
                        </div>
                      )}
                    </div>

                    {/* Product Details */}
                    <div>
                      <div
                        style={{
                          fontWeight: '600',
                          fontSize: 12.5,
                          lineHeight: 1.25,
                          color: 'var(--text)',
                          minHeight: 32,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                        title={p.name}
                      >
                        {p.name}
                      </div>

                      <div className="flex between align-center mt8" style={{ marginTop: 4 }}>
                        <b style={{ color: '#16a34a', fontSize: 13.5 }}>
                          {taka(p.sellPrice)}
                        </b>
                        <span
                          style={{
                            fontSize: 10,
                            padding: '1px 5px',
                            borderRadius: 4,
                            fontWeight: 'bold',
                            background: isOut ? '#fee2e2' : isLow ? '#fef3c7' : '#dcfce7',
                            color: isOut ? '#dc2626' : isLow ? '#b45309' : '#15803d',
                          }}
                        >
                          {isOut
                            ? '০'
                            : p.piecesPerPacket > 1
                              ? `${p.stockQty} টি (${Math.floor(p.stockQty / p.piecesPerPacket)} ${p.packetUnit || 'কার্টন'})`
                              : `${p.stockQty} টি`}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}

              {displayProducts.length === 0 && (
                <div className="empty" style={{ gridColumn: '1 / -1', padding: '30px 12px' }}>
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

            {/* New Product Add Button (Full stock options + quick custom fallback) */}
            <div style={{ marginTop: 12, paddingTop: 10, borderTop: '1px dashed var(--border)' }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                <button
                  type="button"
                  className="btn green"
                  style={{ flex: 1, minWidth: 200, fontSize: 13, padding: '9px 14px' }}
                  onClick={() => {
                    setNewProductForm(initialProductForm);
                    setShowProductModal(true);
                  }}
                >
                  ➕ নতুন পণ্য যোগ করুন (স্টক পেজের মতো সম্পূর্ণ অপশন)
                </button>
                <button
                  type="button"
                  className="btn sm gray"
                  style={{ fontSize: 12 }}
                  onClick={() => setShowCustomForm(!showCustomForm)}
                >
                  {showCustomForm ? '▲ কাস্টম ফর্ম বন্ধ' : '⚡ অনিবন্ধিত দ্রুত পণ্য'}
                </button>
              </div>

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
                        placeholder="পরিমাণ (ডিফল্ট ১)"
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

          {/* Cart Table in Step 1 */}
          <div className="card" style={{ padding: '14px 16px' }}>
            <div className="flex between align-center mb8">
              <h3 style={{ margin: 0, fontSize: 16 }}>
                🛒 নির্বাচিত পণ্য তালিকা ({totalCartItems} টি)
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

            <div className="table-wrap" style={{ maxHeight: 280, overflowY: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>পণ্য</th>
                    <th>দর (৳)</th>
                    <th>পরিমাণ</th>
                    <th>মোট (৳)</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {cart.length === 0 && (
                    <tr>
                      <td colSpan={5} className="empty" style={{ padding: '24px 12px' }}>
                        👆 উপরের পণ্যের বক্সে ক্লিক করে পণ্য নির্বাচন করুন
                      </td>
                    </tr>
                  )}
                  {cart.map((c) => (
                    <tr key={c.productId}>
                      <td style={{ maxWidth: 130, whiteSpace: 'normal' }}>
                        <div style={{ fontWeight: '600', fontSize: 13 }}>{c.name}</div>
                        {c.isNewProduct && (
                          <span className="badge amber" style={{ fontSize: 9 }}>নতুন</span>
                        )}
                      </td>
                      <td>
                        <input
                          type="number"
                          placeholder="দর"
                          value={c.price !== undefined ? c.price : ''}
                          onChange={(e) => updatePrice(c.productId, e.target.value)}
                          style={{
                            width: 60,
                            padding: '3px 4px',
                            fontSize: 13,
                            borderRadius: 4,
                            border: '1px solid var(--border)',
                          }}
                        />
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
                          <span style={{ minWidth: 22, textAlign: 'center', fontWeight: 'bold', fontSize: 13 }}>
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
                        <input
                          type="number"
                          placeholder="মোট"
                          value={c.total !== undefined ? c.total : ''}
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

            {/* Next Step Button inside Card */}
            {cart.length > 0 && (
              <div style={{ marginTop: 14, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
                <button
                  type="button"
                  className="btn green"
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: 15,
                    fontWeight: 'bold',
                    borderRadius: 8,
                  }}
                  onClick={goToStep2}
                >
                  পরবর্তী ধাপ (কাস্টমার ও পেমেন্ট) ➔ ({taka(grandTotal)})
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* STEP 2: Customer Information & Payment Checkout */}
      {currentStep === 2 && (
        <div style={{ maxWidth: 720, margin: '0 auto', display: 'grid', gap: 16 }}>
          {/* Back to Step 1 Button */}
          <div className="flex between align-center">
            <button
              type="button"
              className="btn gray sm"
              onClick={() => setCurrentStep(1)}
              style={{ padding: '8px 14px', fontSize: 13, fontWeight: 'bold' }}
            >
              ← পণ্য বাছাইয়ে ফিরে যান
            </button>
            <span style={{ fontSize: 13, fontWeight: 'bold', color: 'var(--muted)' }}>
              ধাপ ২ এর ২: কাস্টমার ও পেমেন্ট
            </span>
          </div>

          {/* Cart Summary Pill Card */}
          <div className="card" style={{ padding: '14px 16px', background: '#f8fafc' }}>
            <div className="flex between align-center mb8">
              <h4 style={{ margin: 0, fontSize: 14 }}>📋 অর্ডারের সংক্ষিপ্ত বিবরণী ({totalCartItems} টি পণ্য)</h4>
              <button
                type="button"
                className="btn text sm blue"
                onClick={() => setCurrentStep(1)}
                style={{ fontSize: 12, padding: 0 }}
              >
                পণ্য পরিবর্তন করুন ✎
              </button>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {cart.map((c) => (
                <span
                  key={c.productId}
                  style={{
                    background: '#ffffff',
                    border: '1px solid var(--border)',
                    borderRadius: 6,
                    padding: '4px 8px',
                    fontSize: 12.5,
                  }}
                >
                  <b>{c.name}</b> x {c.qty} = {taka(c.total)}
                </span>
              ))}
            </div>
          </div>

          {/* Customer & Checkout Form */}
          <div className="card" style={{ padding: '18px 20px' }}>
            <h3 style={{ margin: 0, fontSize: 16, marginBottom: 14 }}>
              👤 কাস্টমারের তথ্য ও পেমেন্ট
            </h3>

            <div className="form-grid" style={{ gap: 12 }}>
              {/* Customer Name */}
              <div style={{ position: 'relative' }}>
                <label style={{ fontSize: 13, fontWeight: 'bold' }}>গ্রাহকের নাম (ঐচ্ছিক)</label>
                <div style={{ position: 'relative' }}>
                  <input
                    value={customerName}
                    onChange={(e) => {
                      setCustomerName(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    placeholder="নাম লিখুন বা পুরোনো গ্রাহক নির্বাচন করুন"
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
                  <div style={{ marginTop: 6, fontSize: 12.5, fontWeight: 'bold' }}>
                    {customerBakiMap[customerName.trim().toLowerCase()] > 0 ? (
                      <span className="amber" style={{ background: '#fef3c7', padding: '3px 10px', borderRadius: 4, border: '1px solid #f59e0b', display: 'inline-block' }}>
                        ⚠️ এই কাস্টমারের পূর্বের বাকি: {taka(customerBakiMap[customerName.trim().toLowerCase()])}
                      </span>
                    ) : customerBakiMap[customerName.trim().toLowerCase()] < 0 ? (
                      <span className="blue" style={{ background: '#dbeafe', padding: '3px 10px', borderRadius: 4, border: '1px solid #3b82f6', display: 'inline-block' }}>
                        ℹ️ পূর্বের অগ্রিম জমা: {taka(-customerBakiMap[customerName.trim().toLowerCase()])}
                      </span>
                    ) : (
                      <span className="green" style={{ background: '#dcfce7', padding: '3px 10px', borderRadius: 4, border: '1px solid #22c55e', display: 'inline-block' }}>
                        ✅ কোনো পূর্বের বাকি নেই (০ ৳)
                      </span>
                    )}
                  </div>
                )}

                {/* Suggestions Dropdown */}
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
                      boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
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
                          padding: '9px 12px',
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

              {/* Customer Phone & Payment Method */}
              <div className="grid cols-2" style={{ gap: 12 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 'bold' }}>মোবাইল নম্বর (ঐচ্ছিক)</label>
                  <input
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="01XXXXXXXXX"
                  />
                </div>

                <div>
                  <label style={{ fontSize: 13, fontWeight: 'bold' }}>পেমেন্ট মাধ্যম</label>
                  <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                    <option value="cash">💵 নগদ (Cash)</option>
                    <option value="bkash">📱 bKash</option>
                    <option value="both">💵+📱 নগদ + bKash</option>
                  </select>
                </div>
              </div>

              {/* Price, Discount & Due Calculation Box */}
              <div
                style={{
                  background: '#f8fafc',
                  padding: '14px 16px',
                  borderRadius: 10,
                  border: '1px solid var(--border)',
                  marginTop: 6,
                }}
              >
                <div className="flex between" style={{ fontSize: 14, marginBottom: 8 }}>
                  <span className="muted">সাবটোটাল:</span>
                  <b>{taka(subtotal)}</b>
                </div>

                <div className="flex between align-center" style={{ fontSize: 14, marginBottom: 8 }}>
                  <span className="muted">ডিসকাউন্ট (৳):</span>
                  <input
                    type="number"
                    placeholder="ডিসকাউন্ট লিখুন"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    style={{ width: 130, padding: '5px 8px', fontSize: 14, textAlign: 'right' }}
                  />
                </div>

                <div
                  className="flex between align-center"
                  style={{
                    borderTop: '1px solid #e2e8f0',
                    paddingTop: 8,
                    marginTop: 8,
                    fontSize: 17,
                  }}
                >
                  <b>সর্বমোট প্রদেয়:</b>
                  <b style={{ color: '#2563eb', fontSize: 22 }}>{taka(grandTotal)}</b>
                </div>

                <div className="flex between align-center" style={{ marginTop: 10 }}>
                  <span style={{ fontWeight: 'bold', fontSize: 14 }}>জমা / প্রদত্ত টাকা (৳):</span>
                  <input
                    type="number"
                    placeholder="টাকা লিখুন"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value)}
                    style={{
                      width: 130,
                      padding: '6px 8px',
                      fontSize: 16,
                      fontWeight: 'bold',
                      textAlign: 'right',
                    }}
                    autoFocus
                  />
                </div>

                <div
                  className="flex between align-center"
                  style={{
                    borderTop: '1px dashed #cbd5e1',
                    paddingTop: 8,
                    marginTop: 10,
                  }}
                >
                  <span style={{ fontSize: 14, fontWeight: 'bold' }}>বকেয়া বাকি (Due):</span>
                  <span
                    className={due > 0 ? 'red' : 'green'}
                    style={{ fontSize: 18, fontWeight: 'bold' }}
                  >
                    {due > 0 ? taka(due) : '✅ সম্পূর্ণ পরিশোধ'}
                  </span>
                </div>
              </div>

              {/* Confirm Sale Button */}
              <button
                className="btn green"
                style={{
                  width: '100%',
                  padding: '14px',
                  fontSize: 16,
                  fontWeight: 'bold',
                  marginTop: 6,
                  borderRadius: 10,
                }}
                onClick={submit}
                disabled={loading || cart.length === 0}
              >
                {loading ? 'বিক্রি হিসাব হচ্ছে...' : `✅ বিক্রি নিশ্চিত করুন (${taka(grandTotal)})`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Sticky Bottom Bar for Step 1 (Mobile-friendly) */}
      {currentStep === 1 && cart.length > 0 && (
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            background: '#ffffff',
            borderTop: '2px solid #2563eb',
            boxShadow: '0 -4px 16px rgba(0,0,0,0.12)',
            padding: '10px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            zIndex: 100,
          }}
        >
          <div>
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>
              নির্বাচিত: <b>{totalCartItems}</b> টি পণ্য
            </div>
            <div style={{ fontSize: 18, fontWeight: 'bold', color: '#2563eb' }}>
              {taka(grandTotal)}
            </div>
          </div>
          <button
            type="button"
            className="btn green"
            style={{
              padding: '10px 18px',
              fontSize: 14,
              fontWeight: 'bold',
              borderRadius: 8,
            }}
            onClick={goToStep2}
          >
            পরবর্তী ধাপ (কাস্টমার) ➔
          </button>
        </div>
      )}

      {/* Recent Sales History */}
      <div className="card mt" style={{ marginTop: 22 }}>
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
                      className={`badge ${s.paymentMethod === 'bkash' ? 'blue' : s.paymentMethod === 'both' ? 'amber' : 'gray'
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

      {/* Complete Product Creation Modal (with all Stock Page Options) */}
      {showProductModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 16,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowProductModal(false);
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: 620,
              maxHeight: '92vh',
              overflowY: 'auto',
              background: '#ffffff',
              borderRadius: 14,
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
              padding: '20px 22px',
            }}
          >
            <div className="flex between align-center mb8" style={{ borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 17, color: '#0f172a' }}>
                  ➕ নতুন পণ্য যোগ করুন ও সরাসরি কার্টে নিন
                </h3>
                <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
                  স্টক পেজের মতো কার্টন/পিস ও বর্তমান/আগের স্টক হিসাব সহ
                </div>
              </div>
              <button
                type="button"
                className="btn sm text gray"
                style={{ fontSize: 18, padding: '4px 8px' }}
                onClick={() => setShowProductModal(false)}
              >
                ✕
              </button>
            </div>

            <form className="form-grid two mt8" onSubmit={handleCreateProductSubmit}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontWeight: 'bold' }}>পণ্যের নাম *</label>
                <input
                  value={newProductForm.name}
                  onChange={(e) => setNewProductForm((prev) => ({ ...prev, name: e.target.value }))}
                  required
                  placeholder="যেমন: এনার্জি বিস্কুট, মিনি টোস্ট, চিনি..."
                  autoFocus
                />
              </div>

              <div>
                <label>ক্যাটাগরি</label>
                <input
                  value={newProductForm.category}
                  onChange={(e) => setNewProductForm((prev) => ({ ...prev, category: e.target.value }))}
                  placeholder="যেমন: বিস্কুট ও বেকারি, মুদি..."
                />
              </div>

              <div>
                <label>একক (Unit)</label>
                <select
                  value={newProductForm.unit}
                  onChange={(e) => setNewProductForm((prev) => ({ ...prev, unit: e.target.value }))}
                >
                  <option value="পিস">পিস (Piece)</option>
                  <option value="কেজি">কেজি (Kg)</option>
                  <option value="গ্রাম">গ্রাম (gm)</option>
                  <option value="লিটার">লিটার (Liter)</option>
                  <option value="মিলি">মিলি (ml)</option>
                  <option value="প্যাকেট">প্যাকেট (Packet)</option>
                </select>
              </div>

              {/* 1. হিসাবের ধরণ নির্বাচন: প্যাকেট / কার্টন বনাম পিস */}
              <div style={{ gridColumn: '1 / -1', marginTop: 4 }}>
                <label style={{ fontWeight: 'bold', marginBottom: 6, display: 'block', fontSize: 13.5 }}>
                  ১. হিসাবের ধরণ নির্বাচন করুন: *
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => handlePurchaseTypeChange('packet')}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 10,
                      border: newProductForm.purchaseType === 'packet' ? '2px solid #2563eb' : '1px solid var(--border)',
                      background: newProductForm.purchaseType === 'packet' ? '#eff6ff' : '#ffffff',
                      color: newProductForm.purchaseType === 'packet' ? '#1d4ed8' : 'var(--text)',
                      fontWeight: 'bold',
                      fontSize: 13,
                      cursor: 'pointer',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: 16, marginBottom: 2 }}>📦</div>
                    ১. প্যাকেট / কার্টন হিসেবে
                    <div style={{ fontSize: 11, fontWeight: 'normal', color: newProductForm.purchaseType === 'packet' ? '#2563eb' : 'var(--muted)', marginTop: 2 }}>
                      (কার্টনের দাম দিলে পিস দাম অটো বের হবে)
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePurchaseTypeChange('piece')}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 10,
                      border: newProductForm.purchaseType === 'piece' ? '2px solid #16a34a' : '1px solid var(--border)',
                      background: newProductForm.purchaseType === 'piece' ? '#f0fdf4' : '#ffffff',
                      color: newProductForm.purchaseType === 'piece' ? '#166534' : 'var(--text)',
                      fontWeight: 'bold',
                      fontSize: 13,
                      cursor: 'pointer',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: 16, marginBottom: 2 }}>🛍️</div>
                    ২. সরাসরি পিস / একক হিসেবে
                    <div style={{ fontSize: 11, fontWeight: 'normal', color: newProductForm.purchaseType === 'piece' ? '#166534' : 'var(--muted)', marginTop: 2 }}>
                      (সরাসরি প্রতি পিসের কেনা ও বিক্রির দাম)
                    </div>
                  </button>
                </div>
              </div>

              {/* 2. স্টকের ধরণ নির্বাচন: বর্তমান স্টক বনাম আগের স্টক */}
              <div style={{ gridColumn: '1 / -1', marginTop: 4 }}>
                <label style={{ fontWeight: 'bold', marginBottom: 6, display: 'block', fontSize: 13.5, color: '#0f172a' }}>
                  ২. স্টকের ধরণ নির্বাচন করুন (ক্যাশ বক্স হিসাব): *
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => setNewProductForm((prev) => ({ ...prev, isExistingStock: false }))}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 10,
                      border: !newProductForm.isExistingStock ? '2px solid #16a34a' : '1px solid var(--border)',
                      background: !newProductForm.isExistingStock ? '#f0fdf4' : '#ffffff',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <b style={{ color: '#15803d', fontSize: 13.5 }}>🟢 ১. বর্তমান স্টক</b>
                      {!newProductForm.isExistingStock && <span style={{ color: '#16a34a' }}>✔</span>}
                    </div>
                    <div style={{ fontSize: 11.5, color: '#dc2626', marginTop: 2, fontWeight: '600' }}>
                      • ক্যাশবাক্স থেকে টাকা কাটবে (−)
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewProductForm((prev) => ({ ...prev, isExistingStock: true }))}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 10,
                      border: newProductForm.isExistingStock ? '2px solid #2563eb' : '1px solid var(--border)',
                      background: newProductForm.isExistingStock ? '#eff6ff' : '#ffffff',
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <b style={{ color: '#1d4ed8', fontSize: 13.5 }}>🏷️ ২. আগের স্টক</b>
                      {newProductForm.isExistingStock && <span style={{ color: '#2563eb' }}>✔</span>}
                    </div>
                    <div style={{ fontSize: 11.5, color: '#16a34a', marginTop: 2, fontWeight: '600' }}>
                      • ক্যাশবাক্স থেকে কাটবে না (৳০)
                    </div>
                  </button>
                </div>

                <div
                  style={{
                    marginTop: 6,
                    padding: '6px 10px',
                    borderRadius: 6,
                    fontSize: 11.5,
                    background: newProductForm.isExistingStock ? '#eff6ff' : '#fef2f2',
                    border: `1px solid ${newProductForm.isExistingStock ? '#bfdbfe' : '#fecaca'}`,
                    color: newProductForm.isExistingStock ? '#1e40af' : '#991b1b',
                  }}
                >
                  {newProductForm.isExistingStock
                    ? '✓ আগের স্টক সিলেক্ট করা: ক্যাশবাক্স বা মূলধন থেকে কোনো টাকা কাটা হবে না।'
                    : '✓ বর্তমান স্টক সিলেক্ট করা: নতুন মাল কেনার খরচ হিসেবে ক্যাশবাক্স থেকে টাকা বিয়োগ হবে।'}
                </div>
              </div>

              {/* Dynamic Inputs based on purchaseType */}
              {newProductForm.purchaseType === 'packet' ? (
                <>
                  <div>
                    <label>প্যাকেটের একক</label>
                    <select
                      value={newProductForm.packetUnit}
                      onChange={(e) => setNewProductForm((prev) => ({ ...prev, packetUnit: e.target.value }))}
                    >
                      <option value="কার্টন">কার্টন (Carton)</option>
                      <option value="প্যাকেট">প্যাকেট (Packet)</option>
                      <option value="বক্স">বক্স (Box)</option>
                      <option value="ডজন">ডজন (Dozen)</option>
                      <option value="বস্তা">বস্তা (Sack)</option>
                    </select>
                  </div>

                  <div>
                    <label>কয়টি {newProductForm.packetUnit || 'কার্টন'} কিনেছেন?</label>
                    <input
                      type="number"
                      value={newProductForm.packetQty}
                      onChange={(e) => handlePacketQtyChange(e.target.value)}
                      placeholder="যেমন: ১ বা ৫"
                    />
                  </div>

                  <div>
                    <label style={{ fontWeight: 'bold' }}>প্রতি {newProductForm.packetUnit || 'কার্টনের'} কেনার দাম (৳) *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newProductForm.packetBuyPrice}
                      onChange={(e) => handlePacketBuyPriceChange(e.target.value)}
                      placeholder="যেমন: ৬০০"
                      required
                    />
                  </div>

                  <div>
                    <label style={{ fontWeight: 'bold' }}>প্রতি {newProductForm.packetUnit || 'কার্টনে'} কত পিস থাকে? *</label>
                    <input
                      type="number"
                      value={newProductForm.piecesPerPacket}
                      onChange={(e) => handlePiecesPerPacketChange(e.target.value)}
                      placeholder="যেমন: ২৪ বা ১২"
                      required
                    />
                  </div>

                  <div>
                    <label style={{ color: '#2563eb', fontWeight: 'bold' }}>১ পিসের কেনার দাম (৳) [অটো বের হয়েছে]</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newProductForm.buyPrice}
                      onChange={(e) => handlePieceBuyPriceChange(e.target.value)}
                      placeholder="যেমন: ২৫"
                      style={{ background: '#f8fafc' }}
                    />
                  </div>

                  <div>
                    <label style={{ color: '#16a34a', fontWeight: 'bold' }}>১ পিসের বিক্রির দাম (৳) *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newProductForm.sellPrice}
                      onChange={(e) => handlePieceSellPriceChange(e.target.value)}
                      placeholder="যেমন: ৩০"
                      required
                    />
                  </div>

                  <div>
                    <label>পুরো {newProductForm.packetUnit || 'কার্টন'} বিক্রির দাম (৳) [ঐচ্ছিক]</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newProductForm.packetSellPrice}
                      onChange={(e) => handlePacketSellPriceChange(e.target.value)}
                      placeholder="যেমন: ৭২০"
                    />
                  </div>

                  <div>
                    <label style={{ fontWeight: 'bold', color: '#15803d' }}>মোট স্টক সংখ্যা (পিস)</label>
                    <input
                      type="number"
                      value={newProductForm.stockQty}
                      onChange={(e) => handlePieceStockChange(e.target.value)}
                      placeholder="মোট পিস সংখ্যা"
                      style={{ background: '#f0fdf4', fontWeight: 'bold' }}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label>১ পিসের কেনার দাম (৳)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newProductForm.buyPrice}
                      onChange={(e) => setNewProductForm((prev) => ({ ...prev, buyPrice: e.target.value }))}
                      placeholder="যেমন: ৫০"
                    />
                  </div>

                  <div>
                    <label style={{ fontWeight: 'bold' }}>১ পিসের বিক্রির দাম (৳) *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newProductForm.sellPrice}
                      onChange={(e) => setNewProductForm((prev) => ({ ...prev, sellPrice: e.target.value }))}
                      placeholder="যেমন: ৬০"
                      required
                    />
                  </div>

                  <div>
                    <label style={{ fontWeight: 'bold' }}>বর্তমান স্টক সংখ্যা ({newProductForm.unit || 'পিস'})</label>
                    <input
                      type="number"
                      value={newProductForm.stockQty}
                      onChange={(e) => setNewProductForm((prev) => ({ ...prev, stockQty: e.target.value }))}
                      placeholder="যেমন: ১০০"
                    />
                  </div>

                  <div>
                    <label>কম স্টক অ্যালার্ট লেভেল</label>
                    <input
                      type="number"
                      value={newProductForm.lowStockAt}
                      onChange={(e) => setNewProductForm((prev) => ({ ...prev, lowStockAt: e.target.value }))}
                      placeholder="৫"
                    />
                  </div>
                </>
              )}

              {/* Photo Upload */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label>পণ্যের ছবি (ঐচ্ছিক)</label>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={uploadingImage}
                    style={{ flex: 1 }}
                  />
                  {uploadingImage && <span className="muted" style={{ fontSize: 12 }}>আপলোড হচ্ছে...</span>}
                </div>
                {newProductForm.imageUrl && (
                  <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <img
                      src={newProductForm.imageUrl}
                      alt="Product"
                      style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--border)' }}
                    />
                    <button
                      type="button"
                      className="btn sm text red"
                      onClick={() => setNewProductForm((prev) => ({ ...prev, imageUrl: '' }))}
                    >
                      ছবি মুছুন
                    </button>
                  </div>
                )}
              </div>

              {/* Live Accounting Summary Card */}
              <div
                style={{
                  gridColumn: '1 / -1',
                  background: '#f8fafc',
                  border: '1px solid var(--border)',
                  padding: '10px 14px',
                  borderRadius: 8,
                  fontSize: 12.5,
                  lineHeight: 1.6,
                }}
              >
                <b>📊 লাভ ও ক্যাশ হিসাব সারসংক্ষেপ:</b>
                <div>
                  • প্রতি পিসে লাভ: <b style={{ color: '#16a34a' }}>
                    {newProductForm.sellPrice && newProductForm.buyPrice
                      ? taka(Number(newProductForm.sellPrice) - Number(newProductForm.buyPrice))
                      : '—'}
                  </b>
                  {newProductForm.sellPrice && newProductForm.buyPrice && Number(newProductForm.buyPrice) > 0 && (
                    <span style={{ fontSize: 11, color: '#059669', marginLeft: 6 }}>
                      ({(((Number(newProductForm.sellPrice) - Number(newProductForm.buyPrice)) / Number(newProductForm.buyPrice)) * 100).toFixed(1)}% মার্জিন)
                    </span>
                  )}
                </div>
                <div>
                  • ক্যাশবাক্স থেকে কাটা হবে: <b style={{ color: newProductForm.isExistingStock ? '#16a34a' : '#dc2626' }}>
                    {newProductForm.isExistingStock
                      ? '৳০ (আগের স্টক - ক্যাশ কাটবে না)'
                      : taka((Number(newProductForm.stockQty) || 0) * (Number(newProductForm.buyPrice) || 0))}
                  </b>
                </div>
              </div>

              <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  className="btn gray"
                  style={{ flex: 1 }}
                  onClick={() => setShowProductModal(false)}
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="btn green"
                  style={{ flex: 2, fontWeight: 'bold' }}
                  disabled={productSubmitting}
                >
                  {productSubmitting ? 'সংরক্ষণ হচ্ছে...' : '✅ পণ্য সংরক্ষণ ও কার্টে যোগ করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
