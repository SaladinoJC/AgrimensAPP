import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Lock, Fingerprint, Eye, EyeOff } from "lucide-react-native";

import { useStore } from "@/store/useStore";
import { useBiometric } from "@/auth/useBiometric";
import { SyncError } from "@/services/sync/types";

import { useTheme } from "@/hooks/useTheme";
import { useStyles } from "@/hooks/useStyles";

import { CustomAlert, AlertVariant } from "@/components/ui/CustomAlert";

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [cuit, setCuit] = useState("");
  const [cit, setCit] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showBiometricButton, setShowBiometricButton] = useState(false);

  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: "",
    message: "",
    variant: "info" as AlertVariant,
  });

  const setCredenciales = useStore((state) => state.setCredenciales);
  const setIsLoggedIn = useStore((state) => state.setIsLoggedIn);

  const {
    checkBiometricAvailability,
    authenticate,
    isLoading: bioLoading,
  } = useBiometric();

  const { theme, colores } = useTheme();
  const styles = useStyles(createStyles);

  useEffect(() => {
    checkBiometricAvailability().then((result) => {
      setShowBiometricButton(result.available);
    });
  }, [checkBiometricAvailability]);

  const showAlert = (
    title: string,
    message: string,
    variant: AlertVariant = "info",
  ) => {
    setAlertConfig({ visible: true, title, message, variant });
  };

  const handleBiometricLogin = async () => {
    const authResult = await authenticate();
    if (authResult.success) {
      try {
        const savedCuit = await SecureStore.getItemAsync("cuit");
        const savedCit = await SecureStore.getItemAsync("cit");

        if (savedCuit && savedCit) {
          setCredenciales({ cuit: savedCuit, cit: savedCit });
          setIsLoggedIn(true);
          await AsyncStorage.setItem("isLoggedIn", "true");
          onLoginSuccess();
        } else {
          showAlert(
            "No hay datos",
            "No hay credenciales guardadas en este dispositivo.",
            "warning",
          );
        }
      } catch (error) {
        showAlert(
          "Error",
          "No se pudieron obtener las credenciales guardadas.",
          "danger",
        );
      }
    } else {
      showAlert(
        "Autenticación Fallida",
        authResult.error || "No pudimos verificar tu identidad.",
        "warning",
      );
    }
  };

  const handleLogin = async () => {
    const cuitLimpio = cuit.trim();
    const citLimpio = cit.trim();

    if (!cuitLimpio || !citLimpio) {
      showAlert(
        "Datos incompletos",
        "Por favor completá tu CUIT y CIT para ingresar.",
        "info",
      );
      return;
    }

    setIsLoading(true);
    try {
      await SecureStore.setItemAsync("cuit", cuitLimpio);
      await SecureStore.setItemAsync("cit", citLimpio);
      await AsyncStorage.setItem("isLoggedIn", "true");

      setCredenciales({ cuit: cuitLimpio, cit: citLimpio });
      setIsLoggedIn(true);

      onLoginSuccess();
    } catch (error) {
      if (error instanceof SyncError) {
        showAlert("Acceso Denegado", error.message, "danger");
      } else {
        showAlert(
          "Error de Conexión",
          "No se pudo verificar la identidad con ARBA. Intentá nuevamente más tarde.",
          "danger",
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle={theme === "dark" ? "light-content" : "dark-content"}
        backgroundColor={colores.C_BG}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.content}
      >
        {/* Cabecera / Logo */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Lock size={42} color={colores.C_PRIMARY} strokeWidth={2.5} />
          </View>
          <Text style={styles.title}>AgrimensAPP</Text>
          <Text style={styles.subtitle}>
            Sistema de Monitoreo de Trámites ARBA
          </Text>
        </View>

        {/* Tarjeta de Formulario */}
        <View style={styles.card}>
          {showBiometricButton && !bioLoading && (
            <>
              <TouchableOpacity
                style={styles.biometricButton}
                onPress={handleBiometricLogin}
                disabled={bioLoading}
                activeOpacity={0.8}
              >
                <Fingerprint size={32} color={colores.C_PRIMARY} />
                <Text style={styles.biometricText}>
                  {bioLoading
                    ? "Autenticando..."
                    : "Ingresar con Huella/Rostro"}
                </Text>
              </TouchableOpacity>

              <View style={styles.divider}>
                <View style={styles.line} />
                <Text style={styles.dividerText}>
                  o ingresá con tus credenciales
                </Text>
                <View style={styles.line} />
              </View>
            </>
          )}

          <Text style={styles.label}>CUIT</Text>
          <TextInput
            style={styles.input}
            placeholder="23123456780"
            placeholderTextColor={colores.C_TEXT2}
            value={cuit}
            onChangeText={setCuit}
            editable={!isLoading}
            keyboardType="numeric"
            maxLength={11}
            autoCapitalize="none"
          />

          <Text style={styles.label}>CIT (Contraseña)</Text>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Tu contraseña de ARBA"
              placeholderTextColor={colores.C_TEXT2}
              value={cit}
              onChangeText={setCit}
              secureTextEntry={!showPassword}
              editable={!isLoading}
              autoCapitalize="none"
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              disabled={isLoading}
              style={styles.eyeIcon}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              {showPassword ? (
                <EyeOff size={22} color={colores.C_TEXT2} />
              ) : (
                <Eye size={22} color={colores.C_TEXT2} />
              )}
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.loginButton, isLoading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color={colores.C_BG} />
            ) : (
              <Text style={styles.loginButtonText}>GUARDAR Y CONTINUAR</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.warningText}>
            ⚠️ Tus credenciales se guardan de forma encriptada únicamente en
            este dispositivo.
          </Text>
        </View>
      </KeyboardAvoidingView>

      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        variant={alertConfig.variant}
        onConfirm={() => setAlertConfig({ ...alertConfig, visible: false })}
      />
    </SafeAreaView>
  );
};

// ... estilos sin modificaciones ...
const shadowBase = {
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.08,
  shadowRadius: 12,
  elevation: 4,
};

const createStyles = (colores: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colores.C_BG,
    },
    content: {
      flex: 1,
      justifyContent: "center",
      paddingHorizontal: 20,
    },
    header: {
      alignItems: "center",
      marginBottom: 40,
    },
    iconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 16,
      backgroundColor: colores.C_CARD,
      borderWidth: 2,
      borderColor: colores.C_SURFACE,
      ...shadowBase,
    },
    title: {
      fontSize: 32,
      fontWeight: "900",
      color: colores.C_TEXT,
      letterSpacing: -1,
    },
    subtitle: {
      fontSize: 15,
      marginTop: 8,
      color: colores.C_TEXT2,
      textAlign: "center",
      fontWeight: "500",
    },
    card: {
      ...shadowBase,
      backgroundColor: colores.C_CARD,
      borderRadius: 20,
      padding: 24,
      borderWidth: 1,
      borderColor: colores.C_SURFACE,
    },
    biometricButton: {
      flexDirection: "row",
      justifyContent: "center",
      backgroundColor: colores.C_SURFACE,
      borderWidth: 1,
      borderColor: colores.C_PRIMARY,
      borderRadius: 16,
      padding: 16,
      alignItems: "center",
      gap: 12,
    },
    biometricText: {
      fontSize: 16,
      fontWeight: "700",
      color: colores.C_TEXT,
    },
    divider: {
      flexDirection: "row",
      alignItems: "center",
      marginVertical: 24,
    },
    line: {
      flex: 1,
      height: 1,
      backgroundColor: colores.C_SURFACE,
    },
    dividerText: {
      marginHorizontal: 12,
      fontSize: 13,
      fontWeight: "600",
      color: colores.C_TEXT2,
      textTransform: "uppercase",
    },
    label: {
      fontSize: 13,
      fontWeight: "700",
      marginBottom: 8,
      color: colores.C_TEXT,
      letterSpacing: 0.5,
    },
    input: {
      backgroundColor: colores.C_SURFACE,
      color: colores.C_TEXT,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 16,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: colores.C_SURFACE,
    },
    passwordContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colores.C_SURFACE,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colores.C_SURFACE,
    },
    passwordInput: {
      flex: 1,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 16,
      color: colores.C_TEXT,
    },
    eyeIcon: {
      paddingHorizontal: 16,
    },
    loginButton: {
      backgroundColor: colores.C_PRIMARY,
      borderRadius: 16,
      paddingVertical: 16,
      marginTop: 28,
      alignItems: "center",
      ...shadowBase,
    },
    buttonDisabled: {
      opacity: 0.7,
    },
    loginButtonText: {
      fontSize: 16,
      fontWeight: "800",
      color: colores.C_BG,
      letterSpacing: 0.5,
    },
    warningText: {
      fontSize: 12,
      marginTop: 20,
      textAlign: "center",
      lineHeight: 18,
      color: colores.C_TEXT2,
      fontWeight: "500",
    },
  });
