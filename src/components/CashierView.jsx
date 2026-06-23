import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../supabaseClient";
import {
  ArrowLeft, Monitor, ClipboardList, Boxes, Clock, ChefHat,
  PackageCheck, CheckCircle2, Coffee, Volume2, VolumeX, Flame, TrendingUp
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
const Switch = ({ checked, onChange, disabled }) => (
  <button
    role="switch"
    disabled={disabled}
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors flex-shrink-0 ${checked ? "bg-emerald-500" : "bg-slate-300"} ${disabled ? "opacity-60" : ""}`}
  >
    <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${checked ? "translate-x-6" : "translate-x-1"}`} />
  </button>
);

const OrderCard = ({ order, action, actionLabel, actionClass, busy }) => {
  const elapsed = minutesSince(order.created_at);
  const overdue = elapsed > ETA_MINUTES && order.status !== "PICKUP";

  return (
    <div className={`bg-white p-4 rounded-xl border shadow-sm flex flex-col gap-3 transition-colors ${overdue ? "border-red-300 ring-1 ring-red-200" : "border-slate-200"}`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-bold text-slate-900">{order.order_number}</p>
          <p className="text-xs text-slate-500 mt-0.5">
            NIP {order.customer_nip} {order.delivery_method === 'delivery' ? `· Lt. ${order.floor} M- ${order.desk}` : '· Pick Up'}
          </p>
        </div>
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${order.status === 'NEW' ? 'bg-emerald-100 text-emerald-700' : order.status === 'KITCHEN' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>{order.status}</span>
      </div>

      <div className="border-t border-dashed border-slate-200 pt-3 space-y-1.5">
        {order.order_items?.map((it) => (
          <div key={it.id} className="flex justify-between text-sm">
            <span className="text-slate-700"><span className="font-semibold text-slate-900">{it.qty}×</span> {it.menu_name}</span>
            <span className="text-slate-500 text-xs self-center">{formatRp(it.qty * it.price)}</span>
          </div>
        ))}
        {order.notes && <p className="text-[11px] bg-slate-50 border p-2 rounded text-slate-500 italic mt-1">Catatan: "{order.notes}"</p>}
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
    <div className="flex-1 overflow-y-auto space-y-3 pr-1 [&::-webkit-scrollbar]:hidden">{children}</div>
  </div>
);

// --- TAB STOCK ---
const StockTab = ({ cafeId }) => {
  const [stock, setStock] = useState([]);
  const fetchStock = useCallback(async () => {
    const { data } = await supabase.from('menus').select('*').eq('cafe_id', cafeId).order('id');
    if (data) setStock(data);
  }, [cafeId]);
  useEffect(() => { fetchStock(); }, [fetchStock]);
  
  return (
    <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
      {stock.map((it) => (
        <div key={it.id} className="flex items-center justify-between p-4 bg-white border rounded-xl shadow-sm">
          <div><p className="font-semibold text-sm">{it.name}</p><p className="text-xs text-slate-500">{formatRp(it.price)}</p></div>
          <Switch checked={it.is_active} onChange={async() => { await supabase.from('menus').update({is_active: !it.is_active}).eq('id', it.id); fetchStock();}} />
        </div>
      ))}
    </div>
  );
};

// --- TAB REPORT ---
const ReportTab = ({ cafeId }) => {
  const [report, setReport] = useState([]);
  useEffect(() => {
    const fetchReport = async () => {
      const { data } = await supabase.from('orders').select('total_price').eq('cafe_id', cafeId).eq('status', 'COMPLETED');
      if (data) setReport(data);
    };
    fetchReport();
  }, [cafeId]);

  return (
    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
        <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center"><TrendingUp className="w-6 h-6 text-blue-600" /></div>
        <div><p className="text-xs font-bold text-slate-500 uppercase">Total Pendapatan</p><h3 className="text-2xl font-bold text-slate-900">{formatRp(report.reduce((sum, o) => sum + o.total_price, 0))}</h3></div>
      </div>
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
        <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center"><CheckCircle2 className="w-6 h-6 text-emerald-600" /></div>
        <div><p className="text-xs font-bold text-slate-500 uppercase">Pesanan Selesai</p><h3 className="text-2xl font-bold text-slate-900">{report.length} Order</h3></div>
      </div>
    </div>
  );
};

// --- MAIN DASHBOARD ---
export default function CashierView({ onLogout, cafeId }) {
  const [tab, setTab] = useState("queue");
  const [orders, setOrders] = useState([]);
  const [busyId, setBusyId] = useState(null);

  const fetchOrders = useCallback(async () => {
    const { data } = await supabase.from('orders').select('*, order_items(*)').eq('cafe_id', cafeId).neq('status', 'COMPLETED').order('created_at');
    if (data) setOrders(data);
  }, [cafeId]);

  const advanceOrder = async (id, nextStatus) => {
    setBusyId(id);
    await supabase.from('orders').update({ status: nextStatus }).eq('id', id);
    fetchOrders();
    setBusyId(null);
  };

  useEffect(() => {
    fetchOrders();
    const channel = supabase.channel('realtime').on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, fetchOrders).subscribe();
    return () => supabase.removeChannel(channel);
  }, [fetchOrders]);

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
          </button>
          <button onClick={() => setTab("stock")} className={`px-4 py-2 rounded-md text-sm font-semibold flex items-center gap-2 transition-all ${tab === "stock" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
            <Boxes className="w-4 h-4" /> Menu Stock
          </button>
          <button onClick={() => setTab("report")} className={`px-4 py-2 rounded-md text-sm font-semibold flex items-center gap-2 transition-all ${tab === "report" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
            <TrendingUp className="w-4 h-4" /> Financial Report
          </button>
        </nav>

        <button onClick={onLogout} className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-semibold transition"><ArrowLeft className="w-4 h-4" /> Logout</button>
      </header>

      <main className="flex-1 overflow-x-hidden">
        {tab === "queue" ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 p-6">
            <KanbanColumn title="New Orders" count={orders.filter(o => o.status === 'NEW').length} icon={ClipboardList} accent={{ bg: "#D1FAE5", fg: "#047857" }}>
              {orders.filter(o => o.status === 'NEW').map(o => <OrderCard key={o.id} order={o} action={(id) => advanceOrder(id, 'KITCHEN')} actionLabel="Accept & Process" actionClass="bg-emerald-500" busy={busyId === o.id} />)}
            </KanbanColumn>
            <KanbanColumn title="In Kitchen" count={orders.filter(o => o.status === 'KITCHEN').length} icon={ChefHat} accent={{ bg: "#FEF3C7", fg: "#B45309" }}>
              {orders.filter(o => o.status === 'KITCHEN').map(o => <OrderCard key={o.id} order={o} action={(id) => advanceOrder(id, 'PICKUP')} actionLabel="Ready for Pickup" actionClass="bg-amber-500" busy={busyId === o.id} />)}
            </KanbanColumn>
            <KanbanColumn title="Waiting Pickup" count={orders.filter(o => o.status === 'PICKUP').length} icon={PackageCheck} accent={{ bg: "#DBEAFE", fg: "#1D4ED8" }}>
              {orders.filter(o => o.status === 'PICKUP').map(o => <OrderCard key={o.id} order={o} action={(id) => advanceOrder(id, 'COMPLETED')} actionLabel="Completed" actionClass="bg-blue-500" busy={busyId === o.id} />)}
            </KanbanColumn>
          </div>
        ) : tab === "stock" ? <StockTab cafeId={cafeId} /> : <ReportTab cafeId={cafeId} />}
      </main>
    </div>
  );
}