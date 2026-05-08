import { CredencialesArba, RangoFechas, SyncError } from './types';
import { parseTramitesFromPorFechaBuffer } from './parserDsisic';

export async function sincronizarPorFechaHeadless(
  creds: CredencialesArba,
  rango: RangoFechas
): Promise<any[]> {
  const { cuit, cit } = creds;
  if (!cuit || !cit) throw new SyncError('CREDENCIALES_INVALIDAS', 'Faltan credenciales ARBA.');

  // 1. GET inicial a DSISIC (cookie jar nativo RN)
  let res1: Response;
  try {
    res1 = await fetch('https://www16.arba.gov.ar/DSISIC/');
  } catch {
    throw new SyncError('ARBA_NO_DISPONIBLE', 'No se pudo conectar a ARBA/DSISIC.');
  }

  const html1 = await res1.text();
  const ltMatch = html1.match(/name="lt"\s+value="([^"]+)"/);

  // 2. Si aparece login SSO, hacer POST de credenciales
  if (ltMatch) {
    const lt = ltMatch[1];
    const bodySSO =
      `version=2&CUIT=${cuit}&clave_Cuit=${cit}&USER=&clave_Host=&DOMAIN=&clave_Dominio=&lt=${lt}` +
      `&username=${cuit}&password=${cit}&userComponent=CUIT`;

    const res2 = await fetch(res1.url, {
      method: 'POST',
      body: bodySSO,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });

    const html2 = await res2.text();
    if (html2.toLowerCase().includes('sso.arba.gov.ar/login')) {
      throw new SyncError('CREDENCIALES_INVALIDAS', 'Credenciales incorrectas o sesión expirada.');
    }

    // 3. Asignar rol (mejor esfuerzo)
    await fetch('https://www16.arba.gov.ar/DSISIC/asignarRol.do', {
      method: 'POST',
      body: `metodo=asignarRol&usuario=${cuit}&rol=UsuarioExterno`,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    });
  }

  // 4. Inicializar pantalla de fechas (mejor esfuerzo)
  await fetch(
    'https://www16.arba.gov.ar/DSISIC/jsp/consultas/consultaFechas.jsp?metodo=porFechaPdoPdaJson'
  );

  // 5. POST consulta por fechas
  const bodyFechas =
    `opcion=FEC&metodo=porFechaPdoPdaJson&tipoBusqueda=FEC` +
    `&fechaDesde=${rango.desde}&fechaHasta=${rango.hasta}`;

  const resFechas = await fetch('https://www16.arba.gov.ar/DSISIC/PorFechaJson.do', {
    method: 'POST',
    body: bodyFechas,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });

  if (!resFechas.ok) {
    throw new SyncError('ARBA_NO_DISPONIBLE', `ARBA/DSISIC respondió ${resFechas.status}.`);
  }

  const buffer = await resFechas.arrayBuffer();
  return parseTramitesFromPorFechaBuffer(buffer);
}

