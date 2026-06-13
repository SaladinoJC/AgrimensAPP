import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Modal,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Trash2,
  X,
  ChevronRight,
  BellRing,
  BellOff,
  FileText,
  ArrowRight,
} from "lucide-react-native";
import Reanimated, { useAnimatedStyle } from "react-native-reanimated";
import Swipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import type { SharedValue } from "react-native-reanimated";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import {
  getNotificaciones,
  clearNotificaciones,
  deleteNotificacionById,
  getTramiteByNro,
} from "@/db/database";
import { TramiteDetail } from "@/tramites/tramites.type";
import { TramiteDetailModal } from "@/components/TramiteDetailModal";

import { useTheme } from "@/hooks/useTheme";
import { useStyles } from "@/hooks/useStyles";
import { CustomAlert } from "@/components/ui/CustomAlert";
import { LoadingTramitesSpinner } from "@/components/ui/LoadingTramitesSpinner";

const C_RED = "#ef5350";

function DeleteAction(
  prog: SharedValue<number>,
  drag: SharedValue<number>,
  onDelete: () => void,
  styles: any,
) {
  const styleAnimation = useAnimatedStyle(() => ({
    transform: [{ translateX: drag.value + 80 }],
  }));

  return (
    <Reanimated.View style={[styles.deleteContainer, styleAnimation]}>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={onDelete}
        activeOpacity={0.8}
      >
        <Trash2 color="#fff" size={20} />
      </TouchableOpacity>
    </Reanimated.View>
  );
}

interface NotificacionesScreenProps {
  visible: boolean;
  onClose: () => void;
}

export const NotificacionesScreen = ({
  visible,
  onClose,
}: NotificacionesScreenProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [alertVisible, setAlertVisible] = useState(false);
  const [historial, setHistorial] = useState<any[]>([]);
  const [selectedTramite, setSelectedTramite] = useState<TramiteDetail | null>(
    null,
  );

  const { colores } = useTheme();
  const styles = useStyles(createStyles);

  useEffect(() => {
    if (visible) {
      cargarNotificaciones();
    } else {
      setIsLoading(true);
    }
  }, [visible]);

  const cargarNotificaciones = async () => {
    setIsLoading(true);
    try {
      const data = await getNotificaciones();
      setHistorial(data);
    } catch (error) {
      console.error("Error cargando historial:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    if (historial.length === 0) return;
    setAlertVisible(true);
  };

  const confirmarBorrado = async () => {
    setAlertVisible(false);
    await clearNotificaciones();
    setHistorial([]);
  };

  const handleDeleteOne = async (id: number) => {
    await deleteNotificacionById(id);
    setHistorial((prev) => prev.filter((n) => n.id !== id));
  };

  const onOpenTramite = async (nroExpediente: string) => {
    try {
      const tramite = await getTramiteByNro(nroExpediente);
      if (tramite) {
        setSelectedTramite(tramite);
      } else {
        alert("Este expediente ya no se encuentra en la base de datos local.");
      }
    } catch (error) {
      console.error("Error al cargar el trámite:", error);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <GestureHandlerRootView style={styles.root}>
        <SafeAreaView style={styles.container}>
          {/* Header Blindado */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
            >
              <X color={colores.C_TEXT} size={24} />
            </TouchableOpacity>

            <View style={styles.titleContainer}>
              <BellRing color={colores.C_PRIMARY} size={20} />
              <Text style={styles.title}>Centro de Novedades</Text>
            </View>

            <TouchableOpacity
              style={[
                styles.positionDelete,
                (historial.length === 0 || isLoading) && { opacity: 0.3 },
              ]}
              onPress={handleClear}
              disabled={historial.length === 0 || isLoading}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
            >
              <Trash2 color={C_RED} size={22} />
            </TouchableOpacity>
          </View>

          {/* Contenido principal */}
          {isLoading ? (
            <LoadingTramitesSpinner />
          ) : historial.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <BellOff size={48} color={colores.C_TEXT2} strokeWidth={1.5} />
              </View>
              <Text style={styles.emptyTitle}>Todo al día</Text>
              <Text style={styles.emptyText}>
                No hay movimientos recientes en tus expedientes.
              </Text>
            </View>
          ) : (
            <FlatList
              data={historial}
              keyExtractor={(item) => String(item.id)}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <Swipeable
                  friction={2}
                  overshootRight={false}
                  rightThreshold={40}
                  renderRightActions={(prog, drag) =>
                    DeleteAction(
                      prog,
                      drag,
                      () => handleDeleteOne(item.id),
                      styles,
                    )
                  }
                >
                  <TouchableOpacity
                    style={styles.card}
                    onPress={() => onOpenTramite(item.nroExpediente)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.cardMain}>
                      {/* Fila 1: Expediente */}
                      <View style={styles.novedadHeader}>
                        <FileText size={18} color={colores.C_PRIMARY} />
                        <Text style={styles.novedadTitle}>
                          #{item.nroExpediente}
                        </Text>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginLeft: "auto" }}>
                          <Text style={styles.detailText}>
                            Pdo:{" "}
                            <Text style={styles.detailBold}>
                              {item.partido || "-"}
                            </Text>
                          </Text>
                          <Text style={styles.dotSeparator}>•</Text>
                          <Text style={styles.detailText}>
                            Pda:{" "}
                            <Text style={styles.detailBold}>
                              {item.partida || "-"}
                            </Text>
                          </Text>
                        </View>
                      </View>

                      {/* Fila 2: Tipo de Trámite */}
                      <Text style={styles.tipoTramite} numberOfLines={1}>
                        {item.tipo_tramite || "Trámite de Agrimensura"}
                      </Text>

                      {/* Fila 4: Transición de Estados */}
                      <View style={styles.stateChangeContainer}>
                        <Text style={styles.stateTextViejo} numberOfLines={2}>
                          {item.viejo_estado}
                        </Text>
                        <View style={styles.arrowContainer}>
                          <ArrowRight
                            size={14}
                            color={colores.C_PRIMARY}
                            strokeWidth={3}
                          />
                        </View>
                        <Text style={styles.stateTextNuevo} numberOfLines={2}>
                          {item.nuevo_estado}
                        </Text>
                      </View>
                    </View>

                    {/* Flecha indicadora */}
                    <ChevronRight color={colores.C_TEXT2} size={20} />
                  </TouchableOpacity>
                </Swipeable>
              )}
            />
          )}

          {/* Modales */}
          {selectedTramite && (
            <TramiteDetailModal
              visible={!!selectedTramite}
              tramite={selectedTramite}
              onClose={() => setSelectedTramite(null)}
            />
          )}

          <CustomAlert
            visible={alertVisible}
            title="Limpiar Historial"
            message="¿Estás seguro de que querés borrar todo el historial de novedades? Esta acción no se puede deshacer."
            variant="danger"
            confirmText="Borrar Todo"
            cancelText="Cancelar"
            onConfirm={confirmarBorrado}
            onCancel={() => setAlertVisible(false)}
          />
        </SafeAreaView>
      </GestureHandlerRootView>
    </Modal>
  );
};

