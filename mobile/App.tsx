import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  StatusBar,
  TouchableOpacity,
  Alert,
  Text,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Map, BellRing, User, Lock } from 'lucide-react-native';

import { useStore } from './src/store/useStore';
import { upsertTramites } from './src/db/database';
import { DashboardScreen } from './src/components/DashboardScreen';
import { CredentialsModal } from './src/components/CredentialsModal';
import { LoginScreen } from './src/components/LoginScreen';
import { LoadingTramitesSpinner } from './src/components/ui/LoadingTramitesSpinner';

import { useAppBoot } from './src/services/useAppBoot';
import { useAuthManager } from './src/services/useAuthManager';
import { useSincronizador } from './src/sync/useSincronizador';

const C_BG = "#0f1724";
const C_PRIMARY = "#00bfa5";
const C_AMBER = "#ffca28";
const C_CARD = "#1e2a42";
const C_TEXT = "#eceff1";
const C_TEXT2 = "#90a4ae";

export default function App() {
  const {
    isLoggedIn,
    isSyncing,
    cuit,
    cit,
    setIsSyncing,
    novedades,
    setNovedades,
    setRefreshKey,
  } = useStore();
  const [showProfileModal, setShowProfileModal] = useState(false);

  const { appReady } = useAppBoot();
  const { isAuthenticated, setIsAuthenticated, handleLogout, unlockApp } = useAuthManager();
  const { sync, cancelSync, SincronizadorComponent } = useSincronizador();

  // Lógica puente de Sincronización
  const handleSync = async () => {
    if (isSyncing || !cuit || !cit) return;
    setIsSyncing(true);
    
    const result = await sync({ cuit, cit });
    
    if (!result.ok) {
      if (result.error?.message.includes("Credenciales") || result.error?.message.includes("sesión expirada")) {
        Alert.alert("Sesión Expirada", result.error.message, [{ text: "Aceptar", onPress: () => {
          setShowProfileModal(false);
          handleLogout();
        }}]);
      } else {
        Alert.alert("Error de Sincronización", result.error.message);
      }
      setIsSyncing(false);
      return;
    }
    
    try {
      const novs = await upsertTramites(result.rows);
      setRefreshKey(); // Forzar recarga de lista en Dashboard
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
    finally{
      setIsSyncing(false);
    }
  };

  // Lógica principal de Renderizado
  const renderContent = () => {
    // 1. Mostrar spinner mientras la BD y SecureStore cargan
    if (!appReady) return <LoadingTramitesSpinner />

    // 2. Si NO hay sesión, lo mandamos directo al Login (sin pedir PIN)
    if (!isLoggedIn) {
      return (
        <LoginScreen 
          onLoginSuccess={() => {
            // Cuando loguea por primera vez, asumimos que ya es seguro dejarlo pasar
            setIsAuthenticated(true);
            handleSync(); // Iniciar sincronización apenas loguea por primera vez 
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
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => setShowProfileModal(true)}
          >
            <User size={24} color={C_PRIMARY} />
          </TouchableOpacity>
        </View>

        <DashboardScreen onSync={handleSync} onSyncCancel={cancelSync} />

        <CredentialsModal
          visible={showProfileModal}
          onClose={() => setShowProfileModal(false)}
        />

        {SincronizadorComponent}

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