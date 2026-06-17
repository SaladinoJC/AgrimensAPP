import React, { useState } from "react";
import {
  StyleSheet,
  TouchableOpacity,
  Modal,
  Text,
  View,
  Switch,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LogOut, User, X, ShieldCheck, HardDrive } from "lucide-react-native";

import { useStore } from "@/store/useStore";
import { useTheme } from "@/hooks/useTheme";
import { useStyles } from "@/hooks/useStyles";
import { useAuthManager } from "@/hooks/useAuthManager";
import { CustomAlert } from "@/components/ui/CustomAlert";

interface CredentialsModalProps {
  visible: boolean;
  onClose: () => void;
}

export const CredentialsModal: React.FC<CredentialsModalProps> = ({
  visible,
  onClose,
}) => {
  const { handleLogout: logout } = useAuthManager();
  const { theme, toggleTheme } = useStore();
  const cuit = useStore((state) => state.credenciales.cuit);
  const [alertVisible, setAlertVisible] = useState(false);

  const isDark = theme === "dark";
  const { colores } = useTheme();
  const styles = useStyles(createStyles);

  const handleLogoutPress = () => {
    setAlertVisible(true);
  };

  const confirmarLogout = () => {
    setAlertVisible(false);
    logout();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Mi Perfil</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.7}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          >
            <X size={24} color={colores.C_TEXT} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {/* Tarjeta de Perfil */}
          <View style={styles.profileCard}>
            <View style={styles.accentLine} />
            <View style={styles.iconContainer}>
              <User size={42} color={colores.C_PRIMARY} strokeWidth={2.5} />
            </View>
            <Text style={styles.cuitLabel}>CUIT VINCULADO</Text>
            <Text style={styles.cuitValue}>{cuit}</Text>
            <Text style={styles.credentialNote}>
              Credencial guardada de forma segura en este dispositivo
            </Text>
          </View>

          {/* Tarjeta de Seguridad */}
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Información de Seguridad</Text>

            <View style={styles.infoRow}>
              <View style={styles.infoLabelContainer}>
                <ShieldCheck size={18} color={colores.C_TEXT2} />
                <Text style={styles.infoLabel}>Estado</Text>
              </View>
              <Text style={styles.infoValue}>Sesión Activa</Text>
            </View>

            <View style={styles.infoRowNoBorder}>
              <View style={styles.infoLabelContainer}>
                <HardDrive size={18} color={colores.C_TEXT2} />
                <Text style={styles.infoLabel}>Almacenamiento</Text>
              </View>
              <Text style={styles.infoValue}>Local Encriptado</Text>
            </View>
          </View>

          {/* Tarjeta de Tema */}
          <View style={styles.themeRow}>
            <View style={styles.themeTextContainer}>
              <Text style={styles.themeTitle}>Modo Oscuro</Text>
              <Text style={styles.themeSubtitle}>
                Adapta los colores a tu entorno
              </Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: "#e5e7eb", true: colores.C_PRIMARY }}
              thumbColor={
                Platform.OS === "ios"
                  ? "#ffffff"
                  : isDark
                    ? "#ffffff"
                    : "#f3f4f6"
              }
              ios_backgroundColor="#e5e7eb"
              style={styles.themeSwitch}
            />
          </View>
        </View>

        {/* Botón de Cerrar Sesión */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogoutPress} 
          activeOpacity={0.8}
        >
          <LogOut size={22} color={colores.C_WHITE} strokeWidth={2.5} />
          <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
        </TouchableOpacity>

        {/* --- COMPONENTE CUSTOM ALERT --- */}
        <CustomAlert
          visible={alertVisible}
          title="Cerrar Sesión"
          message="¿Estás seguro de que deseas cerrar la sesión? Tendrás que volver a ingresar tus credenciales."
          variant="logout"
          confirmText="Cerrar Sesión"
          cancelText="Cancelar"
          onConfirm={confirmarLogout}
          onCancel={() => setAlertVisible(false)}
        />
      </SafeAreaView>
    </Modal>
  );
};

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
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingVertical: 16,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: "800",
      color: colores.C_TEXT,
      letterSpacing: -0.5,
    },
    closeButton: {
      backgroundColor: colores.C_SURFACE,
      padding: 8,
      borderRadius: 20,
    },
    content: {
      flex: 1,
      paddingHorizontal: 20,
      paddingTop: 10,
    },
    profileCard: {
      ...shadowBase,
      backgroundColor: colores.C_CARD,
      borderRadius: 20,
      padding: 24,
      alignItems: "center",
      marginBottom: 24,
      borderWidth: 1,
      borderColor: colores.C_SURFACE,
      position: "relative",
      overflow: "hidden",
    },
    accentLine: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      height: 4,
      backgroundColor: colores.C_PRIMARY,
    },
    iconContainer: {
      width: 88,
      height: 88,
      borderRadius: 44,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 16,
      backgroundColor: colores.C_BG,
      borderWidth: 2,
      borderColor: colores.C_SURFACE,
    },
    cuitLabel: {
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 1,
      color: colores.C_TEXT2,
      textTransform: "uppercase",
    },
    cuitValue: {
      fontSize: 28,
      fontWeight: "900",
      marginTop: 4,
      marginBottom: 12,
      color: colores.C_TEXT,
      letterSpacing: -0.5,
    },
    credentialNote: {
      fontSize: 13,
      textAlign: "center",
      color: colores.C_TEXT2,
      lineHeight: 18,
      paddingHorizontal: 10,
    },
    infoCard: {
      ...shadowBase,
      backgroundColor: colores.C_CARD,
      borderRadius: 20,
      padding: 20,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: colores.C_SURFACE,
    },
    infoTitle: {
      fontSize: 15,
      fontWeight: "700",
      marginBottom: 16,
      color: colores.C_TEXT,
      letterSpacing: -0.3,
    },
    infoRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colores.C_SURFACE,
    },
    infoRowNoBorder: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingTop: 12,
      paddingBottom: 4,
    },
    infoLabelContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    infoLabel: {
      fontSize: 14,
      color: colores.C_TEXT2,
      fontWeight: "500",
    },
    infoValue: {
      fontSize: 14,
      fontWeight: "700",
      color: colores.C_PRIMARY,
    },
    themeRow: {
      ...shadowBase,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: 20,
      borderRadius: 20,
      backgroundColor: colores.C_CARD,
      borderWidth: 1,
      borderColor: colores.C_SURFACE,
    },
    themeTextContainer: {
      flex: 1,
      paddingRight: 16,
    },
    themeTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: colores.C_TEXT,
      marginBottom: 4,
      letterSpacing: -0.3,
    },
    themeSubtitle: {
      fontSize: 13,
      color: colores.C_TEXT2,
    },
    logoutButton: {
      ...shadowBase,
      backgroundColor: colores.C_RED,
      borderRadius: 16,
      paddingVertical: 16,
      marginHorizontal: 20,
      marginBottom: Platform.OS === "ios" ? 10 : 24,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
    },
    logoutButtonText: {
      color: colores.C_WHITE,
      fontWeight: "800",
      marginLeft: 10,
      fontSize: 16,
      letterSpacing: 0.5,
    },
    themeSwitch: {
      transform: [{ scale: 1.5 }],
      marginRight: 4,
    },
  });
