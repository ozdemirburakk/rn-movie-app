// app/services/location.ts
import { ApiClient } from './api-client';

export interface LocationData {
  device_id: string;
  latitude: number;
  longitude: number;
  date: string;
  time: string;
}

interface LocationResponse {
  success: boolean;
  message?: string;
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
  sendLocation: async (locationData: LocationData): Promise<LocationResponse> => {
    try {
      // Token header olarak otomatik eklenecek
      return await ApiClient.post<LocationResponse>('SEND_LOCATION', locationData);
    } catch (error) {
      console.error('Konum gönderme sırasında hata:', error);
      throw error;
    }
  },
};