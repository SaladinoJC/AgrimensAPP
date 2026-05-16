import React, { useEffect, useState } from 'react';
import { View, Text, Modal, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Trash2, X, ChevronRight } from 'lucide-react-native';
import Reanimated, { useAnimatedStyle } from 'react-native-reanimated';
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import type { SharedValue } from 'react-native-reanimated';
import { getNotificaciones, clearNotificaciones, deleteNotificacionById, getTramiteByNro } from '@/db/database';
import { TramiteDetail } from '@/types/tramites-type';
import { TramiteDetailModal } from '@/components/ui/TramiteDetailModal';

const C_BG = "#0f1724";
const C_PRIMARY = "#00bfa5";
const C_CARD = "#1e2a42";
const C_TEXT = "#eceff1";
const C_TEXT2 = "#90a4ae";

// Acción que aparece al deslizar a la izquierda
function DeleteAction(prog: SharedValue<number>, drag: SharedValue<number>, onDelete: () => void) {
  const styleAnimation = useAnimatedStyle(() => ({
    transform: [{ translateX: drag.value + 72 }], // 72 = ancho del botón
  }));

  return (
    <Reanimated.View style={[styles.deleteContainer, styleAnimation]}>
      <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
        <Trash2 color="#fff" size={22} />
      </TouchableOpacity>
    </Reanimated.View>
  );
}

interface NotificacionesScreenProps {
  visible: boolean;
  onClose: () => void;
}

export const NotificacionesScreen = ({ visible, onClose }: NotificacionesScreenProps) => {
  const [historial, setHistorial] = useState<any[]>([]);
  const [selectedTramite, setSelectedTramite] = useState<TramiteDetail | null>(null);

  useEffect(() => {
    if (visible) cargarNotificaciones();
  }, [visible]);

  const cargarNotificaciones = async () => {
    const data = await getNotificaciones();
    setHistorial(data);
  };

  const handleClear = () => {
    Alert.alert("Limpiar Notificaciones", "¿Seguro que quieres borrar el historial?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Borrar Todo", style: "destructive", onPress: async () => {
          await clearNotificaciones();
          setHistorial([]);
        }
      }
    ]);
  };

  const handleDeleteOne = async (id: number) => {
    await deleteNotificacionById(id);
    setHistorial(prev => prev.filter(n => n.id !== id));
  };

  const onOpenTramite = async (nroExpediente: string) => {
    try {
      const tramite = await getTramiteByNro(nroExpediente);
      if (tramite) {
        setSelectedTramite(tramite);
      } else {
        Alert.alert("Aviso", "Este trámite ya no se encuentra en la base de datos.");
      }
    } catch (error) {
      console.error("Error al cargar el trámite:", error);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}><X color={C_TEXT} size={28} /></TouchableOpacity>
          <Text style={styles.title}>Centro de Novedades</Text>
          <TouchableOpacity onPress={handleClear}><Trash2 color="#ef5350" size={24} /></TouchableOpacity>
        </View>

        {historial.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No tienes notificaciones recientes.</Text>
          </View>
        ) : (
          <FlatList
            data={historial}
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <Swipeable
                friction={2}
                overshootRight={false}
                rightThreshold={40}
                renderRightActions={(prog, drag) =>
                  DeleteAction(prog, drag, () => handleDeleteOne(item.id))
                }
              >
                <TouchableOpacity
                  style={styles.card}
                  onPress={() => onOpenTramite(item.nroExpediente)}
                >
                  <View>
                    <Text style={styles.cardTitle}>Expediente #{item.nroExpediente}</Text>
                    <Text style={styles.cardSubtitle}>De '{item.viejo_estado}' a '{item.nuevo_estado}'</Text>
                  </View>
                  <ChevronRight color={C_PRIMARY} size={20} />
                </TouchableOpacity>
              </Swipeable>
            )}
          />
        )}

        {selectedTramite && (
          <TramiteDetailModal
            visible={!!selectedTramite}
            tramite={selectedTramite}
            onClose={() => setSelectedTramite(null)}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C_BG },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: C_CARD, alignItems: 'center' },
  title: { color: C_TEXT, fontSize: 18, fontWeight: 'bold' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { color: C_TEXT2, fontSize: 16 },
  card: { flexDirection: 'row', backgroundColor: C_CARD, marginHorizontal: 16, marginTop: 12, padding: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { color: C_TEXT, fontWeight: 'bold', fontSize: 16, marginBottom: 4 },
  cardSubtitle: { color: C_TEXT2, fontSize: 13 },
  deleteContainer: { width: 72, marginTop: 12, marginRight: 16, justifyContent: 'center', alignItems: 'center' },
  deleteButton: { backgroundColor: '#ef5350', width: 56, height: '100%', borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
});