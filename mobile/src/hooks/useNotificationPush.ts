import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

export function useNotificacionesPush(onNotificationTap: () => void) {
  useEffect(() => {
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'Trámites de ARBA',
        importance: Notifications.AndroidImportance.MAX, 
        vibrationPattern: [0, 250, 250, 250], 
        lightColor: '#00bfa5', // El color primario de tu app para el LED del celular
      });
    }

    const subscripcionToque = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      console.log("Notificación tocada. Novedades:", data.novedades);

      onNotificationTap();
    });

    return () => {
      subscripcionToque.remove();
    };
  }, [onNotificationTap]);
}