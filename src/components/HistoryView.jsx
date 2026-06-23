export default function HistoryView({ onBack }) {
    // Data dummy riwayat belanja
    const history = [
      { id: "MCO-2026-8829", cafe: "MCO Signature Coffee", date: "23 Jun 2026", status: "Selesai", total: 36000 },
      { id: "MCO-2026-8810", cafe: "Mie Mercon Juara", date: "21 Jun 2026", status: "Dibatalkan", total: 45000 },
    ];
  
    const formatRupiah = (a) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(a);
  
    return (
      <div className="min-h-screen bg-slate-50 font-sans pb-10 antialiased">
        {/* Header */}
        <div className="sticky top-0 z-20 bg-white border-b border-slate-200 px-5 py-4 flex items-center gap-4">
          <button onClick={onBack} className="w-10 h-10 bg-slate-50 flex items-center justify-center rounded-full border border-slate-200 hover:bg-slate-100 active:scale-90 transition-all">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>
          </button>
          <h1 className="text-lg font-extrabold text-slate-800 tracking-tight">Riwayat Pesanan</h1>
        </div>
  
        {/* Daftar Riwayat */}
        <div className="px-5 mt-6 flex flex-col gap-4">
          {history.map((item) => (
            <div key={item.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{item.id}</p>
                  <h3 className="font-extrabold text-slate-800">{item.cafe}</h3>
                </div>
                <span className={`text-[10px] font-extrabold px-2 py-1 rounded-full ${
                  item.status === 'Selesai' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {item.status}
                </span>
              </div>
              
              <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-500">{item.date}</span>
                <span className="font-extrabold text-blue-900">{formatRupiah(item.total)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }