import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthService } from './services/auth';
import { useAuth } from './providers/auth-provider';
import { ENV } from './config/env';

// AsyncStorage anahtarı
const AUTH_TOKEN_KEY = '@app_auth_token';

const LoginScreen = () => {
  const { login } = useAuth();
  const [user_name, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    // Basit doğrulama
    if (!user_name.trim() || !password.trim()) {
      Alert.alert('Hata', 'Kullanıcı adı ve şifre gereklidir.');
      return;
    }

    setIsLoading(true);

    try {
      // API isteği
      const credentials = { user_name, password };
      const response = await AuthService.login(credentials);

      if (response.success) {
        // Token kontrolü ve kaydetme
        const token = response.token || 'authenticated';
        
        // AuthProvider üzerinden login işlemi
        await login(token);
        
        // Ana sayfaya yönlendir
        router.replace('/');
      } else {
        // API hata durumu
        Alert.alert('Giriş Başarısız', response.message || 'Kullanıcı adı veya şifre hatalı.');
      }
    } catch (error) {
      console.error('Login error:', error);
      
      // Demo hesap kontrolü
      if (AuthService.checkDemoCredentials({ user_name, password })) {
        await login('demo_token');
        router.replace('/');
        return;
      }
      
      Alert.alert(
        'Bağlantı Hatası', 
        'Sunucuya bağlanırken bir hata oluştu. Lütfen internet bağlantınızı kontrol edin. Demo hesap ile giriş yapabilirsiniz.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 bg-gray-50"
      >
        <View className="justify-center flex-1 p-6">
          {/* Logo ve başlık */}
          <View className="items-center mb-10">
            <View className="items-center justify-center w-20 h-20 mb-4 bg-green-500 rounded-2xl">
              <Text className="text-3xl font-bold text-white">CGB</Text>
            </View>
            <Text className="text-2xl font-bold text-gray-800">Lokasyon Takip</Text>
            <Text className="mt-1 text-base text-gray-500">Hesabınıza giriş yapın</Text>
          </View>

          {/* Giriş formu */}
          <View className="space-y-5">
            <View className="p-4 mb-5 bg-white border border-gray-100 shadow-sm rounded-xl">
              <Text className="mb-1 text-xs text-gray-400">Kullanıcı Adı</Text>
              <TextInput
                className="text-base text-gray-800 "
                value={user_name}
                onChangeText={setUsername}
                placeholder="Kullanıcı adınızı girin"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View className="p-4 bg-white border border-gray-100 shadow-sm rounded-xl">
              <Text className="mb-1 text-xs text-gray-400">Şifre</Text>
              <View className="flex-row items-center">
                <TextInput
                  className="flex-1 text-base text-gray-800"
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Şifrenizi girin"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Text className="text-gray-500">
                    {showPassword ? 'Gizle' : 'Göster'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              className={`rounded-xl py-4 mt-4 ${isLoading ? 'bg-green-400' : 'bg-green-500'}`}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-base font-bold text-center text-white">
                  Giriş Yap
                </Text>
              )}
            </TouchableOpacity>

            {/* Demo bilgisi */}
            <View className="mt-4">
              <Text className="text-sm text-center text-gray-500">
                Demo kullanıcı: demo / demo123
              </Text>
            </View>
            
            {ENV.APP.DEBUG && (
              <View className="mt-2">
                <Text className="text-xs text-center text-gray-400">
                  API URL: {ENV.API.BASE_URL}
                </Text>
              </View>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
};

export default LoginScreen;