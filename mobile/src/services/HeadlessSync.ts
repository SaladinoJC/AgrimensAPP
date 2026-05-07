import * as SecureStore from 'expo-secure-store';
import * as Notifications from 'expo-notifications';
import { upsertTramites } from '../db/database';

export const syncArbaHeadless = async () => {
  try {
    const cuit = await SecureStore.getItemAsync('cuit');
    const cit = await SecureStore.getItemAsync('cit');
    if (!cuit || !cit) return;

    // React Native's fetch automatically handles cookies natively.
    // 1. GET inicial a DSISIC
    const res1 = await fetch('https://www16.arba.gov.ar/DSISIC/');
    const html1 = await res1.text();
    const ltMatch = html1.match(/name="lt"\s+value="([^"]+)"/);
    
    // If we find "lt", we are at the login screen
    if (ltMatch) {
      const lt = ltMatch[1];
      const bodySSO = `version=2&CUIT=${cuit}&clave_Cuit=${cit}&USER=&clave_Host=&DOMAIN=&clave_Dominio=&lt=${lt}&username=${cuit}&password=${cit}&userComponent=CUIT`;

      // 2. POST login al SSO
      const res2 = await fetch(res1.url, {
        method: 'POST',
        body: bodySSO,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      
      // 3. Asignar Rol
      await fetch('https://www16.arba.gov.ar/DSISIC/asignarRol.do', {
        method: 'POST',
        body: `metodo=asignarRol&usuario=${cuit}&rol=UsuarioExterno`,
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
    }

    // Now we should be authenticated (either by previous cookies or fresh login)
    const today = new Date();
    const yearAgo = new Date();
    yearAgo.setFullYear(today.getFullYear() - 1);
    const strHasta = today.toISOString().split('T')[0];
    const strDesde = yearAgo.toISOString().split('T')[0];

    await fetch('https://www16.arba.gov.ar/DSISIC/jsp/consultas/consultaFechas.jsp?metodo=porFechaPdoPdaJson');
    
    const bodyFechas = `opcion=FEC&metodo=porFechaPdoPdaJson&tipoBusqueda=FEC&fechaDesde=${strDesde}&fechaHasta=${strHasta}`;
    const resFechas = await fetch('https://www16.arba.gov.ar/DSISIC/PorFechaJson.do', {
      method: 'POST',
      body: bodyFechas,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const buffer = await resFechas.arrayBuffer();
    const htmlFechas = new TextDecoder('iso-8859-1').decode(buffer);
    
    const match = htmlFechas.match(/(\\[\\s*\\{.*\\}\\s*\\])/s);
    if (match && match[1]) {
      const rows = JSON.parse(match[1]);
      const novedades = await upsertTramites(rows);
      
      if (novedades.length > 0) {
        // Enviar notificación al celular de forma local
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "¡Novedades en ARBA! 🔔",
            body: `Se actualizaron los estados de ${novedades.length} trámite(s).`,
            data: { novedades },
          },
          trigger: null, // Manda la notificación inmediatamente
        });
      }
    }
  } catch (e) {
    console.log("Background sync error:", e);
  }
};
