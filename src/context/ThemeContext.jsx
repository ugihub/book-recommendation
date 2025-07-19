// src/context/ThemeContext.jsx
import { createContext, useState, useContext, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  // Ambil tema dari localStorage atau default ke 'dark'
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

  // Setiap kali tema berubah, ubah class di body dan simpan ke localStorage
  useEffect(() => {
    document.body.className = ''; // Hapus class lama
    document.body.classList.add(`${theme}-theme`);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Fungsi untuk mengganti tema
  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const value = { theme, toggleTheme };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

// Custom hook untuk mempermudah penggunaan
export const useTheme = () => {
  return useContext(ThemeContext);
};