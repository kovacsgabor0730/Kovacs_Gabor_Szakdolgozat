import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Constants from 'expo-constants';

// Konstansok
const BIOMETRIC_ENABLED_KEY = 'biometric_enabled';
const BIOMETRIC_EMAIL_KEY = 'biometric_email';

// Ellenőrzi, hogy a készülék támogatja-e a biometrikus azonosítást
export async function isBiometricAvailable(): Promise<boolean> {
  const compatible = await LocalAuthentication.hasHardwareAsync();
  if (!compatible) return false;
  
  const enrolled = await LocalAuthentication.isEnrolledAsync();
  return enrolled;
}

// Biometrikus azonosítás bekapcsolása sikeres bejelentkezés után
export async function enableBiometricLogin(email: string): Promise<boolean> {
  try {
    // Ellenőrizzük, hogy elérhető-e a biometrikus azonosítás
    const available = await isBiometricAvailable();
    if (!available) return false;
    
    // Mentsük el az e-mail címet és a beállítást
    await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, 'true');
    await AsyncStorage.setItem(BIOMETRIC_EMAIL_KEY, email);
    
    return true;
  } catch (error) {
    console.error('Biometric enable error:', error);
    return false;
  }
}

// Biometrikus azonosítás ellenőrzése - megtekintjük, használható-e
export async function isBiometricEnabled(): Promise<boolean> {
  try {
    const enabled = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);
    return enabled === 'true';
  } catch (error) {
    console.error('Check biometric settings error:', error);
    return false;
  }
}

// Biometrikus azonosítás végrehajtása
export async function authenticateWithBiometrics(): Promise<{ success: boolean, email?: string }> {
  try {
    // Ellenőrizzük, hogy be van-e kapcsolva és elérhető-e
    const enabled = await isBiometricEnabled();
    const available = await isBiometricAvailable();
    
    if (!enabled || !available) {
      return { success: false };
    }
    
    // Biometrikus azonosítás végrehajtása
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Azonosítás biometrikus adatokkal',
      fallbackLabel: 'Használjon jelszót',
      cancelLabel: 'Mégse',
      disableDeviceFallback: false,
    });
    
    // Ha sikeres volt, visszaadjuk az e-mail címet
    if (result.success) {
      const email = await AsyncStorage.getItem(BIOMETRIC_EMAIL_KEY);
      if (email) {
        return { success: true, email };
      }
    }
    
    return { success: false };
  } catch (error) {
    console.error('Biometric authentication error:', error);
    return { success: false };
  }
}

// API-hívás biometrikus azonosítás utáni bejelentkezéshez
export async function loginWithBiometrics(email: string): Promise<string | null> {
  try {
    const apiUrl = Constants.expoConfig.extra.apiUrl;
    const response = await axios.post(`${apiUrl}/api/auth/biometric-login`, { email });

    if (response.status === 200) {
      return response.data.token;
    }
    return null;
  } catch (error) {
    console.error('Biometric login API error:', error);
    return null;
  }
}

// Biometrikus azonosítás kikapcsolása
export async function disableBiometricLogin(): Promise<boolean> {
  try {
    await AsyncStorage.removeItem(BIOMETRIC_ENABLED_KEY);
    await AsyncStorage.removeItem(BIOMETRIC_EMAIL_KEY);
    return true;
  } catch (error) {
    console.error('Biometric disable error:', error);
    return false;
  }
}