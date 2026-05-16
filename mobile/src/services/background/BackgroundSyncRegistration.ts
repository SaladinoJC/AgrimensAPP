import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';
import { syncArbaHeadless } from '@/services/background/HeadlessSync';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const BACKGROUND_FETCH_TASK = 'background-sync-arba';


TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  try {
    await syncArbaHeadless();
    return BackgroundTask.BackgroundTaskResult.Success; 
  } 
  catch (error) {
    console.error("Fallo en la tarea de fondo:", error);
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

export const registerBackgroundSync = async (): Promise<void> => {
  const status = await BackgroundTask.getStatusAsync();
  console.log('BackgroundTask status:', status); // ← tiene que ser Available (2)

  const { status: notifStatus } = await Notifications.requestPermissionsAsync();
  if (notifStatus !== 'granted') {
    console.log("Permisos de notificación denegados.");
    return;
  }

  const alreadyRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_FETCH_TASK);
  console.log('Ya registrada?', alreadyRegistered);

  if (!alreadyRegistered) {
    await BackgroundTask.registerTaskAsync(BACKGROUND_FETCH_TASK, {
      minimumInterval: 15, // en minutos
    });
    console.log("Tarea registrada.");
  }
};
