import React from "react";
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { FileText, Eye, Share2 } from "lucide-react-native";

import { useTheme } from "@/hooks/useTheme";
import { useStyles } from "@/hooks/useStyles";

interface FileActionModalProps {
  visible: boolean;
  fileName: string;
  onView: () => void;
  onShare: () => void;
  onCancel: () => void;
}

export const FileActionModal: React.FC<FileActionModalProps> = ({
  visible,
  fileName,
  onView,
  onShare,
  onCancel,
}) => {
  const { colores } = useTheme();
  const styles = useStyles(createStyles);

  if (!visible) return null;

  return (
    <View style={[StyleSheet.absoluteFillObject, styles.overlay]}>
      <View style={styles.card}>
        {/* Header del Modal */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <FileText size={28} color={colores.C_PRIMARY} strokeWidth={2} />
          </View>
          <Text style={styles.title}>Archivo Listo</Text>
          <Text style={styles.subtitle} numberOfLines={2}>
            {fileName}
          </Text>
        </View>

        {/* Botones de Acción */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={onView}
            activeOpacity={0.8}
          >
            <Eye size={20} color="#ffffff" />
            <Text style={styles.primaryButtonText}>Ver Documento</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={onShare}
            activeOpacity={0.8}
          >
            <Share2 size={20} color={colores.C_PRIMARY} />
            <Text style={styles.secondaryButtonText}>Compartir</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onCancel}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
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
      backgroundColor: "rgba(0, 0, 0, 0.65)",
      justifyContent: "center",
      alignItems: "center",
      padding: 24,
      zIndex: 999, 
      elevation: 999,
    },
    card: {
      ...shadowBase,
      width: "100%",
      maxWidth: 340,
      backgroundColor: colores.C_CARD,
      borderRadius: 24,
      padding: 24,
      borderWidth: 1,
      borderColor: colores.C_SURFACE,
    },
    header: {
      alignItems: "center",
      marginBottom: 24,
    },
    iconContainer: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: "rgba(0, 191, 165, 0.15)",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 16,
    },
    title: {
      fontSize: 20,
      fontWeight: "800",
      color: colores.C_TEXT,
      marginBottom: 8,
      letterSpacing: -0.5,
    },
    subtitle: {
      fontSize: 14,
      color: colores.C_TEXT2,
      textAlign: "center",
      lineHeight: 20,
    },
    actionsContainer: {
      gap: 12,
    },
    primaryButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colores.C_PRIMARY,
      paddingVertical: 14,
      borderRadius: 14,
      gap: 8,
    },
    primaryButtonText: {
      fontSize: 15,
      fontWeight: "800",
      color: "#ffffff",
    },
    secondaryButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colores.C_BG,
      borderWidth: 1,
      borderColor: colores.C_PRIMARY,
      paddingVertical: 14,
      borderRadius: 14,
      gap: 8,
    },
    secondaryButtonText: {
      fontSize: 15,
      fontWeight: "700",
      color: colores.C_PRIMARY,
    },
    cancelButton: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 14,
      borderRadius: 14,
      backgroundColor: colores.C_SURFACE,
      marginTop: 4,
    },
    cancelButtonText: {
      fontSize: 15,
      fontWeight: "700",
      color: colores.C_TEXT,
    },
  });
