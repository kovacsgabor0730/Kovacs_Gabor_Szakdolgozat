import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import EditProfileScreen from '../../app/screens/EditScreen';
import * as biometricHelper from '../../app/utils/biometricHelper';
import { setAuthenticated } from '../../app/utils/authUtils'; // Ezt a fájlt létre kell hozni vagy megfelelően importálni

// Mock a setAuthenticated függvényt ha nem így importáljuk
jest.mock('../../app/utils/authUtils', () => ({
  setAuthenticated: jest.fn(),
}));

// Mock Alert.alert
jest.spyOn(Alert, 'alert');

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('EditProfileScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Alapértelmezett AsyncStorage mock válaszok
    (AsyncStorage.getItem as jest.Mock)
      .mockImplementation((key) => {
        if (key === 'token') return Promise.resolve('test-token');
        return Promise.resolve(null);
      });
    
    // Mock biometrikus beállítások
    jest.spyOn(biometricHelper, 'isBiometricAvailable').mockResolvedValue(true);
    jest.spyOn(biometricHelper, 'isBiometricEnabled').mockResolvedValue(false);
  });

  it('renders loading state initially', () => {
    const { getByText } = render(<EditProfileScreen />);
    expect(getByText('Adatok betöltése...')).toBeTruthy();
  });

  it('fetches and displays user profile', async () => {
    // Mock sikeres profil betöltés
    mockedAxios.get.mockResolvedValueOnce({
      status: 200,
      data: {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe'
      }
    });

    const { findByDisplayValue } = render(<EditProfileScreen />);

    // Várjuk meg, hogy megjelenjenek az adatok
    expect(await findByDisplayValue('test@example.com')).toBeTruthy();
    expect(await findByDisplayValue('John')).toBeTruthy();
    expect(await findByDisplayValue('Doe')).toBeTruthy();

    // Ellenőrizzük, hogy meghívódott a megfelelő API végpont
    expect(mockedAxios.get).toHaveBeenCalledWith(
      'https://test-api.example.com/api/user/profile',
      { headers: { Authorization: 'Bearer test-token' } }
    );
  });

  it('updates profile successfully', async () => {
    // Mock sikeres profil betöltés és frissítés
    mockedAxios.get.mockResolvedValueOnce({
      status: 200,
      data: {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe'
      }
    });

    mockedAxios.put.mockResolvedValueOnce({
      status: 200
    });

    const { findByDisplayValue, findByText } = render(<EditProfileScreen />);

    // Várjuk meg, hogy megjelenjenek az adatok és a mentés gomb
    const emailInput = await findByDisplayValue('test@example.com');
    const saveButton = await findByText('Mentés');

    // Módosítjuk az email címet
    fireEvent.changeText(emailInput, 'new@example.com');
    
    // Mentés gomb megnyomása
    fireEvent.press(saveButton);
    
    await waitFor(() => {
      // Ellenőrizzük, hogy meghívódott a megfelelő API végpont
      expect(mockedAxios.put).toHaveBeenCalledWith(
        'https://test-api.example.com/api/user/profile',
        { email: 'new@example.com', firstName: 'John', lastName: 'Doe' },
        { headers: { Authorization: 'Bearer test-token' } }
      );
      
      // Ellenőrizzük, hogy megjelent a sikeres üzenet
      expect(Alert.alert).toHaveBeenCalledWith('Siker', 'A profil adatok sikeresen frissítve');
    });
  });

  it('logs out user when logout button is pressed', async () => {
    // Mock sikeres profil betöltés
    mockedAxios.get.mockResolvedValueOnce({
      status: 200,
      data: {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe'
      }
    });

    const { findByText } = render(<EditProfileScreen />);

    // Várjuk meg, hogy megjelenjen a kijelentkezés gomb
    const logoutButton = await findByText('Kijelentkezés');
    
    // Kijelentkezés gomb megnyomása
    fireEvent.press(logoutButton);
    
    // Ellenőrizzük, hogy megjelent a megerősítő kérdés
    expect(Alert.alert).toHaveBeenCalledWith(
      'Kijelentkezés',
      'Biztosan ki szeretne jelentkezni?',
      expect.arrayContaining([
        expect.objectContaining({ text: 'Mégse' }),
        expect.objectContaining({ text: 'Igen' })
      ])
    );
    
    // Szimuláljuk az "Igen" gomb megnyomását
    const alertYesButton = (Alert.alert as jest.Mock).mock.calls[0][2][1];
    alertYesButton.onPress();
    
    await waitFor(() => {
      // Ellenőrizzük, hogy a token törlődött és a globális állapot frissült
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('token');
      expect(setAuthenticated).toHaveBeenCalledWith(false);
    });
  });

  it('toggles biometric login', async () => {
    // Mock sikeres profil betöltés
    mockedAxios.get.mockResolvedValueOnce({
      status: 200,
      data: {
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe'
      }
    });

    // Mock biometrikus függvények
    jest.spyOn(biometricHelper, 'enableBiometricLogin').mockResolvedValue();
    jest.spyOn(biometricHelper, 'disableBiometricLogin').mockResolvedValue();

    const { findByText } = render(<EditProfileScreen />);

    // Várjuk meg, hogy megjelenjen a biometrikus gomb
    const biometricButton = await findByText('Biometrikus bejelentkezés bekapcsolása');
    
    // Biometrikus bekapcsolása
    fireEvent.press(biometricButton);
    
    await waitFor(() => {
      // Ellenőrizzük, hogy a biometrikus engedélyezés meghívódott
      expect(biometricHelper.enableBiometricLogin).toHaveBeenCalledWith('test@example.com');
      expect(Alert.alert).toHaveBeenCalledWith('Értesítés', 'Biometrikus bejelentkezés bekapcsolva');
    });
  });
});