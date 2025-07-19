import AppNavbar from './components/Navbar';
import HomePage from './pages/HomePage';
import DetailPage from './pages/DetailPage';
import LoginPage from './pages/LoginPage';     // 1. Pastikan import ini ada
import RegisterPage from './pages/RegisterPage'; // 2. Pastikan import ini ada
import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import DashboardPage from './pages/DashboardPage';
import ProtectedRoute from './components/ProtectedRoute';
import BooklistPage from './pages/BooklistPage'; // Impor halaman baru

function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCategory, setSearchCategory] = useState('Semua');

  return (
   <div>
      {/* 2. Kirim state dan fungsi baru ke Navbar */}
      <AppNavbar 
        searchQuery={searchQuery} 
        setSearchQuery={setSearchQuery}
        searchCategory={searchCategory}
        setSearchCategory={setSearchCategory}
      />

      <main className="container py-4">
        <Routes>
          {/* Rute yang sudah ada */}
         <Route 
            path="/" 
            element={<HomePage searchQuery={searchQuery} searchCategory={searchCategory} />} 
          />
          <Route path="/buku/:id" element={<DetailPage />} />
           <Route path="/booklist" element={<BooklistPage />} />
          
          {/* 3. Tambahkan rute yang hilang di sini */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

           {/* Rute Terlindungi */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </main>
    </div>
  )
}

export default App;
