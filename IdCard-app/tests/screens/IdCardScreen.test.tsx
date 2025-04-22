import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import IdCardScreen from '../../app/screens/IdCardScreen';

/**
 * Test suite for the IdCardScreen component.
 * Tests rendering and basic functionality of the ID card upload screen.
 */

// Mock a navigation objektum
const mockNavigation = {
  navigate: jest.fn(),
};

// Mock a useFocusEffect hook (React Navigation)
jest.mock('@react-navigation/native', () => ({
  useFocusEffect: jest.fn(cb => cb()),
}));

// Mock a formázó
jest.mock('../../app/utils/formatHelpers', () => ({
  formatDate: jest.fn(date => '2023-01-01'),
}));

// Mock a értesítések
jest.mock('../../app/utils/notificationHelper', () => ({
  scheduleIdCardExpiryNotification: jest.fn(() => Promise.resolve()),
}));

// Mock az Alert.alert-hez
jest.spyOn(Alert, 'alert');

// Mock response
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('IdCardScreen', () => {
  /**
   * Setup before each test. 
   * Clears mocks and configures AsyncStorage mock responses.
   */
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Alapértelmezett AsyncStorage mock válaszok
    (AsyncStorage.getItem as jest.Mock)
      .mockImplementation((key) => {
        if (key === 'token') return Promise.resolve('test-token');
        if (key === 'lastProcessedImage') return Promise.resolve(null);
        if (key === 'lastProcessedData') return Promise.resolve(null);
        return Promise.resolve(null);
      });
  });

  /**
   * Test that the component renders correctly with all expected elements.
   */
  it('renders correctly', () => {
    const { getByText, getByPlaceholderText } = render(
      <IdCardScreen navigation={mockNavigation} />
    );
    
    expect(getByText('Személyi Igazolvány Feltöltés')).toBeTruthy();
    expect(getByPlaceholderText('Személyi szám')).toBeTruthy();
    expect(getByPlaceholderText('Vezetéknév')).toBeTruthy();
    expect(getByPlaceholderText('Keresztnév')).toBeTruthy();
    expect(getByText('Feltöltés')).toBeTruthy();
  });

  /**
   * Test that the component loads last processed data correctly.
   */
  it('loads last processed data', async () => {
    // Mock a korábban feldolgozott adatok
    const mockData = JSON.stringify({
      id_number: 'ID123456',
      last_name: 'Teszt',
      first_name: 'Elek',
      sex: 'férfi'
    });
    
    // Csak a lastProcessedData-t adjuk vissza
    (AsyncStorage.getItem as jest.Mock)
      .mockImplementation((key) => {
        if (key === 'token') return Promise.resolve('test-token');
        if (key === 'lastProcessedImage') return Promise.resolve(null);
        if (key === 'lastProcessedData') return Promise.resolve(mockData);
        return Promise.resolve(null);
      });
    
    const { getByDisplayValue } = render(
      <IdCardScreen navigation={mockNavigation} />
    );
    
    await waitFor(() => {
      expect(getByDisplayValue('ID123456')).toBeTruthy();
      expect(getByDisplayValue('Teszt')).toBeTruthy();
      expect(getByDisplayValue('Elek')).toBeTruthy();
    });
  });

  /**
   * Test that the camera opens when the camera button is pressed.
   */
  it('opens camera when camera button is pressed', async () => {
    const { getByText } = render(
      <IdCardScreen navigation={mockNavigation} />
    );
    
    // Kamera gombra kattintás
    fireEvent.press(getByText('Kamera'));
    
    // Ellenőrizzük, hogy a navigáció megtörtént a kamera képernyőre
    expect(mockNavigation.navigate).toHaveBeenCalledWith('Camera', {
      returnScreen: 'IdCard'
    });
  });

  /**
   * Test that the form submits with valid data.
   */
  it('submits the form with valid data', async () => {
    // Mock sikeres válasz
    mockedAxios.post.mockResolvedValueOnce({
      status: 200
    });

    const { getByText, getByPlaceholderText } = render(
      <IdCardScreen navigation={mockNavigation} />
    );

    // Form kitöltése
    fireEvent.changeText(getByPlaceholderText('Személyi szám'), 'ID123456');
    fireEvent.changeText(getByPlaceholderText('Vezetéknév'), 'Teszt');
    fireEvent.changeText(getByPlaceholderText('Keresztnév'), 'Elek');
    
    // Feltöltés gomb megnyomása
    fireEvent.press(getByText('Feltöltés'));
    
    await waitFor(() => {
      // Ellenőrizzük a sikeres üzenetet
      expect(Alert.alert).toHaveBeenCalledWith('Siker', 'Személyi igazolvány adatok sikeresen feltöltve');
    });
  });

  /**
   * Test that the image selection from the gallery is handled correctly.
   */
  it('handles image selection from gallery', async () => {
    // Mock a kép kiválasztást
    (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file://test-image.jpg' }]
    });

    const { getByText } = render(
      <IdCardScreen navigation={mockNavigation} />
    );
    
    // Tallózás gombra kattintás
    fireEvent.press(getByText('Tallózás'));
    
    await waitFor(() => {
      // Navigáció a képfeldolgozó képernyőre
      expect(mockNavigation.navigate).toHaveBeenCalledWith('Camera', {
        imageUri: 'file://test-image.jpg',
        returnScreen: 'IdCard'
      });
    });
  });
});