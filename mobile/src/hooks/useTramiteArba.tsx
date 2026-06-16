import { useState } from "react";
import { Alert, Platform } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as IntentLauncher from "expo-intent-launcher";
import { useStore } from "@/store/useStore";
import { ArchivoArba } from "@/services/sync/types";
import {
  obtenerArchivosDelTramite,
  obtenerDetallesDelTramite,
} from "@/services/sync/arbaService";
import { validarCredencialesHeadless } from "@/services/sync/headlessAdapter";
import { AlertVariant } from "@/components/ui/CustomAlert";

export const useTramiteArba = (
  nroExpediente?: string,
  showAlert?: (title: string, message: string, variant?: AlertVariant) => void,
  onFileReady?: (fileName: string, fileUri: string, mimeType: string) => void,
) => {
  const credenciales = useStore((state) => state.credenciales);

  const [detallesExtra, setDetallesExtra] = useState<any>(null);
  const [cargandoDetalles, setCargandoDetalles] = useState(false);

  const [archivos, setArchivos] = useState<ArchivoArba[] | null>(null);
  const [cargandoArchivos, setCargandoArchivos] = useState(false);

  const [descargandoId, setDescargandoId] = useState<number | null>(null);

  const notificarError = (titulo: string, mensaje: string) => {
    if (showAlert) {
      showAlert(titulo, mensaje, "danger");
    } else {
      Alert.alert(titulo, mensaje);
    }
  };

  const clearData = () => {
    setDetallesExtra(null);
    setArchivos(null);
  };

  const cargarDetalles = async () => {
    if (!nroExpediente) return;
    setCargandoDetalles(true);
    try {
      const data = await obtenerDetallesDelTramite(
        nroExpediente,
        credenciales.cuit,
        credenciales.cit,
      );
      setDetallesExtra(data);
    } catch (error) {
      notificarError(
        "Error de Conexión",
        "No se pudieron cargar los detalles adicionales del trámite.",
      );
    } finally {
      setCargandoDetalles(false);
    }
  };

  const cargarArchivos = async () => {
    if (!nroExpediente) return;
    setCargandoArchivos(true);
    try {
      const data = await obtenerArchivosDelTramite(
        nroExpediente,
        credenciales.cuit,
        credenciales.cit,
      );
      setArchivos(data);
    } catch (error) {
      notificarError(
        "Error al cargar",
        "No se pudieron cargar los documentos adjuntos.",
      );
    } finally {
      setCargandoArchivos(false);
    }
  };

  const verDocumento = async (uri: string, mimeType: string) => {
    if (Platform.OS === "android") {
      try {
        const contentUri = await FileSystem.getContentUriAsync(uri);
        await IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
          data: contentUri,
          flags: 1,
          type: mimeType,
        });
      } catch (e) {
        notificarError(
          "Aplicación no encontrada",
          "No tenés ninguna aplicación instalada para poder abrir este tipo de archivo.",
        );
      }
    } else {
      await Sharing.shareAsync(uri, {
        UTI:
          mimeType === "application/pdf"
            ? "com.adobe.pdf"
            : "public.zip-archive",
      });
    }
  };

  const compartirDocumento = async (uri: string, mimeType: string) => {
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        mimeType,
        dialogTitle: "Compartir documento",
      });
    }
  };

  const procesarArchivo = async (archivo: ArchivoArba) => {
    setDescargandoId(archivo.secuencia);
    console.log("Procesando archivo:", archivo);

    const nombreSeguro = archivo.descripcion.replace(/[^a-zA-Z0-9]/g, "_");

    // Agregamos el numeroTramite al nombre para evitar colisiones si varios tienen secuencia 0
    const nombreArchivo = `${nombreSeguro}_${archivo.numeroTramite}_${archivo.secuencia}_v2.${archivo.extension}`;
    const fileUri = `${FileSystem.documentDirectory}${nombreArchivo}`;
    const mimeType =
      archivo.extension === "pdf" ? "application/pdf" : "application/zip";

    try {
      const fileInfo = await FileSystem.getInfoAsync(fileUri);

      if (!fileInfo.exists) {
        await validarCredencialesHeadless(credenciales.cuit, credenciales.cit);

        // --- LÓGICA DE RUTEO DE URL ---
        let url = "";

        if (
          !archivo.carpeta ||
          archivo.descripcion === "Comprobante informativo"
        ) {
          // Endpoint especial para el comprobante informativo
          url = `https://www16.arba.gov.ar/DSISIC/consultaComprobanteInformativoJson.do?metodo=mostrarComprobante&nroTramite=${archivo.numeroTramite}`;
        } else {
          // Endpoint clásico para adjuntos (zips, pdfs normales)
          url = `https://www16.arba.gov.ar/DSISIC/obtenerAdjunto.do?metodo=obtenerAdjuntoVisualizar&nroTramite=${archivo.numeroTramite}&archAdjunto=${archivo.secuencia}&tipoArchivo=${archivo.tipo}&tipoExtension=${archivo.extension}&carpetaAplicacion=${archivo.carpeta}`;
        }

        const response = await fetch(url, {
          method: "GET",
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            Accept:
              "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
            Referer: "https://www16.arba.gov.ar/",
          },
        });

        const contentType = response.headers.get("content-type") || "";

        if (contentType.toLowerCase().includes("text/html") || !response.ok) {
          const errorHtml = await response.text();
          throw new Error("La sesión expiró o ARBA bloqueó la descarga.");
        }

        const blob = await response.blob();
        const base64data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onerror = reject;
          reader.onload = () => resolve(String(reader.result).split(",")[1]);
          reader.readAsDataURL(blob);
        });

        await FileSystem.writeAsStringAsync(fileUri, base64data, {
          encoding: "base64",
        });
      }

      if (onFileReady) {
        onFileReady(archivo.descripcion, fileUri, mimeType);
      }
    } catch (error: any) {
      notificarError(
        "Error de Descarga",
        error.message || "Hubo un problema al intentar descargar el documento.",
      );
    } finally {
      setDescargandoId(null);
    }
  };

  return {
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
  };
};
