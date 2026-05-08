import React, { useEffect, useState, useRef } from 'react';
import {
  StyleSheet,
  View,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  Alert,
} from 'react-native';
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStore } from './src/store/useStore';
import { initDB, upsertTramites } from './src/db/database';
import { syncArbaHeadless, cancelSync } from './src/services/HeadlessSync';
import { ArbaWebView } from './src/services/ArbaWebView';
import { LoginScreen } from './src/components/LoginScreen';
import { DashboardScreen } from './src/components/DashboardScreen';
import { CredentialsModal } from './src/components/CredentialsModal';
import { Map, Text, User } from 'lucide-react-native';

const C_BG = "#0f1724";
const C_PRIMARY = "#00bfa5";
const BACKGROUND_FETCH_TASK = 'background-sync-arba';
const C_SURFACE = "#182136";
const C_TEXT = "#eceff1";

TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  try {
    await syncArbaHeadless();
    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch (error) {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true, 
    shouldShowList: true,
  }),
});

export default function App() {
  const {
    isLoggedIn,
    isSyncing,
    cuit,
    cit,
    setIsSyncing,
    setSyncAbortController,
    setNovedades,
  } = useStore();

  const [dbReady, setDbReady] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showWebView, setShowWebView] = useState(false);
  const webViewSyncRef = useRef<any>(null);

  // Inicializar BD al montar
  useEffect(() => {
    initDB().then(() => setDbReady(true));
  }, []);

  // Verificar sesión guardada
  useEffect(() => {
    const checkSavedSession = async () => {
      try {
        const savedLogin = await AsyncStorage.getItem('isLoggedIn');
        // Si está guardada, el store ya se actualizó al cargar useStore desde SecureStore
        // En un caso real, aquí cargaríamos desde SecureStore
      } catch (error) {
        console.error('Error checking saved session:', error);
      }
    };

    if (dbReady) {
      checkSavedSession();
    }
  }, [dbReady]);

  // Configurar background fetch
  useEffect(() => {
    const setupBackgroundFetch = async () => {
      try {
        await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
          minimumInterval: 3 * 60 * 60, // 3 horas
          stopOnTerminate: false,
          startOnBoot: true,
        });
      } catch (error) {
        console.error('Background fetch setup error:', error);
      }
    };

    if (isLoggedIn && dbReady) {
      setupBackgroundFetch();
    }
  }, [isLoggedIn, dbReady]);

  const handleSync = async () => {
    if (isSyncing) return;

    setIsSyncing(true);
    const controller = new AbortController();
    setSyncAbortController(controller);

    try {
      setShowWebView(true);
    } catch (error) {
      Alert.alert('Error', 'No se pudo iniciar la sincronización');
      setIsSyncing(false);
      setSyncAbortController(null);
    }
  };

  const handleSyncCancel = () => {
    cancelSync();
    setSyncAbortController(null);
    setIsSyncing(false);
    setShowWebView(false);
  };

  const handleSyncComplete = async (rows: any[], error?: string) => {
    setShowWebView(false);

    if (error) {
      Alert.alert('Error en sincronización', error);
      setIsSyncing(false);
      setSyncAbortController(null);
      return;
    }

    try {
      const novedades = await upsertTramites(rows);
      setNovedades(novedades);

      if (novedades.length > 0) {
        Alert.alert(
          'Sincronización completada',
          `Se actualizaron ${novedades.length} trámite(s)`
        );
      } else {
        Alert.alert('Sincronización completada', 'No hay cambios nuevos');
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudieron guardar los trámites');
    } finally {
      setIsSyncing(false);
      setSyncAbortController(null);
    }
  };

  const handleLogout = () => {
    setShowProfileModal(false);
  };

  if (!dbReady) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={C_BG} />
        <View style={styles.loaderContainer} />
      </SafeAreaView>
    );
  }

  if (!isLoggedIn) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={C_BG} />
        <LoginScreen onLoginSuccess={() => {}} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={C_BG} />

      {/* Header con botón de perfil */}
      <View style={styles.header}>
        <View style={styles.appBarLeft}>
          <Map color={C_PRIMARY} size={24} />
          <Text style={styles.appBarTitle}>AgrimensAPP</Text>
        </View>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => setShowProfileModal(true)}
          >
            <User size={24} color={C_PRIMARY} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Dashboard principal */}
      <DashboardScreen onSync={handleSync} onSyncCancel={handleSyncCancel} />

      {/* Modal de perfil/credenciales */}
      <CredentialsModal
        visible={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onLogout={handleLogout}
      />

      {/* WebView oculto para sincronización interactiva */}
      {showWebView && (
        <ArbaWebView
          cuit={cuit}
          cit={cit}
          onSyncComplete={handleSyncComplete}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C_BG,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomColor: '#182136',
    borderBottomWidth: 1,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  profileButton: {
    padding: 8,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appBar: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, backgroundColor: C_SURFACE, alignItems: 'center' },
  appBarLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  appBarTitle: { color: C_TEXT, fontSize: 18, fontWeight: 'bold', marginLeft: 8 },
});
