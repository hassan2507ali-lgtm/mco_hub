import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient'; // <-- Import Supabase
import { ArrowLeft, ShoppingBag, Bike } from 'lucide-react';

export default function CheckoutView({ cart, cafe, nip, onBack, onConfirm }) {
  const totalItems = cart.reduce((total, item) => total + item.qty, 0);
  const subTotal = cart.reduce((total, item) => total + (item.price * item.qty), 0);
  const platformFee = 2000;
  const grandTotal = subTotal + platformFee;

  const [deliveryMethod, setDeliveryMethod] = useState(totalItems >= 10 ? 'delivery' : 'pickup');
  const [floor, setFloor] = useState('');
  const [desk, setDesk] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatRupiah = (angka) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(angka);

  useEffect(() => {
    if (totalItems < 10 && deliveryMethod === 'delivery') setDeliveryMethod('pickup');
  }, [totalItems, deliveryMethod]);

  const handleOrder = async () => {
    if (deliveryMethod === 'delivery' && (!floor || !desk)) {
      alert("Mohon isi Lantai dan Nomor Meja untuk pengantaran.");
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Generate nomor pesanan unik secara acak (Cth: ORD-4729)
      const orderNumber = `ORD-${Math.floor(1000 + Math.random() * 9000)}`;

      // 2. Simpan data utama pesanan ke tabel 'orders'
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert([
          {
            order_number: orderNumber,
            customer_nip: nip,
            cafe_id: cafe.id,
            total_price: grandTotal,
            status: 'NEW',
            delivery_method: deliveryMethod,
            floor: deliveryMethod === 'delivery' ? floor : null,
            desk: deliveryMethod === 'delivery' ? desk : null,
            notes: notes || null
          }
        ])
        .select()
        .single(); // Ambil baris data yang baru saja dimasukkan

      if (orderError) throw orderError;

      // 3. Persiapkan array item untuk dimasukkan ke tabel 'order_items'
      const itemsToInsert = cart.map(item => ({
        order_id: orderData.id,
        menu_id: item.id,
        menu_name: item.name,
        price: item.price,
        qty: item.qty
      }));

      // 4. Masukkan seluruh item ke tabel 'order_items'
      const { error: itemsError } = await supabase.from('order_items').insert(itemsToInsert);
      
      if (itemsError) throw itemsError;

      // Jika berhasil semua, lanjut ke halaman sukses
      onConfirm();
    } catch (err) {
      console.error("Gagal memproses pesanan:", err);
      alert("Terjadi kesalahan saat memproses pesanan Anda.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-32 antialiased">
      <div className="sticky top-0 z-20 bg-white border-b border-slate-200 px-5 py-4 shadow-sm flex items-center gap-4">
        <button onClick={onBack} disabled={isSubmitting} className="w-10 h-10 bg-slate-50 text-slate-800 flex items-center justify-center rounded-full hover:bg-slate-100 active:scale-90 transition-all border border-slate-200 disabled:opacity-50">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-extrabold text-slate-800 tracking-tight">Ringkasan Pesanan</h1>
      </div>

      <div className="px-5 mt-6 flex flex-col gap-6">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-sm font-extrabold text-slate-800 mb-4 uppercase tracking-widest">Opsi Pengambilan</h2>
          <div className="grid grid-cols-2 gap-3">
            <div onClick={() => !isSubmitting && setDeliveryMethod('pickup')} className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 cursor-pointer transition-all ${deliveryMethod === 'pickup' ? 'border-blue-700 bg-blue-50 text-blue-700' : 'border-slate-100 text-slate-500 hover:border-slate-300'}`}>
              <ShoppingBag className="w-6 h-6" />
              <span className="text-xs font-bold text-slate-700">Ambil Sendiri</span>
            </div>
            <div onClick={() => !isSubmitting && totalItems >= 10 && setDeliveryMethod('delivery')} className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all relative overflow-hidden ${totalItems < 10 ? 'border-slate-100 bg-slate-100 opacity-60 cursor-not-allowed text-slate-400' : deliveryMethod === 'delivery' ? 'border-blue-700 bg-blue-50 text-blue-700 cursor-pointer' : 'border-slate-100 text-slate-500 hover:border-slate-300'}`}>
              <Bike className="w-6 h-6" />
              <span className="text-xs font-bold text-slate-700">Antar ke Meja</span>
              {totalItems < 10 && <div className="absolute top-0 left-0 right-0 bg-red-500 text-white text-[9px] font-bold text-center py-0.5">Min. 10 Item</div>}
            </div>
          </div>
          {deliveryMethod === 'delivery' && (
            <div className="mt-4 flex gap-3 animate-fade-in-up">
              <div className="flex-1"><label className="text-[11px] font-bold text-slate-500 mb-1 block">Lantai</label><input type="text" placeholder="Cth: Lt. 5" value={floor} onChange={(e) => setFloor(e.target.value)} disabled={isSubmitting} className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg text-sm font-semibold outline-none focus:border-blue-700 disabled:opacity-50" /></div>
              <div className="flex-1"><label className="text-[11px] font-bold text-slate-500 mb-1 block">No. Meja</label><input type="text" placeholder="Cth: M-12" value={desk} onChange={(e) => setDesk(e.target.value)} disabled={isSubmitting} className="w-full bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg text-sm font-semibold outline-none focus:border-blue-700 disabled:opacity-50" /></div>
            </div>
          )}
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
            <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-widest">{cafe.name}</h2>
            <button onClick={onBack} disabled={isSubmitting} className="text-xs font-bold text-blue-700 disabled:opacity-50">Tambah Menu</button>
          </div>
          <div className="flex flex-col gap-4">
            {cart.map((item) => (
              <div key={item.id} className="flex justify-between items-start gap-3">
                <div className="bg-slate-100 text-slate-600 text-xs font-extrabold px-2 py-1 rounded border border-slate-200 mt-0.5">{item.qty}x</div>
                <div className="flex-1"><h3 className="font-bold text-slate-800 text-[14px] leading-tight">{item.name}</h3><span className="text-[13px] font-semibold text-slate-500">{formatRupiah(item.price * item.qty)}</span></div>
              </div>
            ))}
          </div>
          <input type="text" placeholder="Ada catatan? (Cth: Esnya dipisah ya)" value={notes} onChange={(e) => setNotes(e.target.value)} disabled={isSubmitting} className="w-full mt-5 bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-sm font-medium outline-none focus:border-blue-700 disabled:opacity-50" />
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-sm font-extrabold text-slate-800 mb-4 uppercase tracking-widest">Rincian Pembayaran</h2>
          <div className="flex flex-col gap-2.5 text-[13px] font-medium text-slate-600 mb-3 pb-3 border-b border-slate-100">
            <div className="flex justify-between"><span>Subtotal Harga</span><span className="font-bold text-slate-800">{formatRupiah(subTotal)}</span></div>
            <div className="flex justify-between"><span>Biaya Layanan MCO</span><span className="font-bold text-slate-800">{formatRupiah(platformFee)}</span></div>
          </div>
          <div className="flex justify-between items-center"><span className="text-sm font-extrabold text-slate-800">Total Pembayaran</span><span className="text-lg font-extrabold text-blue-800">{formatRupiah(grandTotal)}</span></div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-5 bg-white border-t border-slate-200 max-w-md mx-auto z-30">
        <button onClick={handleOrder} disabled={isSubmitting} className="w-full bg-blue-900 text-white font-extrabold py-3.5 rounded-xl shadow-lg shadow-blue-900/30 hover:bg-blue-800 active:scale-[0.98] transition-all flex justify-between items-center px-6 disabled:opacity-70">
          <span>{isSubmitting ? "Mengirim Pesanan..." : "Pesan Sekarang"}</span>
          <span className="bg-blue-800 px-2 py-1 rounded-lg text-xs">{formatRupiah(grandTotal)}</span>
        </button>
      </div>
    </div>
  );
}