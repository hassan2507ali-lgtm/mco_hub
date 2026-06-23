import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient'; // <-- Import Supabase
import CheckoutView from './CheckoutView';
import SuccessView from './SuccessView';
import { ArrowLeft, Star, Clock, Utensils, Plus, Minus, ChevronRight } from 'lucide-react';

export default function MenuView({ cafe, onBack, nip }) {
  const [menus, setMenus] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [cart, setCart] = useState([]);
  const [activeCategory, setActiveCategory] = useState("Semua");
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isOrderSuccess, setIsOrderSuccess] = useState(false);

  // Ambil data menu khusus untuk cafe yang dipilih dari database
  useEffect(() => {
    const fetchMenus = async () => {
      const { data, error } = await supabase
        .from('menus')
        .select('*')
        .eq('cafe_id', cafe.id)
        .eq('is_active', true); // Hanya tampilkan yang aktif / belum sold out
      
      if (data) {
        setMenus(data);
      }
      setIsLoading(false);
    };
    fetchMenus();
  }, [cafe.id]);

  // Ekstrak kategori unik dari database, lalu tambahkan "Semua" di awal
  const dynamicCategories = ["Semua", ...new Set(menus.map(m => m.category).filter(Boolean))];
  const filteredMenus = activeCategory === "Semua" ? menus : menus.filter(menu => menu.category === activeCategory);

  const formatRupiah = (angka) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(angka);

  const handleAdd = (menu) => setCart(p => {
    const e = p.find(i => i.id === menu.id);
    if (e) return p.map(i => i.id === menu.id ? { ...i, qty: i.qty + 1 } : i);
    return [...p, { ...menu, qty: 1 }];
  });

  const handleRemove = (id) => setCart(p => {
    const e = p.find(i => i.id === id);
    if (e.qty === 1) return p.filter(i => i.id !== id);
    return p.map(i => i.id === id ? { ...i, qty: i.qty - 1 } : i);
  });

  const totalCartPrice = cart.reduce((t, i) => t + (i.price * i.qty), 0);
  const totalCartItems = cart.reduce((t, i) => t + i.qty, 0);

  // Fungsi dinamis untuk warna ikon makanan
  const getMenuColor = (category) => {
    if (category === 'Minuman') return "bg-blue-100 text-blue-700";
    if (category === 'Snack') return "bg-orange-100 text-orange-700";
    if (category === 'Makanan') return "bg-red-100 text-red-700";
    return "bg-slate-100 text-slate-700";
  };

  const getCafeImageProps = (name) => {
    if (name.includes("Coffee")) return { gradient: "from-amber-600 via-amber-700 to-stone-800" };
    if (name.includes("Roti")) return { gradient: "from-orange-400 via-orange-500 to-amber-600" };
    if (name.includes("Mie")) return { gradient: "from-red-500 via-red-600 to-orange-700" };
    return { gradient: "from-blue-700 via-blue-800 to-blue-900" }; 
  };
  const cafeImage = getCafeImageProps(cafe.name);

  if (isOrderSuccess) return <SuccessView onBackToHome={onBack} />;
  if (isCheckoutOpen) return <CheckoutView cart={cart} cafe={cafe} nip={nip} onBack={() => setIsCheckoutOpen(false)} onConfirm={() => setIsOrderSuccess(true)} />;

  return (
    <div className="min-h-screen bg-white font-sans pb-28 antialiased relative">
      <div className={`relative w-full h-60 bg-gradient-to-br ${cafeImage.gradient} shadow-sm overflow-hidden rounded-b-[2.5rem]`}>
        <div className="absolute top-6 left-5 z-20">
          <button onClick={onBack} className="w-10 h-10 bg-white/20 backdrop-blur-md text-white flex items-center justify-center rounded-full hover:bg-white/30 active:scale-90 transition-all border border-white/20">
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>
        <div className="absolute inset-x-6 bottom-8 z-10 text-white">
          <span className="text-yellow-400 text-xs font-bold tracking-widest uppercase mb-1 block">Tenant Resmi MCO</span>
          <h1 className="text-4xl font-extrabold text-white leading-tight tracking-tight drop-shadow-sm">{cafe.name}</h1>
        </div>
      </div>

      <div className="mt-5">
        <div className="flex items-center gap-3 px-5 mb-5 pb-4 border-b border-slate-100">
          <span className="flex items-center gap-1.5 text-xs font-extrabold text-slate-800 bg-slate-100 px-2.5 py-1.5 rounded-full border border-slate-200">
            <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" /> {cafe.rating}
          </span>
          <span className="flex items-center gap-1.5 text-xs font-extrabold text-slate-800 bg-slate-100 px-2.5 py-1.5 rounded-full border border-slate-200">
            <Clock className="w-3.5 h-3.5 text-slate-500" /> {cafe.time_est}
          </span>
        </div>

        <div className="px-5 mb-6">
          <div className="flex gap-2.5 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden">
            {dynamicCategories.map((c) => (
              <button key={c} onClick={() => setActiveCategory(c)} className={`whitespace-nowrap px-4 py-2 rounded-full text-[13px] font-extrabold transition-all border ${activeCategory === c ? "bg-blue-900 text-white border-blue-900 shadow-md" : "bg-white text-slate-500 border-slate-200"}`}>{c}</button>
            ))}
          </div>
        </div>
        
        <div className="flex flex-col gap-6 px-5">
          {isLoading ? (
            <p className="text-center text-sm font-bold text-slate-400 py-10 animate-pulse">Memuat menu...</p>
          ) : filteredMenus.length === 0 ? (
            <p className="text-center text-sm font-bold text-slate-400 py-10">Belum ada menu di kategori ini.</p>
          ) : (
            filteredMenus.map((menu) => {
              const qty = cart.find(i => i.id === menu.id)?.qty || 0;
              const colorClass = getMenuColor(menu.category);
              return (
                <div key={menu.id} className="flex justify-between items-start gap-4 border-b border-slate-100 pb-5 last:border-0">
                  <div className="flex-1 pr-2">
                    <h3 className="font-bold text-slate-800 text-[15px]">{menu.name}</h3>
                    <p className="text-[12px] font-medium text-slate-500 mt-1.5 mb-2.5">{menu.description}</p>
                    <span className="font-extrabold text-slate-800">{formatRupiah(menu.price)}</span>
                  </div>
                  <div className="flex flex-col items-center gap-3 w-24">
                    <div className={`w-24 h-24 ${colorClass} rounded-2xl flex items-center justify-center shadow-inner`}>
                      <Utensils className="w-8 h-8 opacity-40" />
                    </div>
                    {qty === 0 ? (
                      <button onClick={() => handleAdd(menu)} className="w-full bg-white border border-blue-900 text-blue-900 text-xs font-extrabold py-1.5 rounded-full hover:bg-blue-50">Tambah</button>
                    ) : (
                      <div className="w-full flex items-center justify-between bg-white border border-blue-900 rounded-full px-1 py-0.5">
                        <button onClick={() => handleRemove(menu.id)} className="w-6 h-6 flex items-center justify-center text-blue-900"><Minus className="w-3.5 h-3.5" /></button>
                        <span className="text-xs font-extrabold text-blue-900">{qty}</span>
                        <button onClick={() => handleAdd(menu)} className="w-6 h-6 flex items-center justify-center bg-blue-900 text-white rounded-full"><Plus className="w-3.5 h-3.5" /></button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {cart.length > 0 && (
        <div onClick={() => setIsCheckoutOpen(true)} className="fixed bottom-6 left-0 right-0 px-5 max-w-md mx-auto z-30">
          <div className="bg-blue-900 text-white p-3 rounded-2xl shadow-2xl flex justify-between items-center cursor-pointer">
            <div className="flex flex-col px-2">
              <span className="text-[11px] text-blue-200 font-medium">{totalCartItems} item dipilih</span>
              <span className="font-extrabold text-sm">{formatRupiah(totalCartPrice)}</span>
            </div>
            <div className="flex items-center gap-2 bg-yellow-400 text-blue-900 px-5 py-2.5 rounded-xl font-extrabold text-[13px]">
              Checkout <ChevronRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}