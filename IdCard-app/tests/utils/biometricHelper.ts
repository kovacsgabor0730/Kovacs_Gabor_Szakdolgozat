import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import axios from 'axios';
import * as biometricHelper from '../../app/utils/biometricHelper';

jest.mock('@react-native-async-storage/async-storage');
jest.mock('expo-local-authentication');
jest.mock('axios');

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('biometricHelper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('isBiometricAvailable', () => {
    it('returns true when biometric hardware is available and enrolled', async () => {
      (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(true);
      (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(true);
      
      const result = await biometricHelper.isBiometricAvailable();
      expect(result).toBe(true);
    });

    it('returns false when biometric hardware is not available', async () => {
      (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(false);
      
      const result = await biometricHelper.isBiometricAvailable();
      expect(result).toBe(false);
    });

    it('returns false when biometric is not enrolled', async () => {
      (LocalAuthentication.hasHardwareAsync as jest.Mock).mockResolvedValue(true);
      (LocalAuthentication.isEnrolledAsync as jest.Mock).mockResolvedValue(false);
      
      const result = await biometricHelper.isBiometricAvailable();
      expect(result).toBe(false);
    });
  });

  describe('enableBiometricLogin', () => {
    it('saves biometric settings to AsyncStorage', async () => {
      await biometricHelper.enableBiometricLogin('test@example.com');
      
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('biometric_enabled', 'true');
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('biometric_email', 'test@example.com');
    });
  });

  describe('isBiometricEnabled', () => {
    it('returns true when biometric login is enabled', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('true');
      
      const result = await biometricHelper.isBiometricEnabled();
      expect(result).toBe(true);
    });

    it('returns false when biometric login is disabled', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);
      
      const result = await biometricHelper.isBiometricEnabled();
      expect(result).toBe(false);
    });
  });

  describe('authenticateWithBiometrics', () => {
    it('authenticates successfully and returns email', async () => {
      (LocalAuthentication.authenticateAsync as jest.Mock).mockResolvedValue({
        success: true
      });
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('test@example.com');
      
      const result = await biometricHelper.authenticateWithBiometrics();
      expect(result).toEqual({ success: true, email: 'test@example.com' });
    });

    it('returns failure when authentication fails', async () => {
      (LocalAuthentication.authenticateAsync as jest.Mock).mockResolvedValue({
        success: false
      });
      
      const result = await biometricHelper.authenticateWithBiometrics();
      expect(result).toEqual({ success: false });
    });
  });

  describe('loginWithBiometrics', () => {
    it('logs in successfully with biometrics', async () => {
      mockedAxios.post.mockResolvedValue({
        status: 200,
        data: { token: 'test-token' }
      });
      
      const result = await biometricHelper.loginWithBiometrics('test@example.com');
      expect(result).toBe('test-token');
      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://test-api.example.com/api/auth/biometric-login',
        { email: 'test@example.com' }
      );
    });

    it('returns null when login fails', async () => {
      mockedAxios.post.mockRejectedValue(new Error('Login failed'));
      
      const result = await biometricHelper.loginWithBiometrics('test@example.com');
      expect(result).toBeNull();
    });
  });
});