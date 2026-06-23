import { useState, useEffect } from 'react';

export default function CheckoutView({ cart, cafe, onBack, onConfirm }) {
  // Hitung total item dan total harga
  const totalItems = cart.reduce((total, item) => total + item.qty, 0);
  const subTotal = cart.reduce((total, item) => total + (item.price * item.qty), 0);
  const platformFee = 2000; // Biaya aplikasi / layanan dummy
  const grandTotal = subTotal + platformFee;

  // State untuk form checkout
  // Jika total item < 10, paksa ke 'pickup'
  const [deliveryMethod, setDeliveryMethod] = useState(totalItems >= 10 ? 'delivery' : 'pickup');
  const [floor, setFloor] = useState('');
  const [desk, setDesk] = useState('');
  const [notes, setNotes] = useState('');

  // Format Rupiah
  const formatRupiah = (angka) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(angka);
  };

  // Efek penjaga keamanan: Jika user hapus barang sampai < 10, paksa balik ke pickup
  useEffect(() => {
    if (totalItems < 10 && deliveryMethod === 'delivery') {
      setDeliveryMethod('pickup');
    }
  }, [totalItems, deliveryMethod]);

  const handleOrder = () => {
    // Validasi jika milih delivery tapi alamat kosong
    if (deliveryMethod === 'delivery' && (!floor || !desk)) {
      alert("Mohon isi Lantai dan Nomor Meja untuk pengantaran.");
      return;
    }
    // Kirim data pesanan ke atas
    onConfirm({ deliveryMethod, floor, desk, notes, grandTotal });
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-32 antialiased">
      
      {/* HEADER */}
      <div className="sticky top-0 z-20 bg-white border-b border-slate-200 px-5 py-4 shadow-sm flex items-center gap-4">
        <button onClick={onBack} className="w-10 h-10 bg-slate-50 text-slate-800 flex items-center justify-center rounded-full hover:bg-slate-100 active:scale-90 transition-all border border-slate-200">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>
        </button>
        <h1 className="text-lg font-extrabold text-slate-800 tracking-tight">Ringkasan Pesanan</h1>
      </div>

      <div className="px-5 mt-6 flex flex-col gap-6">
        
        {/* 1. METODE PENGAMBILAN */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-sm font-extrabold text-slate-800 mb-4 uppercase tracking-widest">Opsi Pengambilan</h2>
          
          <div className="grid grid-cols-2 gap-3">
            {/* Opsi Pick Up */}
            <div 
              onClick={() => setDeliveryMethod('pickup')}
              className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 cursor-pointer transition-all ${
                deliveryMethod === 'pickup' ? 'border-blue-700 bg-blue-50' : 'border-slate-100 hover:border-slate-300'
              }`}
            >
              <span className="text-2xl">🏃</span>
              <span className="text-xs font-bold text-slate-700">Ambil Sendiri</span>
            </div>

            {/* Opsi Delivery (Terkunci jika item < 10) */}
            <div 
              onClick={() => totalItems >= 10 && setDeliveryMethod('delivery')}
              className={`p-3 rounded-xl border-2 flex flex-col items-center gap-2 transition-all relative overflow-hidden ${
                totalItems < 10 ? 'border-slate-100 bg-slate-100 opacity-60 cursor-not-allowed' : 
                deliveryMethod === 'delivery' ? 'border-blue-700 bg-blue-50 cursor-pointer' : 'border-slate-100 hover:border-slate-300 cursor-pointer'
              }`}
            >
              <span className="text-2xl">🛵</span>
              <span className="text-xs font-bold text-slate-700">Antar ke Meja</span>
              
              {/* Badge Peringatan */}
              {totalItems < 10 && (
                <div className="absolute top-0 left-0 right-0 bg-red-500 text-white text-[9px] font-bold text-center py-0.5">
                  Min. 10 Item
                </div>
              )}
            </div>
          </div>

          {/* Form Detail Meja (Muncul cuma kalau delivery terpilih) */}
          {deliveryMethod === 'delivery' && (
            <div className="mt-4 flex gap-3 animate-fade-in-up">
              <div className="flex-1">
                <label className="text-[11px] font-bold text-slate-500 mb-1 block">Lantai</label>
                <input type="text" placeholder="Cth: Lt. 5" value={floor} onChange={(e) => setFloor(e.target.value)} className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg text-sm font-semibold outline-none focus:border-blue-700" />
              </div>
              <div className="flex-1">
                <label className="text-[11px] font-bold text-slate-500 mb-1 block">No. Meja</label>
                <input type="text" placeholder="Cth: M-12" value={desk} onChange={(e) => setDesk(e.target.value)} className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg text-sm font-semibold outline-none focus:border-blue-700" />
              </div>
            </div>
          )}
        </div>

        {/* 2. DAFTAR PESANAN */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
            <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-widest">{cafe.name}</h2>
            <button onClick={onBack} className="text-xs font-bold text-blue-700">Tambah Menu</button>
          </div>
          
          <div className="flex flex-col gap-4">
            {cart.map((item) => (
              <div key={item.id} className="flex justify-between items-start gap-3">
                <div className="bg-slate-100 text-slate-600 text-xs font-extrabold px-2 py-1 rounded border border-slate-200 mt-0.5">
                  {item.qty}x
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-slate-800 text-[14px] leading-tight">{item.name}</h3>
                  <span className="text-[13px] font-semibold text-slate-500">{formatRupiah(item.price * item.qty)}</span>
                </div>
              </div>
            ))}
          </div>
          
          <input 
            type="text" 
            placeholder="Ada catatan? (Cth: Esnya dipisah ya)" 
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full mt-5 bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-sm font-medium outline-none focus:border-blue-700"
          />
        </div>

        {/* 3. RINCIAN PEMBAYARAN */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-sm font-extrabold text-slate-800 mb-4 uppercase tracking-widest">Rincian Pembayaran</h2>
          <div className="flex flex-col gap-2.5 text-[13px] font-medium text-slate-600 mb-3 pb-3 border-b border-slate-100">
            <div className="flex justify-between"><span>Subtotal Harga</span><span className="font-bold text-slate-800">{formatRupiah(subTotal)}</span></div>
            <div className="flex justify-between"><span>Biaya Layanan MCO</span><span className="font-bold text-slate-800">{formatRupiah(platformFee)}</span></div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-extrabold text-slate-800">Total Pembayaran</span>
            <span className="text-lg font-extrabold text-blue-800">{formatRupiah(grandTotal)}</span>
          </div>
        </div>

      </div>

      {/* FLOATING BUTTON ORDER */}
      <div className="fixed bottom-0 left-0 right-0 p-5 bg-white border-t border-slate-200 max-w-md mx-auto z-30">
        <button 
          onClick={handleOrder}
          className="w-full bg-blue-900 text-white font-extrabold py-3.5 rounded-xl shadow-lg shadow-blue-900/30 hover:bg-blue-800 active:scale-[0.98] transition-all flex justify-between items-center px-6"
        >
          <span>Pesan Sekarang</span>
          <span className="bg-blue-800 px-2 py-1 rounded-lg text-xs">{formatRupiah(grandTotal)}</span>
        </button>
      </div>

    </div>
  );
}