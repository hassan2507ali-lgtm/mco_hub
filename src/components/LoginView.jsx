import { useState } from 'react';

export default function LoginView({ onLogin }) {
  const [nip, setNip] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    // Validasi: pastikan NIP tidak kosong sebelum masuk
    if (nip.trim() !== '') {
      onLogin(nip);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 font-sans">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        
        {/* Header / Logo */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-extrabold text-blue-900 tracking-tight">
            MCO Hub.
          </h1>
          <p className="text-sm text-gray-500 mt-2 font-medium">
            Sistem Pemesanan Internal Terintegrasi
          </p>
        </div>
        
        {/* Form Input NIP */}
        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2 text-left">
            <label htmlFor="nip" className="text-sm font-semibold text-gray-700">
              Nomor Induk Pegawai (NIP)
            </label>
            <input 
              id="nip"
              type="text" 
              placeholder="Masukkan NIP Anda" 
              value={nip}
              onChange={(e) => setNip(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-800 focus:ring-2 focus:ring-blue-100 focus:outline-none text-gray-800 transition-all"
            />
          </div>

          <button 
            type="submit"
            className="w-full bg-yellow-400 hover:bg-yellow-500 text-blue-900 font-bold py-3.5 rounded-xl transition-colors mt-2 shadow-sm"
          >
            Masuk ke Sistem
          </button>
        </form>

        {/* Footer info */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-400">
            Akses dibatasi hanya untuk pegawai yang terdaftar.
          </p>
        </div>

      </div>
    </div>
  );
}