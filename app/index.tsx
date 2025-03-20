import React, { useState, useEffect } from 'react';
import { Text, View, TouchableOpacity, ActivityIndicator, Alert, Platform, ScrollView } from 'react-native';
import * as Location from 'expo-location';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LocationService, LocationData } from './services/location';
import { ENV } from './config/env';

// AsyncStorage anahtarları
const DEVICE_ID_STORAGE_KEY = '@app_device_id';
const LOGIN_STATUS_KEY = '@app_login_status';
const LOGIN_DATA_KEY = '@app_login_data';
const LOGOUT_DATA_KEY = '@app_logout_data';

export default function Index() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [locationPermission, setLocationPermission] = useState(false);
  const [deviceId, setDeviceId] = useState<string>('unknown_device');
  const [loginData, setLoginData] = useState<LocationData | null>(null);
  const [logoutData, setLogoutData] = useState<LocationData | null>(null);

  useEffect(() => {
    // Başlangıç durumlarını yükle
    (async () => {
      // Konum izni iste
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status === 'granted');
      
      try {
        // AsyncStorage'dan device ID'yi yükle
        const storedDeviceId = await AsyncStorage.getItem(DEVICE_ID_STORAGE_KEY);
        
        if (storedDeviceId) {
          // Kayıtlı ID varsa kullan
          setDeviceId(storedDeviceId);
        } else {
          // Kayıtlı ID yoksa yeni bir ID oluştur ve kaydet
          const newDeviceId = generateDeviceId();
          await AsyncStorage.setItem(DEVICE_ID_STORAGE_KEY, newDeviceId);
          setDeviceId(newDeviceId);
        }
        
        // Giriş durumunu yükle
        const loginStatusStr = await AsyncStorage.getItem(LOGIN_STATUS_KEY);
        const isLogged = loginStatusStr === 'true';
        setIsLoggedIn(isLogged);
        
        // Giriş verilerini yükle
        const loginDataStr = await AsyncStorage.getItem(LOGIN_DATA_KEY);
        if (loginDataStr) {
          const parsedLoginData = JSON.parse(loginDataStr) as LocationData;
          setLoginData(parsedLoginData);
        }
        
        // Çıkış verilerini yükle
        const logoutDataStr = await AsyncStorage.getItem(LOGOUT_DATA_KEY);
        if (logoutDataStr) {
          const parsedLogoutData = JSON.parse(logoutDataStr) as LocationData;
          setLogoutData(parsedLogoutData);
        }
      } catch (error) {
        console.warn('Başlangıç verilerini yükleme hatası:', error);
        // Hata durumunda, en azından benzersiz bir device ID oluştur
        setDeviceId(generateDeviceId());
      }
    })();
  }, []);

  // Benzersiz bir cihaz ID'si oluşturan yardımcı fonksiyon
  const generateDeviceId = (): string => {
    // Cihaz bilgilerini al
    const brand = Device.brand || 'unknown';
    const modelName = Device.modelName || 'device';
    const osVersion = Device.osVersion || '';
    
    // Device type için enum değerini string'e çevirme
    let deviceTypeStr = 'unknown';
    switch (Device.deviceType) {
      case Device.DeviceType.PHONE:
        deviceTypeStr = 'phone';
        break;
      case Device.DeviceType.TABLET:
        deviceTypeStr = 'tablet';
        break;
      case Device.DeviceType.DESKTOP:
        deviceTypeStr = 'desktop';
        break;
      case Device.DeviceType.TV:
        deviceTypeStr = 'tv';
        break;
      case Device.DeviceType.UNKNOWN:
      default:
        deviceTypeStr = 'unknown';
        break;
    }
    
    // Cihaz imzası oluştur
    const deviceSignature = `${brand}_${modelName}_${osVersion}_${deviceTypeStr}`.replace(/\s+/g, '_');
    
    // Benzersizliği garantilemek için timestamp ve rastgele bir değer ekle
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 8);
    
    return `${deviceSignature}_${timestamp}${randomPart}`;
  };

  const handleLoginLogout = async () => {
    setIsLoading(true);
    
    try {
      if (!isLoggedIn) {
        // GİRİŞ İŞLEMİ
        
        // Konum izni kontrolü
        if (!locationPermission) {
          Alert.alert(
            'İzin Gerekli',
            'Giriş yapmak için konum izni gereklidir.',
            [
              { text: 'İptal', style: 'cancel' },
              { 
                text: 'İzin Ver', 
                onPress: async () => {
                  const { status } = await Location.requestForegroundPermissionsAsync();
                  setLocationPermission(status === 'granted');
                  if (status === 'granted') {
                    handleLoginLogout(); // İzin verildiyse tekrar dene
                  }
                } 
              }
            ]
          );
          setIsLoading(false);
          return;
        }

        // Mevcut konum alınıyor
        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        
        // Şu anki tarih ve saat
        const now = new Date();
        const date = now.toISOString().split('T')[0]; // YYYY-MM-DD formatında
        const time = now.toTimeString().split(' ')[0]; // HH:MM:SS formatında
        
        // Giriş verisi oluşturuluyor
        const newLoginData: LocationData = {
          device_id: deviceId,
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
          date,
          time
        };
        
        // API'ye giriş verisi gönderiliyor
        const response = await LocationService.sendLocation(newLoginData);
        
        if (response.success) {
          // Başarılı giriş
          setLoginData(newLoginData);
          setIsLoggedIn(true);
          
          // Giriş durumunu ve verilerini AsyncStorage'a kaydet
          await AsyncStorage.setItem(LOGIN_STATUS_KEY, 'true');
          await AsyncStorage.setItem(LOGIN_DATA_KEY, JSON.stringify(newLoginData));
          
          Alert.alert('Başarılı', 'Giriş yapıldı.');
        } else {
          // API hata mesajı
          throw new Error(response.error || 'Giriş işlemi başarısız oldu');
        }
      } else {
        // ÇIKIŞ İŞLEMİ
        
        // Güncel konumu alıp tekrar gönderelim
        try {
          // Mevcut konum alınıyor
          const currentLocation = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });
          
          // Şu anki tarih ve saat
          const now = new Date();
          const date = now.toISOString().split('T')[0]; // YYYY-MM-DD formatında
          const time = now.toTimeString().split(' ')[0]; // HH:MM:SS formatında
          
          // Çıkış verisi oluşturuluyor (device_id aynı kalır)
          const newLogoutData: LocationData = {
            device_id: deviceId,
            latitude: currentLocation.coords.latitude,
            longitude: currentLocation.coords.longitude,
            date,
            time
          };
          
          // API'ye çıkış verisi gönderiliyor
          const response = await LocationService.sendLocation(newLogoutData);
          
          if (response.success) {
            // Çıkış verisini state'e kaydet
            setLogoutData(newLogoutData);
            
            // Çıkış verisini AsyncStorage'a kaydet (çıkış sonrası da görüntülenebilmesi için)
            await AsyncStorage.setItem(LOGOUT_DATA_KEY, JSON.stringify(newLogoutData));
            
            // Giriş durumunu sıfırla
            setIsLoggedIn(false);
            
            // AsyncStorage'daki giriş durumunu güncelle
            await AsyncStorage.setItem(LOGIN_STATUS_KEY, 'false');
            
            Alert.alert('Başarılı', 'Çıkış yapıldı.');
          } else {
            throw new Error(response.error || 'Çıkış işlemi başarısız oldu');
          }
        } catch (locationError) {
          console.error('Konum alınırken hata oluştu:', locationError);
          
          // Konum alınamazsa ve eski login verisi varsa, onu gönder
          if (loginData) {
            const response = await LocationService.sendLocation(loginData);
            
            if (response.success) {
              // Çıkış için tekrar kullanılan login verisi
              setLogoutData(loginData);
              await AsyncStorage.setItem(LOGOUT_DATA_KEY, JSON.stringify(loginData));
              
              // Giriş durumunu sıfırla
              setIsLoggedIn(false);
              await AsyncStorage.setItem(LOGIN_STATUS_KEY, 'false');
              
              Alert.alert('Başarılı', 'Çıkış yapıldı, ancak güncel konum alınamadı.');
            } else {
              throw new Error(response.error || 'Çıkış işlemi başarısız oldu');
            }
          } else {
            throw new Error('Konum bilgisi alınamadı ve kayıtlı konum verisi yok.');
          }
        }
      }
    } catch (error) {
      if (ENV.APP.DEBUG) {
        console.error('İşlem sırasında hata oluştu:', error);
      }
      
      Alert.alert(
        'Hata',
        `İşlem sırasında bir hata oluştu: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-gray-100">
      <View className="items-center justify-center flex-1 p-5">
        <Text className="mb-2 text-gray-600">Cihaz ID: {deviceId}</Text>
        
        <TouchableOpacity 
          className={`
            py-3 px-6 rounded-lg min-w-[200px] h-12 items-center justify-center
            ${isLoggedIn ? 'bg-red-500' : 'bg-green-500'}
            ${isLoading ? 'opacity-70' : 'opacity-100'}
          `}
          onPress={handleLoginLogout}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text className="text-base font-bold text-white">
              {isLoggedIn ? 'Çıkış Yap' : 'Giriş Yap'}
            </Text>
          )}
        </TouchableOpacity>
        
        {/* Giriş ve Çıkış verilerini gösterme */}
        <View className="w-full mt-8">
          {loginData && (
            <View className="w-full p-5 mb-6 bg-white rounded-lg shadow">
              <Text className="mb-4 text-lg font-bold text-gray-800">Giriş Bilgileri:</Text>
              <Text className="mb-2 text-base text-gray-700">Device ID: {loginData.device_id}</Text>
              <Text className="mb-2 text-base text-gray-700">Latitude: {loginData.latitude}</Text>
              <Text className="mb-2 text-base text-gray-700">Longitude: {loginData.longitude}</Text>
              <Text className="mb-2 text-base text-gray-700">Tarih: {loginData.date}</Text>
              <Text className="mb-2 text-base text-gray-700">Saat: {loginData.time}</Text>
            </View>
          )}
          
          {logoutData && (
            <View className="w-full p-5 bg-white rounded-lg shadow">
              <Text className="mb-4 text-lg font-bold text-gray-800">Çıkış Bilgileri:</Text>
              <Text className="mb-2 text-base text-gray-700">Device ID: {logoutData.device_id}</Text>
              <Text className="mb-2 text-base text-gray-700">Latitude: {logoutData.latitude}</Text>
              <Text className="mb-2 text-base text-gray-700">Longitude: {logoutData.longitude}</Text>
              <Text className="mb-2 text-base text-gray-700">Tarih: {logoutData.date}</Text>
              <Text className="mb-2 text-base text-gray-700">Saat: {logoutData.time}</Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}