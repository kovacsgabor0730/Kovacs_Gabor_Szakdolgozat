import React from 'react';
import { render, waitFor, act, fireEvent } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CameraScreen from '../../app/screens/CameraScreen';
import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import axios from 'axios';

// Mock a navigation és route objektumok
const mockNavigation = {
  navigate: jest.fn(),
  setOptions: jest.fn(),
  goBack: jest.fn(),
};

const mockRoute = {
  params: {
    returnScreen: 'IdCard',
  },
};

// Mock expo-camera
jest.mock('expo-camera', () => ({
  Camera: jest.fn().mockImplementation(() => ({
    takePictureAsync: jest.fn().mockResolvedValue({ uri: 'mock-image-uri.jpg' }),
  })),
  CameraType: {
    back: 'back',
    front: 'front',
  },
  FlashMode: {
    off: 'off',
    on: 'on',
    auto: 'auto',
  },
  requestCameraPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
}));

// Mock expo-image-manipulator
jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: jest.fn().mockResolvedValue({ uri: 'manipulated-image-uri.jpg' }),
  SaveFormat: {
    JPEG: 'jpeg',
  },
}));

// Mock axios
jest.mock('axios', () => ({
  post: jest.fn().mockResolvedValue({
    status: 200,
    data: {
      id_number: 'ID123456',
      first_name: 'John',
      last_name: 'Doe',
      sex: 'férfi',
      date_of_birth: '1990-01-01',
      date_of_expiry: '2030-01-01',
      // ...további mezők
    },
  }),
}));

// Mock a navigation és route objektumok
const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
};

const mockRoute = {
    params: {
        returnScreen: 'IdCard',
    },
};

// Mock expo-image-picker
jest.mock('expo-image-picker', () => ({
    launchCameraAsync: jest.fn(),
    MediaTypeOptions: {
        Images: 'Images',
    },
}));

// Mock expo-media-library
jest.mock('expo-media-library', () => ({
    requestPermissionsAsync: jest.fn(),
    saveToLibraryAsync: jest.fn(),
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
    getItem: jest.fn(),
    setItem: jest.fn(),
}));

// Mock axios
jest.mock('axios');

// Mock expo-constants
jest.mock('expo-constants', () => ({
    expoConfig: {
        extra: {
            apiUrl: 'https://api-test.example.com',
        },
    },
}));

describe('CameraScreen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        AsyncStorage.getItem.mockResolvedValue('fake-token');
        AsyncStorage.setItem.mockResolvedValue(undefined);
    });

    it('should show loading state initially', () => {
        const { getByText } = render(
            <CameraScreen navigation={mockNavigation} route={mockRoute} />
        );
        expect(getByText('Kamera indítása...')).toBeTruthy();
    });

    it('should automatically launch camera on mount', () => {
        render(<CameraScreen navigation={mockNavigation} route={mockRoute} />);
        expect(ImagePicker.launchCameraAsync).toHaveBeenCalled();
    });
    
    it('should process pre-selected image from route params', async () => {
        const routeWithImage = {
            params: {
                imageUri: 'test-image.jpg',
                returnScreen: 'IdCard',
            },
        };
        
        axios.post.mockResolvedValueOnce({
            status: 200,
            data: {
                results: [{
                    extracted_data: {
                        id_number: 'ABC123',
                        name: 'Test User',
                    }
                }]
            }
        });
        
        render(<CameraScreen navigation={mockNavigation} route={routeWithImage} />);
        
        await waitFor(() => {
            expect(axios.post).toHaveBeenCalled();
            expect(AsyncStorage.setItem).toHaveBeenCalledWith('lastProcessedImage', 'test-image.jpg');
            expect(AsyncStorage.setItem).toHaveBeenCalledWith('lastProcessedData', expect.stringContaining('ABC123'));
            expect(mockNavigation.navigate).toHaveBeenCalledWith('IdCard');
        });
    });
    
    it('should handle camera capture success', async () => {
        // Setup camera success
        ImagePicker.launchCameraAsync.mockResolvedValueOnce({
            canceled: false,
            assets: [{ uri: 'captured-image.jpg' }]
        });
        
        MediaLibrary.requestPermissionsAsync.mockResolvedValueOnce({ status: 'granted' });
        
        axios
