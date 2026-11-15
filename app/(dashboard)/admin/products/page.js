'use client';

import { useEffect, useState } from 'react';
import { taka, num } from '@/lib/money';
import toast from 'react-hot-toast';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const initialForm = {
    name: '',
    category: 'সাধারণ',
    unit: 'পিস',
    buyPrice: '', // per piece buy price
    sellPrice: '', // per piece sell price
    stockQty: '', // total pieces stock
    lowStockAt: 5,
    imageUrl: '',
    description: '',
    // 2 Options: 'packet' (প্যাকেট/কার্টন) | 'piece' (পিস)
    purchaseType: 'packet',
    packetUnit: 'কার্টন', // 'কার্টন' | 'প্যাকেট' | 'বক্স' | 'ডজন'
    packetQty: '', // কার্টন সংখ্যা (যেমন: ৫)
    packetBuyPrice: '', // প্রতি কার্টনের কেনার দাম (যেমন: ৬০০)
    piecesPerPacket: '', // প্রতি কার্টনে পিস সংখ্যা (যেমন: ২৪)
    packetSellPrice: '', // প্রতি কার্টনের বিক্রির দাম (যেমন: ৭২০)
  };

  const [form, setForm] = useState(initialForm);
  const [uploading, setUploading] = useState(false);

  // Add Stock Modal States
  const [stockModalProduct, setStockModalProduct] = useState(null);
  const [addStockMode, setAddStockMode] = useState('packet'); // 'packet' | 'piece'
  const [addPacketQty, setAddPacketQty] = useState('');
  const [addPieceQty, setAddPieceQty] = useState('');
  const [updatePacketBuyPrice, setUpdatePacketBuyPrice] = useState('');
  const [stockSubmitting, setStockSubmitting] = useState(false);

  // Search & Pagination States
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => { load(); }, []);

  function load() { 
    fetch('/api/products?t=' + Date.now())
      .then((r) => r.json())
      .then((d) => setProducts(d.products || []))
      .catch(() => {}); 
  }

  function set(f) { setForm((p) => ({ ...p, ...f })); }

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
  };

  // Handlers for real-time calculation
  const handlePurchaseTypeChange = (type) => {
    setForm((prev) => ({
      ...prev,
      purchaseType: type,
      packetUnit: prev.packetUnit || 'কার্টন',
    }));
  };

  // When Carton Buy Price changes (e.g. 600)
  const handlePacketBuyPriceChange = (val) => {
    setForm((prev) => {
      const pBuy = Number(val) || 0;
      const pieces = Number(prev.piecesPerPacket) || 0;
      let pieceBuy = prev.buyPrice;
      if (pieces > 0 && pBuy > 0) {
        pieceBuy = String(Number((pBuy / pieces).toFixed(2)));
      }
      return {
        ...prev,
        packetBuyPrice: val,
        buyPrice: pieceBuy,
      };
    });
  };

  // When Pieces Per Packet changes (e.g. 24)
  const handlePiecesPerPacketChange = (val) => {
    setForm((prev) => {
      const pieces = Number(val) || 0;
      const pBuy = Number(prev.packetBuyPrice) || 0;
      const pQty = Number(prev.packetQty) || 0;
      const sPrice = Number(prev.sellPrice) || 0;

      let pieceBuy = prev.buyPrice;
      if (pieces > 0 && pBuy > 0) {
        pieceBuy = String(Number((pBuy / pieces).toFixed(2)));
      }

      let totalStock = prev.stockQty;
      if (pieces > 0 && pQty > 0) {
        totalStock = String(Math.round(pQty * pieces));
      }

      let pSell = prev.packetSellPrice;
      if (pieces > 0 && sPrice > 0) {
        pSell = String(Math.round(sPrice * pieces));
      }

      return {
        ...prev,
        piecesPerPacket: val,
        buyPrice: pieceBuy,
        stockQty: totalStock,
        packetSellPrice: pSell,
      };
    });
  };

  // When Packet Qty (কার্টন সংখ্যা) changes (e.g. 5)
  const handlePacketQtyChange = (val) => {
    setForm((prev) => {
      const pQty = Number(val) || 0;
      const pieces = Number(prev.piecesPerPacket) || 0;
      let totalStock = prev.stockQty;
      if (pieces > 0) {
        totalStock = pQty > 0 ? String(Math.round(pQty * pieces)) : '';
      }
      return {
        ...prev,
        packetQty: val,
        stockQty: totalStock,
      };
    });
  };

  // When Per Piece Sell Price changes (e.g. 30)
  const handlePieceSellPriceChange = (val) => {
    setForm((prev) => {
      const sPrice = Number(val) || 0;
      const pieces = Number(prev.piecesPerPacket) || 0;
      let pSell = prev.packetSellPrice;
      if (pieces > 0 && sPrice > 0) {
        pSell = String(Math.round(sPrice * pieces));
      }
      return {
        ...prev,
        sellPrice: val,
        packetSellPrice: pSell,
      };
    });
  };

  // When Packet Sell Price changes (e.g. 720)
  const handlePacketSellPriceChange = (val) => {
    setForm((prev) => {
      const pSell = Number(val) || 0;
      const pieces = Number(prev.piecesPerPacket) || 0;
      let pieceSell = prev.sellPrice;
      if (pieces > 0 && pSell > 0) {
        pieceSell = String(Number((pSell / pieces).toFixed(2)));
      }
      return {
        ...prev,
        packetSellPrice: val,
        sellPrice: pieceSell,
      };
    });
  };

  // When Per Piece Buy Price changes manually
  const handlePieceBuyPriceChange = (val) => {
    setForm((prev) => {
      const pieceBuy = Number(val) || 0;
      const pieces = Number(prev.piecesPerPacket) || 0;
      let pBuy = prev.packetBuyPrice;
      if (prev.purchaseType === 'packet' && pieces > 0 && pieceBuy > 0) {
        pBuy = String(Math.round(pieceBuy * pieces));
      }
      return {
        ...prev,
        buyPrice: val,
        packetBuyPrice: pBuy,
      };
    });
  };

  // When Total Stock (Pieces) changes manually
  const handleStockQtyChange = (val) => {
    setForm((prev) => {
      const totalPieces = Number(val) || 0;
      const pieces = Number(prev.piecesPerPacket) || 0;
      let pQty = prev.packetQty;
      if (prev.purchaseType === 'packet' && pieces > 0 && totalPieces > 0) {
        pQty = String(Math.floor(totalPieces / pieces));
      }
      return {
        ...prev,
        stockQty: val,
        packetQty: pQty,
      };
    });
  };

  async function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
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
          set({ imageUrl: data.url });
          toast.success('📸 ছবি ক্লাউডিনারিতে আপলোড হয়েছে!');
        } else {
          set({ imageUrl: base64Data }); // Fallback to base64
          toast.success('📸 ছবি নির্বাচন করা হয়েছে');
        }
      } catch (err) {
        set({ imageUrl: base64Data });
        toast.error('আপলোডে সমস্যা, লোকাল প্রিভিউ সেভ করা হচ্ছে');
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name || !form.name.trim()) {
      toast.error('পণ্যের নাম আবশ্যক');
      return;
    }
    if (!form.sellPrice || Number(form.sellPrice) < 0) {
      toast.error('সঠিক বিক্রির দাম লিখুন');
      return;
    }

    const endpoint = '/api/products';
    const method = editingId ? 'PUT' : 'POST';

    const payload = {
      name: form.name.trim(),
      category: form.category || 'সাধারণ',
      unit: form.unit || 'পিস',
      buyPrice: Number(form.buyPrice) || 0,
      sellPrice: Number(form.sellPrice) || 0,
      stockQty: Number(form.stockQty) || 0,
      lowStockAt: Number(form.lowStockAt) || 5,
      imageUrl: form.imageUrl || '',
      description: form.description || '',
      purchaseType: form.purchaseType || 'packet',
      packetUnit: form.packetUnit || 'কার্টন',
      piecesPerPacket: Number(form.piecesPerPacket) || 1,
      packetBuyPrice: Number(form.packetBuyPrice) || 0,
      packetSellPrice: Number(form.packetSellPrice) || 0,
    };

    const body = editingId ? { id: editingId, ...payload } : payload;

    const res = await fetch(endpoint, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) { 
      toast.error(data.error || 'পণ্য সংরক্ষণ করতে সমস্যা হয়েছে'); 
      return; 
    }
    toast.success(editingId ? '✅ পণ্য আপডেট করা হয়েছে' : '✅ পণ্য সফলভাবে যোগ হয়েছে');
    resetForm();
    load();
  }

  function startEdit(p) {
    setEditingId(p._id);
    const isPacket = p.purchaseType === 'packet' || (p.piecesPerPacket && p.piecesPerPacket > 1);
    const pieces = p.piecesPerPacket || 1;
    setForm({
      name: p.name || '',
      category: p.category || 'সাধারণ',
      unit: p.unit || 'পিস',
      buyPrice: p.buyPrice !== undefined && p.buyPrice !== null ? String(p.buyPrice) : '',
      sellPrice: p.sellPrice !== undefined && p.sellPrice !== null ? String(p.sellPrice) : '',
      stockQty: p.stockQty !== undefined && p.stockQty !== null ? String(p.stockQty) : '',
      lowStockAt: p.lowStockAt !== undefined && p.lowStockAt !== null ? p.lowStockAt : 5,
      imageUrl: p.imageUrl || '',
      description: p.description || '',
      purchaseType: isPacket ? 'packet' : (p.purchaseType || 'piece'),
      packetUnit: p.packetUnit || 'কার্টন',
      packetQty: isPacket && p.stockQty ? String(Math.floor(p.stockQty / pieces)) : '',
      packetBuyPrice: p.packetBuyPrice ? String(p.packetBuyPrice) : (isPacket && p.buyPrice ? String(Math.round(p.buyPrice * pieces)) : ''),
      piecesPerPacket: p.piecesPerPacket ? String(p.piecesPerPacket) : '',
      packetSellPrice: p.packetSellPrice ? String(p.packetSellPrice) : (isPacket && p.sellPrice ? String(Math.round(p.sellPrice * pieces)) : ''),
    });
  }

  function openAddStock(p) {
    setStockModalProduct(p);
    const isPacket = p.purchaseType === 'packet' || (p.piecesPerPacket && p.piecesPerPacket > 1);
    setAddStockMode(isPacket ? 'packet' : 'piece');
    setAddPacketQty('1');
    setAddPieceQty(isPacket && p.piecesPerPacket ? String(p.piecesPerPacket) : '10');
    setUpdatePacketBuyPrice(p.packetBuyPrice ? String(p.packetBuyPrice) : '');
  }

  async function handleAddStockSubmit(e) {
    e.preventDefault();
    if (!stockModalProduct) return;
    const p = stockModalProduct;
    let qtyToAdd = 0;
    let newBuyPrice = p.buyPrice || 0;
    let newPacketBuyPrice = p.packetBuyPrice || 0;

    const piecesPerPkt = p.piecesPerPacket || 1;

    if (addStockMode === 'packet') {
      const cartons = Number(addPacketQty) || 0;
      if (cartons <= 0) {
        toast.error('সঠিক কার্টন/প্যাকেট সংখ্যা লিখুন');
        return;
      }
      qtyToAdd = cartons * piecesPerPkt;
      if (updatePacketBuyPrice && Number(updatePacketBuyPrice) > 0) {
        newPacketBuyPrice = Number(updatePacketBuyPrice);
        newBuyPrice = Number((newPacketBuyPrice / piecesPerPkt).toFixed(2));
      }
    } else {
      const pieces = Number(addPieceQty) || 0;
      if (pieces <= 0) {
        toast.error('সঠিক পিস সংখ্যা লিখুন');
        return;
      }
      qtyToAdd = pieces;
    }

    setStockSubmitting(true);
    const updatedStock = (Number(p.stockQty) || 0) + qtyToAdd;
    const body = {
      id: p._id,
      ...p,
      stockQty: updatedStock,
      buyPrice: newBuyPrice,
      packetBuyPrice: newPacketBuyPrice,
    };

    const res = await fetch('/api/products', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setStockSubmitting(false);

    if (res.ok) {
      toast.success(`✅ ${qtyToAdd} টি নতুন স্টক সফলভাবে যোগ হয়েছে!`);
      setStockModalProduct(null);
      load();
    } else {
      toast.error(data.error || 'স্টক যোগ করতে সমস্যা হয়েছে');
    }
  }

  async function remove(id) {
    if (!confirm('পণ্যটি মুছে ফেলবেন?')) return;
    const res = await fetch(`/api/products?id=${id}`, { method: 'DELETE' });
    if (res.ok) {
      toast.success('🗑 পণ্যটি মুছে ফেলা হয়েছে');
      load();
    } else {
      toast.error('মুছে ফেলতে সমস্যা হয়েছে');
    }
  }

  const stockValue = products.reduce((a, p) => a + (p.stockQty || 0) * (p.buyPrice || 0), 0);
  const lowCount = products.filter((p) => (p.stockQty || 0) <= (p.lowStockAt || 5)).length;

  // Filter & Paginate Products
  const filtered = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p.category && p.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );
  
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const activePage = Math.min(currentPage, Math.max(1, totalPages));
  const paginatedProducts = filtered.slice((activePage - 1) * itemsPerPage, activePage * itemsPerPage);

  return (
    <div>
      <div className="topbar">
        <div>
          <h2>📦 স্টক / পণ্য ব্যবস্থাপনা</h2>
          <div className="sub">মোট পণ্য: <b>{products.length}টি</b> • স্টক মূল্য: {taka(stockValue)} • কম স্টক: <b className="red">{lowCount}</b></div>
        </div>
      </div>

      <div className="grid cols-2">
        <div className="card">
          <div className="flex between" style={{ alignItems: 'center' }}>
            <h3>{editingId ? '✏️ পণ্য এডিট করুন' : '➕ নতুন পণ্য যোগ করুন'}</h3>
            {editingId && (
              <button className="btn sm gray" onClick={resetForm}>বাতিল</button>
            )}
          </div>
          
          <form className="form-grid two mt8" onSubmit={handleSubmit}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontWeight: 'bold' }}>পণ্যের নাম *</label>
              <input value={form.name} onChange={(e) => set({ name: e.target.value })} required placeholder="যেমন: এনার্জি বিস্কুট, মিনি টোস্ট..." />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label>ক্যাটাগরি</label>
              <input value={form.category} onChange={(e) => set({ category: e.target.value })} placeholder="যেমন: বিস্কুট ও বেকারি, মুদি, পানীয়..." />
            </div>

            {/* 2 Options Selector: Packet/Carton vs Piece */}
            <div style={{ gridColumn: '1 / -1', marginTop: 4, marginBottom: 4 }}>
              <label style={{ fontWeight: 'bold', marginBottom: 6, display: 'block', fontSize: 13.5 }}>
                হিসাবের ধরণ নির্বাচন করুন:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => handlePurchaseTypeChange('packet')}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 10,
                    border: form.purchaseType === 'packet' ? '2px solid #2563eb' : '1px solid var(--border)',
                    background: form.purchaseType === 'packet' ? '#eff6ff' : '#ffffff',
                    color: form.purchaseType === 'packet' ? '#1d4ed8' : 'var(--text)',
                    fontWeight: 'bold',
                    fontSize: 13.5,
                    cursor: 'pointer',
                    textAlign: 'center',
                    boxShadow: form.purchaseType === 'packet' ? '0 2px 6px rgba(37,99,235,0.15)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ fontSize: 18, marginBottom: 2 }}>📦</div>
                  ১. প্যাকেট / কার্টন হিসেবে
                  <div style={{ fontSize: 11, fontWeight: 'normal', color: form.purchaseType === 'packet' ? '#2563eb' : 'var(--muted)', marginTop: 2 }}>
                    (কার্টন কেনা দাম দিলে ১ পিসের দাম অটো বের হবে)
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handlePurchaseTypeChange('piece')}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 10,
                    border: form.purchaseType === 'piece' ? '2px solid #16a34a' : '1px solid var(--border)',
                    background: form.purchaseType === 'piece' ? '#f0fdf4' : '#ffffff',
                    color: form.purchaseType === 'piece' ? '#166534' : 'var(--text)',
                    fontWeight: 'bold',
                    fontSize: 13.5,
                    cursor: 'pointer',
                    textAlign: 'center',
                    boxShadow: form.purchaseType === 'piece' ? '0 2px 6px rgba(22,163,74,0.15)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ fontSize: 18, marginBottom: 2 }}>🛍️</div>
                  ২. সরাসরি পিস / একক হিসেবে
                  <div style={{ fontSize: 11, fontWeight: 'normal', color: form.purchaseType === 'piece' ? '#166534' : 'var(--muted)', marginTop: 2 }}>
                    (সরাসরি প্রতি পিসের কেনা ও বিক্রির দাম)
                  </div>
                </button>
              </div>
            </div>

            {form.purchaseType === 'packet' ? (
              <>
                {/* Carton / Packet Options */}
                <div>
                  <label>প্যাকেটের একক</label>
                  <select
                    value={form.packetUnit}
                    onChange={(e) => set({ packetUnit: e.target.value })}
                  >
                    <option value="কার্টন">কার্টন (Carton)</option>
                    <option value="প্যাকেট">প্যাকেট (Packet)</option>
                    <option value="বক্স">বক্স (Box)</option>
                    <option value="ডজন">ডজন (Dozen)</option>
                    <option value="বস্তা">বস্তা (Sack)</option>
                    <option value="অন্যান্য">অন্যান্য</option>
                  </select>
                </div>

                <div>
                  <label>কয়টি {form.packetUnit || 'কার্টন'} কিনেছেন? (স্টক)</label>
                  <input
                    type="number"
                    value={form.packetQty}
                    onChange={(e) => handlePacketQtyChange(e.target.value)}
                    placeholder="যেমন: ৫ বা ১"
                  />
                </div>

                <div>
                  <label style={{ fontWeight: 'bold' }}>প্রতি {form.packetUnit || 'কার্টনের'} কেনার দাম (৳) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.packetBuyPrice}
                    onChange={(e) => handlePacketBuyPriceChange(e.target.value)}
                    placeholder="যেমন: ৬০০"
                    required
                  />
                </div>

                <div>
                  <label style={{ fontWeight: 'bold' }}>প্রতি {form.packetUnit || 'কার্টনে'} পিস সংখ্যা *</label>
                  <input
                    type="number"
                    value={form.piecesPerPacket}
                    onChange={(e) => handlePiecesPerPacketChange(e.target.value)}
                    placeholder="যেমন: ২৪"
                    required
                  />
                  <div className="flex align-center mt4" style={{ gap: 4, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, color: 'var(--muted)' }}>কুইক:</span>
                    {[12, 24, 36, 48, 50, 100].map((numVal) => (
                      <button
                        key={numVal}
                        type="button"
                        className="btn sm"
                        style={{
                          padding: '2px 6px',
                          fontSize: 10.5,
                          background: form.piecesPerPacket === String(numVal) ? '#2563eb' : '#f1f5f9',
                          color: form.piecesPerPacket === String(numVal) ? '#fff' : 'var(--text)',
                          border: 'none',
                          borderRadius: 4,
                        }}
                        onClick={() => handlePiecesPerPacketChange(String(numVal))}
                      >
                        {numVal === 12 ? '১২ (ডজন)' : numVal === 24 ? '২৪ (কার্টন)' : numVal}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Auto Calculated Pieces Box */}
                <div
                  style={{
                    gridColumn: '1 / -1',
                    background: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    borderRadius: 8,
                    padding: '10px 14px',
                  }}
                >
                  <div style={{ fontWeight: 'bold', color: '#1d4ed8', fontSize: 13 }}>
                    ⚡ স্বয়ংক্রিয় পিস হিসাব (সিস্টেমের মূল স্টক ও কেনা দাম):
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10, marginTop: 8 }}>
                    <div>
                      <label style={{ fontSize: 12, color: '#1e40af' }}>১ পিসের কেনার দাম (৳):</label>
                      <input
                        type="number"
                        step="0.01"
                        style={{ background: '#fff', fontWeight: 'bold', color: '#1d4ed8' }}
                        value={form.buyPrice}
                        onChange={(e) => handlePieceBuyPriceChange(e.target.value)}
                        placeholder="অটো হিসাব হবে"
                      />
                      <small style={{ fontSize: 11, color: '#3b82f6', marginTop: 2, display: 'block' }}>
                        {form.packetBuyPrice && form.piecesPerPacket
                          ? `${form.packetBuyPrice}৳ ÷ ${form.piecesPerPacket} পিস = ${form.buyPrice}৳`
                          : 'কার্টন দাম ও পিস দিলে বের হবে'}
                      </small>
                    </div>

                    <div>
                      <label style={{ fontSize: 12, color: '#1e40af' }}>মোট স্টক পরিমাণ (পিস):</label>
                      <input
                        type="number"
                        style={{ background: '#fff', fontWeight: 'bold', color: '#1d4ed8' }}
                        value={form.stockQty}
                        onChange={(e) => handleStockQtyChange(e.target.value)}
                        placeholder="অটো হিসাব হবে"
                      />
                      <small style={{ fontSize: 11, color: '#3b82f6', marginTop: 2, display: 'block' }}>
                        {form.packetQty && form.piecesPerPacket
                          ? `${form.packetQty} কার্টন × ${form.piecesPerPacket} = ${form.stockQty} পিস`
                          : 'কার্টন সংখ্যা দিলে বের হবে'}
                      </small>
                    </div>
                  </div>
                </div>

                <div>
                  <label style={{ fontWeight: 'bold', color: '#16a34a' }}>প্রতি পিস বিক্রির দাম (৳) *</label>
                  <input
                    type="number"
                    step="0.01"
                    style={{ fontSize: 16, fontWeight: 'bold' }}
                    value={form.sellPrice}
                    onChange={(e) => handlePieceSellPriceChange(e.target.value)}
                    required
                    placeholder="যেমন: ৩০"
                  />
                </div>

                <div>
                  <label>প্রতি {form.packetUnit || 'কার্টনের'} বিক্রির দাম (৳)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.packetSellPrice}
                    onChange={(e) => handlePacketSellPriceChange(e.target.value)}
                    placeholder="যেমন: ৭২০"
                  />
                  <small className="muted" style={{ fontSize: 11, display: 'block', marginTop: 2 }}>
                    (১ পিস বিক্রি লিখলে কার্টন বিক্রির দাম অটো বসবে)
                  </small>
                </div>

                <div>
                  <label>কম স্টক সতর্কতা (পিস)</label>
                  <input
                    type="number"
                    value={form.lowStockAt}
                    onChange={(e) => set({ lowStockAt: e.target.value })}
                    placeholder="5"
                  />
                </div>

                {/* Calculation Summary Box */}
                {(Number(form.sellPrice) > 0 || Number(form.buyPrice) > 0) && (
                  <div
                    style={{
                      gridColumn: '1 / -1',
                      background: '#f0fdf4',
                      border: '1px solid #bbf7d0',
                      borderRadius: 8,
                      padding: '10px 14px',
                      fontSize: 12.5,
                      lineHeight: 1.8,
                      color: '#166534',
                    }}
                  >
                    <div style={{ fontWeight: 'bold', marginBottom: 4 }}>💡 লাভ-লোকসান হিসাব বিবরণী:</div>
                    • ১ পিসের কেনা: <b>{taka(Number(form.buyPrice) || 0)}</b> | ১ পিসের বিক্রি: <b>{taka(Number(form.sellPrice) || 0)}</b>
                    <br />• ১ পিসে নিট লাভ: <b style={{ color: Number(form.sellPrice) >= Number(form.buyPrice) ? '#16a34a' : '#dc2626' }}>
                      {Number(form.sellPrice) >= Number(form.buyPrice) ? '+' : ''}{taka((Number(form.sellPrice) || 0) - (Number(form.buyPrice) || 0))}
                      {Number(form.buyPrice) > 0
                        ? ` (${(((Number(form.sellPrice) - Number(form.buyPrice)) / Number(form.buyPrice)) * 100).toFixed(1)}%)`
                        : ''}
                    </b>
                    {form.piecesPerPacket && Number(form.piecesPerPacket) > 1 && (
                      <>
                        <br />• প্রতি {form.packetUnit || 'কার্টনে'} মোট লাভ: <b style={{ color: '#16a34a' }}>
                          +{taka(((Number(form.sellPrice) || 0) - (Number(form.buyPrice) || 0)) * Number(form.piecesPerPacket))}
                        </b>
                      </>
                    )}
                    {form.packetQty && Number(form.packetQty) > 0 && (
                      <div style={{ marginTop: 4, paddingTop: 4, borderTop: '1px dashed #bbf7d0' }}>
                        📊 মোট {form.packetQty} {form.packetUnit || 'কার্টন'} ({form.stockQty || 0} পিস) কেনা খরচ: <b>{taka((Number(form.packetBuyPrice) || 0) * Number(form.packetQty))}</b> | সম্ভাব্য মোট বিক্রি: <b>{taka((Number(form.sellPrice) || 0) * (Number(form.stockQty) || 0))}</b>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Direct Piece Options */}
                <div>
                  <label>একক (Unit)</label>
                  <input
                    value={form.unit}
                    onChange={(e) => set({ unit: e.target.value })}
                    placeholder="পিস / কেজি / লিটার"
                  />
                </div>

                <div>
                  <label>কেনার দাম (Buy Price প্রতি {form.unit || 'পিস'})</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.buyPrice}
                    onChange={(e) => set({ buyPrice: e.target.value })}
                    placeholder="যেমন: ২৫"
                  />
                </div>

                <div>
                  <label style={{ fontWeight: 'bold' }}>বিক্রির দাম (Sell Price প্রতি {form.unit || 'পিস'}) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.sellPrice}
                    onChange={(e) => set({ sellPrice: e.target.value })}
                    required
                    placeholder="যেমন: ৩০"
                  />
                </div>

                <div>
                  <label>স্টক পরিমাণ ({form.unit || 'পিস'})</label>
                  <input
                    type="number"
                    value={form.stockQty}
                    onChange={(e) => set({ stockQty: e.target.value })}
                    placeholder="যেমন: ১০০"
                  />
                </div>

                <div>
                  <label>কম স্টক সতর্কতা</label>
                  <input
                    type="number"
                    value={form.lowStockAt}
                    onChange={(e) => set({ lowStockAt: e.target.value })}
                    placeholder="5"
                  />
                </div>

                {/* Profit Preview for Piece */}
                {(Number(form.sellPrice) > 0 || Number(form.buyPrice) > 0) && (
                  <div
                    style={{
                      gridColumn: '1 / -1',
                      background: '#f0fdf4',
                      border: '1px solid #bbf7d0',
                      borderRadius: 8,
                      padding: '10px 14px',
                      fontSize: 12.5,
                      color: '#166534',
                    }}
                  >
                    💡 ১ {form.unit || 'পিসে'} লাভ: <b style={{ color: Number(form.sellPrice) >= Number(form.buyPrice) ? '#16a34a' : '#dc2626' }}>
                      {Number(form.sellPrice) >= Number(form.buyPrice) ? '+' : ''}{taka((Number(form.sellPrice) || 0) - (Number(form.buyPrice) || 0))}
                      {Number(form.buyPrice) > 0
                        ? ` (${(((Number(form.sellPrice) - Number(form.buyPrice)) / Number(form.buyPrice)) * 100).toFixed(1)}%)`
                        : ''}
                    </b>
                  </div>
                )}
              </>
            )}

            {/* Cloudinary Image & Description Section */}
            <div style={{ gridColumn: '1 / -1' }}>
              <label>☁️ Cloudinary ইমেজ URL / ফাইল আপলোড</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                <input 
                  type="text" 
                  value={form.imageUrl} 
                  onChange={(e) => set({ imageUrl: e.target.value })} 
                  placeholder="https://res.cloudinary.com/..." 
                  style={{ flex: 1 }}
                />
                <label className="btn sm gray" style={{ cursor: 'pointer', margin: 0, whiteSpace: 'nowrap' }}>
                  {uploading ? 'আপলোড হচ্ছে...' : '📁 ফাইল বাছুন'}
                  <input type="file" accept="image/*" onChange={handleFileUpload} style={{ display: 'none' }} disabled={uploading} />
                </label>
              </div>
              {form.imageUrl && (
                <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <img src={form.imageUrl} alt="Preview" style={{ width: 50, height: 50, objectFit: 'cover', borderRadius: 6, border: '1px solid #cbd5e1' }} />
                  <span style={{ fontSize: 12, color: '#16a34a', fontWeight: 600 }}>✓ ইমেজের প্রিভিউ সফল</span>
                </div>
              )}
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label>পণ্যের বিবরণ (Description)</label>
              <textarea 
                value={form.description} 
                onChange={(e) => set({ description: e.target.value })} 
                placeholder="পণ্যের গুণাগুণ বা বিবরণ লিখুন..." 
                rows={2}
                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              />
            </div>

            <button className="btn" style={{ gridColumn: '1 / -1', padding: '10px 14px', fontSize: 15, fontWeight: 'bold' }}>
              {editingId ? 'পণ্য আপডেট করুন' : 'পণ্য যোগ করুন'}
            </button>
          </form>
        </div>

        <div className="card">
          <div className="flex between" style={{ alignItems: 'center', marginBottom: 12, gap: 10, flexWrap: 'wrap' }}>
            <h3>📋 পণ্য তালিকা ({filtered.length} টি)</h3>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <select 
                value={itemsPerPage} 
                onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                style={{ padding: '6px 10px', width: '80px', fontSize: '13px' }}
              >
                <option value={10}>10টি</option>
                <option value={20}>20টি</option>
                <option value={50}>50টি</option>
                <option value={100}>100টি</option>
              </select>
            </div>
          </div>
          
          <div style={{ marginBottom: 16 }}>
            <input 
              placeholder="🔍 পণ্য খুঁজুন (নাম বা ক্যাটাগরি)..." 
              value={searchTerm} 
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              style={{ padding: '8px 12px', fontSize: '14px' }}
            />
          </div>

          <div className="table-wrap mt8">
            <table>
              <thead>
                <tr>
                  <th>ছবি</th>
                  <th>পণ্য ও ধরণ</th>
                  <th>কেনার দাম</th>
                  <th>বিক্রির দাম</th>
                  <th>স্টক</th>
                  <th>অ্যাকশন</th>
                </tr>
              </thead>
              <tbody>
                {paginatedProducts.map((p) => {
                  const profit = p.sellPrice - p.buyPrice;
                  const low = p.stockQty <= p.lowStockAt;
                  const isPacket = p.purchaseType === 'packet' || (p.piecesPerPacket && p.piecesPerPacket > 1);
                  const piecesPerPkt = p.piecesPerPacket || 1;

                  return (
                    <tr key={p._id}>
                      <td>
                        {p.imageUrl ? (
                          <img src={p.imageUrl} alt={p.name} style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 8 }} />
                        ) : (
                          <div style={{ width: 44, height: 44, background: '#f1f5f9', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                            {isPacket ? '📦' : '🛍️'}
                          </div>
                        )}
                      </td>
                      <td>
                        <b>{p.name}</b>
                        <div className="muted" style={{ fontSize: 12 }}>{p.category}</div>
                        {isPacket ? (
                          <span
                            className="badge blue"
                            style={{ fontSize: 10, marginTop: 4, display: 'inline-block' }}
                          >
                            📦 {p.packetUnit || 'কার্টন'} ({piecesPerPkt} পিস)
                          </span>
                        ) : (
                          <span
                            className="badge gray"
                            style={{ fontSize: 10, marginTop: 4, display: 'inline-block' }}
                          >
                            🛍️ {p.unit || 'পিস'}
                          </span>
                        )}
                      </td>
                      <td>
                        <b>{taka(p.buyPrice)}</b>
                        <span className="muted" style={{ fontSize: 11 }}> / পিস</span>
                        {isPacket && p.packetBuyPrice > 0 && (
                          <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>
                            প্রতি {p.packetUnit || 'কার্টন'}: {taka(p.packetBuyPrice)}
                          </div>
                        )}
                      </td>
                      <td>
                        <b style={{ color: '#16a34a' }}>{taka(p.sellPrice)}</b>
                        <span className="muted" style={{ fontSize: 11 }}> / পিস</span>
                        {isPacket && p.packetSellPrice > 0 && (
                          <div className="muted" style={{ fontSize: 11, marginTop: 2 }}>
                            প্রতি {p.packetUnit || 'কার্টন'}: {taka(p.packetSellPrice)}
                          </div>
                        )}
                        {profit !== 0 && (
                          <div style={{ fontSize: 11, color: profit > 0 ? '#16a34a' : '#dc2626' }}>
                            লাভ: {profit > 0 ? '+' : ''}{taka(profit)}
                          </div>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${low ? 'red' : 'green'}`} style={{ fontSize: 12 }}>
                          {p.stockQty} {p.unit || 'পিস'}
                        </span>
                        {isPacket && piecesPerPkt > 1 && (
                          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 3 }}>
                            {Math.floor(p.stockQty / piecesPerPkt)} {p.packetUnit || 'কার্টন'}
                            {p.stockQty % piecesPerPkt > 0 ? ` + ${p.stockQty % piecesPerPkt} পিস` : ''}
                          </div>
                        )}
                        <button
                          className="btn sm gray mt4"
                          style={{ display: 'block', fontSize: 11, padding: '3px 8px' }}
                          onClick={() => openAddStock(p)}
                        >
                          ➕ স্টক যোগ
                        </button>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn sm blue" onClick={() => startEdit(p)}>✏️</button>
                          <button className="btn sm red" onClick={() => remove(p._id)}>🗑</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && <tr><td colSpan={6} className="empty">কোনো পণ্য নেই</td></tr>}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex center" style={{ gap: 12, justifyContent: 'center', marginTop: 20, alignItems: 'center' }}>
              <button 
                className="btn sm gray" 
                disabled={activePage === 1} 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              >
                ◀ পূর্ববর্তী
              </button>
              <span style={{ fontSize: 14, fontWeight: '600' }}>
                পৃষ্ঠা {activePage} / {totalPages}
              </span>
              <button 
                className="btn sm gray" 
                disabled={activePage === totalPages} 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              >
                পরবর্তী ▶
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add Stock Modal */}
      {stockModalProduct && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
          }}
        >
          <div className="card" style={{ width: '440px', maxWidth: '92%', background: '#fff' }}>
            <div className="flex between align-center mb8">
              <h3 style={{ margin: 0, fontSize: 16 }}>
                ➕ স্টক যোগ: <span style={{ color: '#2563eb' }}>{stockModalProduct.name}</span>
              </h3>
              <button
                className="btn sm gray"
                style={{ border: 'none', background: 'transparent', fontSize: 16 }}
                onClick={() => setStockModalProduct(null)}
              >
                ✕
              </button>
            </div>

            <div
              style={{
                background: '#f8fafc',
                padding: '8px 12px',
                borderRadius: 8,
                fontSize: 12.5,
                marginBottom: 12,
                border: '1px solid #e2e8f0',
              }}
            >
              বর্তমান মোট স্টক: <b>{stockModalProduct.stockQty} পিস</b>
              {stockModalProduct.piecesPerPacket > 1 && (
                <span className="muted" style={{ marginLeft: 6 }}>
                  ({Math.floor(stockModalProduct.stockQty / stockModalProduct.piecesPerPacket)} {stockModalProduct.packetUnit || 'কার্টন'}
                  {stockModalProduct.stockQty % stockModalProduct.piecesPerPacket > 0 ? ` + ${stockModalProduct.stockQty % stockModalProduct.piecesPerPacket} পিস` : ''})
                </span>
              )}
            </div>

            <form className="form-grid" onSubmit={handleAddStockSubmit}>
              {stockModalProduct.purchaseType === 'packet' && (
                <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 8, marginBottom: 8 }}>
                  <button
                    type="button"
                    className={`btn sm ${addStockMode === 'packet' ? 'blue' : 'gray'}`}
                    style={{ flex: 1 }}
                    onClick={() => setAddStockMode('packet')}
                  >
                    📦 {stockModalProduct.packetUnit || 'কার্টন'} হিসেবে যোগ
                  </button>
                  <button
                    type="button"
                    className={`btn sm ${addStockMode === 'piece' ? 'blue' : 'gray'}`}
                    style={{ flex: 1 }}
                    onClick={() => setAddStockMode('piece')}
                  >
                    🛍️ খুচরা পিস হিসেবে যোগ
                  </button>
                </div>
              )}

              {addStockMode === 'packet' ? (
                <>
                  <div>
                    <label style={{ fontWeight: 'bold' }}>
                      কত {stockModalProduct.packetUnit || 'কার্টন'} যোগ করবেন? *
                    </label>
                    <input
                      type="number"
                      value={addPacketQty}
                      onChange={(e) => setAddPacketQty(e.target.value)}
                      placeholder="যেমন: ১ বা ২"
                      required
                    />
                  </div>

                  <div>
                    <label>প্রতিটিতে পিস সংখ্যা</label>
                    <input
                      type="number"
                      value={stockModalProduct.piecesPerPacket || 1}
                      disabled
                      style={{ background: '#f1f5f9' }}
                    />
                  </div>

                  <div
                    style={{
                      gridColumn: '1 / -1',
                      background: '#eff6ff',
                      padding: '8px 12px',
                      borderRadius: 6,
                      fontSize: 13,
                      color: '#1d4ed8',
                      fontWeight: 'bold',
                    }}
                  >
                    ✓ মোট যোগ হবে: {((Number(addPacketQty) || 0) * (stockModalProduct.piecesPerPacket || 1))} পিস
                  </div>

                  <div style={{ gridColumn: '1 / -1' }}>
                    <label>নতুন কার্টন কেনার দাম (৳) [যদি পরিবর্তন হয়ে থাকে]</label>
                    <input
                      type="number"
                      step="0.01"
                      value={updatePacketBuyPrice}
                      onChange={(e) => setUpdatePacketBuyPrice(e.target.value)}
                      placeholder={stockModalProduct.packetBuyPrice ? `বর্তমান দাম: ${stockModalProduct.packetBuyPrice}৳` : 'ঐচ্ছিক'}
                    />
                  </div>
                </>
              ) : (
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontWeight: 'bold' }}>কত পিস স্টক যোগ করবেন? *</label>
                  <input
                    type="number"
                    value={addPieceQty}
                    onChange={(e) => setAddPieceQty(e.target.value)}
                    placeholder="যেমন: ১০ বা ২০"
                    required
                  />
                </div>
              )}

              <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 8, marginTop: 8 }}>
                <button
                  type="button"
                  className="btn gray"
                  style={{ flex: 1 }}
                  onClick={() => setStockModalProduct(null)}
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="btn green"
                  style={{ flex: 1 }}
                  disabled={stockSubmitting}
                >
                  {stockSubmitting ? 'যোগ হচ্ছে...' : '✅ স্টক যোগ নিশ্চিত করুন'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
