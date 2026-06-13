import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Modal,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Trash2, X, ChevronRight, BellRing, BellOff, FileText, ArrowRight } from "lucide-react-native";
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

const C_RED = "#ef5350";

function DeleteAction(
  prog: SharedValue<number>,
  drag: SharedValue<number>,
  onDelete: () => void,
  styles: any
) {
  const styleAnimation = useAnimatedStyle(() => ({
    transform: [{ translateX: drag.value + 80 }], 
  }));

  return (
    <Reanimated.View style={[styles.deleteContainer, styleAnimation]}>
      <TouchableOpacity style={styles.deleteButton} onPress={onDelete} activeOpacity={0.8}>
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
  const [historial, setHistorial] = useState<any[]>([]);
  const [selectedTramite, setSelectedTramite] = useState<TramiteDetail | null>(null);
  
  const { colores } = useTheme();
  const styles = useStyles(createStyles);

  useEffect(() => {
    if (visible) cargarNotificaciones();
  }, [visible]);

  const cargarNotificaciones = async () => {
    const data = await getNotificaciones();
    setHistorial(data);
  };

  const handleClear = () => {
    if (historial.length === 0) return;
    
    Alert.alert(
      "Limpiar Notificaciones",
      "¿Estás seguro de que quieres borrar todo el historial de novedades?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Borrar Todo",
          style: "destructive",
          onPress: async () => {
            await clearNotificaciones();
            setHistorial([]);
          },
        },
      ],
    );
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
        Alert.alert(
          "Trámite no encontrado",
          "Este expediente ya no se encuentra en la base de datos local.",
        );
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
          
          {/* Header */}
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
              style={[styles.positionDelete, historial.length === 0 && { opacity: 0.3 }]} 
              onPress={handleClear}
              disabled={historial.length === 0}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
            >
              <Trash2 color={C_RED} size={22} />
            </TouchableOpacity>
          </View>

          {/* Contenido */}
          {historial.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <BellOff size={48} color={colores.C_TEXT2} strokeWidth={1.5} />
              </View>
              <Text style={styles.emptyTitle}>Todo al día</Text>
              <Text style={styles.emptyText}> 
                No hay movimientos recientes en tus expedientes. Te avisaremos cuando haya novedades.
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
                    DeleteAction(prog, drag, () => handleDeleteOne(item.id), styles)
                  }
                >
                  <TouchableOpacity
                    style={styles.card}
                    onPress={() => onOpenTramite(item.nroExpediente)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.cardMain}>
                      {/* Título Compacto */}
                      <View style={styles.novedadHeader}>
                        <FileText size={16} color={colores.C_PRIMARY} />
                        <View style={styles.novedadHeaderText}>
                          <Text style={styles.novedadTitle}>#{item.nroExpediente}</Text>
                        </View>

                        <View>
                          <Text style={styles.tipoTramite}>
                            {item.tipo_tramite || "Tipo de Trámite"}
                          </Text>
                        </View>
                      </View>

                      {/* Transición de Estados Compacta */}
                      <View style={styles.stateChangeContainer}>
                        <Text style={styles.stateTextViejo} numberOfLines={2}>
                          {item.viejo_estado}
                        </Text>
                        
                        <View style={styles.arrowContainer}>
                          <ArrowRight size={14} color={colores.C_PRIMARY} strokeWidth={3} />
                        </View>
                        
                        <Text style={styles.stateTextNuevo} numberOfLines={2}>
                          {item.nuevo_estado}
                        </Text>
                      </View>
                    </View>

                    {/* Flecha indicadora de acción */}
                    <ChevronRight color={colores.C_TEXT2} size={20} />
                  </TouchableOpacity>
                </Swipeable>
              )}
            />
          )}

          {/* Modal de Detalle */}
          {selectedTramite && (
            <TramiteDetailModal
              visible={!!selectedTramite}
              tramite={selectedTramite}
              onClose={() => setSelectedTramite(null)}
            />
          )}
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

const createStyles = (colores: any) => StyleSheet.create({
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
    padding: 12,
    borderRadius: 12,
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
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8, 
    borderBottomWidth: 1,
    borderBottomColor: colores.C_SURFACE,
    paddingBottom: 8,
  },
  novedadHeaderText: {
    marginLeft: 8,
    flex: 1,
  },
  novedadTitle: { 
    color: colores.C_TEXT, 
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: -0.3,
  },
  stateChangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  stateTextViejo: { 
    flex: 1,
    color: colores.C_TEXT2, 
    fontSize: 12, 
    fontWeight: '500',
  },
  arrowContainer: {
    backgroundColor: colores.C_SURFACE,
    padding: 4,
    borderRadius: 8,
  },
  stateTextNuevo: { 
    flex: 1,
    color: colores.C_PRIMARY, 
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'right',
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
  tipoTramite: {
      fontSize: 13,
      color: colores.C_TEXT2,
      fontWeight: "500",
    },
});