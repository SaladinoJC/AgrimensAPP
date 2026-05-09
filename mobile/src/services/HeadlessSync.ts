import * as SecureStore from 'expo-secure-store';
import * as Notifications from 'expo-notifications';
import { upsertTramites } from '../db/database';
import { normalizarRango, sincronizarPorFecha } from '../sync/sincronizacion';
import { SyncError } from '../sync/types';
import { tieneNovedades, textoNotificacionAgregada } from '../novedades/policy';

export const syncArbaHeadless = async () => {
  try {
    const cuit = await SecureStore.getItemAsync('cuit');
    const cit = await SecureStore.getItemAsync('cit');
    if (!cuit || !cit) return;

    const rango = normalizarRango();
    const result = await sincronizarPorFecha({ cuit, cit }, rango);
    if (!result.ok) {
      throw result.error;
    }

    const novedades = await upsertTramites(result.rows);

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
