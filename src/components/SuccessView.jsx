export default function SuccessView({ onBackToHome }) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-8 text-center animate-fade-in">
        {/* Ikon Sukses */}
        <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-12 h-12">
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
        </div>
  
        <h1 className="text-2xl font-extrabold text-slate-800 mb-2">Pesanan Berhasil!</h1>
        <p className="text-slate-500 text-sm font-medium mb-10 leading-relaxed">
          Terima kasih, pesanan kamu sedang disiapkan. Kamu bisa memantau status pesananmu di halaman Riwayat.
        </p>
  
        {/* Info Nomor Pesanan */}
        <div className="bg-slate-50 border border-slate-100 px-8 py-4 rounded-2xl mb-10 w-full">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">Nomor Pesanan</p>
          <span className="text-lg font-extrabold text-slate-800 tracking-tight">MCO-2026-8829</span>
        </div>
  
        <button 
          onClick={onBackToHome}
          className="w-full bg-blue-900 text-white font-extrabold py-3.5 rounded-xl shadow-lg shadow-blue-900/30 hover:bg-blue-800 transition-all"
        >
          Kembali ke Beranda
        </button>
      </div>
    );
  }