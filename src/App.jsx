import { useState } from 'react';
import { supabase } from './supabaseClient'; // <-- Import jembatan Supabase
import LoginView from './components/LoginView';
import HomeView from './components/HomeView';
import MenuView from './components/MenuView';
import CashierView from './components/CashierView';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [nip, setNip] = useState('');
  const [userRole, setUserRole] = useState('customer'); 
  const [selectedCafe, setSelectedCafe] = useState(null);
  const [cashierCafeId, setCashierCafeId] = useState(null); // Menyimpan kasir ini pegang cafe mana
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (inputNip) => {
    if (!inputNip) return;
    setIsLoading(true);

    try {
      // 1. Tanya ke Supabase: "Adakah cafe yang punya kasir_nip ini?"
      const { data: cafe, error } = await supabase
        .from('cafes')
        .select('*')
        .eq('kasir_nip', inputNip.toUpperCase())
        .single(); // Ambil 1 data saja

      if (cafe) {
        // Jika ketemu, jadikan dia KASIR untuk cafe tersebut
        setUserRole('cashier');
        setCashierCafeId(cafe.id);
      } else {
        // Jika tidak ketemu, berarti dia PEMBELI (Customer) biasa
        setUserRole('customer');
      }

      setNip(inputNip);
      setIsLoggedIn(true);
    } catch (err) {
      console.error("Gagal login:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setNip('');
    setUserRole('customer');
    setSelectedCafe(null);
    setCashierCafeId(null);
  };

  // Tampilkan loading saat mengecek database
  if (isLoading) {
    return (
      <div className="max-w-md mx-auto min-h-screen bg-slate-50 flex items-center justify-center border-x border-slate-200">
        <p className="text-slate-500 font-bold animate-pulse">Menghubungkan ke server...</p>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="max-w-md mx-auto min-h-screen shadow-2xl relative overflow-x-hidden border-x border-slate-200">
        <LoginView onLogin={handleLogin} />
      </div>
    );
  }

  // Jika yang login punya hak akses Kasir
  if (userRole === 'cashier') {
    return <CashierView onLogout={handleLogout} cafeId={cashierCafeId} />;
  }

  // Tampilan Customer
  return (
    <div className="max-w-md mx-auto min-h-screen shadow-2xl relative overflow-x-hidden border-x border-slate-200 bg-white">
      {selectedCafe ? (
        <MenuView cafe={selectedCafe} nip={nip} onBack={() => setSelectedCafe(null)} />
      ) : (
        <HomeView nip={nip} onLogout={handleLogout} onSelectCafe={setSelectedCafe} />
      )}
    </div>
  );
}