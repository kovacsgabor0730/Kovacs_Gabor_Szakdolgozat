import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  Button, 
  StyleSheet, 
  Alert, 
  TouchableOpacity 
} from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setAuthenticated } from '../_layout';
import Constants from 'expo-constants';
import { registerExpiryCheckTask } from '../tasks/expiryCheckTask';
import {
  isBiometricAvailable,
  isBiometricEnabled,
  authenticateWithBiometrics,
  enableBiometricLogin,
  loginWithBiometrics
} from '../utils/biometricHelper';

/**
 * LoginScreen komponens.
 * 
 * Bejelentkezési felületet biztosít a felhasználóknak.
 * Támogatja mind a hagyományos (e-mail + jelszó), mind a biometrikus bejelentkezést.
 * 
 * @param {object} props - Komponens tulajdonságok
 * @param {object} props.navigation - Navigációs objektum a képernyők közötti váltáshoz
 * @returns {React.FC} React funkcionális komponens
 */
const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showBiometricButton, setShowBiometricButton] = useState(false);

  const apiUrl = Constants.expoConfig.extra.apiUrl;

  /**
   * Ellenőrzi a biometrikus bejelentkezés elérhetőségét a komponens betöltésekor.
   * Ha elérhető és engedélyezett, automatikusan elindítja a biometrikus hitelesítést.
   */
  useEffect(() => {
    const checkBiometric = async () => {
      try {
        // Ellenőrizzük, hogy a készülék támogatja-e és be van-e kapcsolva
        const available = await isBiometricAvailable();
        const enabled = await isBiometricEnabled();
        
        setShowBiometricButton(available && enabled);
        
        // Ha be van kapcsolva, automatikusan elindíthatjuk a biometrikus bejelentkezést is
        if (available && enabled) {
          handleBiometricLogin();
        }
      } catch (error) {
        console.error("Error checking biometric:", error);
      }
    };

    checkBiometric();
  }, []);

  /**
   * Hagyományos bejelentkezés végrehajtása e-mail és jelszó alapján.
   * Sikeres bejelentkezés esetén elmenti a tokent és beállítja a globális authentikációs állapotot.
   * 
   * @returns {Promise<void>} Promise, amely a bejelentkezés befejezésekor teljesül
   */
  const handleLogin = async () => {
    console.log('Login button pressed', apiUrl);
    try {
      const response = await axios.post(`${apiUrl}/api/auth/login`, {
        email,
        password,
      });

      if (response.status === 200) {
        const token = response.data.token;
        await AsyncStorage.setItem('token', token);

        // Bekapcsoljuk a biometrikus bejelentkezést ehhez a felhasználóhoz
        await enableBiometricLogin(email);
        
        await registerExpiryCheckTask();
        
        // Használjuk a custom callback mechanizmust a bejelentkezés jelzésére
        setAuthenticated(true);
        
        Alert.alert('Siker', 'Sikeres bejelentkezés');
        console.log('Token:', token);
      } else {
        Alert.alert('Hiba', response.data.message);
      }
    } catch (error) {
      if (error.response && error.response.data && error.response.data.message) {
        Alert.alert('Hiba', error.response.data.message);
      } else {
        Alert.alert('Hiba', 'Valami hiba történt');
      }
    }
  };

  /**
   * Biometrikus bejelentkezés végrehajtása.
   * Ujjlenyomattal vagy arcfelismeréssel azonosítja a felhasználót.
   * 
   * @returns {Promise<void>} Promise, amely a biometrikus bejelentkezés befejezésekor teljesül
   */
  const handleBiometricLogin = async () => {
    try {
      // Biometrikus azonosítás
      const result = await authenticateWithBiometrics();
      
      if (result.success && result.email) {
        // Bejelentkezés a szervertől kapott e-mail címmel
        const token = await loginWithBiometrics(result.email);
        
        if (token) {
          await AsyncStorage.setItem('token', token);
          await registerExpiryCheckTask();
          setAuthenticated(true);
          Alert.alert('Siker', 'Sikeres biometrikus bejelentkezés');
        } else {
          Alert.alert('Hiba', 'A biometrikus bejelentkezés sikertelen volt. Kérjük, használja a jelszavas bejelentkezést.');
        }
      }
    } catch (error) {
      console.error("Biometric login error:", error);
      Alert.alert('Hiba', 'A biometrikus bejelentkezés közben hiba történt.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bejelentkezés</Text>
      
      {/* Biometrikus bejelentkezés gomb */}
      {showBiometricButton && (
        <TouchableOpacity 
          style={styles.biometricButton} 
          onPress={handleBiometricLogin}
        >
          <FontAwesome6 name="fingerprint" size={30} color="#fff" />
          <Text style={styles.biometricButtonText}>Bejelentkezés biometrikus azonosítással</Text>
        </TouchableOpacity>
      )}
      
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Jelszó"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      
      <TouchableOpacity onPress={handleLogin} style={styles.loginButton}>
        <Text style={styles.loginButtonText}>Bejelentkezés</Text>
      </TouchableOpacity>
      
      {/* Elfelejtett jelszó link */}
      <TouchableOpacity
        style={styles.forgotPasswordButton}
        onPress={() => navigation.navigate('ForgotPassword')}
      >
        <Text style={styles.forgotPasswordText}>Elfelejtette jelszavát?</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.registerButton}
        onPress={() => navigation.navigate('Registration')}
      >
        <Text style={styles.registerButtonText}>Nincs még fiókja? Regisztráljon!</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 8,
    borderRadius: 5,
  },
  biometricButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  biometricButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 10,
  },
  loginButton: {
    backgroundColor: '#4CD964',
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  forgotPasswordButton: {
    marginTop: 15,
    alignItems: 'center',
  },
  forgotPasswordText: {
    color: '#007AFF',
    fontSize: 14,
  },
  registerButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  registerButtonText: {
    color: '#007AFF',
  }
});

export default LoginScreen;