import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  StatusBar,
  TouchableOpacity,
  Alert,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Map, User, Lock, BellRing } from 'lucide-react-native';
import * as SplashScreen from 'expo-splash-screen';

import { useStore } from './src/store/useStore';
import { upsertTramites } from './src/db/database';
import { DashboardScreen } from './src/components/DashboardScreen';
import { CredentialsModal } from './src/components/CredentialsModal';
import { LoginScreen } from './src/components/LoginScreen';
import { LoadingTramitesSpinner } from './src/components/ui/LoadingTramitesSpinner';

import { useAppBoot } from './src/services/useAppBoot';
import { useAuthManager } from './src/services/useAuthManager';
import { useSincronizador } from './src/sync/useSincronizador';
import { NovedadesModal } from './src/components/ui/NovedadesModal';
import { NotificacionesScreen } from './src/components/Notificaciones';

const C_BG = "#0f1724";
const C_PRIMARY = "#00bfa5";
const C_TEXT = "#eceff1";

export default function App() {
  const {
    isLoggedIn,
    setIsSyncing,
    novedades,
    setNovedades,
    setRefreshKey,
  } = useStore();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showNotificaciones, setShowNotificaciones] = useState(false);

  const { appReady } = useAppBoot();
  const { isAuthenticated, setIsAuthenticated, handleLogout, unlockApp } = useAuthManager();
  const { sync, cancelSync, SincronizadorComponent } = useSincronizador();

  SplashScreen.preventAutoHideAsync();

  // Lógica puente de Sincronización
  const handleSync = async () => {
    const freshState = useStore.getState();

    if (freshState.isSyncing || !freshState.cuit || !freshState.cit) return;
    setIsSyncing(true);

    const result = await sync({ cuit: freshState.cuit, cit: freshState.cit });

    if (!result.ok) {
      if (result.error?.message.includes("Credenciales") || result.error?.message.includes("sesión expirada")) {
        Alert.alert("Sesión Expirada", result.error.message, [{
          text: "Aceptar", onPress: () => {
            setShowProfileModal(false);
            handleLogout();
          }
        }]);
      } else {
        Alert.alert("Error de Sincronización", result.error.message);
      }
      setIsSyncing(false);
      return;
    }

    try {
      const novs = await upsertTramites(result.rows);
      if (novs.length > 0) {
        setNovedades(novs);
      } else {
        Alert.alert(
          "Sincronización Exitosa",
          `Se procesaron ${result.rows.length} trámites.\nNo hay cambios de estado recientes.`
        );
      }
    } catch (dbError) {
      Alert.alert("Error guardando datos", "Hubo un problema con la base de datos local.");
    }
    finally {
      setIsSyncing(false);
      setRefreshKey(); // Forzar recarga de lista en Dashboard
    }
  };

  const handleCancelSync = () => {
    cancelSync();
    setIsSyncing(false);
  }

  // Lógica principal de Renderizado
  const renderContent = () => {
    // 1. Mostrar spinner mientras la BD y SecureStore cargan
    if (!appReady) SplashScreen.hideAsync();

    // 2. Si NO hay sesión, lo mandamos directo al Login (sin pedir PIN)
    if (!isLoggedIn) {
      return (
        <LoginScreen
          onLoginSuccess={() => {
            // Cuando loguea por primera vez, asumimos que ya es seguro dejarlo pasar
            setIsAuthenticated(true);
            handleSync();
          }}
        />
      );
    }

    // 3. Si SÍ hay sesión, pero aún no se ha autenticado con PIN/Huella
    if (!isAuthenticated) {
      return (
        <View style={[styles.loadingBg, { padding: 20 }]}>
          <Lock color={C_PRIMARY} size={64} style={{ marginBottom: 20 }} />
          <Text style={{ color: C_TEXT, fontSize: 24, fontWeight: 'bold', marginBottom: 40 }}>AgrimensAPP</Text>
          <TouchableOpacity
            style={styles.btnPrimary}
            activeOpacity={0.8}
            onPress={unlockApp}
          >
            <Text style={{ color: C_BG, fontWeight: 'bold', fontSize: 16 }}>Desbloquear Aplicación</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // 4. Si hay sesión y ya se autenticó (El usuario está adentro)
    return (
      <>
        <View style={styles.appBar}>
          <View style={styles.appBarLeft}>
            <Map color={C_PRIMARY} size={24} />
            <Text style={styles.appBarTitle}>AgrimensAPP</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <TouchableOpacity onPress={() => setShowNotificaciones(true)}>
              <BellRing size={24} color={C_PRIMARY} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.profileButton}
              onPress={() => setShowProfileModal(true)}
            >
              <User size={24} color={C_PRIMARY} />
            </TouchableOpacity>
          </View>
        </View>

        <DashboardScreen onSync={handleSync} onSyncCancel={handleCancelSync} />

        <CredentialsModal
          visible={showProfileModal}
          onClose={() => setShowProfileModal(false)}
        />

        {SincronizadorComponent}

        <NovedadesModal
          novedades={novedades}
          onClose={() => setNovedades([])}
          onOpenNotificaciones={() => {
            setNovedades([]);
            setShowNotificaciones(true);
          }}
        />

        <NotificacionesScreen
          visible={showNotificaciones}
          onClose={() => setShowNotificaciones(false)}
        />
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
  container: { flex: 1, backgroundColor: C_BG },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C_BG },
  loadingBg: { flex: 1, backgroundColor: C_BG, justifyContent: 'center', alignItems: 'center' },
  appBar: { flexDirection: 'row', justifyContent: 'space-between', padding: 16, backgroundColor: C_BG, alignItems: 'center', borderBottomColor: '#182136', borderBottomWidth: 1 },
  appBarLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  appBarTitle: { color: C_TEXT, fontSize: 18, fontWeight: 'bold', marginLeft: 8 },
  profileButton: { padding: 8 },
  btnPrimary: { backgroundColor: C_PRIMARY, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8, alignItems: 'center' },
});