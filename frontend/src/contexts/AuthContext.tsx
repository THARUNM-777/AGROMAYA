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

  const isOfflineOrStaticServer = (err: any) => {
    const status = err?.response?.status;
    return status === 405 || status === 404 || status === 502 || status === 503 || !err?.response;
  };

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
    } catch (err: any) {
      if (isOfflineOrStaticServer(err)) {
        console.warn('Backend server offline or static hosting (HTTP 405/404). Falling back to client-side session.');
        let determinedRole: UserRole = 'FARMER';
        let name = 'Registered Stakeholder';
        const em = email.toLowerCase();
        if (em.includes('company') || em.includes('agromaya')) {
          determinedRole = 'BIOCHAR_COMPANY';
          name = 'AgroMaya Biochar Industries';
        } else if (em.includes('panchayat') || em.includes('apmc')) {
          determinedRole = 'GRAM_PANCHAYAT';
          name = 'Harihara Gram Panchayat Hub';
        } else if (em.includes('supplier') || em.includes('input')) {
          determinedRole = 'SUPPLIER';
          name = 'Kaveri Bio-Inputs Hub';
        } else {
          const saved = localStorage.getItem('agromaya_user');
          if (saved) {
            try {
              const parsed = JSON.parse(saved);
              setUser(parsed);
              return parsed;
            } catch (_e) {}
          }
        }

        const fallbackUser: User = {
          id: `usr_${Date.now()}`,
          name: name,
          email: email,
          role: determinedRole,
          farmerProfile: determinedRole === 'FARMER' ? ({
            id: 'farmer_demo',
            fullName: 'Basavaraj Hiremath',
            phone: '9845123456',
            surveyNumber: 'SY-104/2',
            totalLandAcres: 5.0,
            village: { name: 'Harihara Rural' },
            panchayat: { name: 'Harihara Gram Panchayat' },
            wallet: { balanceCredits: 2200, totalEarnedCredits: 4200, totalRedeemedCredits: 2000 },
          } as any) : undefined,
          companyProfile: determinedRole === 'BIOCHAR_COMPANY' ? ({
            id: 'company_demo',
            companyName: 'AgroMaya Biochar Industries',
            district: 'Davangere',
            capacityTonnes: 120,
          } as any) : undefined,
          supplierProfile: determinedRole === 'SUPPLIER' ? ({
            id: 'supplier_demo',
            supplierName: 'Kaveri Bio-Inputs Hub',
            district: 'Davangere',
            gstin: 'GSTIN29AAACA1234Z5',
          } as any) : undefined,
        };

        const fallbackToken = `agromaya_token_${Date.now()}`;
        setUser(fallbackUser);
        setToken(fallbackToken);
        localStorage.setItem('agromaya_token', fallbackToken);
        localStorage.setItem('agromaya_user', JSON.stringify(fallbackUser));
        return fallbackUser;
      }
      throw err;
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
    } catch (err: any) {
      if (isOfflineOrStaticServer(err)) {
        console.warn('Backend server offline or static hosting (HTTP 405/404). Falling back to client-side session.');
        const fallbackUser: User = {
          id: `usr_${Date.now()}`,
          name: regData.name || 'Registered Stakeholder',
          email: regData.email || `${regData.phone || '9019789795'}@agromaya.local`,
          role: regData.role,
          farmerProfile: regData.role === 'FARMER' ? ({
            id: `farmer_${Date.now()}`,
            fullName: regData.name || 'Registered Farmer',
            phone: regData.phone || '9019789795',
            surveyNumber: regData.surveyNumber || 'SY-45/1',
            totalLandAcres: regData.totalLandAcres || 3.0,
            village: { name: 'Davanagere Rural' },
            panchayat: { name: 'Davangere Taluk Panchayat' },
            wallet: { balanceCredits: 1250, totalEarnedCredits: 1250, totalRedeemedCredits: 0 },
          } as any) : undefined,
          companyProfile: regData.role === 'BIOCHAR_COMPANY' ? ({
            id: `company_${Date.now()}`,
            companyName: regData.companyName || regData.name || 'AgroMaya Biochar Industries',
            district: regData.district || 'Davangere',
            capacityTonnes: regData.capacityTonnes || 50,
          } as any) : undefined,
          supplierProfile: regData.role === 'SUPPLIER' ? ({
            id: `supplier_${Date.now()}`,
            supplierName: regData.supplierName || regData.name || 'Kaveri Agri-Inputs Hub',
            district: regData.district || 'Davangere',
            gstin: regData.gstin || 'GSTIN29AAACA1234Z5',
          } as any) : undefined,
        };

        const fallbackToken = `agromaya_token_${Date.now()}`;
        setUser(fallbackUser);
        setToken(fallbackToken);
        localStorage.setItem('agromaya_token', fallbackToken);
        localStorage.setItem('agromaya_user', JSON.stringify(fallbackUser));
        return fallbackUser;
      }
      throw err;
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
        return;
      }
    } catch (err: any) {
      if (isOfflineOrStaticServer(err)) {
        console.warn('Backend server offline or static hosting (HTTP 405/404). Falling back to client-side session.');
        const DEMO_USERS: Record<string, User> = {
          BIOCHAR_COMPANY: {
            id: 'usr-company',
            name: 'AgroMaya Biochar Industries',
            email: 'procurement@agromaya.com',
            role: 'BIOCHAR_COMPANY',
            companyProfile: {
              id: 'comp-1',
              companyName: 'AgroMaya Biochar Industries',
              district: 'Davangere',
              capacityTonnes: 120,
            } as any,
          },
          GRAM_PANCHAYAT: {
            id: 'usr-panchayat',
            name: 'Harihara Gram Panchayat Hub',
            email: 'harihara.panchayat@agromaya.gov.in',
            role: 'GRAM_PANCHAYAT',
          },
          FARMER: {
            id: 'usr-farmer',
            name: 'Basavaraj Hiremath',
            email: 'farmer@agromaya.com',
            role: 'FARMER',
            farmerProfile: {
              id: 'farmer-1',
              fullName: 'Basavaraj Hiremath',
              phone: '9845123456',
              surveyNumber: 'SY-104/2',
              totalLandAcres: 5.0,
              village: { name: 'Harihara Rural' },
              panchayat: { name: 'Harihara Gram Panchayat' },
              wallet: { balanceCredits: 2200, totalEarnedCredits: 4200, totalRedeemedCredits: 2000 },
            } as any,
          },
          SUPPLIER: {
            id: 'usr-supplier',
            name: 'Kaveri Bio-Inputs Hub',
            email: 'orders@kaveribioinputs.com',
            role: 'SUPPLIER',
            supplierProfile: {
              id: 'supp-1',
              supplierName: 'Kaveri Bio-Inputs Hub',
              district: 'Davangere',
              gstin: 'GSTIN29AAACA1234Z5',
            } as any,
          },
        };
        const u = DEMO_USERS[targetRole];
        const tok = `agromaya_token_${targetRole.toLowerCase()}`;
        setUser(u);
        setToken(tok);
        localStorage.setItem('agromaya_token', tok);
        localStorage.setItem('agromaya_user', JSON.stringify(u));
        return;
      }
      throw err;
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
