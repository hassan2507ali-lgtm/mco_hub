import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, X, BellRing, ChefHat, PackageCheck, ClipboardList } from 'lucide-react';
import { supabase } from '../supabaseClient'; // <-- Import Supabase

export default function HistoryView({ onBack, customerNip }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activePopup, setActivePopup] = useState(null); // State untuk menyimpan pesanan yang diklik

  // Fungsi ambil data
  const fetchHistory = useCallback(async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('customer_nip', customerNip)
      .order('created_at', { ascending: false });
    
    if (data) setHistory(data);
    setLoading(false);
  }, [customerNip]);

  useEffect(() => {
    if (customerNip) {
      fetchHistory();

      // Fitur REAL-TIME: Langsung update status kalau kasir tekan tombol
      const channel = supabase
        .channel('customer-orders-updates')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
          fetchHistory();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } else {
      setLoading(false);
    }
  }, [customerNip, fetchHistory]);

  const formatRupiah = (a) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(a);

  // Fungsi penentuan Status, Warna, dan Pesan Popup
  const getStatusInfo = (status) => {
    switch (status) {
      case 'NEW':
        return { 
          label: 'Dalam Antrean', 
          color: 'bg-slate-100 text-slate-700', 
          icon: <ClipboardList className="w-10 h-10 text-slate-500 mb-3" />,
          msg: 'Pesananmu sudah masuk antrean kasir. Mohon tunggu sebentar ya!' 
        };
      case 'KITCHEN':
        return { 
          label: 'Diproses', 
          color: 'bg-amber-100 text-amber-700',
          icon: <ChefHat className="w-10 h-10 text-amber-500 mb-3" />, 
          msg: 'Makananmu sedang disiapkan dengan cinta di dapur. Harap bersabar!' 
        };
      case 'PICKUP':
        return { 
          label: 'Siap Diambil', 
          color: 'bg-blue-100 text-blue-700',
          icon: <PackageCheck className="w-10 h-10 text-blue-500 mb-3" />, 
          msg: 'Yay! Pesananmu sudah siap. Silakan tunjukkan layar ini ke kasir.' 
        };
      case 'COMPLETED':
        return { label: 'Selesai', color: 'bg-green-100 text-green-700', msg: null }; // msg null = tidak bisa diklik
      case 'CANCELLED':
        return { label: 'Dibatalkan', color: 'bg-red-100 text-red-700', msg: null };
      default:
        return { label: status, color: 'bg-slate-100 text-slate-700', msg: null };
    }
  };

  // Fungsi ketika card di klik
  const handleCardClick = (item, statusInfo) => {
    if (statusInfo.msg !== null) {
      // Jika statusnya belum selesai, munculkan popup
      setActivePopup({ ...item, info: statusInfo });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-10 antialiased relative">
      <div className="sticky top-0 z-20 bg-white border-b border-slate-200 px-5 py-4 flex items-center gap-4">
        <button onClick={onBack} className="w-10 h-10 bg-slate-50 flex items-center justify-center rounded-full border border-slate-200 hover:bg-slate-100 active:scale-90 transition-all">
          <ArrowLeft className="w-5 h-5 text-slate-800" />
        </button>
        <h1 className="text-lg font-extrabold text-slate-800 tracking-tight">Riwayat Pesanan</h1>
      </div>

      <div className="px-5 mt-6 flex flex-col gap-4">
        {loading ? (
          <p className="text-center text-slate-400 text-sm py-10 font-medium animate-pulse">Memuat riwayat...</p>
        ) : history.length === 0 ? (
          <p className="text-center text-slate-400 text-sm py-10 font-medium">Belum ada riwayat pesanan.</p>
        ) : (
          history.map((item) => {
            const statusInfo = getStatusInfo(item.status);
            const formattedDate = new Date(item.created_at).toLocaleDateString('id-ID', {
              day: 'numeric', month: 'short', year: 'numeric'
            });
            
            // Cek apakah card ini bisa diklik
            const isClickable = statusInfo.msg !== null;

            return (
              <div 
                key={item.id} 
                onClick={() => handleCardClick(item, statusInfo)}
                className={`bg-white p-5 rounded-2xl shadow-sm border border-slate-200 transition-all ${isClickable ? 'cursor-pointer active:scale-[0.98] hover:shadow-md border-blue-200' : 'opacity-80'}`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{item.order_number}</p>
                      {isClickable && (
                        <span className="flex items-center gap-1 text-[9px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-extrabold uppercase animate-pulse">
                          <BellRing className="w-3 h-3" /> Lacak
                        </span>
                      )}
                    </div>
                    <h3 className="font-extrabold text-slate-800">Cafe {item.cafe_id}</h3>
                  </div>
                  <span className={`text-[10px] font-extrabold px-2 py-1 rounded-full ${statusInfo.color}`}>
                    {statusInfo.label}
                  </span>
                </div>
                
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-100">
                  <span className="text-xs font-bold text-slate-500">{formattedDate}</span>
                  <span className="font-extrabold text-blue-900">{formatRupiah(item.total_price)}</span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* OVERLAY POPUP NOTIFIKASI STATUS */}
      {activePopup && (
        <div 
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm sm:px-5 pb-5 sm:pb-0" 
          onClick={() => setActivePopup(null)}
        >
          <div 
            className="bg-white p-6 rounded-[2rem] w-full max-w-md shadow-2xl mx-4 sm:mx-0 translate-y-0 animate-fade-in" 
            onClick={(e) => e.stopPropagation()} // Mencegah klik dalam box menutup popup
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="font-extrabold text-slate-800 text-xl tracking-tight">Status Pesanan</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{activePopup.order_number}</p>
              </div>
              <button onClick={() => setActivePopup(null)} className="w-8 h-8 bg-slate-100 flex items-center justify-center rounded-full text-slate-500 hover:bg-slate-200 active:scale-90 transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col items-center text-center px-4 py-8 bg-slate-50 border border-slate-100 rounded-3xl mb-6">
              {activePopup.info.icon}
              <h4 className={`text-lg font-extrabold mb-2 ${activePopup.info.color.split(' ')[1]}`}>
                {activePopup.info.label}
              </h4>
              <p className="text-sm font-medium text-slate-500 leading-relaxed">
                {activePopup.info.msg}
              </p>
            </div>

            <button 
              onClick={() => setActivePopup(null)} 
              className="w-full py-3.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl font-bold text-sm transition-colors active:scale-[0.98]"
            >
              Tutup & Tunggu
            </button>
          </div>
        </div>
      )}
    </div>
  );
}