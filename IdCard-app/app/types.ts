import React from 'react';
import { View } from 'react-native';

export interface ImageCropProps {
  route: {
    params: {
      imageUri: string;
    };
  };
  navigation: any;
}

export interface CameraProps {
  navigation: any;
}

export interface UploadIdCardProps {
  route: {
    params: {
      idCardData: any;
    };
  };
}
