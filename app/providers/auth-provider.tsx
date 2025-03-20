import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

// AsyncStorage anahtarları
const AUTH_TOKEN_KEY = '@app_auth_token';

// Context türleri
type AuthContextType = {
  isAuthenticated: boolean;
  token: string | null;
  loading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => Promise<void>;
  getAuthToken: () => Promise<string | null>;
};

// Context oluşturma
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider bileşeni
export const AuthProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Uygulama başlatıldığında oturum durumunu kontrol et
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const storedToken = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
        if (storedToken) {
          setToken(storedToken);
          setIsAuthenticated(true);
        } else {
          setToken(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Auth check error:', error);
        setToken(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  // Token almak için yardımcı fonksiyon
  const getAuthToken = async (): Promise<string | null> => {
    try {
      // Önce mevcut state'den kontrol et
      if (token) return token;
      
      // State'de yoksa AsyncStorage'dan al
      const storedToken = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      return storedToken;
    } catch (error) {
      console.error('Get auth token error:', error);
      return null;
    }
  };

  // Oturum açma fonksiyonu
  const login = async (newToken: string) => {
    try {
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, newToken);
      setToken(newToken);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  // Oturum kapatma fonksiyonu
  const logout = async () => {
    try {
      await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
      setToken(null);
      setIsAuthenticated(false);
      router.replace('/login');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      token, 
      loading, 
      login, 
      logout,
      getAuthToken
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// Auth context hook'u
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};