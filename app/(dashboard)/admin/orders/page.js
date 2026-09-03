'use client';

import { useEffect, useState } from 'react';
import { taka } from '@/lib/money';
import toast from 'react-hot-toast';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    loadOrders();
  }, []);

  function loadOrders() {
    setLoading(true);
    fetch('/api/orders?t=' + Date.now())
      .then((res) => res.json())
      .then((data) => {
        setOrders(data.orders || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }

  async function updateStatus(id, newStatus) {
    try {
      const res = await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`✅ স্ট্যাটাস আপডেট হয়েছে: ${newStatus}`);
        loadOrders();
        if (selectedOrder && selectedOrder._id === id) {
          setSelectedOrder({ ...selectedOrder, status: newStatus });
        }
      } else {
        toast.error(data.error || 'আপডেট করতে ব্যর্থ হয়েছে');
      }
    } catch (err) {
      toast.error('সমস্যা হয়েছে');
    }
  }

  const filteredOrders = orders.filter((o) => {
    if (statusFilter === 'all') return true;
    return o.status === statusFilter;
  });

  const pendingCount = orders.filter(o => o.status === 'pending').length;

  return (
    <div>
      <div className="topbar">
        <div>
          <h2>🚚 অনলাইন অর্ডারসমূহ (Store Orders)</h2>
          <div className="sub">
            মোট অর্ডার: <b>{orders.length}টি</b> • নতুন পেন্ডিং অর্ডার: <b className="red">{pendingCount}টি</b>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <button 
          onClick={() => setStatusFilter('all')} 
          className={`btn ${statusFilter === 'all' ? '' : 'gray'}`}
        >
          সব ({orders.length})
        </button>
        <button 
          onClick={() => setStatusFilter('pending')} 
          className={`btn ${statusFilter === 'pending' ? 'yellow' : 'gray'}`}
        >
          ⏳ পেন্ডিং ({orders.filter(o => o.status === 'pending').length})
        </button>
        <button 
          onClick={() => setStatusFilter('processing')} 
          className={`btn ${statusFilter === 'processing' ? 'blue' : 'gray'}`}
        >
          🔄 প্রসেসিং ({orders.filter(o => o.status === 'processing').length})
        </button>
        <button 
          onClick={() => setStatusFilter('delivered')} 
          className={`btn ${statusFilter === 'delivered' ? 'green' : 'gray'}`}
        >
          ✅ ডেলিভার্ড ({orders.filter(o => o.status === 'delivered').length})
        </button>
        <button 
          onClick={() => setStatusFilter('cancelled')} 
          className={`btn ${statusFilter === 'cancelled' ? 'red' : 'gray'}`}
        >
          ❌ বাতিল ({orders.filter(o => o.status === 'cancelled').length})
        </button>
      </div>

      <div className="grid cols-2">
        <div className="card">
          <h3>📋 অর্ডার তালিকা</h3>
          {loading ? (
            <p style={{ padding: 20, color: '#64748b' }}>অর্ডার লোড হচ্ছে...</p>
          ) : filteredOrders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
              <span style={{ fontSize: 36 }}>🛒</span>
              <p style={{ marginTop: 8 }}>কোনো অর্ডার পাওয়া যায়নি</p>
            </div>
          ) : (
            <div className="table-wrap mt8">
              <table>
                <thead>
                  <tr>
                    <th>অর্ডার #</th>
                    <th>গ্রাহক</th>
                    <th>মোট টাকা</th>
                    <th>পেমেন্ট</th>
                    <th>স্ট্যাটাস</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((o) => (
                    <tr key={o._id} style={{ background: selectedOrder?._id === o._id ? '#f0f9ff' : 'transparent' }}>
                      <td>
                        <b>#{o.orderNumber}</b>
                        <div className="muted" style={{ fontSize: 11 }}>
                          {new Date(o.createdAt || o.date).toLocaleDateString('bn-BD')}
                        </div>
                      </td>
                      <td>
                        <b>{o.customerName}</b>
                        <div style={{ fontSize: 12, color: '#475569' }}>📞 {o.customerPhone}</div>
                      </td>
                      <td>
                        <b>{taka(o.totalAmount)}</b>
                        <div style={{ fontSize: 11, color: '#64748b' }}>ডেলিভারি: ৳{o.deliveryFee}</div>
                      </td>
                      <td>
                        <span className="badge blue" style={{ fontSize: 11 }}>
                          {o.paymentMethod === 'cod' ? '💵 Cash on Delivery' : '📱 bKash'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${
                          o.status === 'pending' ? 'yellow' :
                          o.status === 'processing' ? 'blue' :
                          o.status === 'delivered' ? 'green' : 'red'
                        }`}>
                          {o.status === 'pending' ? '⏳ পেন্ডিং' :
                           o.status === 'processing' ? '🔄 প্রসেসিং' :
                           o.status === 'delivered' ? '✅ ডেলিভার্ড' : '❌ বাতিল'}
                        </span>
                      </td>
                      <td>
                        <button className="btn sm blue" onClick={() => setSelectedOrder(o)}>
                          বিস্তারিত 👁️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Order details panel */}
        <div className="card">
          {selectedOrder ? (
            <div>
              <div className="flex between" style={{ alignItems: 'center', borderBottom: '1px solid #e2e8f0', pb: 12, marginBottom: 16 }}>
                <div>
                  <h3 style={{ margin: 0 }}>অর্ডার বিস্তারিত: #{selectedOrder.orderNumber}</h3>
                  <span className="muted" style={{ fontSize: 12 }}>
                    তারিখ: {new Date(selectedOrder.createdAt || selectedOrder.date).toLocaleString('bn-BD')}
                  </span>
                </div>
                <span className={`badge ${
                  selectedOrder.status === 'pending' ? 'yellow' :
                  selectedOrder.status === 'processing' ? 'blue' :
                  selectedOrder.status === 'delivered' ? 'green' : 'red'
                }`}>
                  {selectedOrder.status}
                </span>
              </div>

              <div style={{ background: '#f8fafc', padding: 16, borderRadius: 10, marginBottom: 16 }}>
                <h4 style={{ margin: '0 0 8px', fontSize: 14, color: '#1e293b' }}>👤 গ্রাহকের তথ্য</h4>
                <div style={{ fontSize: 14, lineHeight: 1.6 }}>
                  <div><b>নাম:</b> {selectedOrder.customerName}</div>
                  <div><b>মোবাইল:</b> <a href={`tel:${selectedOrder.customerPhone}`} style={{ color: '#2563eb' }}>{selectedOrder.customerPhone}</a></div>
                  <div><b>ঠিকানা:</b> {selectedOrder.deliveryAddress}</div>
                  <div><b>ডেলিভারি এলাকা:</b> {selectedOrder.area === 'jahangirnagar_boalmari' ? 'জাহাঙ্গীরনগর / বোয়ালমারী (হোম ডেলিভারি)' : selectedOrder.area}</div>
                  <div><b>পেমেন্ট মাধ্যম:</b> Cash on Delivery (ক্যাশ অন ডেলিভারি)</div>
                  {selectedOrder.note && <div><b>নোট:</b> {selectedOrder.note}</div>}
                </div>
              </div>

              <h4 style={{ margin: '16px 0 8px', fontSize: 14, color: '#1e293b' }}>🛍️ অর্ডারকৃত পণ্যসমূহ</h4>
              <div className="table-wrap" style={{ marginBottom: 16 }}>
                <table>
                  <thead>
                    <tr><th>পণ্য</th><th>পরিমাণ</th><th>মূল্য</th><th>মোট</th></tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items?.map((item, idx) => (
                      <tr key={idx}>
                        <td>
                          <b>{item.name}</b>
                        </td>
                        <td>{item.qty} {item.unit || 'পিস'}</td>
                        <td>{taka(item.price)}</td>
                        <td><b>{taka(item.total)}</b></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ background: '#eff6ff', padding: 12, borderRadius: 8, fontSize: 14, marginBottom: 20 }}>
                <div className="flex between"><span>পণ্য সাবটোটাল:</span> <span>{taka(selectedOrder.subtotal)}</span></div>
                <div className="flex between"><span>ডেলিভারি চার্জ:</span> <span>৳{selectedOrder.deliveryFee}</span></div>
                <div className="flex between" style={{ fontWeight: 'bold', fontSize: 16, borderTop: '1px solid #bfdbfe', paddingTop: 6, marginTop: 6 }}>
                  <span>সর্বমোট প্রদেয়:</span> <span style={{ color: '#1d4ed8' }}>{taka(selectedOrder.totalAmount)}</span>
                </div>
              </div>

              <h4 style={{ margin: '0 0 10px', fontSize: 14 }}>স্ট্যাটাস পরিবর্তন করুন:</h4>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button 
                  className="btn sm blue"
                  onClick={() => updateStatus(selectedOrder._id, 'processing')}
                >
                  🔄 প্রসেসিং করুন
                </button>
                <button 
                  className="btn sm green"
                  onClick={() => updateStatus(selectedOrder._id, 'delivered')}
                >
                  ✅ ডেলিভার্ড (ডেলিভারি সম্পন্ন)
                </button>
                <button 
                  className="btn sm red"
                  onClick={() => updateStatus(selectedOrder._id, 'cancelled')}
                >
                  ❌ বাতিল করুন
                </button>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
              <span style={{ fontSize: 40 }}>👈</span>
              <p style={{ marginTop: 8 }}>তালিকা থেকে কোনো অর্ডারে ক্লিক করে সম্পূর্ণ বিবরণ দেখুন</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
