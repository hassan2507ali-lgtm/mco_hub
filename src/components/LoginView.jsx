import { useState } from 'react';
import { supabase } from '../supabaseClient';

export default function LoginView({ onLogin }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [nip, setNip] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pin, setPin] = useState(''); // <-- State untuk PIN
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' }); 

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    // Validasi dasar
    if (nip.trim() === '') {
      setMessage({ type: 'error', text: 'NIP tidak boleh kosong.' });
      return;
    }
    
    // Validasi PIN (harus diisi dan hanya angka)
    if (pin.trim() === '') {
      setMessage({ type: 'error', text: 'PIN tidak boleh kosong.' });
      return;
    }
    if (!/^\d+$/.test(pin)) {
      setMessage({ type: 'error', text: 'PIN hanya boleh berisi angka.' });
      return;
    }

    setIsLoading(true);

    try {
      if (isRegistering) {
        // --- LOGIKA REGISTRASI ---
        if (name.trim() === '') {
          setMessage({ type: 'error', text: 'Nama Lengkap wajib diisi.' });
          setIsLoading(false);
          return;
        }
        if (email.trim() === '') {
          setMessage({ type: 'error', text: 'Email wajib diisi.' });
          setIsLoading(false);
          return;
        }
        if (pin.length < 4) {
          setMessage({ type: 'error', text: 'PIN minimal 4 digit angka.' });
          setIsLoading(false);
          return;
        }

        const { data: existingUser } = await supabase
          .from('customers')
          .select('nip')
          .eq('nip', nip)
          .single();

        if (existingUser) {
          setMessage({ type: 'error', text: 'NIP ini sudah terdaftar. Silakan Masuk.' });
        } else {
          // Insert ke tabel 'customers' menggunakan kolom 'pin'
          const { error } = await supabase
            .from('customers')
            .insert([{ nip: nip, name: name, email: email, pin: pin }]);

          if (error) throw error;

          setMessage({ type: 'success', text: 'Registrasi berhasil! Silakan masuk dengan NIP dan PIN Anda.' });
          setIsRegistering(false); 
          setName('');
          setEmail('');
          setPin(''); // Kosongkan PIN setelah regis
        }

      } else {
        // --- LOGIKA LOGIN ---
        
        // 1. Cek Customer
        const { data: isCustomer } = await supabase
          .from('customers')
          .select('nip')
          .eq('nip', nip)
          .eq('pin', pin) // <-- Cocokkan PIN
          .single();

        // 2. Cek Kasir di database berstandar Production
        const { data: isCashier } = await supabase
          .from('cafes')
          .select('kasir_nip, kasir_pin') // <-- Tarik juga data kasir_pin
          .eq('kasir_nip', nip.toUpperCase())
          .single();

        if (isCustomer) {
          onLogin(nip); // Login Pelanggan sukses
        } else if (isCashier && isCashier.kasir_pin === pin) { 
          onLogin(nip); // Login Kasir sukses (mencocokkan PIN dari database)
        } else {
          setMessage({ type: 'error', text: 'NIP atau PIN salah. Silakan coba lagi.' });
        }
      }
    } catch (err) {
        console.error("SUPABASE ERROR:", err);
        // Kode ini akan memunculkan error asli Supabase ke layar merahmu
        setMessage({ type: 'error', text: 'Detail Error: ' + (err.message || err.details || JSON.stringify(err)) }); 
      } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 font-sans relative">
      
      {message.text && (
        <div className={`absolute top-10 left-4 right-4 max-w-md mx-auto p-4 rounded-xl shadow-md text-sm font-bold animate-fade-in ${
          message.type === 'error' ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-green-100 text-green-700 border border-green-200'
        }`}>
          {message.text}
        </div>
      )}

      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8 transition-all">
        
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold text-blue-900 tracking-tight transition-all">
            {isRegistering ? 'Daftar Akun.' : 'MCO Hub.'}
          </h1>
          <p className="text-sm text-gray-500 mt-2 font-medium">
            {isRegistering 
              ? 'Lengkapi data Anda untuk mulai memesan' 
              : 'Masuk dengan NIP dan PIN Anda'}
          </p>
        </div>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          
          {isRegistering && (
            <>
              <div className="flex flex-col gap-2 text-left animate-fade-in">
                <label htmlFor="name" className="text-sm font-semibold text-gray-700">Nama Lengkap</label>
                <input 
                  id="name" type="text" placeholder="Masukkan Nama Anda" 
                  value={name} onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-800 focus:ring-2 focus:ring-blue-100 focus:outline-none text-gray-800 transition-all"
                />
              </div>

              <div className="flex flex-col gap-2 text-left animate-fade-in">
                <label htmlFor="email" className="text-sm font-semibold text-gray-700">Alamat Email</label>
                <input 
                  id="email" type="email" placeholder="contoh@email.com" 
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-800 focus:ring-2 focus:ring-blue-100 focus:outline-none text-gray-800 transition-all"
                />
              </div>
            </>
          )}

          <div className="flex flex-col gap-2 text-left">
            <label htmlFor="nip" className="text-sm font-semibold text-gray-700">Nomor Induk Pegawai (NIP)</label>
            <input 
              id="nip" type="text" placeholder="Masukkan NIP" 
              value={nip} onChange={(e) => setNip(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-800 focus:ring-2 focus:ring-blue-100 focus:outline-none text-gray-800 transition-all"
            />
          </div>

          <div className="flex flex-col gap-2 text-left">
            <label htmlFor="pin" className="text-sm font-semibold text-gray-700">PIN (Angka)</label>
            <input 
              id="pin" 
              type="password" 
              inputMode="numeric" 
              pattern="[0-9]*"
              maxLength="6"
              placeholder="Masukkan 4-6 digit PIN" 
              value={pin} 
              onChange={(e) => setPin(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-800 focus:ring-2 focus:ring-blue-100 focus:outline-none text-gray-800 transition-all"
            />
          </div>

          <button 
            type="submit" disabled={isLoading}
            className={`w-full text-blue-900 font-bold py-3.5 rounded-xl transition-all mt-2 shadow-sm ${
              isLoading ? 'bg-yellow-200 cursor-not-allowed' : 'bg-yellow-400 hover:bg-yellow-500 active:scale-95'
            }`}
          >
            {isLoading ? 'Memproses...' : (isRegistering ? 'Buat Akun Sekarang' : 'Masuk ke Sistem')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 font-medium">
            {isRegistering ? 'Sudah punya akun? ' : 'Belum punya akun? '}
            <button 
              onClick={() => {
                setIsRegistering(!isRegistering);
                setMessage({ type: '', text: '' }); 
              }} 
              className="text-blue-700 font-bold hover:underline focus:outline-none"
            >
              {isRegistering ? 'Masuk di sini' : 'Daftar sekarang'}
            </button>
          </p>
        </div>

      </div>
    </div>
  );
}