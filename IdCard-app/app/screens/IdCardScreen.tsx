import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    TextInput, 
    StyleSheet, 
    Alert, 
    Platform, 
    ScrollView,
    TouchableOpacity,
    Modal,
    Image
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RNPickerSelect from 'react-native-picker-select';
import { FontAwesome6 } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import Constants from 'expo-constants';
import { scheduleIdCardExpiryNotification } from '../utils/notificationHelper';

/**
 * IdCardScreen komponens.
 * 
 * Felhasználói felületet biztosít a személyi igazolvány adatok kezeléséhez.
 * Lehetővé teszi a felhasználónak, hogy képet készítsen vagy válasszon a személyi igazolványáról,
 * majd az OCR technológiával felismert adatokat feltöltse a szerverre.
 * 
 * @returns {React.FC} React funkcionális komponens
 */
const IdCardScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [idNumber, setIdNumber] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [sex, setSex] = useState('');
  const [dateOfExpiry, setDateOfExpiry] = useState(new Date());
  const [placeOfBirth, setPlaceOfBirth] = useState('');
  const [mothersMaidenName, setMothersMaidenName] = useState('');
  const [canNumber, setCanNumber] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState(new Date());
  const [imageUri, setImageUri] = useState<string | null>(null);
  
  // Egyszerű dátumválasztók
  const [showExpiryDateModal, setShowExpiryDateModal] = useState(false);
  const [showBirthDateModal, setShowBirthDateModal] = useState(false);

  const apiUrl = Constants.expoConfig.extra.apiUrl;
  
  /**
   * Figyeli, mikor kerül fókuszba a képernyő, és betölti a feldolgozott adatokat, ha vannak.
   * Az OCR feldolgozás után ide kerülnek vissza az adatok.
   */
  useFocusEffect(
    useCallback(() => {
      const loadProcessedData = async () => {
        try {
          const lastImage = await AsyncStorage.getItem('lastProcessedImage');
          if (lastImage) {
            setImageUri(lastImage);
            
            const lastData = await AsyncStorage.getItem('lastProcessedData');
            if (lastData) {
              const parsedData = JSON.parse(lastData);
              console.log('Betöltött adatok AsyncStorage-ból:', parsedData);
              
              // Ha vannak adatok, töltsd be őket a megfelelő mezőkbe
              if (parsedData.id_number) setIdNumber(parsedData.id_number);
              if (parsedData.first_name) setFirstName(parsedData.first_name);
              if (parsedData.last_name) setLastName(parsedData.last_name);
              if (parsedData.sex) setSex(parsedData.sex);
              if (parsedData.date_of_expiry) setDateOfExpiry(new Date(parsedData.date_of_expiry));
              if (parsedData.place_of_birth) setPlaceOfBirth(parsedData.place_of_birth);
              if (parsedData.mothers_maiden_name) setMothersMaidenName(parsedData.mothers_maiden_name);
              if (parsedData.can_number) setCanNumber(parsedData.can_number);
              if (parsedData.date_of_birth) setDateOfBirth(new Date(parsedData.date_of_birth));
              
              // Csak sikeres betöltés után töröljük az adatokat
              await AsyncStorage.removeItem('lastProcessedImage');
              await AsyncStorage.removeItem('lastProcessedData');
            }
          }
        } catch (error) {
          console.error('Error loading processed data:', error);
        }
      };
      
      loadProcessedData();
      
      // Nem kell cleanup függvény, mivel nincsenek eseményfigyelők
    }, [])
  );

  /**
   * Dátum formázása YYYY-MM-DD formátumra.
   * 
   * @param {Date} date - A formázandó dátum objektum
   * @returns {string} Dátum sztring YYYY-MM-DD formátumban
   */
  const formatDate = (date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${year}-${month}-${day}`;
  };

  /**
   * Kezeli a személyi igazolvány adatok feltöltését a szerverre.
   * Ellenőrzi a bemeneti adatokat, eltárolja a lejárati dátumot értesítésekhez,
   * majd beküldi az adatokat az API-nak.
   * 
   * @returns {Promise<void>} Promise, amely a feltöltés befejezésekor teljesül
   */
  const handleUpload = async () => {
    const token = await AsyncStorage.getItem('token');
    if (!token) {
      Alert.alert('Hiba', 'Nincs bejelentkezve');
      return;
    }

    if (!imageUri) {
      Alert.alert('Hiba', 'Nincs kép feltöltve. Kérjük készítsen vagy válasszon egy képet.');
      return;
    }

    try {
      // Először mentsük el a lejárati dátumot a helyi értesítésekhez
      await AsyncStorage.setItem('idCardExpiryDate', dateOfExpiry.toISOString());
      
      console.log('Személyi igazolvány lejárati dátuma:', dateOfExpiry);
      
      const response = await axios.post(`${apiUrl}/api/id-card/upload`, {
        id_number: idNumber,
        first_name: firstName,
        last_name: lastName,
        sex,
        date_of_expiry: formatDate(dateOfExpiry),
        place_of_birth: placeOfBirth,
        mothers_maiden_name: mothersMaidenName,
        can_number: canNumber,
        date_of_birth: formatDate(dateOfBirth),
        image_uri: imageUri,
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 200) {
        // A dátum biztos helyesen kerüljön átadásra
        await scheduleIdCardExpiryNotification(new Date(dateOfExpiry));
        
        Alert.alert('Siker', 'Személyi igazolvány adatok sikeresen feltöltve');
      } else {
        Alert.alert('Hiba', response.data.message || 'Ismeretlen hiba történt');
      }
    } catch (error: any) {
      // Hibalogolás részletekkel
      console.error('Upload error details:', error);
      if (error.response && error.response.data && error.response.data.message) {
        Alert.alert('Hiba', error.response.data.message);
      } else {
        Alert.alert('Hiba', 'Valami hiba történt a feltöltés során');
      }
    }
  };

  /**
   * Megnyitja a kamera képernyőt személyi igazolvány fotózásához.
   * Navigál a Kamera képernyőre a megfelelő paraméterekkel.
   */
  const openCamera = () => {
    navigation.navigate('Camera', { returnScreen: 'IdCard' });
  };

  /**
   * Megnyitja az eszköz galériáját kép kiválasztásához.
   * A kiválasztott képet továbbítja a Camera képernyőre feldolgozásra.
   * 
   * @returns {Promise<void>} Promise, amely a képválasztás befejezésekor teljesül
   */
  const pickImageFromGallery = async () => {
    try {
      console.log("Galéria megnyitása");
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true, // Körbevágás engedélyezése
        aspect: [4, 3],      // Ugyanaz az arány, mint a kameránál
        quality: 0.8,
      });

      console.log("Képválasztás eredménye:", result.canceled ? "törölve" : "kiválasztva");

      if (!result.canceled && result.assets && result.assets.length > 0) {
        console.log("Választott kép URI:", result.assets[0].uri);
        
        // Direktben használjuk a Camera képernyőt az OCR feldolgozáshoz
        navigation.navigate('Camera', { 
          imageUri: result.assets[0].uri,  // Előre adjuk át a már körbevágott képet
          returnScreen: 'IdCard'
        });
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert('Hiba', 'Nem sikerült a kép kiválasztása');
    }
  };

  // Év, hónap és nap választó lehetőségek generálása
  const generateYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = currentYear - 100; year <= currentYear + 20; year++) {
      years.push({ label: year.toString(), value: year });
    }
    return years;
  };

  const generateMonths = () => {
    const months = [];
    const monthNames = [
      'Január', 'Február', 'Március', 'Április', 'Május', 'Június',
      'Július', 'Augusztus', 'Szeptember', 'Október', 'November', 'December'
    ];
    
    for (let i = 0; i < 12; i++) {
      months.push({ label: monthNames[i], value: i });
    }
    
    return months;
  };

  const generateDays = (year, month) => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({ label: day.toString(), value: day });
    }
    return days;
  };

  /**
   * Egyszerű dátumválasztó modális komponens.
   * 
   * @param {object} props - Komponens tulajdonságok
   * @param {boolean} props.isVisible - Látható-e a modális ablak
   * @param {Function} props.onClose - Bezárási eseménykezelő függvény
   * @param {Date} props.date - Az aktuálisan kiválasztott dátum
   * @param {Function} props.onDateChange - Dátumváltozás eseménykezelő
   * @param {string} props.title - A modális ablak címe
   * @returns {React.FC} React funkcionális komponens
   */
  const SimpleDatePickerModal = ({ 
    isVisible, 
    onClose, 
    date, 
    onDateChange,
    title
  }) => {
    const [tempYear, setTempYear] = useState(date.getFullYear());
    const [tempMonth, setTempMonth] = useState(date.getMonth());
    const [tempDay, setTempDay] = useState(date.getDate());

    const confirmDate = () => {
      const newDate = new Date(tempYear, tempMonth, tempDay);
      onDateChange(newDate);
      onClose();
    };

    return (
      <Modal
        visible={isVisible}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{title || "Válassz dátumot"}</Text>
            
            <View style={styles.pickerContainer}>
              <View style={styles.pickerWrapper}>
                <Text style={styles.pickerLabel}>Év</Text>
                <RNPickerSelect
                  onValueChange={(value) => setTempYear(value)}
                  items={generateYears()}
                  value={tempYear}
                  style={pickerSelectStyles}
                />
              </View>
              
              <View style={styles.pickerWrapper}>
                <Text style={styles.pickerLabel}>Hónap</Text>
                <RNPickerSelect
                  onValueChange={(value) => setTempMonth(value)}
                  items={generateMonths()}
                  value={tempMonth}
                  style={pickerSelectStyles}
                />
              </View>
              
              <View style={styles.pickerWrapper}>
                <Text style={styles.pickerLabel}>Nap</Text>
                <RNPickerSelect
                  onValueChange={(value) => setTempDay(value)}
                  items={generateDays(tempYear, tempMonth)}
                  value={tempDay}
                  style={pickerSelectStyles}
                />
              </View>
            </View>
            
            <View style={styles.modalButtonsContainer}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={onClose}
              >
                <Text style={styles.modalButtonText}>Mégse</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton]} 
                onPress={confirmDate}
              >
                <Text style={styles.modalButtonText}>Mentés</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={styles.title}>Személyi igazolvány adatok</Text>
        
        {/* Kép megjelenítés */}
        <View style={styles.imageSection}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.cardImage} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <FontAwesome6 name="id-card" size={60} color="#ccc" />
              <Text style={styles.placeholderText}>Nincs kép feltöltve</Text>
            </View>
          )}
          
          {/* Kamera és tallózás gombok */}
          <View style={styles.imageButtonsContainer}>
            <TouchableOpacity 
              style={[styles.imageButton, styles.cameraButton]} 
              onPress={openCamera}
            >
              <FontAwesome6 name="camera" size={16} color="#fff" style={styles.buttonIcon} />
              <Text style={styles.imageButtonText}>Kamera</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.imageButton, styles.galleryButton]} 
              onPress={pickImageFromGallery}
            >
              <FontAwesome6 name="images" size={16} color="#fff" style={styles.buttonIcon} />
              <Text style={styles.imageButtonText}>Tallózás</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.separator} />
        
        {/* Űrlap mezők */}
        <TextInput
          style={styles.input}
          placeholder="Személyi szám"
          value={idNumber}
          onChangeText={setIdNumber}
        />
        <TextInput
          style={styles.input}
          placeholder="Vezetéknév"
          value={lastName}
          onChangeText={setLastName}
        />
        <TextInput
          style={styles.input}
          placeholder="Keresztnév"
          value={firstName}
          onChangeText={setFirstName}
        />
        
        <RNPickerSelect
          onValueChange={(value) => setSex(value)}
          items={[
            { label: 'Férfi', value: 'férfi' },
            { label: 'Nő', value: 'nő' },
          ]}
          style={pickerSelectStyles}
          placeholder={{ label: 'Nem kiválasztása', value: null }}
        />

        <Text style={styles.label}>Érvényesség dátuma:</Text>
        <TouchableOpacity 
          style={styles.dateButton} 
          onPress={() => setShowExpiryDateModal(true)}
        >
          <FontAwesome6 name="calendar" size={16} color="#007AFF" style={styles.buttonIcon} />
          <Text style={styles.dateButtonText}>{formatDate(dateOfExpiry)}</Text>
        </TouchableOpacity>

        <Text style={styles.label}>Születési idő:</Text>
        <TouchableOpacity 
          style={styles.dateButton} 
          onPress={() => setShowBirthDateModal(true)}
        >
          <FontAwesome6 name="calendar" size={16} color="#007AFF" style={styles.buttonIcon} />
          <Text style={styles.dateButtonText}>{formatDate(dateOfBirth)}</Text>
        </TouchableOpacity>
        
        <TextInput
          style={styles.input}
          placeholder="Születési hely"
          value={placeOfBirth}
          onChangeText={setPlaceOfBirth}
        />
        <TextInput
          style={styles.input}
          placeholder="Anyja leánykori neve"
          value={mothersMaidenName}
          onChangeText={setMothersMaidenName}
        />
        <TextInput
          style={styles.input}
          placeholder="CAN szám"
          value={canNumber}
          onChangeText={setCanNumber}
        />
        
        <View style={styles.separator} />
        
        <TouchableOpacity style={styles.submitButton} onPress={handleUpload}>
          <FontAwesome6 name="upload" size={16} color="#fff" style={styles.buttonIcon} />
          <Text style={styles.submitButtonText}>Feltöltés</Text>
        </TouchableOpacity>
      </View>

      {/* Dátumválasztó modálok */}
      <SimpleDatePickerModal
        isVisible={showExpiryDateModal}
        onClose={() => setShowExpiryDateModal(false)}
        date={dateOfExpiry}
        onDateChange={setDateOfExpiry}
        title="Érvényesség dátuma"
      />
      
      <SimpleDatePickerModal
        isVisible={showBirthDateModal}
        onClose={() => setShowBirthDateModal(false)}
        date={dateOfBirth}
        onDateChange={setDateOfBirth}
        title="Születési dátum"
      />
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
  title: {
    fontSize: 24,
    marginBottom: 16,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  imageSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  cardImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 10,
  },
  imagePlaceholder: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderStyle: 'dashed',
  },
  placeholderText: {
    color: '#999',
    marginTop: 10,
  },
  imageButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  imageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 5,
  },
  cameraButton: {
    backgroundColor: '#007AFF',
  },
  galleryButton: {
    backgroundColor: '#34C759',
  },
  imageButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  buttonIcon: {
    marginRight: 8,
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 8,
    borderRadius: 5,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    marginTop: 4,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: 12,
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333',
  },
  separator: {
    height: 1,
    backgroundColor: '#ccc',
    marginVertical: 16,
    width: '100%',
  },
  submitButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  // Modál stílusok
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  pickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },
  pickerWrapper: {
    flex: 1,
    marginHorizontal: 5,
  },
  pickerLabel: {
    textAlign: 'center',
    marginBottom: 5,
    fontWeight: '500',
  },
  modalButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#ccc',
  },
  confirmButton: {
    backgroundColor: '#007AFF',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 8,
    borderRadius: 5,
    textAlign: 'center',
  },
  inputAndroid: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 8,
    borderRadius: 5,
    textAlign: 'center',
  },
});

export default IdCardScreen;