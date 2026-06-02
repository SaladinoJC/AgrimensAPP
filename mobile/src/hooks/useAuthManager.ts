import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { clearDatabase , clearNotificaciones} from '@/db/database';
import { useStore } from '@/store/useStore';
import { autenticarAccesoLocal } from '@/auth/authLocal';
// import CookieManager from '@react-native-cookies/cookies';

export function useAuthManager() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const storeLogout = useStore((state) => state.logout);

  // Método para destruir todo rastro del usuario en el dispositivo
  const handleLogout = useCallback(async () => {
    try {
      // Aseguramos que el motor web de Android olvide el SSO de ARBA
      // await CookieManager.clearAll();

      await AsyncStorage.removeItem("isLoggedIn");
      await SecureStore.deleteItemAsync("cuit");
      await SecureStore.deleteItemAsync("cit");
      await clearDatabase();
      await clearNotificaciones();
      storeLogout();
      setIsAuthenticated(false);
    } catch (e) {
      console.error("Error limpiando la sesión profunda", e);
    }
  }, [storeLogout]);

  // Método para el candado de huella/PIN
  const unlockApp = useCallback(async () => {
    const result = await autenticarAccesoLocal();
    if (result.ok) {
      setIsAuthenticated(true);
      return true;
    } else {
      Alert.alert("Acceso denegado", result.message);
      return false;
    }
  }, []);

  return { 
    isAuthenticated, 
    setIsAuthenticated, 
    handleLogout, 
    unlockApp 
  };
}