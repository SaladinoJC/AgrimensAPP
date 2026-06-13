import React from "react";
import { StyleSheet, View, Text, Modal, TouchableOpacity } from "react-native";
import {
  AlertTriangle,
  Info,
  Trash2,
  LogOut,
  CheckCircle,
} from "lucide-react-native";

import { useTheme } from "@/hooks/useTheme";
import { useStyles } from "@/hooks/useStyles";

export type AlertVariant = "danger" | "warning" | "info" | "success" | "logout";

interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  variant?: AlertVariant;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void; 
}

export const CustomAlert: React.FC<CustomAlertProps> = ({
  visible,
  title,
  message,
  variant = "info",
  confirmText = "Aceptar",
  cancelText = "Cancelar",
  onConfirm,
  onCancel,
}) => {
  const { colores } = useTheme();
  const styles = useStyles(createStyles);

  // Configuración visual según la variante
  const getVariantConfig = () => {
    switch (variant) {
      case "danger":
        return {
          icon: Trash2,
          color: "#ef5350",
          bgIcon: "rgba(239, 83, 80, 0.15)",
        };
      case "logout":
        return {
          icon: LogOut,
          color: "#ef5350",
          bgIcon: "rgba(239, 83, 80, 0.15)",
        };
      case "warning":
        return {
          icon: AlertTriangle,
          color: "#f59e0b",
          bgIcon: "rgba(245, 158, 11, 0.15)",
        };
      case "success":
        return {
          icon: CheckCircle,
          color: "#10b981",
          bgIcon: "rgba(16, 185, 129, 0.15)",
        };
      case "info":
      default:
        return {
          icon: Info,
          color: colores.C_PRIMARY,
          bgIcon: "rgba(0, 191, 165, 0.15)",
        };
    }
  };

  const config = getVariantConfig();
  const Icon = config.icon;

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.alertCard}>
          {/* Icono Superior */}
          <View
            style={[styles.iconContainer, { backgroundColor: config.bgIcon }]}
          >
            <Icon size={32} color={config.color} strokeWidth={2} />
          </View>

          {/* Textos */}
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          {/* Botonera */}
          <View style={styles.buttonContainer}>
            {onCancel && (
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onCancel}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelText}>{cancelText}</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.confirmButton,
                { backgroundColor: config.color },
                !onCancel && { flex: 0, minWidth: 120 }, // Ajuste si es un solo botón
              ]}
              onPress={onConfirm}
              activeOpacity={0.8}
            >
              <Text style={styles.confirmText}>{confirmText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const shadowBase = {
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 10 },
  shadowOpacity: 0.2,
  shadowRadius: 20,
  elevation: 10,
};

const createStyles = (colores: any) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.65)", 
      justifyContent: "center",
      alignItems: "center",
      padding: 24,
    },
    alertCard: {
      ...shadowBase,
      width: "100%",
      maxWidth: 340,
      backgroundColor: colores.C_CARD,
      borderRadius: 24,
      padding: 24,
      alignItems: "center",
      borderWidth: 1,
      borderColor: colores.C_SURFACE,
    },
    iconContainer: {
      width: 64,
      height: 64,
      borderRadius: 32,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 16,
    },
    title: {
      fontSize: 20,
      fontWeight: "800",
      color: colores.C_TEXT,
      marginBottom: 8,
      textAlign: "center",
      letterSpacing: -0.5,
    },
    message: {
      fontSize: 15,
      color: colores.C_TEXT2,
      textAlign: "center",
      marginBottom: 24,
      lineHeight: 22,
    },
    buttonContainer: {
      flexDirection: "row",
      gap: 12,
      width: "100%",
      justifyContent: "center",
    },
    cancelButton: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 14,
      backgroundColor: colores.C_SURFACE,
      alignItems: "center",
      justifyContent: "center",
    },
    cancelText: {
      fontSize: 15,
      fontWeight: "700",
      color: colores.C_TEXT,
    },
    confirmButton: {
      flex: 1,
      paddingVertical: 14,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
    },
    confirmText: {
      fontSize: 15,
      fontWeight: "800",
      color: "#ffffff", 
    },
  });
