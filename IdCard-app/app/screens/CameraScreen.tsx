import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    Alert,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as MediaLibrary from 'expo-media-library';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import axios from 'axios';
import Constants from 'expo-constants';

/**
 * CameraScreen komponens.
 * 
 * Kezelőfelületet biztosít személyi igazolvány képének készítéséhez vagy kiválasztásához.
 * A képet automatikusan feltölti az OCR feldolgozó API-hoz, majd visszanavigál az előző képernyőre az eredménnyel.
 * 
 * @returns {React.FC} React funkcionális komponens
 */
const CameraScreen = () => {
    const navigation = useNavigation();
    const route = useRoute();
    const [croppedImage, setCroppedImage] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [processingComplete, setProcessingComplete] = useState<boolean>(false);
    const apiUrl = Constants.expoConfig.extra.apiUrl;
    const returnScreen = route.params?.returnScreen || 'IdCard';

    /**
     * Ellenőrzi, hogy van-e előre kiválasztott kép a komponens betöltésekor.
     * Ha van, feldolgozza; ha nincs, elindítja a kamerát.
     */
    useEffect(() => {
        if (route.params && route.params.imageUri) {
          console.log("Előre körbevágott kép érkezett:", route.params.imageUri);
          setCroppedImage(route.params.imageUri);
          setProcessingComplete(true); // Jelezzük, hogy feldolgozható
        } else {
          // Ha nincs kép, automatikusan indítsuk a kamerát
          console.log("Nincs előre betöltött kép, kamera indítása");
          takePictureWithCamera();
        }
      }, [route.params]);

    /**
     * Figyeli a kép és a feldolgozási állapot változását, és automatikusan feltölti a képet,
     * ha mindkettő készen áll.
     */
    useEffect(() => {
        // Ha van kép és a feldolgozás is befejeződött
        if (croppedImage && processingComplete) {
          uploadToAPI(croppedImage);
        }
    }, [croppedImage, processingComplete]);

    /**
     * Feltölti a képet az OCR API-hoz feldolgozás céljából.
     * A feldolgozott adatokat elmenti az AsyncStorage-ba.
     * 
     * @param {string} imageUri - A feltöltendő kép URI-ja
     * @returns {Promise<void>} Promise, amely a feltöltés befejezésekor teljesül
     */
    const uploadToAPI = async (imageUri) => {
        try {
          console.log("Kép feltöltése OCR feldolgozásra:", imageUri);
          
          // Token beszerzése az autentikációhoz
          const token = await AsyncStorage.getItem('token');
          if (!token) {
            Alert.alert('Hiba', 'Nincs bejelentkezve');
            navigation.goBack();
            return;
          }
          
          // FormData létrehozása a kép feltöltéséhez
          const formData = new FormData();
          
          // Explicit típusú objektumként hozzuk létre a FormData kompatibilitás miatt
          const imageInfo = {
            uri: imageUri,
            type: 'image/jpeg',
            name: 'id_card_front.jpg',
          };
          
          formData.append('images', imageInfo);
          
          // Kép küldése a backend API-ra
          const response = await axios.post(
            `${apiUrl}/api/image/upload`,
            formData,
            {
              headers: {
                'Content-Type': 'multipart/form-data',
                'Authorization': `Bearer ${token}`,
              },
            }
          );
          
          // Sikeres feltöltés és feldolgozás esetén
          if (response.status === 200) {
            console.log("OCR feldolgozás sikeres");
            
            // Mentjük a képet és az adatokat
            await AsyncStorage.setItem('lastProcessedImage', imageUri);
            
            if (response.data && response.data.results && response.data.results[0]) {
              await AsyncStorage.setItem('lastProcessedData', 
                JSON.stringify(response.data.results[0]?.extracted_data || {}));
                
              console.log("Felismert adatok:", response.data.results[0]?.extracted_data);
            }
            
            // Navigálás vissza az előző képernyőre
            setTimeout(() => {
              navigation.navigate(returnScreen);
            }, 800);
          } else {
            Alert.alert('Hiba', 'Nem sikerült feldolgozni a képet.');
            navigation.goBack();
          }
        } catch (error) {
          console.error('API Upload Error:', error);
          console.error('Error details:', error.response?.data || error.message);
          Alert.alert('Feltöltési hiba', 'A kép feltöltése az OCR feldolgozásra sikertelen.');
          navigation.goBack();
        }
      };

    /**
     * Elindítja a kamerát kép készítéséhez.
     * A készített képet automatikusan feldolgozza és elmenti a galériába, ha engedélyezett.
     * 
     * @returns {Promise<void>} Promise, amely a képkészítés befejezésekor teljesül
     */
    const takePictureWithCamera = async () => {
        try {
            setIsSaving(true);
            setProcessingComplete(false);
            
            const pickerResult = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [6, 4],
                quality: 0.8,
            });
            
            if (!pickerResult.canceled && pickerResult.assets && pickerResult.assets.length > 0) {
                setCroppedImage(pickerResult.assets[0].uri);
                console.log("Kamera kép elkészítve:", pickerResult.assets[0].uri);
                
                // Ha a képet sikeresen elkészítettük és körbevágtuk, jelezzük hogy a feldolgozás kész
                setProcessingComplete(true);
                
                try {
                    // Opcionálisan menthetjük a képet a galériába 
                    const { status } = await MediaLibrary.requestPermissionsAsync();
                    if (status === 'granted') {
                        await MediaLibrary.saveToLibraryAsync(pickerResult.assets[0].uri);
                        console.log("Kép mentve a galériába");
                    }
                } catch (saveErr) {
                    console.error("Error saving to gallery:", saveErr);
                    // Nem kritikus hiba, folytathatjuk
                }
            } else {
                // Felhasználó megszakította
                setIsSaving(false);
                navigation.goBack();
            }
        } catch (error) {
            console.error("Error taking picture:", error);
            Alert.alert('Hiba', 'Nem sikerült a kép elkészítése, kérjük próbálja újra.');
            setIsSaving(false);
            navigation.goBack();
        }
    };

    // Betöltés állapot, amíg a kép mentése folyamatban van
    if (isSaving) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={[styles.loadingText, { marginTop: 20 }]}>Kép feldolgozása...</Text>
            </View>
        );
    }

    // Ha nincs kép, akkor betöltést mutatunk
    if (!croppedImage) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Kamera indítása...</Text>
            </View>
        );
    }

    // Képnézet - a körülvágott kép rövid megjelenítése
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Kép feldolgozása</Text>

            <View style={styles.imageContainer}>
                <Image
                    source={{ uri: croppedImage }}
                    style={styles.resultImage}
                    contentFit="contain"
                    transition={300}
                />
            </View>
            
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={[styles.loadingText, { marginTop: 20 }]}>OCR feldolgozás folyamatban...</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1c1c1e',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 20,
    },
    loadingText: {
        color: '#fff',
        fontSize: 16,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 15,
        marginTop: 30,
    },
    imageContainer: {
        width: '90%',
        height: '70%',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    resultImage: {
        width: '100%',
        height: '100%',
    }
});

export default CameraScreen;