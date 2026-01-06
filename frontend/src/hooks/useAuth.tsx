'use client';

import { createContext, useContext, useEffect, useState } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (token: string, userId: string, userName: string, avatar: string | null, profileId?: string) => void;
  logout: () => void;
  updateUser: (name: string, avatar: string | null) => void;
  loading: boolean;
  userName: string | null;
  userAvatar: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    const storedName = localStorage.getItem('userName');
    const storedAvatar = localStorage.getItem('userAvatar');
    if (token) {
      setIsAuthenticated(true);
      if (storedName) setUserName(storedName);
      if (storedAvatar) setUserAvatar(storedAvatar);
    }
    setLoading(false);
  }, []);

  const login = (token: string, userId: string, name: string, avatar: string | null, profileId?: string) => {
    localStorage.setItem('accessToken', token);
    localStorage.setItem('userId', userId);
    localStorage.setItem('userName', name);
    if (avatar) {
      localStorage.setItem('userAvatar', avatar);
      setUserAvatar(avatar);
    } else {
      localStorage.removeItem('userAvatar');
      setUserAvatar(null);
    }
    
    if (profileId) {
        localStorage.setItem('profileId', profileId);
    } else {
        localStorage.removeItem('profileId');
    }
    setUserName(name);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('profileId');
    localStorage.removeItem('userName');
    localStorage.removeItem('userAvatar');
    setUserName(null);
    setUserAvatar(null);
    setIsAuthenticated(false);
    window.location.href = '/login';
  };

  const updateUser = (name: string, avatar: string | null) => {
    localStorage.setItem('userName', name);
    if (avatar) {
      localStorage.setItem('userAvatar', avatar);
      setUserAvatar(avatar);
    } else {
      localStorage.removeItem('userAvatar');
      setUserAvatar(null);
    }
    setUserName(name);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, updateUser, loading, userName, userAvatar }}>
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
