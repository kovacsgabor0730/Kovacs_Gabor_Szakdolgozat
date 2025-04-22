import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import axios from 'axios';
import ForgotPasswordScreen from '../../app/screens/ForgotPasswordScreen';

// Mock a navigation objektum
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn()
};

// Mock az Alert.alert-hez
jest.spyOn(Alert, 'alert');

// Mock response
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('ForgotPasswordScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const { getByText, getByPlaceholderText } = render(
      <ForgotPasswordScreen navigation={mockNavigation} />
    );
    
    expect(getByText('Jelszó visszaállítása')).toBeTruthy();
    expect(getByPlaceholderText('Email cím')).toBeTruthy();
    expect(getByText('Visszaállítási link kérése')).toBeTruthy();
  });

  it('shows error when email is not provided', () => {
    const { getByText } = render(
      <ForgotPasswordScreen navigation={mockNavigation} />
    );
    
    // Üres e-mail mezővel próbáljuk elküldeni
    fireEvent.press(getByText('Visszaállítási link kérése'));
    
    // Ellenőrizzük, hogy megjelent-e hibaüzenet
    expect(Alert.alert).toHaveBeenCalledWith('Hiba', 'Kérjük, adja meg az email címét');
  });

  it('handles successful password reset request', async () => {
    // Mock sikeres válasz
    mockedAxios.post.mockResolvedValueOnce({
      status: 200,
      data: { message: 'Email sent successfully' }
    });

    const { getByPlaceholderText, getByText } = render(
      <ForgotPasswordScreen navigation={mockNavigation} />
    );

    // E-mail megadása
    fireEvent.changeText(getByPlaceholderText('Email cím'), 'test@example.com');
    
    // Gomb megnyomása
    fireEvent.press(getByText('Visszaállítási link kérése'));
    
    await waitFor(() => {
      // Ellenőrizzük, hogy meghívódott-e a megfelelő API
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://test-api.example.com/api/auth/forgot-password',
        { email: 'test@example.com' }
      );
      
      // Ellenőrizzük a sikeres üzenetet
      expect(Alert.alert).toHaveBeenCalled();
    });
  });

  it('navigates back when back button is pressed', () => {
    const { getByText } = render(<ForgotPasswordScreen navigation={mockNavigation} />);
    
    // Vissza gombra kattintás
    fireEvent.press(getByText('Vissza a bejelentkezéshez'));
    
    // Navigáció ellenőrzése
    expect(mockNavigation.goBack).toHaveBeenCalled();
  });
});