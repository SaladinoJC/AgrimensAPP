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

export const useTramiteArba = (nroExpediente?: string) => {
  const credenciales = useStore((state) => state.credenciales);

  const [detallesExtra, setDetallesExtra] = useState<any>(null);
  const [cargandoDetalles, setCargandoDetalles] = useState(false);

  const [archivos, setArchivos] = useState<ArchivoArba[] | null>(null);
  const [cargandoArchivos, setCargandoArchivos] = useState(false);

  // Nuevo: Saber exactamente qué archivo se está descargando para la UI
  const [descargandoId, setDescargandoId] = useState<number | null>(null);

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
      Alert.alert("Error", "No se pudieron cargar los detalles adicionales.");
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
      Alert.alert("Error", "No se pudieron cargar los archivos.");
    } finally {
      setCargandoArchivos(false);
    }
  };

  // Funciones de acción nativas
  const verDocumento = async (uri: string, mimeType: string) => {
    if (Platform.OS === "android") {
      try {
        const contentUri = await FileSystem.getContentUriAsync(uri);
        await IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
          data: contentUri,
          flags: 1, // Permiso de lectura temporal
          type: mimeType,
        });
      } catch (e) {
        Alert.alert(
          "Error",
          "No tienes una aplicación para abrir este archivo.",
        );
      }
    } else {
      // En iOS Sharing actúa como visor previo excelente
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

    const nombreSeguro = archivo.descripcion.replace(/[^a-zA-Z0-9]/g, "_");
    const nombreArchivo = `${nombreSeguro}_${archivo.secuencia}_v2.${archivo.extension}`;

    // Usamos documentDirectory porque es más estable para enviar a otras apps que cacheDirectory
    const fileUri = `${FileSystem.documentDirectory}${nombreArchivo}`;
    const mimeType =
      archivo.extension === "pdf" ? "application/pdf" : "application/zip";

    try {
      const fileInfo = await FileSystem.getInfoAsync(fileUri);

      // Si no existe, lo descargamos de forma segura
      if (!fileInfo.exists) {
        await validarCredencialesHeadless(credenciales.cuit, credenciales.cit);
        const url = `https://www16.arba.gov.ar/DSISIC/obtenerAdjunto.do?metodo=obtenerAdjuntoVisualizar&nroTramite=${archivo.numeroTramite}&archAdjunto=${archivo.secuencia}&tipoArchivo=${archivo.tipo}&tipoExtension=${archivo.extension}&carpetaAplicacion=${archivo.carpeta}`;

        // 1. Engañamos a ARBA haciéndole creer que somos Google Chrome en Windows
        const response = await fetch(url, {
          method: "GET",
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            Accept:
              "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
            Referer: "https://www16.arba.gov.ar/", // Le decimos que venimos de su propia página
          },
        });

        // 2. Escudo Anti-Login y manejo de errores
        const contentType = response.headers.get("content-type") || "";

        if (contentType.toLowerCase().includes("text/html") || !response.ok) {
          // Si nos rebota, leemos el HTML y lo imprimimos para saber por qué falló
          const errorHtml = await response.text();
          console.log("🛑 ARBA DEVOLVIÓ HTML EN VEZ DEL ARCHIVO:");
          console.log(errorHtml.substring(0, 800)); // Imprimimos los primeros 800 caracteres

          throw new Error("La sesión expiró o ARBA bloqueó la descarga.");
        }

        // 3. Si pasamos el escudo, convertimos a base64
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

      // El archivo ya está local en el celular. Preguntamos qué hacer.
      Alert.alert(
        "Archivo Listo",
        `¿Qué deseas hacer con ${archivo.descripcion}?`,
        [
          {
            text: "Ver Documento",
            onPress: () => verDocumento(fileUri, mimeType),
          },
          {
            text: "Compartir",
            onPress: () => compartirDocumento(fileUri, mimeType),
          },
          { text: "Cancelar", style: "cancel" },
        ],
      );
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.message || "Hubo un problema con el documento.",
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
  };
};
