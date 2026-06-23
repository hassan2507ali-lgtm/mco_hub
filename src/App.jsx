import { useState } from 'react';
import LoginView from './components/LoginView';
import HomeView from './components/HomeView';
import MenuView from './components/MenuView'; // Import komponen baru

export default function App() {
  const [userNip, setUserNip] = useState(null);
  const [selectedCafe, setSelectedCafe] = useState(null); 

  const handleLogout = () => {
    setUserNip(null);
    setSelectedCafe(null);
  };

  return (
    <div className="font-sans text-gray-800 bg-gray-100 min-h-screen max-w-md mx-auto relative shadow-2xl overflow-hidden">
      
      {!userNip ? (
        <LoginView onLogin={(nip) => setUserNip(nip)} />
      ) : !selectedCafe ? (
        <HomeView 
          nip={userNip} 
          onLogout={handleLogout} 
          onSelectCafe={(cafe) => setSelectedCafe(cafe)} 
        />
      ) : (
        // Panggil MenuView di sini, kirimkan data cafe yang dipilih dan fungsi tombol back
        <MenuView 
          cafe={selectedCafe} 
          onBack={() => setSelectedCafe(null)} 
        />
      )}
      
    </div>
  );
}