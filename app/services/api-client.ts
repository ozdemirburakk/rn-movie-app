// app/services/api-client.ts
import { ENV, getApiEndpoint } from '../config/env';
import AsyncStorage from '@react-native-async-storage/async-storage';

// AsyncStorage anahtarı
const AUTH_TOKEN_KEY = '@app_auth_token';

/**
 * API çağrıları için merkezi istemci
 */
export const ApiClient = {
  /**
   * GET isteği gönderir
   * @param endpoint Endpoint anahtarı
   * @param params URL parametreleri
   * @returns API yanıtı
   */
  get: async <T>(endpoint: keyof typeof ENV.API.ENDPOINTS, params?: Record<string, string>): Promise<T> => {
    const url = getApiEndpoint(endpoint);
    let requestUrl = url;
    
    // URL parametreleri varsa ekle
    if (params) {
      const queryString = new URLSearchParams(params).toString();
      requestUrl = `${url}?${queryString}`;
    }
    
    // Header'ları hazırla
    const headers = await createHeaders();
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), ENV.API.TIMEOUT);
      
      const response = await fetch(requestUrl, {
        method: 'GET',
        headers,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      return await handleResponse<T>(response);
    } catch (error) {
      return handleError<T>(error, requestUrl);
    }
  },
  
  /**
   * POST isteği gönderir
   * @param endpoint Endpoint anahtarı
   * @param data Gönderilecek veri
   * @returns API yanıtı
   */
  post: async <T>(endpoint: keyof typeof ENV.API.ENDPOINTS, data: any): Promise<T> => {
    const url = getApiEndpoint(endpoint);
    
    // Header'ları hazırla
    const headers = await createHeaders();
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), ENV.API.TIMEOUT);
      
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      return await handleResponse<T>(response);
    } catch (error) {
      return handleError<T>(error, url);
    }
  },
};

/**
 * API istekleri için authorization header'ını içeren header'lar oluşturur
 * @returns HTTP headers
 */
async function createHeaders(): Promise<HeadersInit> {
  const baseHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  try {
    // Token'ı AsyncStorage'dan al
    const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    
    // Token varsa ekle
    if (token) {
      return {
        ...baseHeaders,
        'Authorization': `Bearer ${token}`,
      };
    }
  } catch (error) {
    console.error('Token alınırken hata oluştu:', error);
  }
  
  return baseHeaders;
}

/**
 * API yanıtını işler
 * @param response Fetch response
 * @returns İşlenmiş veri
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage: string;
    
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || `HTTP error! Status: ${response.status}`;
    } catch (e) {
      errorMessage = `HTTP error! Status: ${response.status}`;
    }
    
    throw new Error(errorMessage);
  }
  
  return await response.json();
}

/**
 * API hatalarını işler
 * @param error Hata nesnesi
 * @param url API URL'i
 * @returns Promise.reject ile hata fırlatır
 */
function handleError<T>(error: any, url: string): Promise<T> {
  if (error instanceof Error && error.name === 'AbortError') {
    return Promise.reject(new Error('İstek zaman aşımına uğradı'));
  }
  
  if (ENV.APP.DEBUG) {
    console.error(`API isteği sırasında hata (${url}):`, error);
  }
  
  return Promise.reject(error);
}