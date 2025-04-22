import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import axios from 'axios';
import RegistrationScreen from '../../app/screens/RegistrationScreen';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('RegistrationScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly', () => {
    const { getByText, getByPlaceholderText } = render(<RegistrationScreen />);
    
    expect(getByText('Register')).toBeTruthy();
    expect(getByPlaceholderText('First Name')).toBeTruthy();
    expect(getByPlaceholderText('Last Name')).toBeTruthy();
    expect(getByPlaceholderText('Country')).toBeTruthy();
    expect(getByPlaceholderText('City')).toBeTruthy();
    expect(getByPlaceholderText('Postal Code')).toBeTruthy();
    expect(getByPlaceholderText('Street')).toBeTruthy();
    expect(getByPlaceholderText('Number')).toBeTruthy();
    expect(getByPlaceholderText('Email')).toBeTruthy();
    expect(getByPlaceholderText('Password')).toBeTruthy();
    expect(getByPlaceholderText('Confirm Password')).toBeTruthy();
    expect(getByText('Register')).toBeTruthy();
  });

  it('validates matching passwords', async () => {
    const { getByPlaceholderText, getByText } = render(<RegistrationScreen />);

    // Form kitöltése eltérő jelszavakkal
    fireEvent.changeText(getByPlaceholderText('First Name'), 'John');
    fireEvent.changeText(getByPlaceholderText('Last Name'), 'Doe');
    fireEvent.changeText(getByPlaceholderText('Country'), 'Hungary');
    fireEvent.changeText(getByPlaceholderText('City'), 'Budapest');
    fireEvent.changeText(getByPlaceholderText('Postal Code'), '1000');
    fireEvent.changeText(getByPlaceholderText('Street'), 'Main Street');
    fireEvent.changeText(getByPlaceholderText('Number'), '10');
    fireEvent.changeText(getByPlaceholderText('Email'), 'john@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'Password123');
    fireEvent.changeText(getByPlaceholderText('Confirm Password'), 'Password456');
    
    // Regisztráció gomb megnyomása
    fireEvent.press(getByText('Register'));
    
    // Ellenőrizzük, hogy nem hívódott meg az API, mert a jelszavak nem egyeznek
    expect(mockedAxios.post).not.toHaveBeenCalled();
  });

  it('submits form with valid data', async () => {
    // Mock sikeres regisztráció
    mockedAxios.post.mockResolvedValueOnce({
      status: 201,
      data: { message: 'User registered successfully' }
    });

    const { getByPlaceholderText, getByText } = render(<RegistrationScreen />);

    // Form kitöltése helyes adatokkal
    fireEvent.changeText(getByPlaceholderText('First Name'), 'John');
    fireEvent.changeText(getByPlaceholderText('Last Name'), 'Doe');
    fireEvent.changeText(getByPlaceholderText('Country'), 'Hungary');
    fireEvent.changeText(getByPlaceholderText('City'), 'Budapest');
    fireEvent.changeText(getByPlaceholderText('Postal Code'), '1000');
    fireEvent.changeText(getByPlaceholderText('Street'), 'Main Street');
    fireEvent.changeText(getByPlaceholderText('Number'), '10');
    fireEvent.changeText(getByPlaceholderText('Email'), 'john@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'Password123');
    fireEvent.changeText(getByPlaceholderText('Confirm Password'), 'Password123');
    
    // Regisztráció gomb megnyomása
    fireEvent.press(getByText('Register'));
    
    await waitFor(() => {
      // Ellenőrizzük, hogy meghívódott az API
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://test-api.example.com/api/auth/register', 
        {
          firstName: 'John',
          lastName: 'Doe',
          country: 'Hungary',
          city: 'Budapest',
          postalCode: '1000',
          street: 'Main Street',
          number: '10',
          email: 'john@example.com',
          password: 'Password123',
          confirmPassword: 'Password123'
        }
      );
    });
  });

  it('handles registration error', async () => {
    // Mock regisztrációs hiba
    mockedAxios.post.mockRejectedValueOnce({
      response: {
        data: { message: 'Email already exists' }
      }
    });

    const { getByPlaceholderText, getByText } = render(<RegistrationScreen />);

    // Form kitöltése
    fireEvent.changeText(getByPlaceholderText('First Name'), 'John');
    fireEvent.changeText(getByPlaceholderText('Last Name'), 'Doe');
    fireEvent.changeText(getByPlaceholderText('Country'), 'Hungary');
    fireEvent.changeText(getByPlaceholderText('City'), 'Budapest');
    fireEvent.changeText(getByPlaceholderText('Postal Code'), '1000');
    fireEvent.changeText(getByPlaceholderText('Street'), 'Main Street');
    fireEvent.changeText(getByPlaceholderText('Number'), '10');
    fireEvent.changeText(getByPlaceholderText('Email'), 'existing@example.com');
    fireEvent.changeText(getByPlaceholderText('Password'), 'Password123');
    fireEvent.changeText(getByPlaceholderText('Confirm Password'), 'Password123');
    
    // Regisztráció gomb megnyomása
    fireEvent.press(getByText('Register'));
    
    await waitFor(() => {
      // Ellenőrizzük, hogy meghívódott az API
      expect(mockedAxios.post).toHaveBeenCalled();
    });
  });
});