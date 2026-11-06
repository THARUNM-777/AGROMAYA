import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { authApi } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (email: string, pass: string) => Promise<User>;
  register: (data: any) => Promise<User>;
  demoLogin: (role: 'BIOCHAR_COMPANY' | 'GRAM_PANCHAYAT' | 'FARMER' | 'SUPPLIER') => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('agromaya_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('agromaya_token'));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token && !user) {
      authApi
        .getCurrentUser()
        .then((res) => {
          if (res.success && res.user) {
            setUser(res.user);
            localStorage.setItem('agromaya_user', JSON.stringify(res.user));
          }
        })
        .catch(() => {
          logout();
        });
    }
  }, [token]);

  const login = async (email: string, pass: string): Promise<User> => {
    setLoading(true);
    try {
      const data = await authApi.login(email, pass);
      if (data.success) {
        setUser(data.user);
        setToken(data.token);
        localStorage.setItem('agromaya_token', data.token);
        localStorage.setItem('agromaya_user', JSON.stringify(data.user));
        return data.user;
      }
      throw new Error('Login failed');
    } finally {
      setLoading(false);
    }
  };

  const register = async (regData: any): Promise<User> => {
    setLoading(true);
    try {
      const data = await authApi.register(regData);
      if (data.success) {
        setUser(data.user);
        setToken(data.token);
        localStorage.setItem('agromaya_token', data.token);
        localStorage.setItem('agromaya_user', JSON.stringify(data.user));
        return data.user;
      }
      throw new Error(data.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const demoLogin = async (targetRole: 'BIOCHAR_COMPANY' | 'GRAM_PANCHAYAT' | 'FARMER' | 'SUPPLIER') => {
    setLoading(true);
    try {
      const data = await authApi.demoLogin(targetRole);
      if (data.success) {
        setUser(data.user);
        setToken(data.token);
        localStorage.setItem('agromaya_token', data.token);
        localStorage.setItem('agromaya_user', JSON.stringify(data.user));
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('agromaya_token');
    localStorage.removeItem('agromaya_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role: user?.role || null,
        isAuthenticated: !!user && !!token,
        loading,
        login,
        register,
        demoLogin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
