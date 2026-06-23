import { useState } from 'react';
import LoginView from './components/LoginView';
import HomeView from './components/HomeView';
import MenuView from './components/MenuView';
import CashierView from './components/CashierView';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [nip, setNip] = useState('');
  const [userRole, setUserRole] = useState('customer'); // 'customer' atau 'cashier'
  const [selectedCafe, setSelectedCafe] = useState(null);

  const handleLogin = (inputNip) => {
    setNip(inputNip);
    setIsLoggedIn(true);
    
    // Cek jika yang login adalah kasir
    if (inputNip.toUpperCase() === 'KASIR') {
      setUserRole('cashier');
    } else {
      setUserRole('customer');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setNip('');
    setUserRole('customer');
    setSelectedCafe(null);
  };

  // 1. Jika belum login (Bungkus ukuran HP)
  if (!isLoggedIn) {
    return (
      <div className="max-w-md mx-auto min-h-screen shadow-2xl relative overflow-x-hidden border-x border-slate-200">
        <LoginView onLogin={handleLogin} />
      </div>
    );
  }

  // 2. Jika yang login KASIR (Biarkan Full Screen karena butuh layar lebar)
  if (userRole === 'cashier') {
    return <CashierView onLogout={handleLogout} />;
  }

  // 3. Customer Views (Bungkus ukuran HP agar rapi di tengah monitor)
  return (
    <div className="max-w-md mx-auto min-h-screen shadow-2xl relative overflow-x-hidden border-x border-slate-200 bg-white">
      {selectedCafe ? (
        <MenuView cafe={selectedCafe} onBack={() => setSelectedCafe(null)} />
      ) : (
        <HomeView nip={nip} onLogout={handleLogout} onSelectCafe={setSelectedCafe} />
      )}
    </div>
  );
}