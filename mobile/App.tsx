import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  StatusBar,
  TouchableOpacity,
  Alert,
  Text,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStore } from './src/store/useStore';
import { initDB, upsertTramites, getTramites, getStats } from './src/db/database';
import { syncArbaHeadless } from './src/services/HeadlessSync';
import { ArbaWebView } from './src/services/ArbaWebView';
import { Search, Map, LogIn, RefreshCcw, BellRing, ChevronLeft, ChevronRight, X, Calendar as CalendarIcon } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

const C_BG = "#0f1724";
const C_PRIMARY = "#00bfa5";
const C_ACCENT = "#4fc3f7";
const C_RED = "#ef5350";
const C_GREEN = "#66bb6a";
const C_AMBER = "#ffca28";
const C_GREY = "#78909c";
const C_TEXT = "#eceff1";
const C_TEXT2 = "#90a4ae";

const BACKGROUND_FETCH_TASK = 'background-sync-arba';


Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
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
  const [tramites, setTramites] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0 });
  const [search, setSearch] = useState("");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [partido, setPartido] = useState("");
  const [partida, setPartida] = useState("");
  const [page, setPage] = useState(0);
  const [showLogin, setShowLogin] = useState(false);
  const [tempCuit, setTempCuit] = useState("");
  const [tempCit, setTempCit] = useState("");
  const [selectedTramite, setSelectedTramite] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showDesdePicker, setShowDesdePicker] = useState(false);
  const [showHastaPicker, setShowHastaPicker] = useState(false);

  const onDesdeChange = (event: any, selectedDate?: Date) => {
    setShowDesdePicker(false);
    if (selectedDate) setDesde(selectedDate.toISOString().split('T')[0]);
  };

  const onHastaChange = (event: any, selectedDate?: Date) => {
    setShowHastaPicker(false);
    if (selectedDate) setHasta(selectedDate.toISOString().split('T')[0]);
  };

  useEffect(() => {
    const checkBiometrics = async () => {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!hasHardware || !isEnrolled) {
        // Si no tiene hardware o huella configurada, lo dejamos pasar directo
        setIsAuthenticated(true);
      }
    };
    checkBiometrics();
  }, []);

  // Verificar sesión guardada
  useEffect(() => {
    const checkSavedSession = async () => {
      try {
        await initDB();
        
        const savedCuit = await SecureStore.getItemAsync('cuit');
        const savedCit = await SecureStore.getItemAsync('cit');
        if (savedCuit && savedCit) {
          setCuit(savedCuit);
          setCit(savedCit);
        }
        
        try {
          const { status } = await Notifications.requestPermissionsAsync();
          if (status === 'granted') {
            await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
              minimumInterval: 60 * 60 * 3, // 3 hours
              stopOnTerminate: false,
              startOnBoot: true,
            });
          }
        } catch (pushErr) {
          console.log("Push init error", pushErr);
        }
      } catch (e: any) {
        Alert.alert("Error de Inicio", "Ocurrió un problema al inicializar: " + e.toString());
      } finally {
        setDbReady(true);
      }
    };
    setup();
  }, []);

  const loadData = useCallback(async () => {
    if (!dbReady) return;
    const data = await getTramites(search, desde, hasta, partido, partida, 50, page * 50);
    const st = await getStats();
    setTramites(data);
    setStats(st);
  }, [dbReady, search, desde, hasta, partido, partida, page]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSyncComplete = async (rows: any[], error?: string) => {
    if (error) {
      setIsSyncing(false);
      Alert.alert("Error de Sincronización", error);
      return;
    }
    const novs = await upsertTramites(rows);
    if (novs.length > 0) {
      setNovedades(novs);
    } else {
      Alert.alert("Sincronización Exitosa", `Se procesaron ${rows.length} trámites (Sin novedades nuevas)`);
    }
    setPage(0);
    await loadData();
    setIsSyncing(false);
  };

  const handleLogin = async () => {
    try {
      setCuit(tempCuit);
      setCit(tempCit);
      await SecureStore.setItemAsync('cuit', tempCuit);
      await SecureStore.setItemAsync('cit', tempCit);
    } catch (e) {
      console.error("Error saving creds:", e);
      Alert.alert("Aviso", "No se pudieron guardar las credenciales localmente, pero se usarán en esta sesión.");
    } finally {
      setShowLogin(false);
    }
  };

  const renderCard = ({ item }: { item: any }) => {
    const col = getColor(item.estado);
    const fgCol = col === C_RED ? "#ffffff" : C_BG;
    
    return (
      <TouchableOpacity style={[styles.card, { borderLeftColor: col }]} onPress={() => setSelectedTramite(item)}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>#{item.nroExpediente || '—'}</Text>
          <Text style={styles.cardDate}>{item.fecha_alta}</Text>
        </View>
        <Text style={styles.cardSubtitle} numberOfLines={1}>{item.tipo_tramite}</Text>
        <View style={styles.cardDetails}>
          <Text style={styles.cardDetailText}>Pdo {item.partido || '—'}</Text>
          <Text style={styles.cardDetailText}>Pda {item.partida || '—'}</Text>
        </View>
        <View style={styles.badgeContainer}>
          <View style={[styles.badge, { backgroundColor: col }]}>
            <Text style={[styles.badgeText, { color: fgCol }]}>{item.estado || '—'}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (!dbReady) return <View style={styles.loadingBg}><ActivityIndicator size="large" color={C_PRIMARY}/></View>;

  const shareTramite = async (tramite: any) => {
    const htmlContent = `
      <html>
        <body style="font-family: sans-serif; padding: 40px; color: #333;">
          <h1 style="color: #00bfa5;">AgrimensAPP - Reporte de Trámite</h1>
          <hr/>
          <h2>Expediente #${tramite.nroExpediente}</h2>
          <h3 style="color: ${getColor(tramite.estado)}">${tramite.estado}</h3>
          <p><strong>Tipo:</strong> ${tramite.tipo_tramite}</p>
          <p><strong>Partido:</strong> ${tramite.partido} | <strong>Partida:</strong> ${tramite.partida}</p>
          <p><strong>Nomenclatura:</strong> ${tramite.nomenclatura}</p>
          <p><strong>Fecha Alta:</strong> ${tramite.fecha_alta}</p>
          <p><strong>Último Movimiento:</strong> ${tramite.fecha_movimiento}</p>
          ${tramite.demora ? `<p><strong>Demora:</strong> ${tramite.demora} días</p>` : ''}
          <br/><br/>
          <p style="font-size: 12px; color: #888;">Generado automáticamente por AgrimensAPP Mobile</p>
        </body>
      </html>
    `;
    try {
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf', dialogTitle: 'Compartir Trámite' });
    } catch (e) {
      Alert.alert("Error", "No se pudo compartir el reporte.");
    }
  };

  const openLogin = () => {
    setTempCuit(cuit);
    setTempCit(cit);
    setShowLogin(true);
  };

  if (!isAuthenticated) {
    return (
      <View style={[styles.loadingBg, { padding: 20 }]}>
        <Map color={C_PRIMARY} size={64} style={{ marginBottom: 20 }} />
        <Text style={{color: C_TEXT, fontSize: 24, fontWeight: 'bold', marginBottom: 40}}>AgrimensAPP</Text>
        
        <TouchableOpacity 
          style={{ backgroundColor: C_PRIMARY, paddingVertical: 14, paddingHorizontal: 24, borderRadius: 12 }}
          onPress={async () => {
             const result = await LocalAuthentication.authenticateAsync({
               promptMessage: 'Acceso seguro a AgrimensAPP',
               fallbackLabel: 'Usar PIN'
             });
             setIsAuthenticated(result.success);
          }}
        >
          <Text style={{color: C_BG, fontWeight: 'bold', fontSize: 16}}>Tocar para desbloquear</Text>
        </TouchableOpacity>
      </View>
    );
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

      {/* Search and Filters */}
      <View style={styles.searchSection}>
        <View style={styles.searchInputContainer}>
          <Search color={C_TEXT2} size={20} style={{ marginLeft: 10 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar partida, nro..."
            placeholderTextColor={C_TEXT2}
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={() => setPage(0)}
          />
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
          <View style={{ width: '48%', position: 'relative', justifyContent: 'center' }}>
            <TextInput style={[styles.filterInput, {width: '100%', paddingRight: 35}]} placeholder="Desde (AAAA-MM-DD)" placeholderTextColor={C_TEXT2} value={desde} onChangeText={setDesde} />
            <TouchableOpacity style={{ position: 'absolute', right: 8 }} onPress={() => setShowDesdePicker(true)}>
              <CalendarIcon color={C_TEXT2} size={18} />
            </TouchableOpacity>
          </View>
          <View style={{ width: '48%', position: 'relative', justifyContent: 'center' }}>
            <TextInput style={[styles.filterInput, {width: '100%', paddingRight: 35}]} placeholder="Hasta (AAAA-MM-DD)" placeholderTextColor={C_TEXT2} value={hasta} onChangeText={setHasta} />
            <TouchableOpacity style={{ position: 'absolute', right: 8 }} onPress={() => setShowHastaPicker(true)}>
              <CalendarIcon color={C_TEXT2} size={18} />
            </TouchableOpacity>
          </View>
          <TextInput style={[styles.filterInput, {width: '48%'}]} placeholder="Partido" placeholderTextColor={C_TEXT2} value={partido} onChangeText={setPartido} />
          <TextInput style={[styles.filterInput, {width: '48%'}]} placeholder="Partida" placeholderTextColor={C_TEXT2} value={partida} onChangeText={setPartida} />
        </View>
        <TouchableOpacity style={styles.applyBtn} onPress={() => { setPage(0); loadData(); }}>
          <Text style={{color: C_BG, fontWeight: 'bold'}}>Buscar y Aplicar Filtros</Text>
        </TouchableOpacity>
        <Text style={styles.statsText}>Mostrando {tramites.length} de {stats.total} (Pág {page + 1})</Text>
      </View>

      {showDesdePicker && (
        <DateTimePicker
          value={desde ? new Date(desde + 'T12:00:00Z') : new Date()}
          mode="date"
          onChange={onDesdeChange}
        />
      )}
      {showHastaPicker && (
        <DateTimePicker
          value={hasta ? new Date(hasta + 'T12:00:00Z') : new Date()}
          mode="date"
          onChange={onHastaChange}
        />
      )}

      {/* List */}
      <FlatList
        data={tramites}
        renderItem={renderCard}
        keyExtractor={item => item.nroExpediente}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl 
            refreshing={isSyncing} 
            onRefresh={() => {
              if (!cuit || cuit.trim() === '' || !cit || cit.trim() === '') {
                Alert.alert("Atención", "Falta CUIT o Clave. Tocá el ícono superior para iniciar sesión.");
                return;
              }
              setIsSyncing(true);
            }} 
            tintColor={C_PRIMARY}
            colors={[C_PRIMARY]}
          />
        }
      />

      {/* Pagination */}
      <View style={styles.pagination}>
        <TouchableOpacity disabled={page === 0} onPress={() => setPage(p => p - 1)}>
          <ChevronLeft color={page === 0 ? C_GREY : C_PRIMARY} size={30} />
        </TouchableOpacity>
        <Text style={styles.pageText}>Página {page + 1}</Text>
        <TouchableOpacity disabled={tramites.length < 50} onPress={() => setPage(p => p + 1)}>
          <ChevronRight color={tramites.length < 50 ? C_GREY : C_PRIMARY} size={30} />
        </TouchableOpacity>
      </View>

      {/* FAB */}
      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => {
          if (!cuit || cuit.trim() === '' || !cit || cit.trim() === '') {
            Alert.alert("Atención", "Falta CUIT o Clave. Tocá el ícono superior derecho para iniciar sesión.");
            return;
          }
          setIsSyncing(true);
        }}
        disabled={isSyncing}
      >
        {isSyncing ? <ActivityIndicator color={C_BG}/> : <RefreshCcw color={C_BG} size={24} />}
      </TouchableOpacity>

      {/* Login Modal */}
      <Modal visible={showLogin} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Credenciales ARBA SIC</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="CUIT"
              placeholderTextColor={C_TEXT2}
              value={tempCuit}
              onChangeText={setTempCuit}
              keyboardType="number-pad"
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Clave CIT"
              placeholderTextColor={C_TEXT2}
              secureTextEntry
              value={tempCit}
              onChangeText={setTempCit}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setShowLogin(false)}><Text style={{ color: C_TEXT2 }}>Cancelar</Text></TouchableOpacity>
              <TouchableOpacity style={styles.btnPrimary} onPress={handleLogin}>
                <Text style={{ color: C_BG, fontWeight: 'bold' }}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Detalle Modal */}
      <Modal visible={!!selectedTramite} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalContent}>
            {selectedTramite && (
              <>
                <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                  <Text style={[styles.modalTitle, {color: C_ACCENT}]}>Detalle del Trámite</Text>
                  <TouchableOpacity onPress={() => setSelectedTramite(null)}><X color={C_TEXT2}/></TouchableOpacity>
                </View>
                <Text style={styles.detailText}><Text style={styles.bold}>Trámite:</Text> #{selectedTramite.nroExpediente} | <Text style={styles.bold}>Oblea:</Text> {selectedTramite.oblea || '—'}</Text>
                <Text style={[styles.detailText, {color: getColor(selectedTramite.estado)}]}>{selectedTramite.estado}</Text>
                <View style={styles.divider} />
                <Text style={styles.detailText}><Text style={styles.bold}>Tipo:</Text> {selectedTramite.tipo_tramite}</Text>
                <Text style={styles.detailText}><Text style={styles.bold}>Partido:</Text> {selectedTramite.partido} | <Text style={styles.bold}>Partida:</Text> {selectedTramite.partida}</Text>
                <Text style={styles.detailText}><Text style={styles.bold}>Nomenclatura:</Text> {selectedTramite.nomenclatura}</Text>
                <View style={styles.divider} />
                <Text style={styles.detailText}><Text style={styles.bold}>Fecha Alta:</Text> {selectedTramite.fecha_alta}</Text>
                <Text style={styles.detailText}><Text style={styles.bold}>Último Movimiento:</Text> {selectedTramite.fecha_movimiento}</Text>
                {!!selectedTramite.demora && <Text style={styles.detailText}><Text style={styles.bold}>Demora:</Text> {selectedTramite.demora} días</Text>}
                {!!selectedTramite.final_estimada && <Text style={styles.detailText}><Text style={styles.bold}>Final Estimada:</Text> {selectedTramite.final_estimada}</Text>}
                
                <TouchableOpacity style={[styles.btnPrimary, {marginTop: 20, alignSelf: 'center', width: '100%', alignItems: 'center'}]} onPress={() => shareTramite(selectedTramite)}>
                  <Text style={{ color: C_BG, fontWeight: 'bold' }}>Compartir (PDF / WhatsApp)</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Novedades Modal */}
      <Modal visible={novedades.length > 0} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={[styles.modalContent, {maxHeight: '80%'}]}>
            <View style={{flexDirection: 'row', alignItems: 'center', marginBottom: 16}}>
              <BellRing color={C_AMBER} size={24} style={{marginRight: 8}}/>
              <Text style={styles.modalTitle}>¡Novedades!</Text>
            </View>
            <FlatList
              data={novedades}
              keyExtractor={(item) => item.nro}
              renderItem={({item}) => (
                <View style={{backgroundColor: C_BG, padding: 10, borderRadius: 8, marginBottom: 8}}>
                  <Text style={{color: C_TEXT}}>Trámite #{item.nro}</Text>
                  <Text style={{color: C_TEXT2, fontSize: 12}}>De '{item.viejo}' a '{item.nuevo}'</Text>
                </View>
              )}
            />
            <TouchableOpacity style={[styles.btnPrimary, {marginTop: 16, alignSelf: 'flex-end'}]} onPress={clearNovedades}>
              <Text style={{ color: C_BG, fontWeight: 'bold' }}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Invisible WebView Component */}
      {isSyncing && <ArbaWebView cuit={cuit} cit={cit} onSyncComplete={handleSyncComplete} />}
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