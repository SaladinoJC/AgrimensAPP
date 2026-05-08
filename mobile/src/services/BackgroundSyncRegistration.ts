import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import * as Notifications from 'expo-notifications';
import { syncArbaHeadless } from './HeadlessSync';

export const BACKGROUND_FETCH_TASK = 'background-sync-arba';

let isTaskDefined = false;

const defineBackgroundSyncTask = () => {
  if (isTaskDefined) return;

  TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
    try {
      await syncArbaHeadless();
      return BackgroundFetch.BackgroundFetchResult.NewData;
    } catch {
      return BackgroundFetch.BackgroundFetchResult.Failed;
    }
  });

  isTaskDefined = true;
};

// Llama a defineBackgroundSyncTask en el scope global del módulo.
// Esto es CRÍTICO para que funcione en background real (headless),
// ya que los useEffect de React no se ejecutan cuando el OS despierta la app.
defineBackgroundSyncTask();

export const registerBackgroundSync = async (): Promise<void> => {

  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return;

  const alreadyRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_FETCH_TASK);
  if (alreadyRegistered) return;

  await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
    minimumInterval: 60 * 60 * 3, // 3 hours
    stopOnTerminate: false,
    startOnBoot: true,
  });
};
