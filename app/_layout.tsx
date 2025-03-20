import React, { useEffect } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from './providers/auth-provider';
import './globals.css';
// Auth Koruması
const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    // Mevcut sayfa yolunu kontrol et
    const isLoginPage = segments[0] === 'login';

    if (!isAuthenticated && !isLoginPage) {
      // Kullanıcı oturum açmamış ve giriş sayfasında değilse, login'e yönlendir
      router.replace('/login');
    } else if (isAuthenticated && isLoginPage) {
      // Kullanıcı oturum açmış ve login sayfasındaysa, ana sayfaya yönlendir
      router.replace('/');
    }
  }, [isAuthenticated, loading, segments]);

  // Yükleme durumunda basit bir yükleme göstergesi gösterilebilir
  if (loading) {
    return (
      <Slot />
    );
  }

  return <>{children}</>;
};

export default function RootLayout() {
  return (
    <AuthProvider>
      <AuthGuard>
        <Slot />
      </AuthGuard>
    </AuthProvider>
  );
}