import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabaseClient";
import {
  ArrowLeft, Monitor, ClipboardList, Boxes, Clock, ChefHat,
  PackageCheck, CheckCircle2, Coffee, Volume2, VolumeX, Flame, 
  TrendingUp, DollarSign, Receipt, Trophy, ArrowUpRight, History, Gift
} from "lucide-react";

const ETA_MINUTES = 7;

const formatRp = (angka) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(angka).replace("Rp", "Rp ");
};

const minutesSince = (isoString) => {
  if (!isoString) return 0;
  const diff = Date.now() - new Date(isoString).getTime();
  return Math.floor(diff / 60000);
};

// --- SUBS-KOMPONEN ---
const Switch = ({ checked, onChange, disabled, colorClass = "bg-emerald-500" }) => (
  <button
    role="switch"
    disabled={disabled}
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors flex-shrink-0 ${checked ? colorClass : "bg-slate-300"} ${disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
  >
    <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${checked ? "translate-x-6" : "translate-x-1"}`} />
  </button>
);

const etaInfo = (order) => {
  const elapsed = minutesSince(order.created_at);
  const remaining = ETA_MINUTES - elapsed;
  const overdue = remaining < 0 && order.status !== "PICKUP";
  return { elapsed, remaining, overdue };
};

const StatusBadge = ({ status }) => {
  const map = {
    NEW: { label: "New", color: "bg-emerald-100 text-emerald-700" },
    KITCHEN: { label: "In Kitchen", color: "bg-amber-100 text-amber-700" },
    PICKUP: { label: "Ready", color: "bg-blue-100 text-blue-700" },
  };
  const v = map[status] || map.NEW;
  return <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${v.color}`}>{v.label}</span>;
};

const OrderCard = ({ order, action, actionLabel, actionClass, busy }) => {
  const { elapsed, remaining, overdue } = etaInfo(order);

  return (
    <div className={`bg-white p-4 rounded-xl border shadow-sm flex flex-col gap-3 transition-colors ${overdue ? "border-red-300 ring-1 ring-red-200" : "border-slate-200"}`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-bold text-slate-900">{order.order_number}</p>
          <p className="text-xs text-slate-500 mt-0.5">
            NIP {order.customer_nip} {order.delivery_method === 'delivery' ? `· Lt. ${order.floor} M- ${order.desk}` : '· Pick Up'}
          </p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="border-t border-dashed border-slate-200 pt-3 space-y-1.5">
        {order.order_items?.map((it) => (
          <div key={it.id} className="flex justify-between text-sm">
            <span className="text-slate-700"><span className="font-semibold text-slate-900">{it.qty}×</span> {it.menu_name}</span>
            <span className="text-slate-500 text-xs self-center">{formatRp(it.qty * it.price)}</span>
          </div>
        ))}
        {order.notes && (
          <p className="text-[11px] bg-slate-50 border p-2 rounded text-slate-500 italic mt-1">Catatan: "{order.notes}"</p>
        )}
      </div>

      <div className="flex justify-between items-center pt-2 border-t border-slate-100">
        <div className={`flex items-center gap-1 text-xs ${overdue ? "text-red-600 font-bold" : "text-slate-500"}`}>
          {overdue ? <Flame className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
          {order.status === "PICKUP"
            ? <span>Ready · {elapsed}m ago</span>
            : overdue
              ? <span>Overdue by {Math.abs(remaining)}m</span>
              : <span>{elapsed}m elapsed · ~{Math.max(0, remaining)}m left</span>}
        </div>
        <p className="text-sm font-bold text-slate-900">{formatRp(order.total_price)}</p>
      </div>

      <button onClick={() => action(order.id)} disabled={busy} className={`w-full py-2.5 text-white rounded-lg font-semibold text-sm transition-colors disabled:opacity-60 ${actionClass}`}>
        {busy ? "Memproses..." : actionLabel}
      </button>
    </div>
  );
};

const KanbanColumn = ({ title, count, icon: Icon, accent, children }) => (
  <div className="flex flex-col gap-3 bg-white/60 backdrop-blur-sm p-4 rounded-2xl border border-slate-200 h-[calc(100vh-180px)] overflow-hidden">
    <div className="flex justify-between items-center pb-3 border-b border-slate-200">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: accent.bg }}>
          <Icon className="w-4 h-4" color={accent.fg} strokeWidth={2.5} />
        </div>
        <h3 className="font-semibold text-slate-900">{title}</h3>
      </div>
      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold" style={{ backgroundColor: accent.bg, color: accent.fg }}>{count}</span>
    </div>
    <div className="flex-1 overflow-y-auto space-y-3 pr-1 -mr-1 [&::-webkit-scrollbar]:hidden">{children}</div>
  </div>
);

