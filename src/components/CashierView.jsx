import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  ArrowLeft,
  Monitor,
  ClipboardList,
  Boxes,
  Clock,
  ChefHat,
  PackageCheck,
  CheckCircle2,
  Coffee,
  Volume2,
  VolumeX,
  Flame,
} from "lucide-react";

// --- DATA & UTILS DUMMY (Pengganti mcoData & mcoApi) ---
const ETA_MINUTES = 7;

const CAFES = [
  { id: 1, name: "MCO Signature Coffee", accent: "#3B82F6" },
  { id: 2, name: "Mie Mercon Juara", accent: "#EF4444" },
  { id: 3, name: "Roti Gembong Prima", accent: "#F59E0B" }
];

const formatRp = (angka) => {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(angka).replace("Rp", "Rp ");
};

const minutesSince = (isoString) => {
  if (!isoString) return 0;
  const diff = Date.now() - new Date(isoString).getTime();
  return Math.floor(diff / 60000);
};

// --- KOMPONEN BANTUAN ---

const Switch = ({ checked, onChange, testId, disabled }) => (
  <button
    data-testid={testId}
    role="switch"
    aria-checked={checked}
    disabled={disabled}
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors flex-shrink-0 ${
      checked ? "bg-emerald-500" : "bg-slate-300"
    } ${disabled ? "opacity-60" : ""}`}
  >
    <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${checked ? "translate-x-6" : "translate-x-1"}`} />
  </button>
);

