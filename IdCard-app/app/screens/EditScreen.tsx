import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity, 
  Alert, 
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Constants from 'expo-constants';
import { setAuthenticated } from '../_layout';
import { 
  isBiometricAvailable, 
  isBiometricEnabled, 
  enableBiometricLogin, 
  disableBiometricLogin 
} from '../utils/biometricHelper';

/**
 * EditProfileScreen komponens.
 * 
 * Felületet biztosít a felhasználói profil adatok szerkesztéséhez,
 * beleértve a személyes adatokat és biometrikus bejelentkezés beállításait.
 * Tartalmazza a kijelentkezési funkcionalitást is.
 * 
 * @returns {React.FC} React funkcionális komponens
 */
const EditProfileScreen = () => {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const apiUrl = Constants.expoConfig.extra.apiUrl;

  /**
   * Lekéri és betölti a felhasználó profil adatait az API-ról.
   * Ellenőrzi a biometrikus hitelesítés elérhetőségét is.
   */
  useEffect(() => {
    /**
     * Profil adatok lekérése a szerverről.
     * 
     * @returns {Promise<void>} Promise, amely a lekérés befejezésekor teljesül
     */
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const token = await AsyncStorage.getItem('token');
        
        if (!token) {
          Alert.alert('Hiba', 'Nincs bejelentkezve');
          setLoading(false);
          return;
        }

        const response = await axios.get(`${apiUrl}/api/user/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === 200 && response.data) {
          setEmail(response.data.email || '');
          setFirstName(response.data.firstName || '');
          setLastName(response.data.lastName || '');
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        Alert.alert('Hiba', 'Nem sikerült betölteni a profil adatokat');
      } finally {
        setLoading(false);
      }
    };

    /**
     * Biometrikus hitelesítés elérhetőségének ellenőrzése.
     * 
     * @returns {Promise<void>} Promise, amely az ellenőrzés befejezésekor teljesül
     */
    const checkBiometric = async () => {
      const available = await isBiometricAvailable();
      const enabled = await isBiometricEnabled();
      
      setBiometricAvailable(available);
      setBiometricEnabled(enabled);
    };

    fetchProfile();
    checkBiometric();
  }, []);

  /**
   * Kezeli a felhasználói profil adatok frissítését.
   * Ellenőrzi a bemeneti adatokat és elküldi a frissített adatokat az API-nak.
   * 
   * @returns {Promise<void>} Promise, amely a frissítés befejezésekor teljesül
   */
  const handleUpdateProfile = async () => {
    if (!email || !firstName || !lastName) {
      Alert.alert('Hiba', 'Minden mezőt ki kell tölteni');
      return;
    }

    setLoading(true);

    try {
      const token = await AsyncStorage.getItem('token');
      
      if (!token) {
        Alert.alert('Hiba', 'Nincs bejelentkezve');
        setLoading(false);
        return;
      }

      const response = await axios.put(
        `${apiUrl}/api/user/profile`,
        {
          email,
          firstName,
          lastName,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 200) {
        Alert.alert('Siker', 'A profil adatok sikeresen frissítve');
      } else {
        Alert.alert('Hiba', response.data.message || 'Nem sikerült frissíteni a profil adatokat');
      }
    } catch (error) {
      console.error('Update profile error:', error);
      Alert.alert('Hiba', 'Nem sikerült frissíteni a profil adatokat');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Kezeli a felhasználó kijelentkezését.
   * Megerősítést kér a felhasználótól, majd eltávolítja a hitelesítési adatokat.
   * 
   * @returns {Promise<void>} Promise, amely a kijelentkezés befejezésekor teljesül
   */
  const handleLogout = async () => {
    try {
      // Megkérdezzük a felhasználót, hogy biztosan ki akar-e jelentkezni
      Alert.alert(
        'Kijelentkezés',
        'Biztosan ki szeretne jelentkezni?',
        [
          {
            text: 'Mégse',
            style: 'cancel'
          },
          {
            text: 'Igen',
            onPress: async () => {
              // Token törlése az AsyncStorage-ból
              await AsyncStorage.removeItem('token');
              
              // Globális hitelesítési állapot frissítése
              setAuthenticated(false);
              
              // Sikerüzenet
              console.log('Sikeres kijelentkezés');
            }
          }
        ]
      );
    } catch (error) {
      console.error('Kijelentkezési hiba:', error);
      Alert.alert('Hiba', 'Nem sikerült kijelentkezni');
    }
  };

  /**
   * Ki- vagy bekapcsolja a biometrikus bejelentkezés funkcionalitást.
   * Ha be van kapcsolva, kikapcsolja; ha ki van kapcsolva, bekapcsolja az elérhetőség ellenőrzése után.
   * 
   * @returns {Promise<void>} Promise, amely a váltás befejezésekor teljesül
   */
  const toggleBiometric = async () => {
    try {
      if (biometricEnabled) {
        // Kikapcsolás
        await disableBiometricLogin();
        setBiometricEnabled(false);
        Alert.alert('Értesítés', 'Biometrikus bejelentkezés kikapcsolva');
      } else {
        // Bekapcsolás
        const available = await isBiometricAvailable();
        if (!available) {
          Alert.alert('Hiba', 'A készülékén nincs beállítva biometrikus azonosítás.');
          return;
        }

        await enableBiometricLogin(email);
        setBiometricEnabled(true);
        Alert.alert('Értesítés', 'Biometrikus bejelentkezés bekapcsolva');
      }
    } catch (error) {
      console.error('Toggle biometric error:', error);
      Alert.alert('Hiba', 'Nem sikerült módosítani a biometrikus beállításokat');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Adatok betöltése...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={styles.title}>Profil szerkesztése</Text>

        <Text style={styles.label}>Email:</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          placeholder="Email cím"
        />

        <Text style={styles.label}>Vezetéknév:</Text>
        <TextInput
          style={styles.input}
          value={lastName}
          onChangeText={setLastName}
          placeholder="Vezetéknév"
        />

        <Text style={styles.label}>Keresztnév:</Text>
        <TextInput
          style={styles.input}
          value={firstName}
          onChangeText={setFirstName}
          placeholder="Keresztnév"
        />
        
        {/* Biometrikus azonosítás kapcsoló */}
        {biometricAvailable && (
          <>
            <Text style={styles.sectionTitle}>Biometrikus bejelentkezés</Text>
            <TouchableOpacity 
              style={[styles.biometricButton, biometricEnabled ? styles.biometricEnabled : styles.biometricDisabled]} 
              onPress={toggleBiometric}
            >
              <FontAwesome6 name="fingerprint" size={20} color="#fff" style={styles.buttonIcon} />
              <Text style={styles.biometricButtonText}>
                {biometricEnabled ? 'Biometrikus bejelentkezés kikapcsolása' : 'Biometrikus bejelentkezés bekapcsolása'}
              </Text>
            </TouchableOpacity>
            
            <Text style={styles.biometricNote}>
              {biometricEnabled 
                ? 'A biometrikus bejelentkezés aktív. Mostantól ujjlenyomattal vagy arcfelismeréssel is bejelentkezhet.' 
                : 'Kapcsolja be a biometrikus bejelentkezést a kényelmesebb használat érdekében.'}
            </Text>
          </>
        )}

        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.button, styles.updateButton]} 
            onPress={handleUpdateProfile}
          >
            <FontAwesome6 name="save" size={16} color="#fff" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>Mentés</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.logoutButton]} 
            onPress={handleLogout}
          >
            <FontAwesome6 name="sign-out-alt" size={16} color="#fff" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>Kijelentkezés</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    fontWeight: '500',
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 15,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  buttonContainer: {
    marginTop: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  updateButton: {
    backgroundColor: '#4CD964',
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonIcon: {
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 10,
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  biometricEnabled: {
    backgroundColor: '#34C759', // Zöld, ha be van kapcsolva
  },
  biometricDisabled: {
    backgroundColor: '#FF3B30', // Piros, ha ki van kapcsolva
  },
  biometricButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  biometricNote: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    fontStyle: 'italic',
  }
});

export default EditProfileScreen;