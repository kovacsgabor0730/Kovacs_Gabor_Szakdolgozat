import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import IdCardDetailsScreen from '../../app/screens/IdCardDetailsScreen';

// Mock useFocusEffect
jest.mock('@react-navigation/native', () => ({
  useFocusEffect: jest.fn(cb => cb()),
}));

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock formatHelpers
jest.mock('../../app/utils/formatHelpers', () => ({
  formatDate: jest.fn(date => '2023-01-01'),
  calculateDaysUntilExpiry: jest.fn(() => 30),
}));

describe('IdCardDetailsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Alapértelmezett AsyncStorage mock válaszok
    (AsyncStorage.getItem as jest.Mock)
      .mockImplementation((key) => {
        if (key === 'token') return Promise.resolve('test-token');
        return Promise.resolve(null);
      });
  });

  it('renders loading state initially', () => {
    const { getByTestId } = render(<IdCardDetailsScreen />);
    expect(getByTestId('loading-indicator')).toBeTruthy();
  });

  it('fetches and displays ID card data', async () => {
    // Mock sikeres ID kártya betöltés
    mockedAxios.get.mockResolvedValueOnce({
      status: 200,
      data: {
        id_number: 'ID123456',
        first_name: 'John',
        last_name: 'Doe',
        sex: 'férfi',
        date_of_birth: '1990-01-01',
        place_of_birth: 'Budapest',
        mothers_maiden_name: 'Smith Jane',
        date_of_expiry: '2030-01-01',
        can_number: 'CAN123456'
      }
    });

    const { findByText } = render(<IdCardDetailsScreen />);

    // Várjuk meg, hogy megjelenjen az adat
    expect(await findByText('ID123456')).toBeTruthy();
    expect(await findByText('John Doe')).toBeTruthy();
    expect(await findByText('Személyi igazolvány adatok')).toBeTruthy();

    // Ellenőrizzük, hogy meghívódott a megfelelő API végpont
    expect(mockedAxios.get).toHaveBeenCalledWith(
      'https://test-api.example.com/api/id-card/details',
      { headers: { Authorization: 'Bearer test-token' } }
    );
  });

  it('displays no data message when no ID card is available', async () => {
    // Mock sikeres, de üres válasz
    mockedAxios.get.mockResolvedValueOnce({
      status: 200,
      data: null
    });

    const { findByText } = render(<IdCardDetailsScreen />);

    // Várjuk meg, hogy megjelenjen a "nincs adat" üzenet
    expect(await findByText('Nincs személyi igazolvány feltöltve')).toBeTruthy();
  });

  it('displays expiry warning when ID card is about to expire', async () => {
    // Mock a calculateDaysUntilExpiry függvényt, hogy alacsony értéket adjon vissza
    require('../../app/utils/formatHelpers').calculateDaysUntilExpiry.mockReturnValue(10);
    
    // Mock sikeres ID kártya betöltés közeli lejárati dátummal
    mockedAxios.get.mockResolvedValueOnce({
      status: 200,
      data: {
        id_number: 'ID123456',
        first_name: 'John',
        last_name: 'Doe',
        date_of_expiry: '2023-05-01', // Közeli dátum
        // ...többi mező
      }
    });

    const { findByText } = render(<IdCardDetailsScreen />);

    // Várjuk meg, hogy megjelenjen a figyelmeztetés
    expect(await findByText(/Az Ön személyi igazolványa hamarosan lejár/)).toBeTruthy();
  });

  it('handles API errors gracefully', async () => {
    // Mock API hiba
    mockedAxios.get.mockRejectedValueOnce(new Error('Network error'));

    const { findByText } = render(<IdCardDetailsScreen />);

    // Várjuk meg, hogy megjelenjen a hiba üzenet
    expect(await findByText('Hiba történt az adatok betöltése közben')).toBeTruthy();
  });
});