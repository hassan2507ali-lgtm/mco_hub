import { useState } from 'react';
import LoginView from './components/LoginView';

export default function App() {
  // State ini bertugas mengingat apakah user sudah login atau belum
  const [userNip, setUserNip] = useState(null);

  return (
    <div className="font-sans text-gray-800 bg-gray-100 min-h-screen">
      {/* Logika kondisional:
        Jika userNip masih kosong (belum login), tampilkan halaman Login.
        Jika sudah diisi, tampilkan tulisan selamat datang sementara.
      */}
      {!userNip ? (
        <LoginView onLogin={(nip) => setUserNip(nip)} />
      ) : (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <h1 className="text-2xl font-bold text-blue-900 mb-2">
            Selamat datang, NIP {userNip}
          </h1>
          <p className="text-gray-500 mb-6">Dashboard Cafe belum kita buat nih!</p>
          <button 
            onClick={() => setUserNip(null)}
            className="px-6 py-2 border-2 border-blue-900 text-blue-900 font-semibold rounded-xl hover:bg-blue-50 transition-colors"
          >
            Keluar (Logout)
          </button>
        </div>
      )}
    </div>
  );
}