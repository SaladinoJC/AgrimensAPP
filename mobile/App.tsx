import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  StatusBar,
  TouchableOpacity,
  Alert,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as BackgroundTask from 'expo-background-task';
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
import { Map, User } from 'lucide-react-native';

const C_BG = "#0f1724";
const C_PRIMARY = "#00bfa5";
const BACKGROUND_FETCH_TASK = 'background-sync-arba';
const C_TEXT = "#eceff1";

TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  try {
    await syncArbaHeadless();
    return BackgroundTask.BackgroundTaskResult.Success;
  } catch (error) {
    return BackgroundTask.BackgroundTaskResult.Failed;
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

  // Inicializar BD al montar
  useEffect(() => {
    initDB().then(() => setDbReady(true));
  }, []);

  // Verificar sesión guardada
  useEffect(() => {
    const checkSavedSession = async () => {
      try {
        await AsyncStorage.getItem('isLoggedIn');
        // El store ya se actualizó al cargar useStore desde SecureStore
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
        await BackgroundTask.registerTaskAsync(BACKGROUND_FETCH_TASK, {
          minimumInterval: 3 * 60 * 60, // 3 horas
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

  // Función para decidir qué renderizar según el estado de la app
  const renderContent = () => {
    if (!dbReady) {
      return <View style={styles.loaderContainer} />;
    }

    if (!isLoggedIn) {
      return <LoginScreen onLoginSuccess={() => {}} />;
    }

    return (
      <>
        {/* Header con botón de perfil */}
        <View style={styles.appBar}>
          <View style={styles.appBarLeft}>
            <Map color={C_PRIMARY} size={24} />
            <Text style={styles.appBarTitle}>AgrimensAPP</Text>
          </View>

          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => setShowProfileModal(true)}
          >
            <User size={24} color={C_PRIMARY} />
          </TouchableOpacity>
        </View>

        {/* Dashboard principal */}
        <DashboardScreen onSync={handleSync} onSyncCancel={handleSyncCancel} />

        {/* Modal de perfil/credenciales */}
        <CredentialsModal
          visible={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          onLogout={() => setShowProfileModal(false)}
        />

        {/* WebView oculto para sincronización interactiva */}
        {showWebView && (
          <ArbaWebView
            cuit={cuit}
            cit={cit}
            onSyncComplete={handleSyncComplete}
          />
        )}
      </>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={C_BG} />
      {renderContent()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C_BG,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: C_BG,
    alignItems: 'center',
    borderBottomColor: '#182136',
    borderBottomWidth: 1,
  },
  appBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  appBarTitle: {
    color: C_TEXT,
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  profileButton: {
    padding: 8,
  },
});