import { useState } from 'react';
import CheckoutView from './CheckoutView';
import SuccessView from './SuccessView';

export default function MenuView({ cafe, onBack }) {
  const menus = [
    { id: 101, name: "Kopi Susu Gula Aren", desc: "Espresso 100% Arabica, susu segar, dan gula aren murni", price: 18000, category: "Minuman", color: "bg-amber-100 text-amber-700" },
    { id: 102, name: "Americano Dingin", desc: "Kopi hitam dingin segar tanpa gula dari biji kopi pilihan", price: 15000, category: "Minuman", color: "bg-stone-200 text-stone-700" },
    { id: 103, name: "Roti Bakar Coklat Keju", desc: "Roti bakar tebal dengan topping coklat premium dan keju melimpah", price: 20000, category: "Snack", color: "bg-orange-100 text-orange-700" },
    { id: 104, name: "Nasi Goreng Spesial", desc: "Nasi goreng bumbu rempah dengan telur mata sapi dan ayam", price: 25000, category: "Makanan", color: "bg-red-100 text-red-700" },
    { id: 105, name: "Air Mineral Premium", desc: "Air mineral botol 600ml dingin", price: 5000, category: "Minuman", color: "bg-blue-100 text-blue-700" },
  ];

  const [cart, setCart] = useState([]);
  const [activeCategory, setActiveCategory] = useState("Semua");
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isOrderSuccess, setIsOrderSuccess] = useState(false);

  const categories = ["Semua", "Makanan", "Minuman", "Snack"];

  const filteredMenus = activeCategory === "Semua" 
    ? menus 
    : menus.filter(menu => menu.category === activeCategory);

  const formatRupiah = (angka) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(angka);
  };

  const handleAdd = (menu) => {
    setCart((prev) => {
      const existing = prev.find(item => item.id === menu.id);
      if (existing) return prev.map(item => item.id === menu.id ? { ...item, qty: item.qty + 1 } : item);
      return [...prev, { ...menu, qty: 1 }];
    });
  };

  const handleRemove = (menuId) => {
    setCart((prev) => {
      const existing = prev.find(item => item.id === menuId);
      if (existing.qty === 1) return prev.filter(item => item.id !== menuId);
      return prev.map(item => item.id === menuId ? { ...item, qty: item.qty - 1 } : item);
    });
  };

  const totalCartPrice = cart.reduce((total, item) => total + (item.price * item.qty), 0);
  const totalCartItems = cart.reduce((total, item) => total + item.qty, 0);

  const getCafeImageProps = (name) => {
    if (name.includes("Coffee")) return { gradient: "from-amber-600 via-amber-700 to-stone-800", icon: "☕" };
    if (name.includes("Roti")) return { gradient: "from-orange-400 via-orange-500 to-amber-600", icon: "🍞" };
    if (name.includes("Mie")) return { gradient: "from-red-500 via-red-600 to-orange-700", icon: "🍜" };
    if (name.includes("Nusantara")) return { gradient: "from-green-600 via-green-700 to-emerald-800", icon: "🇮🇩" };
    if (name.includes("Salad")) return { gradient: "from-emerald-400 via-emerald-500 to-teal-600", icon: "🥗" };
    return { gradient: "from-blue-700 via-blue-800 to-blue-900", icon: "🏪" }; 
  };
  const cafeImage = getCafeImageProps(cafe.name);

  // --- LOGIKA NAVIGASI YANG DIPERBAIKI ---
  if (isOrderSuccess) {
    // onBack di sini akan menutup MenuView dan kembali ke HomeView
    return <SuccessView onBackToHome={onBack} />;
  }

  if (isCheckoutOpen) {
    return (
      <CheckoutView 
        cart={cart} 
        cafe={cafe} 
        onBack={() => setIsCheckoutOpen(false)} 
        onConfirm={() => setIsOrderSuccess(true)} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans pb-28 antialiased relative">
      {/* ... (seluruh sisa UI kamu tetap sama seperti sebelumnya) ... */}
      <div className={`relative w-full h-60 bg-gradient-to-br ${cafeImage.gradient} shadow-sm overflow-hidden rounded-b-[2.5rem]`}>
        <div className="absolute top-6 left-5 right-5 flex justify-between items-start z-20">
          <button onClick={onBack} className="w-10 h-10 bg-white/20 backdrop-blur-md text-white flex items-center justify-center rounded-full hover:bg-white/30 active:scale-90 transition-all border border-white/20">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>
          </button>
        </div>
        <div className="absolute inset-x-6 bottom-8 z-10 text-white">
          <span className="text-yellow-400 text-xs font-bold tracking-widest uppercase mb-1 block">Tenant Resmi MCO</span>
          <h1 className="text-4xl font-extrabold text-white leading-tight tracking-tight drop-shadow-sm">{cafe.name}</h1>
        </div>
        <div className="absolute -bottom-10 -right-10 text-[120px] opacity-20 transform -rotate-12 transition-transform duration-700">{cafeImage.icon}</div>
      </div>

      <div className="mt-5">
        <div className="flex items-center gap-3 px-5 mb-5 pb-4 border-b border-slate-100">
          <span className="flex items-center gap-1.5 text-xs font-extrabold text-slate-800 bg-slate-100 px-2.5 py-1.5 rounded-full border border-slate-200">
            <span className="text-yellow-500">⭐</span> {cafe.rating}
          </span>
          <span className="flex items-center gap-1.5 text-xs font-extrabold text-slate-800 bg-slate-100 px-2.5 py-1.5 rounded-full border border-slate-200">
            <span>⏱️</span> {cafe.time}
          </span>
        </div>

        <div className="px-5 mb-6">
          <div className="flex gap-2.5 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-[13px] font-extrabold transition-all border ${
                  activeCategory === category ? "bg-blue-900 text-white border-blue-900 shadow-md" : "bg-white text-slate-500 border-slate-200"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex flex-col gap-6 px-5">
          {filteredMenus.map((menu) => {
            const cartItem = cart.find(item => item.id === menu.id);
            const qty = cartItem ? cartItem.qty : 0;
            return (
              <div key={menu.id} className="flex justify-between items-start gap-4 border-b border-slate-100 pb-5 last:border-0">
                <div className="flex-1 pr-2">
                  <h3 className="font-bold text-slate-800 text-[15px]">{menu.name}</h3>
                  <p className="text-[12px] font-medium text-slate-500 mt-1.5 mb-2.5">{menu.desc}</p>
                  <span className="font-extrabold text-slate-800">{formatRupiah(menu.price)}</span>
                </div>
                <div className="flex flex-col items-center gap-3 w-24">
                  <div className={`w-24 h-24 ${menu.color} rounded-2xl flex items-center justify-center shadow-inner`}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8 opacity-50"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" /></svg>
                  </div>
                  {qty === 0 ? (
                    <button onClick={() => handleAdd(menu)} className="w-full bg-white border border-blue-900 text-blue-900 text-xs font-extrabold py-1.5 rounded-full hover:bg-blue-50">Tambah</button>
                  ) : (
                    <div className="w-full flex items-center justify-between bg-white border border-blue-900 rounded-full px-1 py-0.5">
                      <button onClick={() => handleRemove(menu.id)} className="w-6 h-6 flex items-center justify-center text-blue-900"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" /></svg></button>
                      <span className="text-xs font-extrabold text-blue-900">{qty}</span>
                      <button onClick={() => handleAdd(menu)} className="w-6 h-6 flex items-center justify-center bg-blue-900 text-white rounded-full"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg></button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
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
              Checkout
            </div>
          </div>
        </div>
      )}
    </div>
  );
}