const EmptyState = ({ label }) => (
  <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400 text-sm">
    <CheckCircle2 className="w-8 h-8 mb-2 opacity-50" />{label}
  </div>
);

// --- TAB ORDER QUEUE ---
const OrderQueueTab = ({ orders, advance, busyId }) => {
  const newOrders = orders.filter((o) => o.status === "NEW");
  const kitchen = orders.filter((o) => o.status === "KITCHEN");
  const pickup = orders.filter((o) => o.status === "PICKUP");

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 p-6">
      <KanbanColumn title="New Orders" count={newOrders.length} icon={ClipboardList} accent={{ bg: "#D1FAE5", fg: "#047857" }}>
        {newOrders.length === 0 && <EmptyState label="No new orders" />}
        {newOrders.map((o) => (
          <OrderCard key={o.id} order={o} action={(id) => advance(id, "KITCHEN")} actionLabel="Accept & Process" actionClass="bg-emerald-500 hover:bg-emerald-600" busy={busyId === o.id} />
        ))}
      </KanbanColumn>

      <KanbanColumn title="In Kitchen" count={kitchen.length} icon={ChefHat} accent={{ bg: "#FEF3C7", fg: "#B45309" }}>
        {kitchen.length === 0 && <EmptyState label="Kitchen idle" />}
        {kitchen.map((o) => (
          <OrderCard key={o.id} order={o} action={(id) => advance(id, "PICKUP")} actionLabel="Ready for Pickup" actionClass="bg-amber-500 hover:bg-amber-600" busy={busyId === o.id} />
        ))}
      </KanbanColumn>

      <KanbanColumn title="Waiting Pickup" count={pickup.length} icon={PackageCheck} accent={{ bg: "#DBEAFE", fg: "#1D4ED8" }}>
        {pickup.length === 0 && <EmptyState label="No pending pickups" />}
        {pickup.map((o) => (
          <OrderCard key={o.id} order={o} action={(id) => advance(id, "COMPLETED")} actionLabel="Completed" actionClass="bg-blue-500 hover:bg-blue-600" busy={busyId === o.id} />
        ))}
      </KanbanColumn>
    </div>
  );
};

