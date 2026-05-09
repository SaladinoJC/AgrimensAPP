import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  StatusBar,
  TouchableOpacity,
  Alert,
  Text,
  Modal,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as Notifications from 'expo-notifications';
import { useStore } from './src/store/useStore';
import { initDB, upsertTramites } from './src/db/database';
import { syncArbaHeadless, cancelSync } from './src/services/HeadlessSync';
import { ArbaWebView } from './src/services/ArbaWebView';
import { Map, BellRing, User, Lock } from 'lucide-react-native';
import { DashboardScreen } from './src/components/DashboardScreen';
import { CredentialsModal } from './src/components/CredentialsModal';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LoginScreen } from './src/components/LoginScreen';
import { registerBackgroundSync } from './src/services/BackgroundSyncRegistration';
import { autenticarAccesoLocal } from './src/authLocal/authLocal';

const C_BG = "#0f1724";
const C_PRIMARY = "#00bfa5";
const C_AMBER = "#ffca28";
const C_CARD = "#1e2a42";
const C_TEXT = "#eceff1";
const C_TEXT2 = "#90a4ae";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function App() {
  const {
    isLoggedIn,
    isSyncing,
    cuit,
    cit,
    setCuit,
    setCit,
    setIsLoggedIn,
    setIsSyncing,
    setSyncAbortController,
    novedades,
    setNovedades,
  } = useStore();

  const [appReady, setAppReady] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showWebView, setShowWebView] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Inicialización (Cargar BD y verificar si hay sesión guardada)
  useEffect(() => {
    const initializeApp = async () => {
      try {
        await initDB();
        
        const savedCuit = await SecureStore.getItemAsync('cuit');
        const savedCit = await SecureStore.getItemAsync('cit');
        
        if (savedCuit && savedCit) {
          setCuit(savedCuit);
          setCit(savedCit);
          setIsLoggedIn(true);
        }
        
        try {
          await registerBackgroundSync();
        } catch (pushErr) {
          console.log("Push init error", pushErr);
        }
        
      } catch (e: any) {
        Alert.alert("Error de Inicio", "Ocurrió un problema al inicializar: " + e.toString());
      } finally {
        setAppReady(true);
      }
    };
    initializeApp();
  }, []);

  // Funciones de Sincronización
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
      setIsSyncing(false);
      Alert.alert("Error de Sincronización", error);
      return;
    }
    const novs = await upsertTramites(rows);
    if (novs.length > 0) {
      setNovedades(novs);
    } else {
      Alert.alert("Sincronización Exitosa", `Se procesaron ${rows[0].length} trámites (Sin novedades nuevas)`);
    }
    setIsSyncing(false);
  };

  // Lógica principal de Renderizado
  const renderContent = () => {
    // 1. Mostrar spinner mientras la BD y SecureStore cargan
    if (!appReady) {
      return (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={C_PRIMARY} />
        </View>
      );
    }

    // 2. Si NO hay sesión, lo mandamos directo al Login (sin pedir PIN)
    if (!isLoggedIn) {
      return (
        <LoginScreen 
          onLoginSuccess={() => {
            // Cuando loguea por primera vez, asumimos que ya es seguro dejarlo pasar
            setIsAuthenticated(true); 
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
            onPress={async () => {
              const result = await autenticarAccesoLocal();
              if (result.ok) {
                setIsAuthenticated(true);
              } else {
                Alert.alert("Acceso denegado", result.message);
              }
            }}
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
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => setShowProfileModal(true)}
          >
            <User size={24} color={C_PRIMARY} />
          </TouchableOpacity>
        </View>

        <DashboardScreen onSync={handleSync} onSyncCancel={handleSyncCancel} />

        <CredentialsModal
          visible={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          onLogout={() => {
            setShowProfileModal(false);
            // Si hace logout, reseteamos la autenticación para que vuelva a pedir PIN al próximo login si es necesario.
            setIsAuthenticated(false);
          }}
        />

        {showWebView && (
          <ArbaWebView
            cuit={cuit}
            cit={cit}
            onSyncComplete={handleSyncComplete}
          />
        )}

        <Modal visible={novedades.length > 0} transparent animationType="slide">
          <View style={styles.modalBg}>
            <View style={[styles.modalContent, { maxHeight: '80%' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <BellRing color={C_AMBER} size={24} style={{ marginRight: 8 }} />
                <Text style={styles.modalTitle}>¡Novedades!</Text>
              </View>
              <FlatList
                data={novedades}
                keyExtractor={(item) => item.nro}
                renderItem={({ item }) => (
                  <View style={styles.novedadItem}>
                    <Text style={{ color: C_TEXT, fontWeight: 'bold' }}>Trámite #{item.nro}</Text>
                    <Text style={{ color: C_TEXT2, fontSize: 12 }}>De '{item.viejo}' a '{item.nuevo}'</Text>
                  </View>
                )}
              />
              <TouchableOpacity 
                style={[styles.btnPrimary, { marginTop: 16, alignSelf: 'flex-end' }]} 
                onPress={() => setNovedades([])}
              >
                <Text style={{ color: C_BG, fontWeight: 'bold' }}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: C_CARD, borderRadius: 12, padding: 20 },
  modalTitle: { color: C_TEXT, fontSize: 18, fontWeight: 'bold' },
  btnPrimary: { backgroundColor: C_PRIMARY, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8, alignItems: 'center' },
  novedadItem: { backgroundColor: C_BG, padding: 12, borderRadius: 8, marginBottom: 8 },
});