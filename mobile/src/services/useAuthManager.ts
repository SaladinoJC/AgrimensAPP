import { useState } from 'react';
import { Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { clearDatabase } from '../db/database';
import { useStore } from '../store/useStore';
import { autenticarAccesoLocal } from '../authLocal/authLocal';

export function useAuthManager() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { logout: storeLogout } = useStore();

  // Método para destruir todo rastro del usuario en el dispositivo
  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('isLoggedIn');
      await SecureStore.deleteItemAsync('cuit');
      await SecureStore.deleteItemAsync('cit');
      await clearDatabase(); 
      
      storeLogout(); // Limpia los estados de store
      setIsAuthenticated(false);
    } catch (e) {
      console.error("Error limpiando la sesión profunda", e);
    }
  };

  // Método para el candado de huella/PIN
  const unlockApp = async () => {
    const result = await autenticarAccesoLocal();
    if (result.ok) {
      setIsAuthenticated(true);
      return true;
    } else {
      Alert.alert("Acceso denegado", result.message);
      return false;
    }
  };

  return { 
    isAuthenticated, 
    setIsAuthenticated, 
    handleLogout, 
    unlockApp 
  };
}