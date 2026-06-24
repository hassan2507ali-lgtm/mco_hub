import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient'; 
import HistoryView from './HistoryView';
import { 
  MapPin, History, LogOut, Search, Utensils, 
  Bike, ShoppingBag, Users, CreditCard, Store, Star, Clock, Gift, X
} from 'lucide-react';

export default function HomeView({ nip, onLogout, onSelectCafe }) {
  const [cafes, setCafes] = useState([]);
  const [vouchers, setVouchers] = useState([]); 
  const [isLoading, setIsLoading] = useState(true);
  const [activeBanner, setActiveBanner] = useState(0);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [userPoints, setUserPoints] = useState(0); 
  
  // State baru untuk mengontrol pop-up/modal Semua Reward
  const [isRewardModalOpen, setIsRewardModalOpen] = useState(false);

  useEffect(() => {
    const fetchCafes = async () => {
      const { data, error } = await supabase.from('cafes').select('*').order('id', { ascending: true });
      if (data) setCafes(data);
      setIsLoading(false);
    };
    fetchCafes();
  }, []);

  useEffect(() => {
    const fetchVouchers = async () => {
      const { data } = await supabase
        .from('menus')
        .select('*')
        .eq('is_voucher', true);
      if (data) setVouchers(data);
    };

    fetchVouchers();

    const channel = supabase
      .channel('public:menus')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'menus' }, () => {
        fetchVouchers();
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  useEffect(() => {
    const fetchPoints = async () => {
      const { data } = await supabase
        .from('orders')
        .select('id')
        .eq('customer_nip', nip)
        .eq('status', 'COMPLETED');
      
      if (data) {
        setUserPoints((data.length * 2) + 10);
      } else {
        setUserPoints(10); 
      }
    };
    if (nip) fetchPoints();
  }, [nip]);

  useEffect(() => {
    if (cafes.length === 0) return;
    const interval = setInterval(() => {
      setActiveBanner((prevIndex) => (prevIndex + 1) % cafes.length);
    }, 2500); 
    return () => clearInterval(interval);
  }, [cafes.length]);

  const handleClaimReward = (voucher) => {
    if (userPoints < voucher.point_cost) return;

    const targetCafe = cafes.find(c => c.id === voucher.cafe_id);
    
    if (targetCafe) {
      onSelectCafe({
        ...targetCafe,
        redeemItem: {
          ...voucher,     
          price: 0,       
          isRedeem: true, 
          qty: 1
        }
      });
    } else {
      alert("Kafe penyedia voucher ini sedang tidak tersedia.");
    }
  };

  if (isHistoryOpen) {
    return <HistoryView onBack={() => setIsHistoryOpen(false)} customerNip={nip} />;
  }

  const quickActions = [
    { icon: <Bike className="w-6 h-6" />, label: "Delivery", bg: "bg-blue-50/80 text-blue-600" },
    { icon: <ShoppingBag className="w-6 h-6" />, label: "Pick Up", bg: "bg-yellow-50/80 text-yellow-600" },
    { icon: <Users className="w-6 h-6" />, label: "Group", bg: "bg-red-50/80 text-red-600" },
    { icon: <CreditCard className="w-6 h-6" />, label: "Pay", bg: "bg-green-50/80 text-green-600" },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center pb-24">
        <p className="text-slate-500 font-bold animate-pulse">Memuat daftar tenant...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24 overflow-y-auto antialiased relative">
      
      {/* 1. BAGIAN BANNER & HEADER */}
      <div className="relative w-full h-[280px] bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 rounded-b-[2.5rem] shadow-sm overflow-hidden transition-colors duration-500">
        
        <div className="absolute top-6 left-5 right-5 flex justify-between items-start z-20">
          <div className="bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-full flex items-center gap-2 text-sm font-semibold border border-white/20 shadow-sm">
            <span className="tracking-wide">NIP: {nip}</span>
          </div>
          <div className="flex gap-2.5">
            <button onClick={() => setIsHistoryOpen(true)} className="w-10 h-10 bg-white text-slate-600 flex items-center justify-center rounded-full shadow-lg hover:bg-slate-50 hover:text-blue-700 active:scale-90 transition-all">
              <History className="w-5 h-5" />
            </button>
            <button onClick={onLogout} className="w-10 h-10 bg-white text-red-500 flex items-center justify-center rounded-full shadow-lg hover:bg-red-50 hover:text-red-600 active:scale-90 transition-all">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        {cafes.length > 0 && (
          <div key={activeBanner} className="absolute inset-0 flex flex-col justify-center px-6 pt-10 text-white z-10 animate-fade-in">
            <span className="text-yellow-400 text-xs font-bold tracking-widest uppercase mb-2">Pilihan Spesial</span>
            <h2 className="text-4xl font-extrabold tracking-tight leading-none mb-3 text-white drop-shadow-sm">
              {cafes[activeBanner].name}
            </h2>
            <p className="text-sm font-medium text-blue-100 flex items-center gap-3">
              <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" /> {cafes[activeBanner].rating}</span>
              <span className="w-1 h-1 bg-blue-300 rounded-full"></span>
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {cafes[activeBanner].time_est}</span>
            </p>
          </div>
        )}

        <div className="absolute bottom-12 left-6 flex gap-2 z-10">
          {cafes.map((_, idx) => (
            <div key={idx} className={`h-1.5 rounded-full transition-all duration-500 ${activeBanner === idx ? "w-6 bg-yellow-400" : "w-2 bg-white/40"}`}></div>
          ))}
        </div>
      </div>

      {/* 2. SEARCH BAR */}
      <div className="px-5 -mt-7 relative z-20">
        <div className="bg-white rounded-2xl shadow-xl shadow-blue-900/5 flex items-center px-5 py-4 gap-3 border border-slate-100">
          <Search className="w-5 h-5 text-slate-400" />
          <input type="text" placeholder="Lagi mau makan apa hari ini?" className="flex-1 outline-none text-sm font-semibold text-slate-700 bg-transparent placeholder-slate-400" />
          <div className="w-px h-6 bg-slate-200"></div>
          <Utensils className="w-5 h-5 text-yellow-500" />
        </div>
      </div>

      {/* 3. MCO LOYALTY REWARDS */}
      <div className="px-5 mt-6">
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-4 text-white shadow-md shadow-orange-500/10">
          <div className="flex justify-between items-center mb-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-orange-100">MCO Loyalty Points</p>
              <h3 className="text-2xl font-black mt-0.5">{userPoints} POIN</h3>
            </div>
            {/* Tombol All Rewards */}
            <button 
              onClick={() => setIsRewardModalOpen(true)}
              className="bg-white/20 hover:bg-white/30 active:scale-95 px-3 py-1.5 rounded-xl text-[10px] font-bold backdrop-blur-sm border border-white/10 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Gift className="w-3 h-3" /> All Rewards
            </button>
          </div>
          
          <div className="flex gap-3 overflow-x-auto pb-1 snap-x [&::-webkit-scrollbar]:hidden">
            {vouchers.length === 0 ? (
              <div className="bg-white/20 w-full rounded-xl p-3 text-center text-xs font-bold text-orange-100 backdrop-blur-sm border border-white/10">
                Belum ada voucher yang aktif saat ini.
              </div>
            ) : (
              vouchers.slice(0, 3).map((voucher) => ( // Hanya tampilkan 3 maksimal di luar
                <div key={voucher.id} className="bg-white rounded-xl p-3 flex justify-between items-center text-slate-800 shadow-sm min-w-[240px] snap-center shrink-0">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-9 h-9 bg-orange-50 rounded-lg flex items-center justify-center text-orange-500 flex-shrink-0">
                      <Gift className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 pr-2">
                      <p className="font-extrabold text-xs text-slate-800 truncate" title={voucher.name}>{voucher.name}</p>
                      <p className="text-[11px] font-bold text-orange-600 mt-0.5">Tukar {voucher.point_cost} Poin</p>
                    </div>
                  </div>
                  <button 
                    disabled={userPoints < voucher.point_cost}
                    onClick={() => handleClaimReward(voucher)}
                    className={`px-3.5 py-2 rounded-lg text-xs font-black tracking-wide transition-all flex-shrink-0 ${
                      userPoints >= voucher.point_cost 
                        ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-sm active:scale-95 cursor-pointer' 
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    Claim
                  </button>
                </div>
              ))
            )}
            
            {/* Kartu ekstra "Lihat Lainnya" kalau lebih dari 3 */}
            {vouchers.length > 3 && (
               <div 
                 onClick={() => setIsRewardModalOpen(true)}
                 className="bg-orange-400/20 hover:bg-orange-400/40 border border-orange-300/30 rounded-xl p-3 flex flex-col justify-center items-center text-white shadow-sm min-w-[100px] snap-center shrink-0 cursor-pointer transition-all active:scale-95"
               >
                 <span className="text-xs font-bold text-center">Lihat<br/>Lainnya</span>
               </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. QUICK ACTIONS */}
      <div className="px-5 mt-8 grid grid-cols-4 gap-4 text-center">
        {quickActions.map((action, idx) => (
          <div key={idx} className="flex flex-col items-center gap-2.5 cursor-pointer active:scale-95 transition-transform">
            <div className={`w-14 h-14 ${action.bg} rounded-[1.25rem] flex items-center justify-center shadow-sm border border-slate-100/50`}>{action.icon}</div>
            <span className="text-[12px] font-bold text-slate-700 tracking-tight">{action.label}</span>
          </div>
        ))}
      </div>

      {/* 5. DAFTAR CAFE */}
      <div className="px-5 mt-8">
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
              <div className="w-20 h-20 rounded-xl flex-shrink-0 flex items-center justify-center border border-slate-100" style={{ backgroundColor: `${cafe.accent_color}15` }}>
                <Store className="w-8 h-8" style={{ color: cafe.accent_color }} />
              </div>

              <div className="flex flex-col justify-center flex-1">
                <h3 className="font-extrabold text-slate-800 text-base leading-tight tracking-tight">{cafe.name}</h3>
                <p className="text-xs font-medium text-slate-500 mt-1.5">{cafe.desc_text}</p>
                
                <div className="flex items-center gap-2 mt-2.5 text-[11px] font-bold text-slate-600">
                  <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                    <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" /> {cafe.rating}
                  </span>
                  <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-md border border-slate-100">
                    <Clock className="w-3 h-3 text-slate-400" /> {cafe.time_est}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* POP-UP / MODAL SEMUA REWARDS */}
      {isRewardModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[85vh]">
            
            {/* Header Modal */}
            <div className="flex justify-between items-center p-5 border-b border-slate-100">
              <div>
                <h3 className="font-extrabold text-slate-800 text-lg flex items-center gap-2">
                  <Gift className="w-5 h-5 text-orange-500" /> Semua Reward
                </h3>
                <p className="text-xs font-bold text-slate-500 mt-1">Poin kamu saat ini: <span className="text-orange-600">{userPoints} Pts</span></p>
              </div>
              <button 
                onClick={() => setIsRewardModalOpen(false)} 
                className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {/* Isi Daftar Voucher */}
            <div className="p-5 overflow-y-auto flex-1 flex flex-col gap-3 bg-slate-50">
              {vouchers.length === 0 ? (
                <div className="text-center py-10">
                  <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Gift className="w-8 h-8" />
                  </div>
                  <p className="text-sm font-bold text-slate-500">Belum ada reward yang tersedia.</p>
                </div>
              ) : (
                vouchers.map((voucher) => (
                  <div key={voucher.id} className="bg-white border border-slate-200 rounded-xl p-4 flex justify-between items-center shadow-sm">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-orange-500 flex-shrink-0">
                        <Gift className="w-6 h-6" />
                      </div>
                      <div className="min-w-0 pr-2">
                        <p className="font-extrabold text-sm text-slate-800 truncate" title={voucher.name}>{voucher.name}</p>
                        <p className="text-xs font-bold text-orange-600 mt-1">Tukar {voucher.point_cost} Poin</p>
                      </div>
                    </div>
                    <button 
                      disabled={userPoints < voucher.point_cost}
                      onClick={() => {
                        setIsRewardModalOpen(false); // Tutup modal dulu
                        handleClaimReward(voucher);  // Baru jalankan klaim
                      }}
                      className={`px-4 py-2.5 rounded-xl text-xs font-black tracking-wide transition-all flex-shrink-0 ${
                        userPoints >= voucher.point_cost 
                          ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-sm active:scale-95' 
                          : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      Claim
                    </button>
                  </div>
                ))
              )}
            </div>
            
          </div>
        </div>
      )}

    </div>
  );
}