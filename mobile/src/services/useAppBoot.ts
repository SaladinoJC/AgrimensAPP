import { useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { initDB } from '../db/database';
import { registerBackgroundSync } from './BackgroundSyncRegistration';
import { useStore } from '../store/useStore';

export function useAppBoot() {
  const [appReady, setAppReady] = useState(false);
  const { setCuit, setCit, setIsLoggedIn } = useStore();

  useEffect(() => {
    async function bootApp() {
      try {
        // 1. Inicializar la base de datos local
        await initDB();
        
        // 2. Recuperar sesión
        const savedCuit = await SecureStore.getItemAsync('cuit');
        const savedCit = await SecureStore.getItemAsync('cit');
        
        if (savedCuit && savedCit) {
          setCuit(savedCuit);
          setCit(savedCit);
          setIsLoggedIn(true);
        }
        
        // 3. Registrar tareas en segundo plano
        try {
          await registerBackgroundSync();
        } catch (pushErr) {
          console.log("Error registrando Background Sync", pushErr);
        }
        
      } catch (e) {
        console.error("Error crítico inicializando la app:", e);
      } finally {
        setAppReady(true);
      }
    }
    
    bootApp();
  }, []);

  return { appReady };
}