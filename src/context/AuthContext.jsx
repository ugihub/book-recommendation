import { createContext, useState, useContext, useEffect } from 'react';

// Konteks tetap diekspor sebagai named export
export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // --- State yang sudah ada ---
  const [user, setUser] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', variant: 'success' });

  // 1. STATE UNTUK BOOKLIST
  // Menyimpan daftar ID buku yang difavoritkan
  const [booklist, setBooklist] = useState([]);

  // --- useEffect yang sudah ada (tidak perlu diubah) ---
  // (Jika ada, biarkan saja)

  // 2. useEffect untuk MEMUAT Booklist dari localStorage saat aplikasi pertama kali dibuka
  useEffect(() => {
    try {
      const storedBooklist = localStorage.getItem('booklist');
      if (storedBooklist) {
        setBooklist(JSON.parse(storedBooklist));
      }
    } catch (error) {
      console.error("Gagal memuat booklist dari localStorage", error);
    }
  }, []); // Array dependensi kosong berarti hanya berjalan sekali

  // 3. useEffect untuk MENYIMPAN Booklist ke localStorage setiap kali ada perubahan
  useEffect(() => {
    try {
      localStorage.setItem('booklist', JSON.stringify(booklist));
    } catch (error) {
      console.error("Gagal menyimpan booklist ke localStorage", error);
    }
  }, [booklist]); // Berjalan setiap kali state 'booklist' berubah

  // --- Fungsi yang sudah ada ---
  const login = (userData) => {
    setUser({ name: userData.name, email: userData.email });
  };

  const logout = () => {
    setUser(null);
  };

  const showToast = (message, variant = 'success') => {
    setToast({ show: true, message, variant });
    setTimeout(() => {
      setToast({ show: false, message: '', variant: 'success' });
    }, 3000);
  };

  // 4. FUNGSI UNTUK MENAMBAH/MENGHAPUS DARI BOOKLIST
  const toggleBooklist = (bookId) => {
    setBooklist(prevBooklist => {
      const isBookInList = prevBooklist.includes(bookId);
      if (isBookInList) {
        // Jika buku sudah ada di daftar, hapus
        showToast('Dihapus dari Booklist', 'danger');
        return prevBooklist.filter(id => id !== bookId);
      } else {
        // Jika buku belum ada, tambahkan
        showToast('Ditambahkan ke Booklist', 'success');
        return [...prevBooklist, bookId];
      }
    });
  };
  
  // 5. TAMBAHKAN 'booklist' dan 'toggleBooklist' KE DALAM VALUE
  const value = { user, login, logout, toast, showToast, booklist, toggleBooklist };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export default AuthContext;