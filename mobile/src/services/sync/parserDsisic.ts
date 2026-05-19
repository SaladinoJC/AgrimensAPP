import { SyncError } from '@/services/sync/types';

const JSON_ARRAY_REGEX = /(\[\s*\{.*\}\s*\])/s;

function seemsLoginOrSessionProblem(htmlLower: string): boolean {
  return (
    htmlLower.includes('sso.arba.gov.ar/login') ||
    htmlLower.includes('dsisic - ingreso usuario y password') ||
    htmlLower.includes('loginsso.jsp') ||
    htmlLower.includes('name="lt"') ||
    htmlLower.includes('dsisic-login') ||
    htmlLower.includes('opcioneslogin.jsp') ||
    htmlLower.includes('otro usuario ha iniciado una sesión')
  );
}

function seemsServerError(htmlLower: string): boolean {
  return (
    htmlLower.includes('fallo.jsp') ||
    htmlLower.includes('error inesperado') ||
    htmlLower.includes('ocurrió un error inesperado') ||
    htmlLower.includes('código de transacción')
  );
}

export function decodeIso88591(buffer: ArrayBuffer): string {
  // En React Native, TextDecoder no soporta 'iso-8859-1'.
  // Como ISO-8859-1 es un mapeo directo 1 a 1 con los primeros 256 caracteres de Unicode,
  // leemos byte por byte y lo convertimos a String.
  const bytes = new Uint8Array(buffer);
  let str = '';
  
  for (let i = 0; i < bytes.length; i++) {
    str += String.fromCharCode(bytes[i]);
  }
  
  return str;
}

export function extractJsonArrayStringFromHtml(html: string): string {
  const htmlLower = html.toLowerCase();
  if (seemsLoginOrSessionProblem(htmlLower)) {
    throw new SyncError('CREDENCIALES_INVALIDAS', 'ARBA/DSISIC devolvió pantalla de login/sesión. Verificar credenciales o sesión en uso.');
  }
  if (seemsServerError(htmlLower)) {
    throw new SyncError('ARBA_NO_DISPONIBLE', 'ARBA/DSISIC devolvió un error inesperado del servidor.');
  }

  const match = html.match(JSON_ARRAY_REGEX);
  if (!match?.[1]) {
    throw new SyncError('TECNICO', 'No se encontró JSON en la respuesta de ARBA/DSISIC.');
  }
  return match[1];
}

export function parseTramitesFromPorFechaHtml(html: string): any[] {
  const json = extractJsonArrayStringFromHtml(html);
  try {
    return JSON.parse(json);
  } catch {
    throw new SyncError('TECNICO', 'JSON inválido en respuesta de ARBA/DSISIC.');
  }
}

export function parseTramitesFromPorFechaBuffer(buffer: ArrayBuffer): any[] {
  return parseTramitesFromPorFechaHtml(decodeIso88591(buffer));
}

