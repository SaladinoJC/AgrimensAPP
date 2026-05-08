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
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { X, Share2, FileText } from 'lucide-react-native';

const C_BG = "#0f1724";
const C_SURFACE = "#182136";
const C_CARD = "#1e2a42";
const C_PRIMARY = "#00bfa5";
const C_ACCENT = "#4fc3f7";
const C_TEXT = "#eceff1";
const C_TEXT2 = "#90a4ae";
const C_GREEN = "#66bb6a";
const C_AMBER = "#ffca28";
const C_RED = "#ef5350";
const C_GREY = "#78909c";

interface TramiteDetail {
  nroExpediente: string;
  estado?: string;
  partido?: string;
  partida?: string;
  tipo_tramite?: string;
  nomenclatura?: string;
  fecha_alta?: string;
  fecha_movimiento?: string;
  origen?: string;
  oblea?: string;
  demora?: string;
  final_estimada?: string;
  ultima_sincronizacion?: string;
}

interface TramiteDetailModalProps {
  visible: boolean;
  tramite: TramiteDetail | null;
  onClose: () => void;
}

export const TramiteDetailModal: React.FC<TramiteDetailModalProps> = ({
  visible,
  tramite,
  onClose,
}) => {

  const getStatusColor = (status?: string) => {
    if (!status) return C_GREY;
    const upper = status.toUpperCase();
    if (upper.includes('FINALIZADO') || upper.includes('ENTREGADO')) return C_GREEN;
    if (upper.includes('RECHAZADO')) return C_RED;
    if (upper.includes('OBSERVADO') || upper.includes('PENDIENTE') || upper.includes('CURSO')) return C_AMBER;
    return C_ACCENT;
  };

  const getHTMLTemplate = () => {
    if (!tramite) return '';
    return `
      <html>
        <head>
          <meta charset="UTF-8" />
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; background: #ffffff; }
            h1 { color: #00bfa5; border-bottom: 2px solid #00bfa5; padding-bottom: 10px; }
            .detail-row { display: flex; margin: 10px 0; border-bottom: 1px solid #f0f0f0; padding-bottom: 5px; }
            .detail-label { font-weight: bold; width: 180px; color: #182136; }
            .detail-value { flex: 1; color: #0f1724; }
            .status-badge { 
              display: inline-block; 
              padding: 5px 10px; 
              border-radius: 5px; 
              background: ${getStatusColor(tramite.estado)}; 
              color: white; 
              font-weight: bold; 
            }
            .timestamp { font-size: 12px; color: #999; margin-top: 30px; text-align: right; font-style: italic; }
          </style>
        </head>
        <body>
          <h1>Detalle de Trámite</h1>
          <div class="detail-row"><div class="detail-label">Nº de Expediente:</div><div class="detail-value">${tramite.nroExpediente || '-'}</div></div>
          <div class="detail-row"><div class="detail-label">Estado:</div><div class="detail-value"><span class="status-badge">${tramite.estado || '-'}</span></div></div>
          <div class="detail-row"><div class="detail-label">Partido:</div><div class="detail-value">${tramite.partido || '-'}</div></div>
          <div class="detail-row"><div class="detail-label">Partida:</div><div class="detail-value">${tramite.partida || '-'}</div></div>
          <div class="detail-row"><div class="detail-label">Tipo de Trámite:</div><div class="detail-value">${tramite.tipo_tramite || '-'}</div></div>
          <div class="detail-row"><div class="detail-label">Nomenclatura:</div><div class="detail-value">${tramite.nomenclatura || '-'}</div></div>
          <div class="detail-row"><div class="detail-label">Fecha de Alta:</div><div class="detail-value">${tramite.fecha_alta || '-'}</div></div>
          <div class="detail-row"><div class="detail-label">Fecha del Estado:</div><div class="detail-value">${tramite.fecha_movimiento || '-'}</div></div>
          <div class="detail-row"><div class="detail-label">Origen:</div><div class="detail-value">${tramite.origen || '-'}</div></div>
          <div class="detail-row"><div class="detail-label">Oblea:</div><div class="detail-value">${tramite.oblea || '-'}</div></div>
          <div class="detail-row"><div class="detail-label">Demora:</div><div class="detail-value">${tramite.demora || '-'}</div></div>
          <div class="detail-row"><div class="detail-label">Fecha Final Estimada:</div><div class="detail-value">${tramite.final_estimada || '-'}</div></div>
          <div class="detail-row"><div class="detail-label">Última Sincronización:</div><div class="detail-value">${tramite.ultima_sincronizacion || '-'}</div></div>
          <p class="timestamp">Generado el: ${new Date().toLocaleString('es-AR')}</p>
        </body>
      </html>
    `;
  };

  // Abre el diálogo nativo para Ver/Guardar PDF
  const handlePrintPDF = async () => {
    try {
      await Print.printAsync({ html: getHTMLTemplate() });
    } catch (error) {
      console.error('Error viewing PDF:', error);
    }
  };

  // Genera el PDF en segundo plano y abre WhatsApp/Mail para compartir
  const handleSharePDF = async () => {
    try {
      const { uri } = await Print.printToFileAsync({ html: getHTMLTemplate() });
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Compartir Trámite',
      });
    } catch (error) {
      console.error('Error sharing PDF:', error);
    }
  };

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
            onPress={handlePrintPDF}
            activeOpacity={0.8}
          >
            <FileText size={20} color={C_BG} />
            <Text style={styles.buttonText}>VER PDF</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.button, styles.shareButton]} 
            onPress={handleSharePDF}
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