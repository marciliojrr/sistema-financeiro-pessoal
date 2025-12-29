'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (token: string, userId: string, userName: string) => void;
  logout: () => void;
  loading: boolean;
  userName: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const storedName = localStorage.getItem('userName');
    if (token) {
      setIsAuthenticated(true);
      if (storedName) setUserName(storedName);
    }
    setLoading(false);
  }, []);

  const login = (token: string, userId: string, name: string, profileId?: string) => {
    localStorage.setItem('accessToken', token);
    localStorage.setItem('userId', userId);
    localStorage.setItem('userName', name);
    if (profileId) {
        localStorage.setItem('profileId', profileId);
    }
    setUserName(name);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('profileId');
    localStorage.removeItem('userName');
    setUserName(null);
    setIsAuthenticated(false);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, loading, userName }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
