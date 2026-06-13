import "react-native-gesture-handler";
import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  View,
  StatusBar,
  TouchableOpacity,
  Text,
  AppState,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Map, User, Lock, BellRing } from "lucide-react-native";
import { hideAsync } from "expo-splash-screen";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { useStore } from "@/store/useStore";
import { upsertTramites } from "@/db/database";
import { DashboardScreen } from "@/screens/DashboardScreen";
import { CredentialsModal } from "@/screens/CredentialsModal";
import { LoginScreen } from "@/screens/LoginScreen";

import { useAppBoot } from "@/hooks/useAppBoot";
import { useAuthManager } from "@/hooks/useAuthManager";
import { useSincronizador } from "@/hooks/useSincronizador";
import { NovedadesModal } from "@/components/ui/NovedadesModal";
import { NotificacionesScreen } from "@/screens/NotificacionesScreen";
import { useTheme } from "@/hooks/useTheme";
import { useStyles } from "@/hooks/useStyles";

import { CustomAlert, AlertVariant } from "@/components/ui/CustomAlert";

export default function App() {
  const { isLoggedIn, setIsSyncing, novedades, setNovedades, setRefreshKey } =
    useStore();

  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showNotificaciones, setShowNotificaciones] = useState(false);

  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: "",
    message: "",
    variant: "info" as AlertVariant,
    onConfirmAction: undefined as (() => void) | undefined, 
  });

  const { appReady } = useAppBoot();
  const { isAuthenticated, setIsAuthenticated, handleLogout, unlockApp } =
    useAuthManager();
  const { sync, cancelSync, sincronizadorElement } = useSincronizador();

  const appState = useRef(AppState.currentState);
  const timestampFondo = useRef<number | null>(null);
  const TIEMPO_MAXIMO_MINUTOS = 5;

  const { theme, colores } = useTheme();
  const styles = useStyles(createStyles);

  useEffect(() => {
    if (appReady) {
      hideAsync().catch(console.warn);
    }
  }, [appReady]);

  useEffect(() => {
    const subscripcion = AppState.addEventListener("change", (nextAppState) => {
      if (
        appState.current === "active" &&
        nextAppState.match(/inactive|background/)
      ) {
        timestampFondo.current = Date.now();
      } else if (
        appState.current.match(/inactive|background/) &&
        nextAppState === "active"
      ) {
        if (timestampFondo.current) {
          const tiempoPasadoMs = Date.now() - timestampFondo.current;
          const minutosPasados = tiempoPasadoMs / (1000 * 60);

          if (minutosPasados >= TIEMPO_MAXIMO_MINUTOS) {
            setIsAuthenticated(false);
          }
        }
        timestampFondo.current = null;
      }
      appState.current = nextAppState;
    });

    return () => subscripcion.remove();
  }, [setIsAuthenticated]);

  const showAlert = (
    title: string,
    message: string,
    variant: AlertVariant = "info",
    onConfirmAction?: () => void,
  ) => {
    setAlertConfig({ visible: true, title, message, variant, onConfirmAction });
  };

  const handleAlertConfirm = () => {
    if (alertConfig.onConfirmAction) {
      alertConfig.onConfirmAction();
    }
    setAlertConfig((prev) => ({
      ...prev,
      visible: false,
      onConfirmAction: undefined,
    }));
  };

  const handleSync = async () => {
    const freshState = useStore.getState();

    if (
      freshState.isSyncing ||
      !freshState.credenciales.cuit ||
      !freshState.credenciales.cit
    )
      return;
    setIsSyncing(true);

    const result = await sync({
      cuit: freshState.credenciales.cuit,
      cit: freshState.credenciales.cit,
    });

    if (!result.ok) {
      if (
        result.error?.message.includes("Credenciales") ||
        result.error?.message.includes("sesión expirada")
      ) {
        // Alerta con Callback: Forzamos el cierre de sesión al tocar Aceptar
        showAlert("Sesión Expirada", result.error.message, "warning", () => {
          setShowProfileModal(false);
          handleLogout();
        });
      } else {
        // Alerta simple de error
        showAlert("Error de Sincronización", result.error.message, "danger");
      }
      setIsSyncing(false);
      return;
    }

    try {
      const novs = await upsertTramites(result.rows);
      if (novs.length > 0) {
        setNovedades(novs);
      } else {
        // Alerta de éxito
        showAlert(
          "Sincronización Exitosa",
          `Se procesaron ${result.rows.length} trámites.\nNo hay cambios de estado recientes.`,
          "success",
        );
      }
    } catch (dbError) {
      showAlert(
        "Error guardando datos",
        "Hubo un problema con la base de datos local.",
        "danger",
      );
    } finally {
      setIsSyncing(false);
      setRefreshKey();
    }
  };

  const handleCancelSync = () => {
    cancelSync();
    setIsSyncing(false);
  };

  const renderContent = () => {
    if (!appReady) return null;

    if (!isLoggedIn) {
      return (
        <LoginScreen
          onLoginSuccess={() => {
            setIsAuthenticated(true);
            handleSync();
          }}
        />
      );
    }

    if (!isAuthenticated) {
      return (
        <View style={styles.loadingBg}>
          <Lock color={colores.C_PRIMARY} size={64} style={styles.lockIcon} />
          <Text style={styles.appName}>AgrimensAPP</Text>
          <TouchableOpacity
            style={styles.btnPrimary}
            activeOpacity={0.8}
            onPress={unlockApp}
          >
            <Text style={styles.btnPrimaryText}>Desbloquear Aplicación</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <>
        <View style={styles.appBar}>
          <View style={styles.appBarLeft}>
            <Map color={colores.C_PRIMARY} size={24} />
            <Text style={styles.appBarTitle}>AgrimensAPP</Text>
          </View>
          <View style={styles.appBarRight}>
            <TouchableOpacity onPress={() => setShowNotificaciones(true)}>
              <BellRing size={24} color={colores.C_PRIMARY} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.profileButton}
              onPress={() => setShowProfileModal(true)}
            >
              <User size={24} color={colores.C_PRIMARY} />
            </TouchableOpacity>
          </View>
        </View>

        <DashboardScreen onSync={handleSync} onSyncCancel={handleCancelSync} />

        <CredentialsModal
          visible={showProfileModal}
          onClose={() => setShowProfileModal(false)}
        />

        {sincronizadorElement}

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
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaView style={styles.container}>
        <StatusBar
          barStyle={theme === "dark" ? "light-content" : "dark-content"}
          backgroundColor={colores.C_BG}
        />
        {renderContent()}

        <CustomAlert
          visible={alertConfig.visible}
          title={alertConfig.title}
          message={alertConfig.message}
          variant={alertConfig.variant}
          onConfirm={handleAlertConfirm}
        />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const createStyles = (colores: any) =>
  StyleSheet.create({
    root: {
      flex: 1,
    },
    container: {
      flex: 1,
      backgroundColor: colores.C_BG,
    },
    loadingBg: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colores.C_BG,
      padding: 20,
    },
    lockIcon: {
      marginBottom: 20,
    },
    appName: {
      color: colores.C_TEXT,
      fontSize: 24,
      fontWeight: "bold",
      marginBottom: 40,
    },
    appBar: {
      flexDirection: "row",
      justifyContent: "space-between",
      padding: 16,
      paddingBottom: 4,
      alignItems: "center",
      borderBottomColor: colores.C_SURFACE,
      borderBottomWidth: 1,
      backgroundColor: colores.C_BG,
    },
    appBarLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    appBarRight: {
      flexDirection: "row",
      alignItems: "center",
      gap: 16,
    },
    appBarTitle: {
      fontSize: 18,
      fontWeight: "bold",
      marginLeft: 8,
      color: colores.C_TEXT,
    },
    profileButton: {
      padding: 8,
    },
    btnPrimary: {
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 8,
      alignItems: "center",
      backgroundColor: colores.C_PRIMARY,
    },
    btnPrimaryText: {
      color: colores.C_BG,
      fontWeight: "bold",
      fontSize: 16,
    },
  });
