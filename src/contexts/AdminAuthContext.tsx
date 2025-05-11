import React, { createContext, useContext, useState, useEffect } from 'react';
import { Admin, verifyAdmin } from '@/integrations/supabase/admin';

interface AdminAuthContextType {
  isAdminAuthenticated: boolean;
  admin: Admin | null;
  login: (name: string, password: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(false);
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check for existing admin session
    const checkAdminSession = () => {
      const adminData = localStorage.getItem('adminData');
      if (adminData) {
        try {
          const parsedData = JSON.parse(adminData);
          setAdmin(parsedData);
          setIsAdminAuthenticated(true);
        } catch (error) {
          console.error('Error parsing admin data:', error);
          localStorage.removeItem('adminData');
        }
      }
      setLoading(false);
    };

    checkAdminSession();
  }, []);

  const login = async (name: string, password: string): Promise<boolean> => {
    try {
      const { success, admin } = await verifyAdmin(name, password);
      
      if (success && admin) {
        setAdmin(admin);
        setIsAdminAuthenticated(true);
        
        // Store admin data in localStorage
        localStorage.setItem('adminData', JSON.stringify(admin));
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    setAdmin(null);
    setIsAdminAuthenticated(false);
    localStorage.removeItem('adminData');
  };

  return (
    <AdminAuthContext.Provider value={{ isAdminAuthenticated, admin, login, logout, loading }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};