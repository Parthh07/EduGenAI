"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check JWT on extremely fast initial load
    const storedToken = localStorage.getItem('edugen_jwt');
    const storedUsername = localStorage.getItem('edugen_username');
    
    if (storedToken && storedUsername) {
      setUser({ token: storedToken, username: storedUsername });
    }
    setLoading(false);
  }, []);

  const login = (data) => {
    localStorage.setItem('edugen_jwt', data.access_token);
    localStorage.setItem('edugen_username', data.username);
    setUser({ token: data.access_token, username: data.username });
  };

  const logout = () => {
    localStorage.removeItem('edugen_jwt');
    localStorage.removeItem('edugen_username');
    setUser(null);
    router.push('/');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
