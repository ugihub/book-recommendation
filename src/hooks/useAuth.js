// src/hooks/useAuth.js
import { useContext } from 'react';
import AuthContext from '../context/AuthContext'; // Impor context dari file sebelumnya

export const useAuth = () => {
  return useContext(AuthContext);
};