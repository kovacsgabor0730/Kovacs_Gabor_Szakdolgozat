import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { scheduleIdCardExpiryNotification } from '../utils/notificationHelper';

/**
 * Az igazolvány lejárati idő ellenőrzésére szolgáló háttérfolyamat egyedi azonosítója.
 */
const EXPIRY_CHECK_TASK = 'EXPIRY_CHECK_TASK';

/**
 * Háttérfolyamat definiálása, amely ellenőrzi az igazolványok lejárati idejét és értesítéseket ütemez.
 * A folyamat lekéri a tárolt lejárati dátumot és szükség esetén értesítést ütemez.
 */
TaskManager.defineTask(EXPIRY_CHECK_TASK, async () => {
    try {
      console.log('[Background] Starting ID card expiry check task');
      
      // Lekérjük az utolsó mentett lejárati dátumot
      const storedExpiryDate = await AsyncStorage.getItem('idCardExpiryDate');
      
      if (storedExpiryDate) {
        const expiryDate = new Date(storedExpiryDate);
        
        // Ellenőrizzük, hogy érvényes-e a dátum
        if (isNaN(expiryDate.getTime())) {
          console.error('[Background] Invalid expiry date:', storedExpiryDate);
          return TaskManager.TaskExecutionResult.FAILURE;
        }
        
        console.log('[Background] Retrieved expiry date:', expiryDate);
        
        await scheduleIdCardExpiryNotification(expiryDate);
        
        console.log('[Background] Expiry notification scheduled for:', expiryDate);
      } else {
        console.log('[Background] No expiry date found, skipping notification');
      }
      
      return TaskManager.TaskExecutionResult.SUCCESS;
    } catch (error) {
      console.error('[Background] Error in expiry check task:', error);
      return TaskManager.TaskExecutionResult.FAILURE;
    }
  });

/**
 * Regisztrálja az igazolvány lejárati idő ellenőrző folyamatot, hogy naponta egyszer fusson.
 * A folyamat ellenőrzi a hamarosan lejáró igazolványokat és értesítéseket ütemez.
 * 
 * @returns {Promise<void>} Egy Promise, amely sikeres regisztráció esetén teljesül.
 */
export async function registerExpiryCheckTask() {
  try {
    await TaskManager.registerTaskAsync(EXPIRY_CHECK_TASK, {
      frequency: TaskManager.TaskManagerAvailabilityResult.AVAILABLE ? 
                 TaskManager.TaskFrequency.DAILY : undefined,
      minimumInterval: 60 * 60 * 24, // 24 óránként minimum
    });
    
    console.log('Expiry check task registered successfully');
  } catch (error) {
    console.error('Failed to register expiry check task:', error);
  }
}

/**
 * Leiratkoztatja az igazolvány lejárati idő ellenőrző folyamatot, leállítva minden jövőbeli ellenőrzést.
 * 
 * @returns {Promise<void>} Egy Promise, amely sikeres leiratkoztatás esetén teljesül.
 */
export async function unregisterExpiryCheckTask() {
  try {
    await TaskManager.unregisterTaskAsync(EXPIRY_CHECK_TASK);
    console.log('Expiry check task unregistered successfully');
  } catch (error) {
    console.error('Failed to unregister expiry check task:', error);
  }
}