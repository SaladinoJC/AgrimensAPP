import React from "react";
import { StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { ChevronRight, FileText, Clock } from "lucide-react-native";

import { getColor } from "@/utils/utils-tramite";
import { Tramite } from "@/tramites/tramites.type";

import { useTheme } from "@/hooks/useTheme";
import { useStyles } from "@/hooks/useStyles";

interface TramiteCardProps {
  tramite: Tramite;
  onPress: () => void;
}

export const TramiteCard: React.FC<TramiteCardProps> = ({
  tramite,
  onPress,
}) => {
  const { colores } = useTheme();
  const styles = useStyles(createStyles);

  const bgColorEstado = getColor(tramite.estado);
  const fgColorEstado =
    bgColorEstado.toLowerCase() === "#ef5350" ? "#ffffff" : colores.C_BG;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.cardInner}>
        {/* Avatar / Ícono de la izquierda */}
        <View style={styles.iconContainer}>
          <FileText size={24} color={colores.C_PRIMARY} strokeWidth={2} />
        </View>

        {/* Contenido principal */}
        <View style={styles.cardContent}>
          <View style={styles.headerRow}>
            <Text style={styles.expediente}>#{tramite.oblea || tramite.nroExpediente}</Text>
          </View>

          <Text style={styles.tipoTramite} numberOfLines={1}>
            {tramite.tipo_tramite}
          </Text>

          <View style={styles.detailsRow}>
            <Text style={styles.detailText}>
              Pdo: <Text style={styles.detailBold}>{tramite.partido}</Text>
            </Text>
            <Text style={styles.dotSeparator}>•</Text>
            <Text style={styles.detailText}>
              Pda: <Text style={styles.detailBold}>{tramite.partida}</Text>
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.stateRow}>
        <View style={[styles.badge, { backgroundColor: bgColorEstado }]}>
          <Text style={[styles.badgeText, { color: fgColorEstado }]}>
            {tramite.estado || "SIN ESTADO"}
          </Text>
        </View>
      </View>

      {/* Pie de tarjeta (Fecha y Flecha) */}
      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          <Clock size={12} color={colores.C_TEXT2} />
          <Text style={styles.dateText}>
            {tramite.fecha_movimiento
              ? `Actualizado: ${tramite.fecha_movimiento}`
              : "Sin actualizaciones recientes"}
          </Text>
        </View>
        <ChevronRight size={18} color={colores.C_TEXT2} />
      </View>
    </TouchableOpacity>
  );
};

const shadowBase = {
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.04,
  shadowRadius: 8,
  elevation: 2,
};

const createStyles = (colores: any) =>
  StyleSheet.create({
    card: {
      ...shadowBase,
      backgroundColor: colores.C_CARD,
      borderRadius: 12,
      marginHorizontal: 16,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colores.C_SURFACE,
    },
    cardInner: {
      flexDirection: "row",
      padding: 8,
    },
    iconContainer: {
      width: 48,
      height: 48,
      borderRadius: 6,
      backgroundColor: colores.C_SURFACE,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 14,
    },
    cardContent: {
      flex: 1,
      justifyContent: "center",
    },
    headerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 4,
    },
    expediente: {
      fontSize: 18,
      fontWeight: "800",
      color: colores.C_TEXT,
      letterSpacing: -0.5,
    },
    badge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12, 
    },
    badgeText: {
      fontWeight: "800",
      fontSize: 10,
      letterSpacing: 0.5,
    },
    tipoTramite: {
      fontSize: 13,
      color: colores.C_TEXT2,
      fontWeight: "500",
    },
    detailsRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    detailText: {
      fontSize: 13,
      color: colores.C_TEXT2,
    },
    detailBold: {
      fontWeight: "700",
      color: colores.C_TEXT,
    },
    dotSeparator: {
      marginHorizontal: 8,
      fontSize: 13,
      color: colores.C_SURFACE,
      fontWeight: "900",
    },
    footer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 16,
      paddingVertical: 6,
      borderTopWidth: 1,
      borderTopColor: colores.C_SURFACE, 
    },
    footerLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    dateText: {
      fontSize: 12,
      color: colores.C_TEXT2,
      fontWeight: "500",
    },
    stateRow: {
      marginBottom: 8,
      marginLeft: 12,
      alignSelf: "flex-start",
    },
  });