const etaInfo = (order) => {
  const baseIso = order.paid_at || order.placed_at;
  const elapsed = minutesSince(baseIso);
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

const OrderCard = ({ order, action, actionLabel, actionClass, testIdPrefix, busy }) => {
  const cafe = CAFES.find((c) => c.id === order.cafeId);
  const { elapsed, remaining, overdue } = etaInfo(order);

  return (
    <div data-testid={`${testIdPrefix}-${order.id}`}
      className={`bg-white p-4 rounded-xl border shadow-sm flex flex-col gap-3 transition-colors ${
        overdue ? "border-red-300 ring-1 ring-red-200" : "border-slate-200"
      }`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-bold text-slate-900">{order.id}</p>
          <p className="text-xs text-slate-500 mt-0.5">NIP {order.nip} · {cafe?.name}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="border-t border-dashed border-slate-200 pt-3 space-y-1.5">
        {order.items.map((it) => (
          <div key={it.id} className="flex justify-between text-sm">
            <span className="text-slate-700"><span className="font-semibold text-slate-900">{it.qty}×</span> {it.name}</span>
            <span className="text-slate-500 text-xs self-center">{formatRp(it.qty * it.price)}</span>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center pt-2 border-t border-slate-100">
        <div className={`flex items-center gap-1 text-xs ${overdue ? "text-red-600 font-bold" : "text-slate-500"}`}>
          {overdue ? <Flame className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
          {order.status === "PICKUP"
            ? <span data-testid={`eta-${order.id}`}>Ready · placed {elapsed}m ago</span>
            : overdue
              ? <span data-testid={`eta-${order.id}`}>Overdue by {Math.abs(remaining)}m</span>
              : <span data-testid={`eta-${order.id}`}>{elapsed}m elapsed · ~{Math.max(0, remaining)}m left</span>}
        </div>
        <p className="text-sm font-bold text-slate-900">{formatRp(order.total)}</p>
      </div>

      <button data-testid={`${testIdPrefix}-action-${order.id}`} onClick={() => action(order.id)} disabled={busy}
        className={`w-full py-2.5 text-white rounded-lg font-semibold text-sm transition-colors disabled:opacity-60 ${actionClass}`}>
        {actionLabel}
      </button>
    </div>
  );
};

const KanbanColumn = ({ title, count, icon: Icon, accent, children, testId }) => (
  <div data-testid={testId}
    className="flex flex-col gap-3 bg-white/60 backdrop-blur-sm p-4 rounded-2xl border border-slate-200 h-[calc(100vh-180px)] overflow-hidden">
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

const OrderQueueTab = ({ orders, setOrders, busyId, setBusyId }) => {
  const newOrders = orders.filter((o) => o.status === "NEW");
  const kitchen = orders.filter((o) => o.status === "KITCHEN");
  const pickup = orders.filter((o) => o.status === "PICKUP");

  const advance = (id, next) => {
    setBusyId(id);
    setTimeout(() => {
      if (next === "COMPLETED") {
        setOrders(prev => prev.filter(o => o.id !== id));
      } else {
        setOrders(prev => prev.map(o => o.id === id ? { ...o, status: next } : o));
      }
      setBusyId(null);
    }, 400); // Simulasi delay API
  };

  return (
    <div data-testid="order-queue-tab" className="grid grid-cols-1 md:grid-cols-3 gap-5 p-6">
      <KanbanColumn testId="kanban-column-new" title="New Orders" count={newOrders.length} icon={ClipboardList}
        accent={{ bg: "#D1FAE5", fg: "#047857" }}>
        {newOrders.length === 0 && <EmptyState label="No new orders" />}
        {newOrders.map((o) => (
          <OrderCard key={o.id} order={o} action={(id) => advance(id, "KITCHEN")}
            actionLabel="Accept & Process" actionClass="bg-emerald-500 hover:bg-emerald-600"
            testIdPrefix="order-card-new" busy={busyId === o.id} />
        ))}
      </KanbanColumn>

      <KanbanColumn testId="kanban-column-kitchen" title="In Kitchen" count={kitchen.length} icon={ChefHat}
        accent={{ bg: "#FEF3C7", fg: "#B45309" }}>
        {kitchen.length === 0 && <EmptyState label="Kitchen idle" />}
        {kitchen.map((o) => (
          <OrderCard key={o.id} order={o} action={(id) => advance(id, "PICKUP")}
            actionLabel="Ready for Pickup" actionClass="bg-amber-500 hover:bg-amber-600"
            testIdPrefix="order-card-kitchen" busy={busyId === o.id} />
        ))}
      </KanbanColumn>

      <KanbanColumn testId="kanban-column-pickup" title="Waiting Pickup" count={pickup.length} icon={PackageCheck}
        accent={{ bg: "#DBEAFE", fg: "#1D4ED8" }}>
        {pickup.length === 0 && <EmptyState label="No pending pickups" />}
        {pickup.map((o) => (
          <OrderCard key={o.id} order={o}
            action={(id) => advance(id, "COMPLETED")}
            actionLabel="Completed" actionClass="bg-blue-500 hover:bg-blue-600"
            testIdPrefix="order-card-pickup" busy={busyId === o.id} />
        ))}
      </KanbanColumn>
    </div>
  );
};

// --- TAB STOCK ---

const StockTab = () => {
  const [stock, setStock] = useState([
    { id: 101, cafeId: 1, name: "Kopi Susu Gula Aren", price: 18000, active: true },
    { id: 102, cafeId: 1, name: "Americano Dingin", price: 15000, active: true },
    { id: 201, cafeId: 2, name: "Mie Mercon Level 5", price: 24000, active: false },
    { id: 301, cafeId: 3, name: "Cheese Gembong", price: 45000, active: true },
  ]);
  const [busyId, setBusyId] = useState(null);

  const toggle = (item, next) => {
    setBusyId(item.id);
    setTimeout(() => {
      setStock((prev) => prev.map((p) => (p.id === item.id ? { ...p, active: next } : p)));
      setBusyId(null);
    }, 300); // Simulasi delay
  };

  const enriched = stock.map((it) => {
    const cafe = CAFES.find((c) => c.id === it.cafeId);
    return { ...it, cafeName: cafe?.name, cafeAccent: cafe?.accent };
  });
  const activeCount = enriched.filter((i) => i.active).length;

  return (
    <div data-testid="stock-tab" className="p-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-5">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Menu Stock Management</h2>
          <p className="text-sm text-slate-500 mt-1">Toggle items off when sold out. Customers see them as unavailable instantly.</p>
        </div>
        <div className="flex gap-2">
          <span className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-sm font-semibold border border-emerald-100">
            {activeCount} Active
          </span>
          <span className="px-3 py-1.5 rounded-lg bg-red-50 text-red-700 text-sm font-semibold border border-red-100">
            {enriched.length - activeCount} Sold Out
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {enriched.map((it) => (
          <div key={it.id} data-testid={`stock-item-${it.id}`}
            className={`flex items-center justify-between p-4 bg-white border rounded-xl shadow-sm transition-all ${
              it.active ? "border-slate-200" : "border-red-200 bg-red-50/30"
            }`}>
            <div className="flex-1 min-w-0 pr-3">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: it.cafeAccent }} />
                <p className="text-xs text-slate-500 truncate">{it.cafeName}</p>
              </div>
              <p className="font-semibold text-slate-900 text-sm truncate">{it.name}</p>
              <p className="text-xs text-slate-500 mt-0.5">{formatRp(it.price)}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Switch checked={it.active} onChange={(v) => toggle(it, v)} disabled={busyId === it.id}
                testId={`stock-toggle-${it.id}`} />
              <span className={`text-[10px] font-bold uppercase tracking-wider ${it.active ? "text-emerald-600" : "text-red-500"}`}>
                {it.active ? "Active" : "Sold Out"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- KOMPONEN UTAMA KASIR ---

export default function CashierView({ onLogout }) {
  const [tab, setTab] = useState("queue");
  const [busyId, setBusyId] = useState(null);
  const [soundOn, setSoundOn] = useState(true);
  const [_tick, setTick] = useState(0); 

  // Dummy State Pesanan
  const [orders, setOrders] = useState([
    {
      id: "ORD-DEMO1", nip: "20871", cafeId: 1, total: 61000, status: "NEW",
      placed_at: new Date(Date.now() - 240 * 60000).toISOString(), // 240 menit lalu (overdue)
      items: [{ id: 1, qty: 2, name: "Es Kopi Susu", price: 18000 }, { id: 2, qty: 1, name: "Matcha Latte", price: 25000 }]
    },
    {
      id: "ORD-64125A", nip: "7890", cafeId: 1, total: 25000, status: "NEW",
      placed_at: new Date(Date.now() - 2 * 60000).toISOString(), // 2 menit lalu
      items: [{ id: 3, qty: 1, name: "Nasi Goreng Special", price: 25000 }]
    },
    {
      id: "ORD-DEMO2", nip: "30115", cafeId: 2, total: 36000, status: "KITCHEN",
      placed_at: new Date(Date.now() - 240 * 60000).toISOString(), 
      items: [{ id: 4, qty: 1, name: "Mie Mercon Level 5", price: 24000 }, { id: 5, qty: 1, name: "Es Jeruk Peras", price: 12000 }]
    },
    {
      id: "ORD-DEMO3", nip: "10456", cafeId: 3, total: 45000, status: "PICKUP",
      placed_at: new Date(Date.now() - 243 * 60000).toISOString(), 
      items: [{ id: 6, qty: 3, name: "Cheese Gembong", price: 15000 }]
    }
  ]);

  // Tick setiap 30 detik untuk update label ETA
  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 30000);
    return () => clearInterval(t);
  }, []);

  return (
    <div data-testid="cashier-dashboard-view" className="font-sans min-h-screen w-full bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shadow-[0_1px_2px_rgba(0,0,0,0.04)] sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center">
            <Coffee className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 leading-none">MCO Cafe Hub</h1>
            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
              <Monitor className="w-3 h-3" /> Cashier Console · Live
            </p>
          </div>
        </div>

        <nav className="hidden md:flex bg-slate-100 rounded-lg p-1">
          <button data-testid="tab-queue-btn" onClick={() => setTab("queue")}
            className={`px-4 py-2 rounded-md text-sm font-semibold flex items-center gap-2 transition-all ${
              tab === "queue" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}>
            <ClipboardList className="w-4 h-4" /> Order Queue
            <span data-testid="queue-count-badge"
              className="px-1.5 py-0.5 rounded text-xs bg-emerald-100 text-emerald-700 font-bold">{orders.filter(o => o.status === 'NEW').length}</span>
          </button>
          <button data-testid="tab-stock-btn" onClick={() => setTab("stock")}
            className={`px-4 py-2 rounded-md text-sm font-semibold flex items-center gap-2 transition-all ${
              tab === "stock" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}>
            <Boxes className="w-4 h-4" /> Menu Stock
          </button>
        </nav>

        <div className="flex items-center gap-2">
          <button data-testid="sound-toggle-btn" onClick={() => setSoundOn((s) => !s)}
            title={soundOn ? "Mute new-order chime" : "Enable new-order chime"}
            className={`w-9 h-9 rounded-lg border flex items-center justify-center transition ${
              soundOn ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-slate-100 border-slate-200 text-slate-400"
            }`}>
            {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
          <button data-testid="cashier-back-to-role-btn" onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-semibold transition">
            <ArrowLeft className="w-4 h-4" /> Back to Role Selection
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-x-hidden">
        {tab === "queue"
          ? <OrderQueueTab orders={orders} setOrders={setOrders} busyId={busyId} setBusyId={setBusyId} />
          : <StockTab />}
      </main>
    </div>
  );
}