// --- TAB STOCK MANAGEMENT & VOUCHER ---
const StockTab = ({ cafeId }) => {
  const [stock, setStock] = useState([]);
  const [busyId, setBusyId] = useState(null);
  const [busyVoucherId, setBusyVoucherId] = useState(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newMenu, setNewMenu] = useState({ name: '', price: '', category: 'Makanan', is_voucher: false, point_cost: '' });

  const fetchStock = useCallback(async () => {
    const { data } = await supabase.from('menus').select('*').eq('cafe_id', cafeId).order('id', { ascending: true });
    if (data) setStock(data);
  }, [cafeId]);

  useEffect(() => { fetchStock(); }, [fetchStock]);

  // Toggle ketersediaan menu (Active/Sold Out)
  const toggleActive = async (id, nextStatus) => {
    setBusyId(id);
    const { error } = await supabase.from('menus').update({ is_active: nextStatus }).eq('id', id);
    if (!error) {
      setStock(prev => prev.map(p => p.id === id ? { ...p, is_active: nextStatus } : p));
    }
    setBusyId(null);
  };

  // Toggle status voucher menu (ON/OFF)
  const toggleVoucher = async (id, nextVoucherStatus) => {
    setBusyVoucherId(id);
    const { error } = await supabase.from('menus').update({ is_voucher: nextVoucherStatus }).eq('id', id);
    if (!error) {
      setStock(prev => prev.map(p => p.id === id ? { ...p, is_voucher: nextVoucherStatus } : p));
    }
    setBusyVoucherId(null);
  };

  // Update harga poin saat kasir selesai mengetik
  const updatePointCost = async (id, newCost) => {
    const cost = parseInt(newCost) || 0;
    const { error } = await supabase.from('menus').update({ point_cost: cost }).eq('id', id);
    if (!error) {
      setStock(prev => prev.map(p => p.id === id ? { ...p, point_cost: cost } : p));
    }
  };

  const addMenu = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('menus').insert([{ 
      cafe_id: cafeId, 
      name: newMenu.name, 
      price: parseInt(newMenu.price), 
      category: newMenu.category,
      is_active: true,
      is_voucher: newMenu.is_voucher,
      point_cost: parseInt(newMenu.point_cost) || 0
    }]);
    
    if (!error) {
      setNewMenu({ name: '', price: '', category: 'Makanan', is_voucher: false, point_cost: '' });
      setIsAdding(false);
      fetchStock();
    }
  };

  const activeCount = stock.filter((i) => i.is_active).length;
  const voucherCount = stock.filter((i) => i.is_voucher).length;

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-5">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Menu Stock & Voucher Management</h2>
          <p className="text-sm text-slate-500 mt-1">Atur ketersediaan menu dan tentukan menu mana yang bisa diklaim menggunakan poin pelanggan.</p>
        </div>
        <div className="flex gap-2 items-center">
          <span className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 text-sm font-semibold border border-blue-100 flex items-center gap-1"><Gift className="w-3.5 h-3.5"/> {voucherCount} Vouchers</span>
          <span className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-sm font-semibold border border-emerald-100">{activeCount} Active</span>
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className="ml-2 bg-slate-900 text-white px-4 py-1.5 rounded-lg text-sm font-bold transition hover:bg-slate-800"
          >
            {isAdding ? 'Batal' : '+ Tambah Menu'}
          </button>
        </div>
      </div>

      {isAdding && (
        <form onSubmit={addMenu} className="bg-white p-4 rounded-xl border border-slate-200 mb-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input required placeholder="Nama Menu" className="border border-slate-200 p-2.5 rounded-lg text-sm focus:outline-none focus:border-slate-400" value={newMenu.name} onChange={e => setNewMenu({...newMenu, name: e.target.value})} />
            <input required type="number" placeholder="Harga (Rp)" className="border border-slate-200 p-2.5 rounded-lg text-sm focus:outline-none focus:border-slate-400" value={newMenu.price} onChange={e => setNewMenu({...newMenu, price: e.target.value})} />
            <select className="border border-slate-200 p-2.5 rounded-lg text-sm focus:outline-none focus:border-slate-400" value={newMenu.category} onChange={e => setNewMenu({...newMenu, category: e.target.value})}>
              <option value="Makanan">Makanan</option>
              <option value="Minuman">Minuman</option>
              <option value="Snack">Snack</option>
            </select>
            <div className="flex items-center gap-3 border border-slate-200 p-2.5 rounded-lg bg-slate-50">
               <label className="text-sm font-medium text-slate-700 flex-1">Jadikan Voucher?</label>
               <Switch checked={newMenu.is_voucher} onChange={(v) => setNewMenu({...newMenu, is_voucher: v})} colorClass="bg-blue-500" />
            </div>
            {newMenu.is_voucher && (
              <input required type="number" placeholder="Harga Poin (cth: 10)" className="border border-blue-200 bg-blue-50 p-2.5 rounded-lg text-sm focus:outline-none focus:border-blue-400 col-span-full md:col-span-1 md:col-start-4" value={newMenu.point_cost} onChange={e => setNewMenu({...newMenu, point_cost: e.target.value})} />
            )}
          </div>
          <button type="submit" className="mt-3 w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-lg font-bold text-sm transition-colors">
            Simpan Menu
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {stock.map((it) => (
          <div key={it.id} className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white border rounded-xl shadow-sm transition-all ${it.is_active ? "border-slate-200" : "border-red-200 bg-red-50/30"} gap-4`}>
            
            <div className="flex-1 min-w-0 pr-3">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-slate-900 text-sm truncate">{it.name}</p>
                {it.is_voucher && <Gift className="w-3.5 h-3.5 text-blue-500" />}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">{formatRp(it.price)}</p>
            </div>
            
            <div className="flex items-center gap-4 sm:gap-6 self-end sm:self-auto">
              
              {/* VOUCHER CONTROLS */}
              <div className="flex flex-col items-center gap-1 border-r border-slate-200 pr-4 sm:pr-6">
                <div className="flex items-center gap-2 h-7">
                  <Switch 
                    checked={it.is_voucher} 
                    onChange={(v) => toggleVoucher(it.id, v)} 
                    disabled={busyVoucherId === it.id} 
                    colorClass="bg-blue-500" 
                  />
                  {it.is_voucher && (
                    <input 
                      type="number" 
                      placeholder="Pts"
                      defaultValue={it.point_cost}
                      onBlur={(e) => updatePointCost(it.id, e.target.value)}
                      className="w-14 px-1.5 py-1 text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded text-center focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                      title="Ubah harga poin lalu klik di luar kotak untuk menyimpan"
                    />
                  )}
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${it.is_voucher ? "text-blue-600" : "text-slate-400"}`}>
                  {it.is_voucher ? "Voucher ON" : "Voucher OFF"}
                </span>
              </div>

              {/* ACTIVE CONTROLS */}
              <div className="flex flex-col items-center gap-1 min-w-[60px]">
                <div className="h-7 flex items-center">
                  <Switch 
                    checked={it.is_active} 
                    onChange={(v) => toggleActive(it.id, v)} 
                    disabled={busyId === it.id} 
                  />
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${it.is_active ? "text-emerald-600" : "text-red-500"}`}>
                  {it.is_active ? "Active" : "Sold Out"}
                </span>
              </div>
              
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- TAB FINANCIAL REPORT ---
const ReportTab = ({ cafeId }) => {
  const [report, setReport] = useState([]);
  const [ordersToday, setOrdersToday] = useState(0);
  const [bestSeller, setBestSeller] = useState("—");

  useEffect(() => {
    const fetchReport = async () => {
      const { data } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('cafe_id', cafeId)
        .eq('status', 'COMPLETED');

      if (data) {
        setReport(data);

        // 1. Hitung Orders Today
        const today = new Date().toISOString().split('T')[0];
        const todayOrders = data.filter(o => o.created_at.startsWith(today));
        setOrdersToday(todayOrders.length);

        // 2. Hitung Best Seller
        const itemCounts = {};
        data.forEach(order => {
          order.order_items?.forEach(item => {
            itemCounts[item.menu_name] = (itemCounts[item.menu_name] || 0) + item.qty;
          });
        });

        let bestItem = "—";
        let maxQty = 0;
        for (const [name, qty] of Object.entries(itemCounts)) {
          if (qty > maxQty) {
            maxQty = qty;
            bestItem = name;
          }
        }
        setBestSeller(bestItem);
      }
    };
    fetchReport();
  }, [cafeId]);

  const totalPendapatan = report.reduce((sum, o) => sum + o.total_price, 0);

  return (
    <div className="p-6">
      {/* 3 KOTAK ATAS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Card 1: Total Revenue */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
              <DollarSign className="w-5 h-5" />
            </div>
            <span className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-md text-[10px] font-bold tracking-wider">
              <ArrowUpRight className="w-3 h-3" /> LIVE
            </span>
          </div>
          <p className="text-xs font-bold text-slate-500 tracking-widest uppercase mt-6">Total Revenue</p>
          <h3 className="text-3xl font-extrabold text-slate-900 mt-1">{formatRp(totalPendapatan)}</h3>
          <p className="text-xs text-slate-400 mt-2">Akumulasi semua pesanan paid/done</p>
        </div>

        {/* Card 2: Orders Today */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
              <Receipt className="w-5 h-5" />
            </div>
            <span className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-md text-[10px] font-bold tracking-wider">
              <ArrowUpRight className="w-3 h-3" /> LIVE
            </span>
          </div>
          <p className="text-xs font-bold text-slate-500 tracking-widest uppercase mt-6">Orders Today</p>
          <h3 className="text-3xl font-extrabold text-slate-900 mt-1">{ordersToday}</h3>
          <p className="text-xs text-slate-400 mt-2">Pesanan diterima hari ini</p>
        </div>

        {/* Card 3: Best Seller */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-600">
              <Trophy className="w-5 h-5" />
            </div>
            <span className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-md text-[10px] font-bold tracking-wider">
              <ArrowUpRight className="w-3 h-3" /> LIVE
            </span>
          </div>
          <p className="text-xs font-bold text-slate-500 tracking-widest uppercase mt-6">Best Seller</p>
          <h3 className="text-3xl font-extrabold text-slate-900 mt-1 truncate">{bestSeller}</h3>
          <p className="text-xs text-slate-400 mt-2">Menu paling laris</p>
        </div>

      </div>

      {/* KOTAK CHART BAWAH */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm mt-5">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900">Weekly Revenue</h3>
            <p className="text-sm text-slate-400 mt-0.5">7 hari terakhir</p>
          </div>
          <span className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-xs font-bold tracking-wide">
            <TrendingUp className="w-4 h-4" /> Trend
          </span>
        </div>
        
        {/* Area Kosong untuk Chart Data Visual */}
        <div className="h-56 flex flex-col justify-between py-2 border-y border-dashed border-slate-100 relative">
           <div className="w-full border-t border-dashed border-slate-200 opacity-60"></div>
           <div className="w-full border-t border-dashed border-slate-200 opacity-60"></div>
           <div className="w-full border-t border-dashed border-slate-200 opacity-60"></div>
        </div>
      </div>
    </div>
  );
};

// --- TAB HISTORY ---
const HistoryTab = ({ cafeId }) => {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const fetchHistory = async () => {
      const { data } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('cafe_id', cafeId)
        .eq('status', 'COMPLETED')
        .order('created_at', { ascending: false }); 
      
      if (data) setHistory(data);
    };
    fetchHistory();
  }, [cafeId]);

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-5">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Order History</h2>
          <p className="text-sm text-slate-500 mt-1">Riwayat semua pesanan yang sudah selesai (COMPLETED).</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {history.length === 0 ? (
          <div className="col-span-full py-10 text-center text-slate-400 text-sm">Belum ada riwayat pesanan.</div>
        ) : (
          history.map((order) => {
            const orderDate = new Date(order.created_at);
            return (
              <div key={order.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-bold text-slate-900">{order.order_number}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {orderDate.toLocaleDateString('id-ID')} · {orderDate.toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}
                    </p>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 uppercase tracking-wide">
                    {order.delivery_method}
                  </span>
                </div>

                <div className="border-t border-dashed border-slate-200 pt-3 space-y-1.5">
                  {order.order_items?.map((it) => (
                    <div key={it.id} className="flex justify-between text-sm">
                      <span className="text-slate-700"><span className="font-semibold text-slate-900">{it.qty}×</span> {it.menu_name}</span>
                      <span className="text-slate-500 text-xs self-center">{formatRp(it.qty * it.price)}</span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                  <p className="text-xs text-slate-500">NIP: {order.customer_nip}</p>
                  <p className="text-sm font-bold text-slate-900">{formatRp(order.total_price)}</p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

// --- KOMPONEN UTAMA KASIR ---
export default function CashierView({ onLogout, cafeId }) {
  const [tab, setTab] = useState("queue");
  const [orders, setOrders] = useState([]);
  const [busyId, setBusyId] = useState(null);
  const [soundOn, setSoundOn] = useState(true);
  const [_tick, setTick] = useState(0);

  const fetchOrders = useCallback(async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('cafe_id', cafeId)
      .neq('status', 'COMPLETED') 
      .order('created_at', { ascending: true });

    if (data) setOrders(data);
  }, [cafeId]);

  const advanceOrder = async (id, nextStatus) => {
    setBusyId(id);
    const { error } = await supabase.from('orders').update({ status: nextStatus }).eq('id', id);
    if (!error) {
      await fetchOrders();
    }
    setBusyId(null);
  };

  useEffect(() => {
    fetchOrders();

    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchOrders]);

  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 10000); 
    return () => clearInterval(t);
  }, []);

  return (
    <div className="font-sans min-h-screen w-full bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shadow-[0_1px_2px_rgba(0,0,0,0.04)] sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center"><Coffee className="w-5 h-5 text-white" /></div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 leading-none">MCO Cafe Hub</h1>
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1"><Monitor className="w-3 h-3" /> Cashier Console · Live</p>
          </div>
        </div>

        <nav className="hidden md:flex bg-slate-100 rounded-lg p-1">
          <button onClick={() => setTab("queue")} className={`px-4 py-2 rounded-md text-sm font-semibold flex items-center gap-2 transition-all ${tab === "queue" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
            <ClipboardList className="w-4 h-4" /> Order Queue
            <span className="px-1.5 py-0.5 rounded text-xs bg-emerald-100 text-emerald-700 font-bold">{orders.length}</span>
          </button>
          <button onClick={() => setTab("stock")} className={`px-4 py-2 rounded-md text-sm font-semibold flex items-center gap-2 transition-all ${tab === "stock" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
            <Boxes className="w-4 h-4" /> Menu Stock
          </button>
          <button onClick={() => setTab("history")} className={`px-4 py-2 rounded-md text-sm font-semibold flex items-center gap-2 transition-all ${tab === "history" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
            <History className="w-4 h-4" /> History
          </button>
          <button onClick={() => setTab("report")} className={`px-4 py-2 rounded-md text-sm font-semibold flex items-center gap-2 transition-all ${tab === "report" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
            <TrendingUp className="w-4 h-4" /> Financial Report
          </button>
        </nav>

        <div className="flex items-center gap-2">
          <button onClick={() => setSoundOn(!soundOn)} className={`w-9 h-9 rounded-lg border flex items-center justify-center transition ${soundOn ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-slate-100 border-slate-200 text-slate-400"}`}>
            {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          <button onClick={onLogout} className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-semibold transition"><ArrowLeft className="w-4 h-4" /> Back to Role Selection</button>
        </div>
      </header>

      <main className="flex-1 overflow-x-hidden">
        {tab === "queue" ? (
          <OrderQueueTab orders={orders} advance={advanceOrder} busyId={busyId} />
        ) : tab === "stock" ? (
          <StockTab cafeId={cafeId} />
        ) : tab === "history" ? (
          <HistoryTab cafeId={cafeId} />
        ) : (
          <ReportTab cafeId={cafeId} />
        )}
      </main>
    </div>
  );
}