const shadowBase = {
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.05,
  shadowRadius: 4,
  elevation: 2,
};

const createStyles = (colores: any) =>
  StyleSheet.create({
    root: {
      flex: 1,
    },
    container: {
      flex: 1,
      backgroundColor: colores.C_BG,
    },
    header: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colores.C_CARD,
      backgroundColor: colores.C_BG,
      flexShrink: 0,
      minHeight: 60,
      zIndex: 10,
    },
    closeButton: {
      position: "absolute",
      left: 20,
      zIndex: 10,
      backgroundColor: colores.C_SURFACE,
      padding: 6,
      borderRadius: 20,
    },
    titleContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    title: {
      fontSize: 16,
      fontWeight: "800",
      color: colores.C_TEXT,
      letterSpacing: -0.5,
    },
    positionDelete: {
      position: "absolute",
      right: 20,
      zIndex: 10,
    },
    emptyState: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      paddingHorizontal: 40,
    },
    emptyIconContainer: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colores.C_CARD,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 20,
      borderWidth: 2,
      borderColor: colores.C_SURFACE,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: colores.C_TEXT,
      marginBottom: 8,
    },
    emptyText: {
      fontSize: 14,
      color: colores.C_TEXT2,
      textAlign: "center",
      lineHeight: 20,
    },
    listContent: {
      paddingVertical: 12,
    },
    card: {
      ...shadowBase,
      flexDirection: "row",
      marginHorizontal: 16,
      marginBottom: 10,
      padding: 16,
      borderRadius: 16,
      backgroundColor: colores.C_CARD,
      alignItems: "center",
      justifyContent: "space-between",
      borderWidth: 1,
      borderColor: colores.C_SURFACE,
    },
    cardMain: {
      flex: 1,
      paddingRight: 10,
    },
    novedadHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 6,
      gap: 8,
    },
    novedadTitle: {
      color: colores.C_TEXT,
      fontWeight: "900",
      fontSize: 16,
      letterSpacing: -0.3,
    },
    tipoTramite: {
      fontSize: 13,
      color: colores.C_PRIMARY,
      fontWeight: "700",
      marginBottom: 4,
    },
    detailsRow: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 12,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: colores.C_SURFACE,
    },
    detailText: {
      fontSize: 12,
      color: colores.C_TEXT2,
    },
    detailBold: {
      fontWeight: "700",
      color: colores.C_TEXT,
    },
    dotSeparator: {
      marginHorizontal: 8,
      fontSize: 12,
      color: colores.C_SURFACE,
      fontWeight: "900",
    },
    stateChangeContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 6,
      backgroundColor: colores.C_SURFACE,
      padding: 10,
      borderRadius: 10,
    },
    stateTextViejo: {
      flex: 1,
      color: colores.C_TEXT2,
      fontSize: 11,
      fontWeight: "600",
    },
    arrowContainer: {
      backgroundColor: colores.C_CARD,
      padding: 4,
      borderRadius: 8,
    },
    stateTextNuevo: {
      flex: 1,
      color: colores.C_TEXT,
      fontSize: 11,
      fontWeight: "800",
      textAlign: "right",
    },
    deleteContainer: {
      width: 70,
      marginBottom: 10,
      marginRight: 16,
      justifyContent: "center",
      alignItems: "center",
    },
    deleteButton: {
      ...shadowBase,
      backgroundColor: C_RED,
      width: 56,
      height: "100%",
      borderRadius: 12,
      justifyContent: "center",
      alignItems: "center",
    },
  });
