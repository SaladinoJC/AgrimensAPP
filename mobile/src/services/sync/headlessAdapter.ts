import CookieManager from '@react-native-cookies/cookies';
import { CredencialesArba, RangoFechas, SyncError } from '@/services/sync/types';
import { parseTramitesFromPorFechaBuffer } from '@/services/sync/parserDsisic';

const ARBA_HOST = 'https://www16.arba.gov.ar';
const SSO_HOST  = 'https://sso.arba.gov.ar';

// Limpia todas las cookies de los dominios de ARBA
async function limpiarCookiesArba(): Promise<void> {
  try {
    await CookieManager.clearByName(ARBA_HOST, 'JSESSIONID');
    await CookieManager.clearByName(SSO_HOST, 'JSESSIONID');
    await CookieManager.clearByName(SSO_HOST, 'TGC');
    // O nuclear: borra todo
    // await CookieManager.clearAll();
  } catch (e) {
    console.log('Error limpiando cookies:', e);
  }
}

export async function logoutHeadless(): Promise<void> {
  try {
    await fetch(`${ARBA_HOST}/DSISIC/salir.do`, { method: 'GET' });
    await fetch(`${SSO_HOST}/Login/salir`, { method: 'GET' });
  } catch (e) {
    console.log("No se pudo cerrar la sesión remota.");
  } finally {
    // Siempre limpiamos las cookies, haya funcionado el logout o no
    await limpiarCookiesArba();
  }
}

export async function validarCredencialesHeadless(
  cuit: string, 
  cit: string, 
  signal?: AbortSignal
): Promise<void> {
  // Limpiamos ANTES de cada intento para arrancar desde cero
  await limpiarCookiesArba();
  
  try {
    const res1 = await fetch(`${ARBA_HOST}/DSISIC/`, { signal });
    const html1 = await res1.text();
    const ltMatch = html1.match(/name="lt"\s+value="([^"]+)"/);
    if (ltMatch) {
      const lt = ltMatch[1];
      const bodySSO = `version=2&CUIT=${cuit}&clave_Cuit=${cit}&username=${cuit}&password=${cit}&userComponent=CUIT&lt=${lt}`;
      const res2 = await fetch(res1.url, {
        method: 'POST',
        body: bodySSO,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        signal,
      });
      const html2 = await res2.text();
      if (html2.toLowerCase().includes('sso.arba.gov.ar/login')) {
        throw new SyncError('CREDENCIALES_INVALIDAS', 'Credenciales incorrectas o sesión expirada.');
      }
    }
  } catch (err: any) {
    if (err.name === 'AbortError') throw err;
    if (err instanceof SyncError) throw err;
    throw new SyncError('ARBA_NO_DISPONIBLE', 'No se pudo conectar a ARBA.');
  }
}

export async function sincronizarPorFechaHeadless(
  creds: CredencialesArba,
  rango: RangoFechas,
  signal?: AbortSignal
): Promise<any[]> {
  const { cuit, cit } = creds;
  if (!cuit || !cit) throw new SyncError('CREDENCIALES_INVALIDAS', 'Faltan credenciales.');

  try {
    await validarCredencialesHeadless(cuit, cit, signal); // ya limpia cookies al inicio
    await new Promise(r => setTimeout(r, 500));
    await fetch(`${ARBA_HOST}/DSISIC/asignarRol.do`, {
      method: 'POST',
      body: `metodo=asignarRol&usuario=${cuit}&rol=UsuarioExterno`,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      signal,
    });
    await new Promise(r => setTimeout(r, 500));
    await fetch(`${ARBA_HOST}/DSISIC/jsp/consultas/consultaFechas.jsp?metodo=porFechaPdoPdaJson`, { signal });

    const bodyFechas = `opcion=FEC&metodo=porFechaPdoPdaJson&tipoBusqueda=FEC&fechaDesde=${rango.desde}&fechaHasta=${rango.hasta}`;
    const resFechas = await fetch(`${ARBA_HOST}/DSISIC/PorFechaJson.do`, {
      method: 'POST',
      body: bodyFechas,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      signal,
    });

    if (!resFechas.ok) throw new SyncError('ARBA_NO_DISPONIBLE', `Error HTTP ${resFechas.status}`);
    const buffer = await resFechas.arrayBuffer();
    return parseTramitesFromPorFechaBuffer(buffer);
  } finally {
    await logoutHeadless(); // logout + limpieza de cookies siempre
  }
}