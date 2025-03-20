// app/config/env.ts

/**
 * Ortam değişkenleri
 * Farklı ortamlar için (dev, staging, prod) farklı değerler kullanabilirsiniz
 */
export const ENV = {
    /**
     * API bağlantı bilgileri
     */
    API: {
      // Ana API URL (trailing slash olmadan)
      BASE_URL: 'http://64.226.70.37:3000',
      
  
      
      // API endpoint'leri
      ENDPOINTS: {
        SEND_LOCATION: '/save-location',
        LOGIN: '/login',
        // Diğer endpoint'leri buraya ekleyebilirsiniz
      },
      
      // API timeout süresi (ms)
      TIMEOUT: 10000,
    },
    
    /**
     * Uygulama genel ayarları
     */
    APP: {
      // Debug modu
      DEBUG: __DEV__, // Expo'da __DEV__ değişkeni kullanılabilir
    }
  };
  
  /**
   * Tam URL oluşturmak için yardımcı fonksiyon
   * @param endpoint API endpoint (başında / karakteri olmalı)
   * @returns Tam API URL'i
   */
  export const getApiUrl = (endpoint: string): string => {
    // Endpoint'in başında / olduğundan emin olun
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    
   
    
    return `${ENV.API.BASE_URL}${normalizedEndpoint}`;
  };
  
  /**
   * Önceden tanımlanmış endpoint için URL oluşturmak için yardımcı fonksiyon
   * @param endpointKey ENV.API.ENDPOINTS içindeki anahtar
   * @returns Tam API URL'i
   */
  export const getApiEndpoint = (endpointKey: keyof typeof ENV.API.ENDPOINTS): string => {
    const endpoint = ENV.API.ENDPOINTS[endpointKey];
    return getApiUrl(endpoint);
  };