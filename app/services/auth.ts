// app/services/auth.ts
import { ApiClient } from './api-client';

export interface LoginCredentials {
  user_name: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  token?: string;
  message?: string;
}

/**
 * Yetkilendirme işlemleri için servis
 */
export const AuthService = {
  /**
   * Kullanıcı girişi
   * @param credentials Kullanıcı adı ve şifre
   * @returns API yanıtı
   */
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    try {
      // API isteği gönder (ApiClient token eklemez çünkü henüz token yok)
      return await ApiClient.post<LoginResponse>('LOGIN', credentials);
    } catch (error) {
      console.error('Login isteği sırasında hata:', error);
      throw error;
    }
  },

  /**
   * Demo kullanıcı kontrolü (gerçek API mevcut değilse)
   * @param credentials Kullanıcı adı ve şifre
   * @returns Başarılı ise true, değilse false
   */
  checkDemoCredentials: (credentials: LoginCredentials): boolean => {
    return credentials.user_name === 'demo' && credentials.password === 'demo123';
  }
};