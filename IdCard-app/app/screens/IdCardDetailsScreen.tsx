import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Image, 
  TouchableOpacity, 
  Alert,
  ActivityIndicator 
} from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import Constants from 'expo-constants';
import { scheduleIdCardExpiryNotification } from '../utils/notificationHelper';

interface IdCardData {
  id_number: string;
  first_name: string;
  last_name: string;
  sex: string;
  date_of_expiry: string;
  place_of_birth: string;
  mothers_maiden_name: string;
  can_number: string;
  date_of_birth: string;
  image_url?: string;  // Opcionális, ha van kép URL
  created_at?: string;
  modified_at?: string;
}

const IdCardDetailsScreen = () => {
  const navigation = useNavigation();
  const [idCardData, setIdCardData] = useState<IdCardData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [notificationScheduled, setNotificationScheduled] = useState<string | null>(null);
  const apiUrl = Constants.expoConfig.extra.apiUrl;

  // Navigációs jelzés figyelése amikor a képernyő fókuszba kerül
  useFocusEffect(
    useCallback(() => {
      const checkNavigation = async () => {
        const navigateTo = await AsyncStorage.getItem('navigateToScreen');
        if (navigateTo === 'IdCardDetails') {
          // Töröljük a jelzést
          await AsyncStorage.removeItem('navigateToScreen');
          // Itt nem kell külön navigálni, mivel már ezen a képernyőn vagyunk
        }
      };
      
      // Ütemezett értesítés ellenőrzése
      const checkNotificationSchedule = async () => {
        const scheduledDate = await AsyncStorage.getItem('idCardNotificationScheduled');
        setNotificationScheduled(scheduledDate);
      };
      
      checkNavigation();
      checkNotificationSchedule();
      fetchIdCardData(); // Adatok frissítése amikor visszatérünk a képernyőre
    }, [])
  );

  // Adatok lekérése és értesítés ütemezése
  // Adatok lekérése és értesítés ütemezése
useEffect(() => {
    if (idCardData && idCardData.date_of_expiry) {
      try {
        console.log('Lejárati dátum a szerverről:', idCardData.date_of_expiry);
        const expiryDate = new Date(idCardData.date_of_expiry);
        
        // Dátum ellenőrzése a biztonság kedvéért
        if (isNaN(expiryDate.getTime())) {
          console.error('Érvénytelen lejárati dátum:', idCardData.date_of_expiry);
          return;
        }
        
        // Ellenőrizzük, hogy van-e már ütemezett értesítés
        AsyncStorage.getItem('idCardNotificationScheduled').then(scheduledDate => {
          if (!scheduledDate) {
            console.log('Nincs még ütemezett értesítés, most ütemezünk.');
            // Csak akkor ütemezünk értesítést, ha még nincs
            AsyncStorage.setItem('idCardExpiryDate', expiryDate.toISOString());
            
            scheduleIdCardExpiryNotification(expiryDate)
              .then(() => {
                AsyncStorage.getItem('idCardNotificationScheduled').then(date => {
                  console.log('Beütemezett értesítés dátuma:', date);
                  setNotificationScheduled(date);
                });
              });
          } else {
            console.log('Már van ütemezett értesítés:', scheduledDate);
            setNotificationScheduled(scheduledDate);
            
            // Opcionálisan: ellenőrizhetjük, hogy az ütemezett értesítés dátuma
            // megfelel-e a jelenlegi lejárati dátumnak, és ha nem, akkor
            // frissíthetjük az értesítést
            const scheduledDateTime = new Date(scheduledDate);
            const expectedNotifyDate = new Date(expiryDate);
            expectedNotifyDate.setMonth(expectedNotifyDate.getMonth() - 1);
            
            // Ha 1 napnál nagyobb az eltérés, akkor frissítsük
            if (Math.abs(scheduledDateTime.getTime() - expectedNotifyDate.getTime()) > 24 * 60 * 60 * 1000) {
              console.log('Az ütemezett értesítés dátuma eltér az elvárttól, frissítjük.');
              AsyncStorage.setItem('idCardExpiryDate', expiryDate.toISOString());
              
              scheduleIdCardExpiryNotification(expiryDate)
                .then(() => {
                  AsyncStorage.getItem('idCardNotificationScheduled').then(date => {
                    console.log('Frissített értesítés dátuma:', date);
                    setNotificationScheduled(date);
                  });
                });
            }
          }
        });
        
      } catch (error) {
        console.error('Hiba az értesítés ütemezése közben:', error);
      }
    }
  }, [idCardData]);
  // Személyi igazolvány adatok lekérése a backend API-ról
  const fetchIdCardData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = await AsyncStorage.getItem('token');
      
      if (!token) {
        setError('A lekérdezéshez be kell jelentkezni');
        setIsLoading(false);
        return;
      }

      const response = await axios.get(`${apiUrl}/api/id-card/details`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 200 && response.data) {
        setIdCardData(response.data);
      } else {
        setError('Nem sikerült lekérni az adatokat');
      }
    } catch (err: any) {
      console.error('Hiba az adatok lekérésekor:', err);
      if (err.response && err.response.status === 404) {
        setError('Nincs még feltöltött személyi igazolvány adat');
      } else {
        setError(err.response?.data?.message || 'Hiba történt az adatok lekérésekor');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Dátum formázása olvashatóbb formátumra
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return `${date.getFullYear()}. ${String(date.getMonth() + 1).padStart(2, '0')}. ${String(date.getDate()).padStart(2, '0')}.`;
  };

  // Segédfüggvény, ami ellenőrzi, hogy egy hónapon belül lejár-e az igazolvány
// Segédfüggvény módosítása, ami ellenőrzi, hogy egy hónapon belül lejár-e az igazolvány
const isExpiringWithinMonth = (dateString: string): boolean => {
    if (!dateString) return false;
    
    try {
      const expiryDate = new Date(dateString);
      if (isNaN(expiryDate.getTime())) {
        console.error('Érvénytelen dátum:', dateString);
        return false;
      }
      
      const now = new Date();
      
      // Egy hónap múlva
      const oneMonthLater = new Date(now);
      oneMonthLater.setMonth(now.getMonth() + 1);

      const notifyDate = new Date(expiryDate);
      notifyDate.setMonth(notifyDate.getMonth() - 1);
      
      console.log('Most:', now);
      console.log('Lejárati dátum:', expiryDate);
      console.log('Értesítési dátum (1 hónappal a lejárat előtt):', notifyDate);
      
      const isWithinOneMonth = expiryDate > now && notifyDate <= now;
      console.log('Egy hónapon belül lejár:', isWithinOneMonth);
      
      return isWithinOneMonth;
      
    } catch (error) {
      console.error('Hiba a dátum ellenőrzésekor:', error);
      return false;
    }
  };

  // Adat feltöltési képernyőre navigálás
  const navigateToUpload = () => {
    navigation.navigate('IdCard');
  };

  // Betöltés közben
  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Adatok betöltése...</Text>
      </View>
    );
  }

  // Hiba esetén
  if (error) {
    return (
      <View style={styles.centerContainer}>
        <FontAwesome6 name="exclamation-circle" size={50} color="#FF3B30" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchIdCardData}>
          <Text style={styles.retryButtonText}>Újrapróbálkozás</Text>
        </TouchableOpacity>
        {error.includes('Nincs még feltöltött') && (
          <TouchableOpacity style={styles.uploadButton} onPress={navigateToUpload}>
            <Text style={styles.uploadButtonText}>Személyi adatok feltöltése</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // Nincs adat
  if (!idCardData) {
    return (
      <View style={styles.centerContainer}>
        <FontAwesome6 name="id-card" size={50} color="#999" />
        <Text style={styles.noDataText}>Nincs elérhető személyi igazolvány adat</Text>
        <TouchableOpacity style={styles.uploadButton} onPress={navigateToUpload}>
          <Text style={styles.uploadButtonText}>Személyi adatok feltöltése</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Adatok megjelenítése
  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={styles.title}>Személyi igazolvány adatok</Text>
        
        {/* Kép megjelenítése ha van */}
        {idCardData.image_url ? (
          <Image 
            source={{ uri: idCardData.image_url }} 
            style={styles.cardImage}
            resizeMode="contain"
          />
        ) : (
          <View style={styles.imagePlaceholder}>
            <FontAwesome6 name="id-card" size={60} color="#ccc" />
            <Text style={styles.placeholderText}>Nincs kép feltöltve</Text>
          </View>
        )}

        {/* Adatkártyák */}
        <View style={styles.dataCard}>
          <Text style={styles.cardHeader}>Személyes adatok</Text>
          
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Teljes név:</Text>
            <Text style={styles.dataValue}>{`${idCardData.last_name} ${idCardData.first_name}`}</Text>
          </View>
          
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Személyi szám:</Text>
            <Text style={styles.dataValue}>{idCardData.id_number}</Text>
          </View>
          
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Nem:</Text>
            <Text style={styles.dataValue}>{idCardData.sex}</Text>
          </View>
          
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>CAN szám:</Text>
            <Text style={styles.dataValue}>{idCardData.can_number}</Text>
          </View>
        </View>

        <View style={styles.dataCard}>
          <Text style={styles.cardHeader}>Származási adatok</Text>
          
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Születési hely:</Text>
            <Text style={styles.dataValue}>{idCardData.place_of_birth}</Text>
          </View>
          
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Születési idő:</Text>
            <Text style={styles.dataValue}>{formatDate(idCardData.date_of_birth)}</Text>
          </View>
          
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Anyja neve:</Text>
            <Text style={styles.dataValue}>{idCardData.mothers_maiden_name}</Text>
          </View>
        </View>
        
        <View style={styles.dataCard}>
          <Text style={styles.cardHeader}>Érvényességi adatok</Text>
          
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Érvényesség vége:</Text>
            <Text style={[
              styles.dataValue, 
              isExpiringWithinMonth(idCardData.date_of_expiry) && styles.warningText
            ]}>
              {formatDate(idCardData.date_of_expiry)}
              {isExpiringWithinMonth(idCardData.date_of_expiry) && ' (Hamarosan lejár!)'}
            </Text>
          </View>
          
          {idCardData.created_at && (
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>Feltöltve:</Text>
              <Text style={styles.dataValue}>{formatDate(idCardData.created_at)}</Text>
            </View>
          )}
          
          {idCardData.modified_at && (
            <View style={styles.dataRow}>
              <Text style={styles.dataLabel}>Utoljára módosítva:</Text>
              <Text style={styles.dataValue}>{formatDate(idCardData.modified_at)}</Text>
            </View>
          )}
        </View>

        {/* Értesítések szekció - teszt gomb nélkül */}
        <View style={styles.dataCard}>
          <Text style={styles.cardHeader}>Értesítések</Text>
          
          <View style={styles.dataRow}>
            <Text style={styles.dataLabel}>Értesítés ütemezve:</Text>
            <Text style={styles.dataValue}>
              {notificationScheduled 
                ? formatDate(notificationScheduled) 
                : 'Nincs ütemezett értesítés'}
            </Text>
          </View>
          
          <Text style={styles.notificationDescription}>
            A rendszer automatikusan értesítést küld, ha a személyi igazolvány egy hónapon belül lejár.
            {isExpiringWithinMonth(idCardData.date_of_expiry) && (
              '\n\nFigyelem! A személyi igazolványod hamarosan lejár!'
            )}
          </Text>
        </View>

        {/* Gomb az adatok frissítéséhez */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.refreshButton} onPress={fetchIdCardData}>
            <FontAwesome6 name="sync" size={16} color="#fff" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>Adatok frissítése</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.editButton} onPress={navigateToUpload}>
            <FontAwesome6 name="edit" size={16} color="#fff" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>Adatok módosítása</Text>
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 16,
  },
  cardImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 16,
  },
  imagePlaceholder: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'dashed',
  },
  placeholderText: {
    color: '#999',
    marginTop: 8,
  },
  dataCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#eee',
  },
  cardHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 8,
  },
  dataRow: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingVertical: 4,
  },
  dataLabel: {
    flex: 1,
    fontSize: 16,
    color: '#555',
    fontWeight: '500',
  },
  dataValue: {
    flex: 1.5,
    fontSize: 16,
    color: '#333',
  },
  buttonContainer: {
    marginTop: 8,
    marginBottom: 24,
  },
  refreshButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  editButton: {
    backgroundColor: '#5AC8FA',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  buttonIcon: {
    marginRight: 8,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
    marginBottom: 20,
  },
  noDataText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 12,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  uploadButton: {
    backgroundColor: '#34C759',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 12,
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  warningText: {
    color: '#FF3B30',
    fontWeight: 'bold',
  },
  notificationDescription: {
    fontSize: 14,
    color: '#666',
    marginVertical: 12,
    lineHeight: 20,
    fontStyle: 'italic',
  },
});

export default IdCardDetailsScreen;