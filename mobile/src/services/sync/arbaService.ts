import { validarCredencialesHeadless } from "./headlessAdapter";
import { ArchivoArba } from "./types";

export async function obtenerDetallesDelTramite(
  nroExpediente: string,
  cuit: string,
  cit: string,
) {
  try {
    // 1. Iniciamos sesión silenciosamente para obtener las cookies nativas
    await validarCredencialesHeadless(cuit, cit);

    await new Promise((r) => setTimeout(r, 300));
    await fetch(`https://www16.arba.gov.ar/DSISIC/asignarRol.do`, {
      method: "POST",
      body: `metodo=asignarRol&usuario=${cuit}&rol=UsuarioExterno`,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });

    // 2. Hacemos la petición
    const url = `https://www16.arba.gov.ar/DSISIC/PorTramiteJson.do?metodo=detalleporNroTramiteJson&nroTramite=${nroExpediente}&usuarioConsulta=E`;
    const response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
    });
    const text = await response.text();
    
    // ESCUDO: Si la respuesta empieza con "<", ARBA nos rebotó al login
    if (text.trim().startsWith("<")) {
      throw new Error("ARBA rechazó la sesión y devolvió HTML.");
    }

    let data = JSON.parse(text);
    
    if (typeof data === "string") {
      data = JSON.parse(data);
    }
    
    if (data && data.length > 0) {
      const detalle = data[0];
      return {
        profesional: detalle["Profesional"]
          ? detalle["Profesional"].trim()
          : "No especificado",
        cuit: detalle["CUIT profesional"] || "No especificado",
        visado: detalle["Visado"] || "No especificado",
      };
    }

    return null;
  } catch (error) {
    console.error("Error obteniendo detalles de ARBA:", error);
    throw error;
  }
}
export async function obtenerArchivosDelTramite(
  nroExpediente: string,
  cuit: string,
  cit: string,
): Promise<ArchivoArba[]> {
  try {
    // 1. Iniciamos sesión silenciosamente para obtener las cookies nativas
    await validarCredencialesHeadless(cuit, cit);

    // 2. Hacemos la petición
    const url = `https://www16.arba.gov.ar/DSISIC/PorTramiteJson.do?metodo=listaArchivosporNroTramiteJson&nroTramite=${nroExpediente}`;
    const response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    const text = await response.text();

    // ESCUDO
    if (text.trim().startsWith("<")) {
      throw new Error("ARBA rechazó la sesión y devolvió HTML.");
    }
    let data = JSON.parse(text);
    if (typeof data === "string") {
      data = JSON.parse(data);
    }
    return data as ArchivoArba[];
  } catch (error) {
    console.error("Error obteniendo archivos:", error);
    throw error;
  }
}