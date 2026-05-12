import React from 'react';
import { View, Text, Modal, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { BellRing } from 'lucide-react-native';
import { Novedad } from '@/novedades/types';

const C_BG = "#0f1724";
const C_PRIMARY = "#00bfa5";
const C_AMBER = "#ffca28";
const C_CARD = "#1e2a42";
const C_TEXT = "#eceff1";
const C_TEXT2 = "#90a4ae";

interface NovedadesModalProps {
  novedades: Novedad[];
  onClose: () => void;
  onOpenNotificaciones: () => void;
}

export const NovedadesModal: React.FC<NovedadesModalProps> = ({ novedades, onClose, onOpenNotificaciones }) => {
  return (
    <Modal visible={novedades.length > 0} transparent animationType="slide">
      <View style={styles.modalBg}>
        <View style={[styles.modalContent, { maxHeight: '80%' }]}>
          <View style={styles.header}>
            <BellRing color={C_AMBER} size={24} style={styles.icon} />
            <Text style={styles.modalTitle}>¡Novedades!</Text>
          </View>

          <FlatList
            data={novedades}
            keyExtractor={(item) => item.nro}
            renderItem={({ item }) => (
              <View style={styles.novedadItem}>
                <Text style={styles.novedadTitle}>Trámite #{item.nro}</Text>
                <Text style={styles.novedadSubtitle}>De '{item.viejo}' a '{item.nuevo}'</Text>
              </View>
            )}
          />

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, alignItems: 'center' }}>
            <TouchableOpacity
              style={styles.btnPrimary}
              onPress={onClose}
            >
              <Text style={styles.btnText}>Cerrar</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.btnPrimary} onPress={onOpenNotificaciones}>
              <Text style={styles.btnText}>Ver Novedades</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: C_CARD, borderRadius: 12, padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  icon: { marginRight: 8 },
  modalTitle: { color: C_TEXT, fontSize: 18, fontWeight: 'bold' },
  btnPrimary: { backgroundColor: C_PRIMARY, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8, alignItems: 'center', marginTop: 16, alignSelf: 'flex-end' },
  btnText: { color: C_BG, fontWeight: 'bold' },
  novedadItem: { backgroundColor: C_BG, padding: 12, borderRadius: 8, marginBottom: 8 },
  novedadTitle: { color: C_TEXT, fontWeight: 'bold' },
  novedadSubtitle: { color: C_TEXT2, fontSize: 12 }
});