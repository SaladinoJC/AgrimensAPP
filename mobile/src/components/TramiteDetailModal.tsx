import React from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { X, FileText, User, Download, Share2 } from "lucide-react-native";
import { TramiteDetail } from "@/tramites/tramites.type";
import { getStatusColor } from "@/utils/utils-tramite";
import { useTramiteArba } from "@/hooks/useTramiteArba"; 

const C_BG = "#0f1724";
const C_SURFACE = "#182136";
const C_CARD = "#1e2a42";
const C_PRIMARY = "#00bfa5";
const C_TEXT = "#eceff1";
const C_TEXT2 = "#90a4ae";

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
  const {
    detallesExtra,
    cargandoDetalles,
    cargarDetalles,
    archivos,
    cargandoArchivos,
    cargarArchivos,
    procesarArchivo,
    descargandoId,
    clearData,
  } = useTramiteArba(tramite?.nroExpediente);

  const handleClose = () => {
    clearData();
    onClose();
  };

  if (!tramite) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.container}>
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Detalle del Trámite</Text>
          <TouchableOpacity
            onPress={handleClose}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          >
            <X size={28} color={C_TEXT} />
          </TouchableOpacity>
        </View>

        {/* CONTENIDO PRINCIPAL */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.expedienteSection}>
            <Text style={styles.expedienteNumber}>
              #{tramite.nroExpediente}
            </Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(tramite.estado) },
              ]}
            >
              <Text style={styles.statusText}>
                {tramite.estado || "SIN ESTADO"}
              </Text>
            </View>
          </View>

          {/* Información Base (SQLite) extraída a un sub-componente abajo */}
          <BasicInfoCards tramite={tramite} />

          {/* SECCIÓN DINÁMICA: PROFESIONAL */}
          <View style={styles.actionSection}>
            {!detallesExtra && !cargandoDetalles && (
              <TouchableOpacity
                style={styles.lazyButton}
                onPress={cargarDetalles}
              >
                <User size={20} color={C_PRIMARY} />
                <Text style={styles.lazyButtonText}>
                  Cargar Profesional y Visado
                </Text>
              </TouchableOpacity>
            )}

            {cargandoDetalles && (
              <ActivityIndicator
                size="small"
                color={C_PRIMARY}
                style={{ marginVertical: 10 }}
              />
            )}

            {detallesExtra && (
              <View style={styles.extraDataBox}>
                <Text style={styles.detailLabel}>Profesional Asignado</Text>
                <Text style={styles.detailValue}>
                  {detallesExtra.profesional}
                </Text>
                <View style={{ flexDirection: "row", marginTop: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.detailLabel}>CUIT Profesional</Text>
                    <Text style={styles.detailValue}>{detallesExtra.cuit}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.detailLabel}>Nro. Visado</Text>
                    <Text style={styles.detailValue}>
                      {detallesExtra.visado}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* SECCIÓN DINÁMICA: ARCHIVOS */}
          <View style={[styles.actionSection, { marginBottom: 30 }]}>
            {!archivos && !cargandoArchivos && (
              <TouchableOpacity
                style={styles.lazyButton}
                onPress={cargarArchivos}
              >
                <FileText size={20} color={C_PRIMARY} />
                <Text style={styles.lazyButtonText}>Ver Archivos Adjuntos</Text>
              </TouchableOpacity>
            )}

            {cargandoArchivos && (
              <ActivityIndicator
                size="small"
                color={C_PRIMARY}
                style={{ marginVertical: 10 }}
              />
            )}

            {archivos && archivos.length === 0 && (
              <Text
                style={[
                  styles.detailLabel,
                  { textAlign: "center", marginVertical: 10 },
                ]}
              >
                No hay archivos adjuntos.
              </Text>
            )}

            {archivos && archivos.length > 0 && (
              <View style={{ marginTop: 10 }}>
                <Text style={[styles.detailLabel, { marginBottom: 10 }]}>
                  Documentos ({archivos.length})
                </Text>
                {archivos.map((archivo) => (
                  <TouchableOpacity
                    key={archivo.secuencia}
                    style={styles.fileCard}
                    onPress={() => procesarArchivo(archivo)} // <-- Llamas a la nueva función
                    activeOpacity={0.7}
                    disabled={descargandoId === archivo.secuencia} // Deshabilita mientras descarga
                  >
                    <View style={styles.fileIconBox}>
                      <FileText size={24} color={C_PRIMARY} />
                      <Text style={styles.fileExt}>
                        {archivo.extension.toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 15 }}>
                      <Text style={styles.fileName}>{archivo.descripcion}</Text>
                      <Text style={styles.detailLabel}>
                        ID: {archivo.secuencia}
                      </Text>
                    </View>

                    {/* Mostrar spinner solo en el archivo que se está descargando */}
                    {descargandoId === archivo.secuencia ? (
                      <ActivityIndicator size="small" color={C_PRIMARY} />
                    ) : (
                      <Download size={20} color={C_TEXT2} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

// ==========================================
// SUB-COMPONENTES LOCALES (LIMPIEZA DE CÓDIGO)
// ==========================================

const BasicInfoCards = ({ tramite }: { tramite: TramiteDetail }) => (
  <>
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
      <DetailRow
        label="Última Sincronización"
        value={tramite.ultima_sincronizacion}
      />
    </View>
  </>
);

const DetailRow = ({ label, value }: { label: string; value?: string }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={styles.detailValue}>{value || "-"}</Text>
  </View>
);

// ==========================================
// ESTILOS (IGUALES A TU VERSIÓN ANTERIOR)
// ==========================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C_BG },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomColor: C_CARD,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 20, fontWeight: "bold", color: C_TEXT },
  content: { flex: 1, padding: 12 },
  expedienteSection: {
    backgroundColor: C_CARD,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: "center",
  },
  expedienteNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: C_PRIMARY,
    marginBottom: 12,
  },
  statusBadge: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20 },
  statusText: { color: "#fff", fontWeight: "bold", fontSize: 14 },
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
    fontWeight: "600",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  detailValue: { fontSize: 14, color: C_TEXT },
  actionSection: { marginTop: 10 },
  lazyButton: {
    backgroundColor: C_SURFACE,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C_CARD,
  },
  lazyButtonText: {
    color: C_PRIMARY,
    fontWeight: "bold",
    marginLeft: 10,
    fontSize: 15,
  },
  extraDataBox: {
    backgroundColor: C_CARD,
    padding: 15,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: C_PRIMARY,
  },
  fileCard: {
    backgroundColor: C_CARD,
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: C_SURFACE,
  },
  fileIconBox: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C_SURFACE,
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  fileExt: { color: C_PRIMARY, fontSize: 10, fontWeight: "bold", marginTop: 2 },
  fileName: {
    color: C_TEXT,
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 4,
  },
  actionButtons: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: C_CARD,
    backgroundColor: C_BG,
  },
  button: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  pdfButton: { backgroundColor: C_PRIMARY },
  shareButton: { backgroundColor: C_SURFACE },
  buttonText: { color: C_BG, fontWeight: "bold", fontSize: 14 },
});
