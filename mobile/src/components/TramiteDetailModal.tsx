import React, { useState } from "react";
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
import { X, FileText, User, Download, FileDigit } from "lucide-react-native";

import { TramiteDetail } from "@/tramites/tramites.type";
import { getStatusColor } from "@/utils/utils-tramite";
import { useTramiteArba } from "@/hooks/useTramiteArba";

import { useTheme } from "@/hooks/useTheme";
import { useStyles } from "@/hooks/useStyles";

import { CustomAlert, AlertVariant } from "@/components/ui/CustomAlert";
import { FileActionModal } from "@/components/ui/FileActionModal";

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
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: "",
    message: "",
    variant: "info" as AlertVariant,
  });
  const [fileMenuConfig, setFileMenuConfig] = useState<{
    visible: boolean;
    fileName: string;
    fileUri: string;
    mimeType: string;
  }>({ visible: false, fileName: "", fileUri: "", mimeType: "" });

  const showAlert = (
    title: string,
    message: string,
    variant: AlertVariant = "info",
  ) => {
    setAlertConfig({ visible: true, title, message, variant });
  };

  const handleFileReady = (
    fileName: string,
    fileUri: string,
    mimeType: string,
  ) => {
    setFileMenuConfig({ visible: true, fileName, fileUri, mimeType });
  };

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
    verDocumento,
    compartirDocumento,
  } = useTramiteArba(tramite?.nroExpediente, showAlert, handleFileReady); 

  const { colores } = useTheme();
  const styles = useStyles(createStyles);

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
            style={styles.closeButton}
            onPress={handleClose}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
          >
            <X size={24} color={colores.C_TEXT} />
          </TouchableOpacity>
        </View>

        {/* CONTENIDO PRINCIPAL */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* SECCIÓN EXPEDIENTE (Compacta y Horizontal) */}
          <View style={styles.expedienteSection}>
            <View style={styles.expedienteLeft}>
              <View style={styles.iconCircle}>
                <FileDigit
                  size={24}
                  color={colores.C_PRIMARY}
                  strokeWidth={2.5}
                />
              </View>
            </View>
            <View style={styles.expedienteRight}>
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
          </View>

          {/* Información Base (SQLite) */}
          <BasicInfoCards tramite={tramite} styles={styles} />

          {/* SECCIÓN: PROFESIONAL */}
          <View style={styles.actionSection}>
            <Text style={styles.sectionTitle}>Datos del Profesional</Text>

            {!detallesExtra && !cargandoDetalles && (
              <TouchableOpacity
                style={styles.lazyButton}
                onPress={cargarDetalles}
                activeOpacity={0.7}
              >
                <User size={20} color={colores.C_PRIMARY} />
                <Text style={styles.lazyButtonText}>
                  Consultar Profesional y Visado
                </Text>
              </TouchableOpacity>
            )}

            {cargandoDetalles && (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="small" color={colores.C_PRIMARY} />
                <Text style={styles.loadingText}>Conectando con ARBA...</Text>
              </View>
            )}

            {detallesExtra && (
              <View style={styles.extraDataBox}>
                <View style={styles.dataGridRow}>
                  <View style={styles.dataGridColFull}>
                    <Text style={styles.detailLabel}>Profesional Asignado</Text>
                    <Text style={styles.detailValueBold}>
                      {detallesExtra.profesional}
                    </Text>
                  </View>
                </View>
                <View style={[styles.dataGridRow, { marginBottom: 0 }]}>
                  <View style={styles.dataGridCol}>
                    <Text style={styles.detailLabel}>CUIT Profesional</Text>
                    <Text style={styles.detailValue}>{detallesExtra.cuit}</Text>
                  </View>
                  <View style={styles.dataGridCol}>
                    <Text style={styles.detailLabel}>Nro. Visado</Text>
                    <Text style={styles.detailValue}>
                      {detallesExtra.visado}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* SECCIÓN: ARCHIVOS */}
          <View style={[styles.actionSection, { marginBottom: 40 }]}>
            <Text style={styles.sectionTitle}>Documentación Adjunta</Text>

            {!archivos && !cargandoArchivos && (
              <TouchableOpacity
                style={styles.lazyButton}
                onPress={cargarArchivos}
                activeOpacity={0.7}
              >
                <FileText size={20} color={colores.C_PRIMARY} />
                <Text style={styles.lazyButtonText}>
                  Ver Archivos del Expediente
                </Text>
              </TouchableOpacity>
            )}

            {cargandoArchivos && (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="small" color={colores.C_PRIMARY} />
                <Text style={styles.loadingText}>Buscando documentos...</Text>
              </View>
            )}

            {archivos && archivos.length === 0 && (
              <View style={styles.emptyFilesBox}>
                <Text style={styles.emptyFilesText}>
                  No se encontraron archivos adjuntos para este expediente.
                </Text>
              </View>
            )}

            {archivos && archivos.length > 0 && (
              <View style={styles.filesContainer}>
                {archivos.map((archivo) => (
                  <TouchableOpacity
                    key={archivo.secuencia}
                    style={styles.fileCard}
                    onPress={() => procesarArchivo(archivo)}
                    activeOpacity={0.7}
                    disabled={descargandoId === archivo.secuencia}
                  >
                    <View style={styles.fileIconBox}>
                      <FileText size={22} color={colores.C_PRIMARY} />
                      <Text style={styles.fileExt}>
                        {archivo.extension.toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.fileInfo}>
                      <Text style={styles.fileName} numberOfLines={2}>
                        {archivo.descripcion}
                      </Text>
                      <Text style={styles.fileId}>
                        ID Archivo: {archivo.secuencia}
                      </Text>
                    </View>

                    <View style={styles.downloadAction}>
                      {descargandoId === archivo.secuencia ? (
                        <ActivityIndicator
                          size="small"
                          color={colores.C_PRIMARY}
                        />
                      ) : (
                        <Download size={20} color={colores.C_PRIMARY} />
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </ScrollView>

        <CustomAlert
          visible={alertConfig.visible}
          title={alertConfig.title}
          message={alertConfig.message}
          variant={alertConfig.variant}
          onConfirm={() =>
            setAlertConfig((prev) => ({ ...prev, visible: false }))
          }
        />
        <FileActionModal
          visible={fileMenuConfig.visible}
          fileName={fileMenuConfig.fileName}
          onView={() => {
            setFileMenuConfig((prev) => ({ ...prev, visible: false }));
            verDocumento(fileMenuConfig.fileUri, fileMenuConfig.mimeType);
          }}
          onShare={() => {
            setFileMenuConfig((prev) => ({ ...prev, visible: false }));
            compartirDocumento(fileMenuConfig.fileUri, fileMenuConfig.mimeType);
          }}
          onCancel={() =>
            setFileMenuConfig((prev) => ({ ...prev, visible: false }))
          }
        />
      </SafeAreaView>
    </Modal>
  );
};

const BasicInfoCards = ({
  tramite,
  styles,
}: {
  tramite: TramiteDetail;
  styles: any;
}) => (
  <View style={styles.detailCard}>
    {/* FILA COMPLETA 1: TIPO DE TRÁMITE */}
    <View style={styles.dataGridRow}>
      <View style={styles.dataGridColFull}>
        <Text style={styles.detailLabel}>Tipo de Trámite</Text>
        <Text style={styles.detailValueBold}>
          {tramite.tipo_tramite || "-"}
        </Text>
      </View>
    </View>

    {/* FILA COMPLETA 2: NOMENCLATURA */}
    <View style={styles.dataGridRow}>
      <View style={styles.dataGridColFull}>
        <Text style={styles.detailLabel}>Nomenclatura</Text>
        <Text style={styles.detailValue}>{tramite.nomenclatura || "-"}</Text>
      </View>
    </View>

    {/* GRILLAS DIVIDIDAS */}
    <View style={styles.dataGridRow}>
      <View style={styles.dataGridCol}>
        <Text style={styles.detailLabel}>Partido</Text>
        <Text style={styles.detailValue}>{tramite.partido || "-"}</Text>
      </View>
      <View style={styles.dataGridCol}>
        <Text style={styles.detailLabel}>Partida</Text>
        <Text style={styles.detailValue}>{tramite.partida || "-"}</Text>
      </View>
    </View>

    <View style={styles.dataGridRow}>
      <View style={styles.dataGridCol}>
        <Text style={styles.detailLabel}>Origen</Text>
        <Text style={styles.detailValue}>{tramite.origen || "-"}</Text>
      </View>
      <View style={styles.dataGridCol}>
        <Text style={styles.detailLabel}>Oblea</Text>
        <Text style={styles.detailValue}>{tramite.oblea || "-"}</Text>
      </View>
    </View>

    <View style={styles.dataGridRow}>
      <View style={styles.dataGridCol}>
        <Text style={styles.detailLabel}>Fecha Alta</Text>
        <Text style={styles.detailValue}>{tramite.fecha_alta || "-"}</Text>
      </View>
      <View style={styles.dataGridCol}>
        <Text style={styles.detailLabel}>Actualización</Text>
        <Text style={styles.detailValue}>
          {tramite.fecha_movimiento || "-"}
        </Text>
      </View>
    </View>

    <View style={styles.dataGridRow}>
      <View style={styles.dataGridCol}>
        <Text style={styles.detailLabel}>Demora</Text>
        <Text style={styles.detailValue}>{tramite.demora || "-"}</Text>
      </View>
      <View style={styles.dataGridCol}>
        <Text style={styles.detailLabel}>Final Estimada</Text>
        <Text style={styles.detailValue}>{tramite.final_estimada || "-"}</Text>
      </View>
    </View>

    {/* FILA COMPLETA 3: SINCRONIZACIÓN */}
    <View style={[styles.dataGridRow, { marginBottom: 0 }]}>
      <View style={styles.dataGridColFull}>
        <Text style={styles.detailLabel}>Última Sincronización</Text>
        <Text style={styles.detailValue}>
          {tramite.ultima_sincronizacion || "-"}
        </Text>
      </View>
    </View>
  </View>
);

const shadowBase = {
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.05,
  shadowRadius: 6,
  elevation: 2,
};

const createStyles = (colores: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colores.C_BG,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomColor: colores.C_CARD,
      borderBottomWidth: 1,
      backgroundColor: colores.C_BG,
    },
    headerTitle: {
      fontSize: 20,
      fontWeight: "800",
      color: colores.C_TEXT,
      letterSpacing: -0.5,
    },
    closeButton: {
      backgroundColor: colores.C_SURFACE,
      padding: 6,
      borderRadius: 20,
    },
    content: {
      flex: 1,
      padding: 16,
    },
    expedienteSection: {
      ...shadowBase,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: colores.C_CARD,
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colores.C_SURFACE,
    },
    expedienteLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    iconCircle: {
      backgroundColor: "rgba(0, 191, 165, 0.1)",
      padding: 10,
      borderRadius: 12,
    },
    expedienteRight: {
      flex: 1,
      marginLeft: 12,
      alignItems: "center",
    },
    expedienteNumber: {
      fontSize: 22,
      fontWeight: "900",
      color: colores.C_TEXT,
      letterSpacing: -0.5,
    },
    statusBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
    },
    statusText: {
      color: "#fff",
      fontWeight: "800",
      fontSize: 11,
      letterSpacing: 0.5,
    },
    // ---------------------------------------------------------
    sectionTitle: {
      fontSize: 16,
      fontWeight: "800",
      color: colores.C_TEXT,
      marginBottom: 12,
      letterSpacing: -0.3,
    },
    detailCard: {
      ...shadowBase,
      backgroundColor: colores.C_CARD,
      borderRadius: 16,
      padding: 20,
      marginBottom: 24,
      borderWidth: 1,
      borderColor: colores.C_SURFACE,
    },
    dataGridRow: {
      flexDirection: "row",
      marginBottom: 16,
      gap: 16,
    },
    dataGridCol: {
      flex: 1,
    },
    dataGridColFull: {
      flex: 1,
    },
    detailLabel: {
      fontSize: 11,
      color: colores.C_TEXT2,
      fontWeight: "700",
      marginBottom: 4,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    detailValue: {
      fontSize: 14,
      color: colores.C_TEXT,
      fontWeight: "500",
    },
    detailValueBold: {
      fontSize: 15,
      color: colores.C_TEXT,
      fontWeight: "800",
    },
    actionSection: {
      marginBottom: 24,
    },
    lazyButton: {
      backgroundColor: colores.C_SURFACE,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      padding: 16,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colores.C_PRIMARY,
      borderStyle: "dashed",
    },
    lazyButtonText: {
      color: colores.C_PRIMARY,
      fontWeight: "700",
      marginLeft: 10,
      fontSize: 14,
    },
    loadingBox: {
      backgroundColor: colores.C_SURFACE,
      padding: 20,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "row",
      gap: 12,
    },
    loadingText: {
      color: colores.C_TEXT2,
      fontWeight: "600",
      fontSize: 14,
    },
    extraDataBox: {
      backgroundColor: colores.C_SURFACE,
      padding: 20,
      borderRadius: 16,
      borderLeftWidth: 4,
      borderLeftColor: colores.C_PRIMARY,
    },
    filesContainer: {
      gap: 12,
    },
    emptyFilesBox: {
      backgroundColor: colores.C_SURFACE,
      padding: 20,
      borderRadius: 16,
      alignItems: "center",
    },
    emptyFilesText: {
      color: colores.C_TEXT2,
      fontSize: 14,
      textAlign: "center",
      fontStyle: "italic",
    },
    fileCard: {
      backgroundColor: colores.C_SURFACE,
      flexDirection: "row",
      alignItems: "center",
      padding: 12,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colores.C_CARD,
    },
    fileIconBox: {
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colores.C_CARD,
      width: 48,
      height: 48,
      borderRadius: 12,
    },
    fileExt: {
      color: colores.C_PRIMARY,
      fontSize: 10,
      fontWeight: "800",
      marginTop: 2,
    },
    fileInfo: {
      flex: 1,
      marginLeft: 12,
    },
    fileName: {
      color: colores.C_TEXT,
      fontSize: 14,
      fontWeight: "700",
      marginBottom: 4,
    },
    fileId: {
      color: colores.C_TEXT2,
      fontSize: 12,
      fontWeight: "500",
    },
    downloadAction: {
      padding: 10,
      backgroundColor: colores.C_CARD,
      borderRadius: 12,
      marginLeft: 8,
    },
  });
