// app/services/location.ts
import { ENV, getApiEndpoint } from '../config/env';

export interface LocationData {
  device_id: string;
  latitude: number;
  longitude: number;
  date: string;
  time: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Konum servisi - Konum bilgilerini API'ye gönderir
 */
export const LocationService = {
  /**
   * Konum verilerini API'ye gönderir
   * @param locationData Konum bilgisi
   * @returns API yanıtı
   */
  sendLocation: async (locationData: LocationData): Promise<ApiResponse<any>> => {
    const url = getApiEndpoint('SEND_LOCATION');
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), ENV.API.TIMEOUT);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(locationData),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.error || `HTTP error! Status: ${response.status}`
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('İstek zaman aşımına uğradı');
      }
      
      if (ENV.APP.DEBUG) {
        console.error(`Konum gönderme sırasında hata (${url}):`, error);
      }
      
      throw error;
    }
  },
};