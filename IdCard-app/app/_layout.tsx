import React, { useState, useEffect, useRef } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Subscription } from 'expo-modules-core';
import { registerForPushNotificationsAsync } from './utils/notificationHelper';
import RegistrationScreen from './screens/RegistrationScreen';
import LoginScreen from './screens/LoginScreen';
import EditProfileScreen from './screens/EditScreen';
import CameraScreen from './screens/CameraScreen';
import IdCardScreen from './screens/IdCardScreen';
import IdCardDetailsScreen from './screens/IdCardDetailsScreen';
import ForgotPasswordScreen from './screens/ForgotPasswordScreen';
import { View, ActivityIndicator } from 'react-native';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const AuthStack = createNativeStackNavigator();

/**
 * Globális hitelesítési állapot objektum.
 * Fenntartja a hitelesítési állapotot és megfigyelő mintát implementál
 * a változásokról való értesítéshez.
 */
let globalAuthState = {
  /** Jelenlegi hitelesítési állapot */
  isAuthenticated: false,
  
  /** Visszahívási függvények halmaza, amelyeket értesít a hitelesítési állapot változásakor */
  listeners: new Set<() => void>(),
  
  /**
   * Figyelőt ad hozzá, amelyet meghív, amikor a hitelesítési állapot változik.
   * 
   * @param {Function} callback - Függvény, amelyet meghív a hitelesítési állapot változásakor
   * @returns {Function} Függvény a figyelő eltávolításához
   */
  addListener(callback: () => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  },
  
  /**
   * Frissíti a hitelesítési állapotot és értesíti az összes figyelőt.
   * 
   * @param {boolean} status - Új hitelesítési állapot
   */
  updateStatus(status: boolean) {
    this.isAuthenticated = status;
    this.listeners.forEach(callback => callback());
  }
};

/**
 * Beállítja a globális hitelesítési állapotot.
 * Ezt a függvényt exportáljuk, hogy a bejelentkezési/kijelentkezési kezelők használhassák.
 * 
 * @param {boolean} value - Új hitelesítési állapot (true = hitelesített)
 */
export function setAuthenticated(value: boolean) {
  globalAuthState.updateStatus(value);
}

/**
 * Hitelesítési navigátor komponens.
 * Kezeli a hitelesítési képernyők és lapok közötti navigációt.
 * 
 * @returns {React.FC} React funkcionális komponens
 */
function AuthNavigator() {
  return (
    <AuthStack.Navigator>
      {/* Fő bejelentkezési tab-ok */}
      <AuthStack.Screen 
        name="AuthTabs"
        component={AuthTabs} 
        options={{ headerShown: false }}
      />
      {/* Elfelejtett jelszóhoz tartozó képernyők */}
      <AuthStack.Screen 
        name="ForgotPassword" 
        component={ForgotPasswordScreen} 
        options={{ 
          title: 'Elfelejtett jelszó',
          headerBackTitle: 'Vissza' 
        }}
      />
    </AuthStack.Navigator>
  );
}

/**
 * Hitelesítési lapok komponens.
 * Lap navigációt biztosít a bejelentkezési és regisztrációs képernyők között.
 * 
 * @returns {React.FC} React funkcionális komponens
 */
function AuthTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Login') {
            iconName = focused ? 'log-in' : 'log-in-outline';
          } else if (route.name === 'Registration') {
            iconName = focused ? 'person-add' : 'person-add-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: 'tomato',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen 
        name="Login" 
        component={LoginScreen} 
        options={{ title: "Bejelentkezés" }}
      />
      <Tab.Screen 
        name="Registration" 
        component={RegistrationScreen} 
        options={{ title: "Regisztráció" }}
      />
    </Tab.Navigator>
  );
}

/**
 * Alkalmazás lapok komponens.
 * Lap navigációt biztosít a fő alkalmazás képernyők között a hitelesítés után.
 * 
 * @returns {React.FC} React funkcionális komponens
 */
function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'IdCard') {
            iconName = focused ? 'id-card' : 'id-card-outline';
          } else if (route.name === 'IdCardDetails') {
            iconName = focused ? 'document-text' : 'document-text-outline';
          } else if (route.name === 'EditProfile') {
            iconName = focused ? 'create' : 'create-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: 'tomato',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen 
        name="IdCard" 
        component={IdCardScreen} 
        options={{ title: "Feltöltés" }}
      />
      <Tab.Screen 
        name="IdCardDetails" 
        component={IdCardDetailsScreen} 
        options={{ title: "Adataim" }}
      />
      <Tab.Screen 
        name="EditProfile" 
        component={EditProfileScreen} 
        options={{ title: "Profil" }}
      />
    </Tab.Navigator>
  );
}

/**
 * Az alkalmazás gyökér elrendezés komponense.
 * Kezeli a hitelesítési állapotot és a navigációs szerkezetet.
 * Kezeli a push értesítéseket és a hitelesítési állapot változásokat.
 * 
 * @returns {React.FC} React funkcionális komponens
 */
export default function RootLayout() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const notificationListener = useRef<Subscription>();
  const responseListener = useRef<Subscription>();

  /**
   * Inicializálja az alkalmazást.
   * Ellenőrzi a hitelesítési állapotot, beállítja az értesítési figyelőket,
   * és kezeli az útvonalválasztást a hitelesítés alapján.
   */
  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const authStatus = !!token;
        setIsAuthenticated(authStatus);
        globalAuthState.updateStatus(authStatus);
        
        // Ha a felhasználó be van jelentkezve, regisztráljuk a push értesítéseket
        if (authStatus) {
          await registerForPushNotificationsAsync();
        }
      } catch (error) {
        console.error("Error checking authentication:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthentication();

    // Értesítési figyelők beállítása
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
    });

    // Figyelő regisztrálása a globális auth állapotra
    const removeListener = globalAuthState.addListener(() => {
      setIsAuthenticated(globalAuthState.isAuthenticated);
    });

    // Takarítás az unmount-nál
    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
      removeListener();
    };
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        // Be van jelentkezve - fő alkalmazás képernyők
        <>
          <Stack.Screen name="AppTabs" component={AppTabs} />
          {/* CameraScreen csak programkódból elérhető, tab-ban nem látszik */}
          <Stack.Screen name="Camera" component={CameraScreen} options={{ headerShown: true, title: 'Kamera' }} />
        </>
      ) : (
        // Nincs bejelentkezve - auth képernyők, beleértve az elfelejtett jelszó képernyőket is
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
}