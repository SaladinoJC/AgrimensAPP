import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Share2, FileText } from 'lucide-react-native';
import { TramiteDetail } from '@/types/tramites-type';
import { handlePrintPDF, handleSharePDF } from '@/tramites/ReportePDF';
import { getStatusColor } from '@/utils/utils-tramite';

const C_BG = "#0f1724";
const C_SURFACE = "#182136";
const C_CARD = "#1e2a42";
const C_PRIMARY = "#00bfa5";
const C_TEXT = "#eceff1";
const C_TEXT2 = "#90a4ae";


interface TramiteDetailModalProps {
  visible: boolean;
  tramite: TramiteDetail;
  onClose: () => void;
}

export const TramiteDetailModal: React.FC<TramiteDetailModalProps> = ({
  visible,
  tramite,
  onClose,
}) => {

  if (!tramite) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Detalle del Trámite</Text>
          <TouchableOpacity 
            onPress={onClose}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
            activeOpacity={0.7}
          >
            <X size={28} color={C_TEXT} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.expedienteSection}>
            <Text style={styles.expedienteNumber}>#{tramite.nroExpediente}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(tramite.estado) }]}>
              <Text style={styles.statusText}>{tramite.estado || 'SIN ESTADO'}</Text>
            </View>
          </View>

          <View style={styles.detailCard}>
            <DetailRow label="Partido" value={tramite.partido} />
            <DetailRow label="Partida" value={tramite.partida} />
            <DetailRow label="Tipo de Trámite" value={tramite.tipo_tramite} />
            <DetailRow label="Nomenclatura" value={tramite.nomenclatura} />
          </View>

          <View style={styles.detailCard}>
            <DetailRow label="Fecha de Alta" value={tramite.fecha_alta} />
            <DetailRow label="Fecha del Estado" value={tramite.fecha_movimiento} />
            <DetailRow label="Demora" value={tramite.demora} />
            <DetailRow label="Fecha Final Estimada" value={tramite.final_estimada} />
          </View>

          <View style={styles.detailCard}>
            <DetailRow label="Origen" value={tramite.origen} />
            <DetailRow label="Oblea" value={tramite.oblea} />
            <DetailRow label="Última Sincronización" value={tramite.ultima_sincronizacion} />
          </View>
        </ScrollView>

        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.button, styles.pdfButton]} 
            onPress={() => handlePrintPDF(tramite)}
            activeOpacity={0.8}
          >
            <FileText size={20} color={C_BG} />
            <Text style={styles.buttonText}>VER PDF</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.shareButton]} 
            onPress={() => handleSharePDF(tramite)}
            activeOpacity={0.8}
          >
            <Share2 size={20} color={C_TEXT} />
            <Text style={[styles.buttonText, { color: C_TEXT }]}>COMPARTIR</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

interface DetailRowProps {
  label: string;
  value?: string;
}

const DetailRow: React.FC<DetailRowProps> = ({ label, value }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value || '-'}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C_BG,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomColor: C_CARD,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: C_TEXT,
  },
  content: {
    flex: 1,
    padding: 12,
  },
  expedienteSection: {
    backgroundColor: C_CARD,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  expedienteNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: C_PRIMARY,
    marginBottom: 12,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  detailCard: {
    backgroundColor: C_CARD,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  detailRow: {
    marginVertical: 4,
    paddingVertical: 4,
    borderBottomColor: C_SURFACE,
    borderBottomWidth: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: C_TEXT2,
    fontWeight: '600',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    color: C_TEXT,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  pdfButton: {
    backgroundColor: C_PRIMARY,
  },
  shareButton: {
    backgroundColor: C_SURFACE,
  },
  buttonText: {
    color: C_BG,
    fontWeight: 'bold',
    fontSize: 14,
  },
});