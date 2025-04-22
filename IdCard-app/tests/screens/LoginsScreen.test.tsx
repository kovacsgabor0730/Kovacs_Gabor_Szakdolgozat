import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LoginScreen from '../../app/screens/LoginScreen';
import * as biometricHelper from '../../app/utils/biometricHelper';

// Mock a navigation objektum
const mockNavigation = {
  navigate: jest.fn(),
};

// Mock response
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('LoginScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const { getByText, getByPlaceholderText } = render(
      <LoginScreen navigation={mockNavigation} />
    );
    
    expect(getByText('Bejelentkezés')).toBeTruthy();
    expect(getByPlaceholderText('Email')).toBeTruthy();
    expect(getByPlaceholderText('Jelszó')).toBeTruthy();
    expect(getByText('Bejelentkezés')).toBeTruthy();
  });

  it('handles form submission with valid credentials', async () => {
    // Mock sikeres bejelentkezési válasz
    mockedAxios.post.mockResolvedValueOnce({
      status: 200,
      data: { token: 'test-token', user: { email: 'test@example.com' } }
    });

    const { getByPlaceholderText, getByText } = render(
      <LoginScreen navigation={mockNavigation} />
    );

    // Form kitöltése
    const emailInput = getByPlaceholderText('Email');
    const passwordInput = getByPlaceholderText('Jelszó');
    
    fireEvent.changeText(emailInput, 'test@example.com');
    fireEvent.changeText(passwordInput, 'password123');
    
    // Bejelentkezés gomb megnyomása
    const loginButton = getByText('Bejelentkezés');
    fireEvent.press(loginButton);
    
    await waitFor(() => {
      // Ellenőrizzük, hogy meghívódott-e az API
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://test-api.example.com/api/auth/login',
        { email: 'test@example.com', password: 'password123' }
      );
      
      // Ellenőrizzük, hogy mentésre került a token
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('token', 'test-token');
    });
  });

  it('shows error message for invalid credentials', async () => {
    // Mock hibás bejelentkezési válasz
    mockedAxios.post.mockRejectedValueOnce({
      response: {
        data: { message: 'Invalid email or password' }
      }
    });

    const { getByPlaceholderText, getByText, findByText } = render(
      <LoginScreen navigation={mockNavigation} />
    );

    // Form kitöltése
    fireEvent.changeText(getByPlaceholderText('Email'), 'wrong@example.com');
    fireEvent.changeText(getByPlaceholderText('Jelszó'), 'wrongpassword');
    
    // Bejelentkezés gomb megnyomása
    fireEvent.press(getByText('Bejelentkezés'));
    
    // Hibakijelzés ellenőrzése
    const errorMessage = await findByText('Invalid email or password');
    expect(errorMessage).toBeTruthy();
  });

  it('navigates to forgot password screen', () => {
    const { getByText } = render(<LoginScreen navigation={mockNavigation} />);
    
    // "Elfelejtett jelszó" gombra kattintás
    fireEvent.press(getByText('Elfelejtett jelszó?'));
    
    // Navigáció ellenőrzése
    expect(mockNavigation.navigate).toHaveBeenCalledWith('ForgotPassword');
  });

  it('renders biometric login button when available', async () => {
    // Mock biometrikus azonosítás elérhetősége
    jest.spyOn(biometricHelper, 'isBiometricAvailable').mockResolvedValue(true);
    jest.spyOn(biometricHelper, 'isBiometricEnabled').mockResolvedValue(true);

    const { findByTestId } = render(<LoginScreen navigation={mockNavigation} />);
    
    const biometricButton = await findByTestId('biometric-button');
    expect(biometricButton).toBeTruthy();
  });
});