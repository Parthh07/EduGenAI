"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const storedToken = localStorage.getItem('edugen_jwt');
    const storedUsername = localStorage.getItem('edugen_username');
    const storedEmail = localStorage.getItem('edugen_email');
    if (storedToken && storedUsername) {
      setUser({ token: storedToken, username: storedUsername, email: storedEmail || '' });
    }
    setLoading(false);
  }, []);

  const login = (data) => {
    localStorage.setItem('edugen_jwt', data.access_token);
    localStorage.setItem('edugen_username', data.username);
    localStorage.setItem('edugen_email', data.email || '');
    setUser({ token: data.access_token, username: data.username, email: data.email || '' });
  };

  const logout = () => {
    localStorage.removeItem('edugen_jwt');
    localStorage.removeItem('edugen_username');
    localStorage.removeItem('edugen_email');
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
