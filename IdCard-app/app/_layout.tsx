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
const AuthStack = createNativeStackNavigator(); // Külön Stack a bejelentkezési folyamathoz

// Globális változó a token változásának figyeléséhez
let globalAuthState = {
  isAuthenticated: false,
  listeners: new Set<() => void>(),
  
  // Metódus a listener hozzáadására
  addListener(callback: () => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  },
  
  // Metódus a státusz frissítésére
  updateStatus(status: boolean) {
    this.isAuthenticated = status;
    this.listeners.forEach(callback => callback());
  }
};

// Globális segédfüggvény a bejelentkezés átállításához
// Ezt exportáljuk, hogy a LoginScreen használhassa
export function setAuthenticated(value: boolean) {
  globalAuthState.updateStatus(value);
}

// Beágyazott Auth struktúra, amely tartalmazza a tab navigációt és az egyedi képernyőket
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

// Autentikációs képernyők (bejelentkezés, regisztráció)
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

// Alkalmazás fő képernyők (bejelentkezés után)
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

// FONTOS: Ez a fő komponens, amit exportálunk
export default function RootLayout() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const notificationListener = useRef<Subscription>();
  const responseListener = useRef<Subscription>();

  // Ellenőrizzük, hogy van-e token (bejelentkezett-e a felhasználó)
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

    // Értesítés érkezés figyelése
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
    });

    // Értesítésre kattintás figyelése
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
      
      // Ha a személyi igazolvány lejáratáról szóló értesítésre kattintott, navigálás az IdCardDetails képernyőre
      if (response.notification.request.content.data.type === 'id-card-expiry') {
        AsyncStorage.setItem('navigateToScreen', 'IdCardDetails');
      }
    });

    // Figyeljük a globalAuthState változásait a custom listener mechanizmussal
    const cleanupAuth = globalAuthState.addListener(() => {
      setIsAuthenticated(globalAuthState.isAuthenticated);
    });

    return () => {
      // Tisztítás
      if (notificationListener.current) 
        Notifications.removeNotificationSubscription(notificationListener.current);
      
      if (responseListener.current)
        Notifications.removeNotificationSubscription(responseListener.current);
      
      cleanupAuth();
    };
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  // Itt visszatérünk közvetlenül a Stack.Navigator-ral a NavigationContainer nélkül
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