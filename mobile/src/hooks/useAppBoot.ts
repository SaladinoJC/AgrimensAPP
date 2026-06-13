import { useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { useColorScheme } from "react-native";
import { initDB } from '@/db/database';
import { useStore } from '@/store/useStore';
import AsyncStorage from '@react-native-async-storage/async-storage/lib/typescript/AsyncStorage';

export function useAppBoot() {
  const [appReady, setAppReady] = useState(false);

  const setCredenciales = useStore((state) => state.setCredenciales);
  const setIsLoggedIn = useStore((state) => state.setIsLoggedIn);
  const setTheme = useStore((state) => state.setTheme);

  const systemTheme = useColorScheme();

  useEffect(() => {
    async function bootApp() {
      try {
        // 1. Inicializar la base de datos local
        await initDB();

        // 2. Recuperar sesión
        const savedCuit = await SecureStore.getItemAsync("cuit");
        const savedCit = await SecureStore.getItemAsync("cit");

        if (savedCuit && savedCit) {
          setCredenciales({ cuit: savedCuit, cit: savedCit });
          setIsLoggedIn(true);
        }

        const savedTheme = await AsyncStorage.getItem('app_theme');
        if (savedTheme === "dark" || savedTheme === "light") {
          setTheme(savedTheme);
        } else {
          const initialTheme = systemTheme === "dark" ? "dark" : "light";
          setTheme(initialTheme);
          await AsyncStorage.setItem('app_theme', initialTheme);
        }
      } catch (e) {
        console.error("Error crítico inicializando la app:", e);
      } finally {
        setAppReady(true);
      }
    }

    bootApp();
  }, [setCredenciales, setIsLoggedIn, setTheme, systemTheme]); 

  return { appReady };
}