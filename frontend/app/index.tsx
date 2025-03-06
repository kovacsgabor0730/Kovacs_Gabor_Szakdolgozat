import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import RegistrationScreen from './screens/RegistrationScreen';
import LoginScreen from './screens/LoginScreen';
import IdCardScreen from './screens/IdCardScreen';

const Stack = createStackNavigator();

const AppNavigator = () => {
  return (
  <Stack.Navigator initialRouteName="Upload_ID_Card">
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegistrationScreen} />
      <Stack.Screen name="Upload_ID_Card" component={IdCardScreen} />
    </Stack.Navigator>
  );
};

export default AppNavigator;