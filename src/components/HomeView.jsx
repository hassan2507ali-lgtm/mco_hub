import { useState, useEffect } from 'react';
import HistoryView from './HistoryView'; // <-- Import halaman History

export default function HomeView({ nip, onLogout, onSelectCafe }) {
  const cafes = [
    { id: 1, name: "MCO Signature Coffee", desc: "Kopi, Teh & Minuman Dingin", rating: "4.9", time: "5-10 mnt" },
    { id: 2, name: "Roti Gembong Prima", desc: "Roti Bakar & Pastry", rating: "4.8", time: "10-15 mnt" },
    { id: 3, name: "Mie Mercon Juara", desc: "Mie Pedas & Dimsum", rating: "4.7", time: "15-20 mnt" },
    { id: 4, name: "Nusantara Rice Box", desc: "Ayam Geprek & Nasi Kotak", rating: "4.6", time: "10-20 mnt" },
    { id: 5, name: "Healthy Salad Bar", desc: "Salad & Jus Buah Segar", rating: "4.9", time: "5-10 mnt" },
  ];

  const [activeBanner, setActiveBanner] = useState(0);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false); // <-- State untuk buka History

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveBanner((prevIndex) => (prevIndex + 1) % cafes.length);
    }, 2500); 
    return () => clearInterval(interval);
  }, [cafes.length]);

  // <-- LOGIKA NAVIGASI KE HISTORY -->
  if (isHistoryOpen) {
    return <HistoryView onBack={() => setIsHistoryOpen(false)} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24 overflow-y-auto antialiased">
      
      {/* 1. BAGIAN BANNER & HEADER */}
      <div className="relative w-full h-[280px] bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 rounded-b-[2.5rem] shadow-sm overflow-hidden transition-colors duration-500">
        
        {/* Header Action */}
        <div className="absolute top-6 left-5 right-5 flex justify-between items-start z-20">
          <div className="bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-full flex items-center gap-2 text-sm font-semibold border border-white/20 shadow-sm">
            <span>📍</span>
            <span className="tracking-wide">NIP: {nip}</span>
          </div>

          {/* Kanan: Tombol History & Logout */}
          <div className="flex gap-2.5">
            
            {/* Tombol History (Telah dihubungkan ke onClick) */}
            <button 
              onClick={() => setIsHistoryOpen(true)} 
              className="w-10 h-10 bg-white text-slate-600 flex items-center justify-center rounded-full shadow-lg hover:bg-slate-50 hover:text-blue-700 active:scale-90 transition-all"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
              </svg>
            </button>

            {/* Tombol Logout */}
            <button onClick={onLogout} className="w-10 h-10 bg-white text-red-500 flex items-center justify-center rounded-full shadow-lg hover:bg-red-50 hover:text-red-600 active:scale-90 transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
              </svg>
            </button>

          </div>
        </div>

        {/* Konten Banner Animasi */}
        <div 
          key={activeBanner} 
          className="absolute inset-0 flex flex-col justify-center px-6 pt-10 text-white z-10 animate-fade-in"
        >
          <span className="text-yellow-400 text-xs font-bold tracking-widest uppercase mb-2">
            Pilihan Spesial
          </span>
          <h2 className="text-4xl font-extrabold tracking-tight leading-none mb-3 text-white drop-shadow-sm">
            {cafes[activeBanner].name}
          </h2>
          <p className="text-sm font-medium text-blue-100 flex items-center gap-3">
            <span className="flex items-center gap-1">⭐ {cafes[activeBanner].rating}</span>
            <span className="w-1 h-1 bg-blue-300 rounded-full"></span>
            <span className="flex items-center gap-1">⏱️ {cafes[activeBanner].time}</span>
          </p>
        </div>

        {/* Indikator Titik Banner */}
        <div className="absolute bottom-12 left-6 flex gap-2 z-10">
          {cafes.map((_, idx) => (
            <div 
              key={idx} 
              className={`h-1.5 rounded-full transition-all duration-500 ${
                activeBanner === idx ? "w-6 bg-yellow-400" : "w-2 bg-white/40"
              }`}
            ></div>
          ))}
        </div>
      </div>

      {/* 2. SEARCH BAR */}
      <div className="px-5 -mt-7 relative z-20">
        <div className="bg-white rounded-2xl shadow-xl shadow-blue-900/5 flex items-center px-5 py-4 gap-3 border border-slate-100">
          <span className="text-slate-400 text-lg">🔍</span>
          <input 
            type="text" 
            placeholder="Lagi mau makan apa hari ini?" 
            className="flex-1 outline-none text-sm font-semibold text-slate-700 bg-transparent placeholder-slate-400"
          />
          <div className="w-px h-6 bg-slate-200"></div>
          <span className="text-yellow-500 text-lg">🍴</span>
        </div>
      </div>

      {/* 3. QUICK ACTIONS */}
      <div className="px-5 mt-8 grid grid-cols-4 gap-4 text-center">
        {[
          { icon: "🛵", label: "Delivery", bg: "bg-blue-50/80 text-blue-600" },
          { icon: "🏃", label: "Pick Up", bg: "bg-yellow-50/80 text-yellow-600" },
          { icon: "👥", label: "Group", bg: "bg-red-50/80 text-red-600" },
          { icon: "💳", label: "Pay", bg: "bg-green-50/80 text-green-600" },
        ].map((action, idx) => (
          <div key={idx} className="flex flex-col items-center gap-2.5 cursor-pointer active:scale-95 transition-transform">
            <div className={`w-14 h-14 ${action.bg} rounded-[1.25rem] flex items-center justify-center text-2xl shadow-sm border border-slate-100/50`}>
              {action.icon}
            </div>
            <span className="text-[12px] font-bold text-slate-700 tracking-tight">{action.label}</span>
          </div>
        ))}
      </div>

      {/* 4. DAFTAR CAFE / TENANT */}
      <div className="px-5 mt-10">
        <div className="flex justify-between items-end mb-5">
          <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Rekomendasi Tenant</h2>
          <span className="text-sm font-bold text-blue-700 cursor-pointer hover:text-blue-800 transition-colors">Lihat Semua</span>
        </div>
        
        <div className="flex flex-col gap-4">
          {cafes.map((cafe) => (
            <div 
              key={cafe.id} 
              onClick={() => onSelectCafe(cafe)}
              className="bg-white p-4 rounded-2xl shadow-sm hover:shadow-md border border-slate-100 flex gap-4 active:scale-[0.98] transition-all cursor-pointer"
            >
              <div className="w-20 h-20 bg-slate-50 rounded-xl flex-shrink-0 flex items-center justify-center text-3xl border border-slate-100">
                🏪
              </div>

              <div className="flex flex-col justify-center flex-1">
                <h3 className="font-extrabold text-slate-800 text-base leading-tight tracking-tight">{cafe.name}</h3>
                <p className="text-xs font-medium text-slate-500 mt-1.5">{cafe.desc}</p>
                
                <div className="flex items-center gap-2 mt-2.5 text-[11px] font-bold text-slate-600">
                  <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                    ⭐ {cafe.rating}
                  </span>
                  <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                    ⏱️ {cafe.time}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}