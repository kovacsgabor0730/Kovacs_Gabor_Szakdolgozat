import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  StyleSheet, 
  TouchableOpacity, 
  Alert,
  ActivityIndicator
} from 'react-native';
import axios from 'axios';
import Constants from 'expo-constants';
import { FontAwesome6 } from '@expo/vector-icons';
import { CommonActions } from '@react-navigation/native';

const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  
  const apiUrl = Constants.expoConfig.extra.apiUrl;

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert('Hiba', 'Kérjük, adja meg az email címét');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(`${apiUrl}/api/auth/forgot-password`, { email });
      
      if (response.status === 200) {
        Alert.alert(
          'Sikeres kérés', 
          'Jelszó visszaállítási link elküldve az email címére. Kérjük, ellenőrizze a postaládáját és kattintson a linkre a böngészőben.',
          [{ 
            text: 'OK', 
            onPress: () => {
              // Különböző navigációs megoldások - az első általában működik, de ha gond lenne, próbáld a másodikat
              
              // 1. Navigálj vissza a bejelentkezési képernyőre
              navigation.navigate('AuthTabs', { screen: 'Login' });
              
              // 2. Ha a fenti nem működik, használj CommonActions-t
              /*
              navigation.dispatch(
                CommonActions.reset({
                  index: 0,
                  routes: [{ name: 'AuthTabs' }]
                })
              );
              */
            }
          }]
        );
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      
      let errorMessage = 'Hiba történt a kérés során';
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      }
      
      Alert.alert('Hiba', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Jelszó visszaállítása</Text>
      <Text style={styles.subtitle}>
        Kérjük, adja meg az email címét, amellyel regisztrált. Küldünk egy linket a jelszó visszaállításához.
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Email cím"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        editable={!loading}
      />

      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
      ) : (
        <TouchableOpacity 
          style={styles.button} 
          onPress={handleForgotPassword}
          disabled={loading}
        >
          <FontAwesome6 name="paper-plane" size={16} color="#fff" style={styles.buttonIcon} />
          <Text style={styles.buttonText}>Visszaállítási link kérése</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => navigation.goBack()}
        disabled={loading}
      >
        <FontAwesome6 name="arrow-left" size={16} color="#007AFF" style={styles.buttonIcon} />
        <Text style={styles.backButtonText}>Vissza a bejelentkezéshez</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    height: 46,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 10,
    borderRadius: 5,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonIcon: {
    marginRight: 8,
  },
  backButton: {
    marginTop: 20,
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 16,
  },
  loader: {
    marginTop: 20,
    marginBottom: 20,
  }
});

export default ForgotPasswordScreen;