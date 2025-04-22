import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

// Értesítések beállítása (előtérben és háttérben is)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Push notification token regisztrálása
export async function registerForPushNotificationsAsync() {
  let token;
  
  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Failed to get push token for push notification!');
      return;
    }
    
    // Expo push token létrehozása
    token = await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig.extra.eas.projectId,
    });
    
    console.log('Push notification token:', token);
    
    // Token mentése AsyncStorage-ba
    await AsyncStorage.setItem('pushToken', token.data);
    
    // Token regisztrálása a szerveren
    await registerTokenWithServer(token.data);
  } else {
    console.log('Must use physical device for Push Notifications');
  }

  // Android-specifikus beállítások
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  return token;
}

// Token regisztrálása a szerverünkön
async function registerTokenWithServer(token: string) {
  try {
    const userToken = await AsyncStorage.getItem('token');
    if (!userToken) {
      console.log('User not authenticated, cannot register push token');
      return;
    }
    
    const apiUrl = Constants.expoConfig.extra.apiUrl;
    await axios.post(
      `${apiUrl}/api/user/push-token`, 
      { pushToken: token },
      {
        headers: { Authorization: `Bearer ${userToken}` }
      }
    );
    
    console.log('Push token registered with server successfully');
  } catch (error) {
    console.error('Error registering push token with server:', error);
  }
}

// Lokális értesítés ütemezése a személyi igazolvány lejáratához
export async function scheduleIdCardExpiryNotification(expiryDate: Date) {
  try {
    // Jelenlegi dátum
    const now = new Date();
    
    // Számítsuk ki a lejárat előtti egy hónappal korábbi dátumot
    const notifyDate = new Date(expiryDate);
    notifyDate.setMonth(notifyDate.getMonth() - 1);
    
    console.log('Lejárati dátum:', expiryDate);
    console.log('Értesítési dátum (egy hónappal a lejárat előtt):', notifyDate);
    
    // Töröljük a korábbi értesítést (ha van ilyen)
    await Notifications.cancelScheduledNotificationAsync('id-card-expiry');
    
    // 1. Ha már egy hónapon belül vagyunk a lejárathoz (most >= notifyDate)
    // ÉS még nem járt le (now < expiryDate)
    if (now >= notifyDate && now < expiryDate) {
      console.log('Egy hónapon belül a lejáratig, azonnali értesítés');
      
      // Azonnal küldünk értesítést
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Személyi igazolvány lejár!',
          body: 'A személyi igazolványod egy hónapon belül lejár. Kérjük, gondoskodj az időben történő megújításról!',
          data: { type: 'id-card-expiry' },
        },
        trigger: null, // Azonnali értesítés
        identifier: 'id-card-expiry',
      });
      
      // Az értesítés idejét tároljuk el
      await AsyncStorage.setItem('idCardNotificationScheduled', now.toISOString());
      console.log('Azonnali értesítés elküldve');
    }
    // 2. Ha még nincs egy hónapon belül a lejárat (now < notifyDate) 
    // akkor ütemezünk egy értesítést a jövőre
    else if (now < notifyDate) {
      console.log('Értesítés ütemezése jövőbeli időpontra:', notifyDate);
      
      // Kiszámoljuk a másodperceket a jelenlegi időpont és az értesítési idő között
      const seconds = Math.floor((notifyDate.getTime() - now.getTime()) / 1000);
      console.log(`Értesítés ütemezése ${seconds} másodperc múlva`);
      
      // Értesítés ütemezése
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Személyi igazolvány lejár!',
          body: 'A személyi igazolványod egy hónap múlva lejár. Kérjük, gondoskodj az időben történő megújításról!',
          data: { type: 'id-card-expiry' },
        },
        trigger: { seconds },
        identifier: 'id-card-expiry',
      });
      
      // Mentjük az ütemezést
      await AsyncStorage.setItem('idCardNotificationScheduled', notifyDate.toISOString());
      console.log('Értesítés beütemezve erre az időpontra:', notifyDate);
    }
    // 3. Ha már lejárt, akkor nem csinálunk semmit
    else if (now >= expiryDate) {
      console.log('A lejárat már elmúlt, nincs értesítés', expiryDate);
      await AsyncStorage.removeItem('idCardNotificationScheduled');
    }
    
  } catch (error) {
    console.error('Error scheduling notification:', error);
  }
}

// Értesítés azonnali küldése (teszteléshez vagy lejárat előtt azonnal)
export async function sendImmediateExpiryNotification() {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Személyi igazolvány lejár!',
      body: 'A személyi igazolványod egy hónap múlva lejár. Kérjük, gondoskodj az időben történő megújításról!',
      data: { type: 'id-card-expiry' },
    },
    trigger: null, // Azonnali küldés
  });
}

// Előzőleg beütemezett értesítések eltávolítása
export async function cancelAllScheduledNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
  await AsyncStorage.removeItem('idCardNotificationScheduled');
}