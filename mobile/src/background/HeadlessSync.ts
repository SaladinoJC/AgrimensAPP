import * as SecureStore from 'expo-secure-store';
import * as Notifications from 'expo-notifications';
import { upsertTramites } from '@/db/database';
import { normalizarRango } from '@/sync/sincronizacion';
import { sincronizarPorFechaHeadless } from '@/sync/headlessAdapter';
import { SyncError } from '@/sync/types';
import { tieneNovedades, textoNotificacionAgregada } from '@/novedades/policy';

export const syncArbaHeadless = async () => {
  try {
    const cuit = await SecureStore.getItemAsync('cuit');
    const cit = await SecureStore.getItemAsync('cit');
    if (!cuit || !cit) return;

    const rango = normalizarRango();

    const result = await sincronizarPorFechaHeadless({ cuit, cit }, rango);

    const novedades = await upsertTramites(result);

    if (tieneNovedades(novedades)) {
      const { title, body } = textoNotificacionAgregada(novedades);
      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: { novedades },
        },
        trigger: null,
      });
    }
   
  } catch (e) {
    const msg = e instanceof SyncError ? `${e.kind}: ${e.message}` : String(e);
    console.log("Background sync error:", msg);
  }
};
