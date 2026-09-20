import React, { useState, useEffect, useCallback } from 'react';
import { ShoppingCart, Plus, Minus, Trash2, X, Package, Search, ChevronDown, Loader, CheckCircle2, AlertCircle, Pill, Filter, FileText, Zap } from 'lucide-react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = ['All', 'Fever & Pain', 'Antibiotics', 'Vitamins', 'Diabetes', 'BP & Heart', 'Digestive', 'Skin Care', 'Eye & Ear', 'Respiratory', 'Ortho & Joint'];

// ─── Medicine Card ───
const MedCard = ({ med, onAddCart }) => (
  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-teal-300 transition-all p-4 flex flex-col gap-3">
    <div className="flex items-start justify-between gap-2">
      <div>
        <h3 className="font-extrabold text-slate-900 text-sm leading-tight">{med.brand_name}</h3>
        <p className="text-xs text-slate-500 mt-0.5">{med.generic_name}</p>
      </div>
      <span className={`shrink-0 text-[9px] font-black px-2 py-0.5 rounded-full border ${med.prescription_required ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
        {med.prescription_required ? 'Rx Required' : 'OTC'}
      </span>
    </div>
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-[10px] bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full font-semibold border border-teal-100">{med.category}</span>
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${med.stock_quantity > 20 ? 'bg-emerald-50 text-emerald-700' : med.stock_quantity > 0 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>
        {med.stock_quantity > 20 ? `In Stock (${med.stock_quantity})` : med.stock_quantity > 0 ? `Low Stock (${med.stock_quantity})` : 'Out of Stock'}
      </span>
    </div>
    <div className="flex items-center justify-between">
      <div>
        <span className="text-lg font-black text-slate-900">₹{med.generic_price || med.brand_price}</span>
        {med.brand_price > med.generic_price && <span className="text-xs line-through text-slate-400 ml-1.5">₹{med.brand_price}</span>}
      </div>
      <button
        onClick={() => onAddCart(med)}
        disabled={med.stock_quantity === 0}
        className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
      >
        <Plus className="w-3.5 h-3.5" /> Add
      </button>
    </div>
  </div>
);

// ─── Main MedicineCart Component ───
export default function MedicineCart({ prescriptionMeds = null, onOrderPlaced }) {
  const { user } = useAuth();
  const [view, setView] = useState('shop'); // 'shop' | 'cart' | 'checkout' | 'success'
  const [medicines, setMedicines] = useState([]);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [loading, setLoading] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [lastOrder, setLastOrder] = useState(null);
  const [paymentMode, setPaymentMode] = useState('Online');
  const [shippingAddress, setShippingAddress] = useState(user?.address || '');
  const [rxId, setRxId] = useState('');
  const [myPrescriptions, setMyPrescriptions] = useState([]);

  // Fetch medicines from pharmacy inventory
  const fetchMedicines = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set('q', search);
      if (category && category !== 'All') params.set('category', category);
      const res = await API.get(`/pharmacy/medicines?${params.toString()}`);
      setMedicines(res.data.medicines || []);
    } catch { setMedicines([]); } finally { setLoading(false); }
  }, [search, category]);

  const fetchCart = useCallback(async () => {
    try {
      const res = await API.get('/pharmacy/cart');
      setCart(res.data.cart || []);
    } catch { setCart([]); }
  }, []);

  const fetchPrescriptions = useCallback(async () => {
    try {
      const res = await API.get('/prescriptions/patient');
      setMyPrescriptions(res.data.prescriptions || []);
    } catch { setMyPrescriptions([]); }
  }, []);

  useEffect(() => { fetchMedicines(); }, [fetchMedicines]);
  useEffect(() => { fetchCart(); fetchPrescriptions(); }, []);

  // If pre-filled from prescription, add those medicines to cart on mount
  useEffect(() => {
    if (prescriptionMeds && prescriptionMeds.length > 0) {
      prescriptionMeds.forEach(m => {
        handleAddCart({ id: Date.now() + Math.random(), brand_name: m.name, generic_name: m.name, brand_price: 50, generic_price: 50, category: 'Other', stock_quantity: 99, prescription_required: true }, m.quantity || 1);
      });
    }
  }, []);

  const handleAddCart = async (med, qty = 1) => {
    try {
      const res = await API.post('/pharmacy/cart/add', {
        medicine_id: med.id,
        name: med.brand_name,
        generic_name: med.generic_name,
        price: med.generic_price || med.brand_price,
        quantity: qty,
        category: med.category,
        prescription_required: med.prescription_required
      });
      setCart(res.data.cart || []);
    } catch (err) { console.error('Add to cart error:', err); }
  };

  const handleUpdateQty = async (item, delta) => {
    const newQty = (item.quantity || 1) + delta;
    if (newQty <= 0) { handleRemove(item); return; }
    try {
      const res = await API.put(`/pharmacy/cart/${item.id}`, { quantity: newQty });
      setCart(res.data.cart || []);
    } catch {}
  };

  const handleRemove = async (item) => {
    try {
      await API.delete(`/pharmacy/cart/${item.id}`);
      fetchCart();
    } catch {}
  };

  const cartTotal = cart.reduce((s, c) => s + (c.price || 0) * (c.quantity || 1), 0);
  const hasRxMeds = cart.some(c => c.prescription_required);
  const deliveryFee = cartTotal > 500 ? 0 : 40;
  const grandTotal = cartTotal + deliveryFee;

  const handlePlaceOrder = async () => {
    if (!shippingAddress.trim()) { alert('Please enter your delivery address.'); return; }
    if (hasRxMeds && !rxId) { alert('This order contains prescription medicines. Please select or enter your prescription ID.'); return; }
    try {
      setPlacingOrder(true);
      const res = await API.post('/pharmacy/orders', {
        items: cart.map(c => ({ name: c.name, generic_name: c.generic_name, qty: c.quantity, price: c.price })),
        total: grandTotal,
        shippingAddress,
        paymentMode,
        rx_id: rxId || null,
        requires_prescription: hasRxMeds
      });
      setLastOrder(res.data);
      setCart([]);
      setView('success');
      onOrderPlaced && onOrderPlaced(res.data);
    } catch (err) { alert('Failed to place order. Please try again.'); } finally { setPlacingOrder(false); }
  };

  // ── Success Screen ──
  if (view === 'success' && lastOrder) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center space-y-5">
        <div className="w-20 h-20 bg-emerald-100 rounded-3xl flex items-center justify-center animate-bounce">
          <CheckCircle2 className="w-10 h-10 text-emerald-600" />
        </div>
        <div>
          <h3 className="text-xl font-black text-slate-900">Order Placed! 🎉</h3>
          <p className="text-sm text-slate-500 mt-1">Order ID: <span className="font-bold text-teal-700">{lastOrder?.order_id || lastOrder?.order?.id}</span></p>
          {hasRxMeds && <p className="text-xs bg-amber-50 border border-amber-200 text-amber-700 rounded-xl px-4 py-2 mt-3 font-semibold">📋 Prescription verification in progress. The pharmacy will confirm after verification.</p>}
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-4 text-left space-y-2 w-full max-w-sm">
          <p className="text-xs font-bold text-slate-600 uppercase">Order Status</p>
          {['Order Placed ✅', 'Prescription Verification (if required)', 'Preparing 🔄', 'Out for Delivery 🛵', 'Delivered 🏠'].map((s, i) => (
            <div key={i} className={`flex items-center gap-2 text-xs ${i === 0 ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
              <span className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-emerald-500' : 'bg-slate-200'}`} />
              {s}
            </div>
          ))}
        </div>
        <button onClick={() => { setView('shop'); setLastOrder(null); }} className="px-8 py-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-sm transition-all">
          Continue Shopping
        </button>
      </div>
    );
  }

  // ── Cart/Checkout View ──
  if (view === 'cart') {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <button onClick={() => setView('shop')} className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1">← Back to Medicines</button>
          <h2 className="text-base font-extrabold text-slate-900">🛒 My Cart ({cart.length} items)</h2>
        </div>

        {cart.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-bold text-slate-600">Your cart is empty</p>
            <button onClick={() => setView('shop')} className="mt-3 text-sm text-teal-600 font-bold hover:underline">Browse Medicines</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-3">
              {cart.map(item => (
                <div key={item.id} className="bg-white rounded-2xl border border-slate-200 p-4 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 text-sm truncate">{item.name}</p>
                    <p className="text-xs text-slate-400">{item.generic_name}</p>
                    {item.prescription_required && <span className="text-[9px] bg-red-50 text-red-600 font-bold px-2 py-0.5 rounded-full border border-red-200 mt-1 inline-block">Rx Required</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => handleUpdateQty(item, -1)} className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-100"><Minus className="w-3 h-3" /></button>
                    <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
                    <button onClick={() => handleUpdateQty(item, 1)} className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center hover:bg-slate-100"><Plus className="w-3 h-3" /></button>
                  </div>
                  <div className="text-right min-w-[60px]">
                    <p className="font-black text-slate-900 text-sm">₹{(item.price * item.quantity).toFixed(0)}</p>
                    <p className="text-[10px] text-slate-400">₹{item.price} each</p>
                  </div>
                  <button onClick={() => handleRemove(item)} className="text-red-400 hover:text-red-600 p-1 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
                <h3 className="font-extrabold text-slate-900 text-sm">Order Summary</h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span className="font-bold">₹{cartTotal}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Delivery</span><span className={`font-bold ${deliveryFee === 0 ? 'text-emerald-600' : ''}`}>{deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}</span></div>
                  {deliveryFee > 0 && <p className="text-[10px] text-slate-400">Free delivery on orders above ₹500</p>}
                  <div className="pt-2 border-t border-slate-100 flex justify-between"><span className="font-extrabold text-slate-900">Total</span><span className="font-black text-teal-700 text-base">₹{grandTotal}</span></div>
                </div>

                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Payment Mode</label>
                    <select value={paymentMode} onChange={e => setPaymentMode(e.target.value)} className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs font-semibold">
                      <option>Online</option><option>Cash on Delivery</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">Delivery Address *</label>
                    <textarea rows={2} value={shippingAddress} onChange={e => setShippingAddress(e.target.value)} placeholder="Enter complete delivery address" className="w-full px-3 py-2 bg-slate-50 rounded-xl border border-slate-200 text-xs resize-none" />
                  </div>
                  {hasRxMeds && (
                    <div>
                      <label className="block text-[10px] font-bold text-red-600 uppercase mb-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Prescription ID (Required)</label>
                      <select value={rxId} onChange={e => setRxId(e.target.value)} className="w-full px-3 py-2 bg-red-50 rounded-xl border border-red-200 text-xs font-semibold text-slate-800">
                        <option value="">-- Select Prescription --</option>
                        {myPrescriptions.map(p => <option key={p.rx_id} value={p.rx_id}>{p.rx_id} — {p.doctor_name} ({p.created_at?.split('T')[0]})</option>)}
                      </select>
                    </div>
                  )}
                </div>

                <button onClick={handlePlaceOrder} disabled={placingOrder || cart.length === 0} className="w-full py-3 bg-gradient-to-r from-teal-600 to-cyan-600 text-white font-extrabold text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20 disabled:opacity-50 transition-all hover:from-teal-500 hover:to-cyan-500">
                  {placingOrder ? <><Loader className="w-4 h-4 animate-spin" />Placing Order...</> : <><Zap className="w-4 h-4" />Place Order — ₹{grandTotal}</>}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ── Shop View ──
  return (
    <div className="space-y-5">
      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search medicines by name..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400/40"
          />
        </div>
        <select value={category} onChange={e => setCategory(e.target.value)} className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-400/40">
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <button onClick={fetchMedicines} className="px-4 py-2.5 bg-teal-600 text-white text-sm font-bold rounded-xl hover:bg-teal-700 transition-all">Search</button>
        <button onClick={() => setView('cart')} className="relative flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-700 transition-all">
          <ShoppingCart className="w-4 h-4" />
          Cart
          {cart.length > 0 && <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center">{cart.length}</span>}
        </button>
      </div>

      {/* Category Pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setCategory(c)} className={`shrink-0 px-3 py-1.5 text-xs font-bold rounded-full border transition-all ${category === c ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-slate-600 border-slate-200 hover:border-teal-400'}`}>{c}</button>
        ))}
      </div>

      {/* Prescription auto-fill notice */}
      {prescriptionMeds && prescriptionMeds.length > 0 && (
        <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4 flex items-center gap-3">
          <FileText className="w-5 h-5 text-teal-600 shrink-0" />
          <div>
            <p className="text-sm font-bold text-teal-800">Prescription Medicines Pre-loaded</p>
            <p className="text-xs text-teal-600">{prescriptionMeds.length} medicines from your prescription added to cart. <button onClick={() => setView('cart')} className="underline font-bold">View Cart →</button></p>
          </div>
        </div>
      )}

      {/* Medicines Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader className="w-8 h-8 text-teal-600 animate-spin" /></div>
      ) : medicines.length === 0 ? (
        <div className="text-center py-12">
          <Pill className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="font-bold text-slate-600">No medicines found</p>
          <p className="text-xs text-slate-400 mt-1">Try a different search or category</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {medicines.map(med => <MedCard key={med.id} med={med} onAddCart={handleAddCart} />)}
        </div>
      )}
    </div>
  );
}
