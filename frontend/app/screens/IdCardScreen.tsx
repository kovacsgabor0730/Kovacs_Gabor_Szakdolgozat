import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, Platform } from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import RNPickerSelect from 'react-native-picker-select';

const IdCardScreen = () => {
  const [idNumber, setIdNumber] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [sex, setSex] = useState('');
  const [dateOfExpiry, setDateOfExpiry] = useState(new Date());
  const [placeOfBirth, setPlaceOfBirth] = useState('');
  const [mothersMaidenName, setMothersMaidenName] = useState('');
  const [canNumber, setCanNumber] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState(new Date());
  const [showExpiryDatePicker, setShowExpiryDatePicker] = useState(false);
  const [showBirthDatePicker, setShowBirthDatePicker] = useState(false);

  const handleUpload = async () => {
    //const token = await AsyncStorage.getItem('token');
    const token="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3Yzg4MzFkNTA0ZjU4YzQ2ZjBjMmY5NCIsImlhdCI6MTc0MTI3NjE3NywiZXhwIjoxNzQxMjc5Nzc3fQ.CKCCapOVuZZEFL09Hi_fjCT0FsarCCmO5FHOBkrm0QA";
    if (!token) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    try {
      const response = await axios.post('http://localhost:3000/api/id-card/upload', {
        id_number: idNumber,
        first_name: firstName,
        last_name: lastName,
        sex,
        date_of_expiry: dateOfExpiry.toISOString().split('T')[0],
        place_of_birth: placeOfBirth,
        mothers_maiden_name: mothersMaidenName,
        can_number: canNumber,
        date_of_birth: dateOfBirth.toISOString().split('T')[0],
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 200) {
        Alert.alert('Success', 'ID card data uploaded successfully');
      } else {
        Alert.alert('Error', response.data.message);
      }
    } catch (error: any) {
      if (error.response && error.response.data && error.response.data.message) {
        Alert.alert('Error', error.response.data.message);
      } else {
        Alert.alert('Error', 'Something went wrong');
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Upload ID Card</Text>
      <TextInput
        style={styles.input}
        placeholder="ID Number"
        value={idNumber}
        onChangeText={setIdNumber}
      />
      <TextInput
        style={styles.input}
        placeholder="First Name"
        value={firstName}
        onChangeText={setFirstName}
      />
      <TextInput
        style={styles.input}
        placeholder="Last Name"
        value={lastName}
        onChangeText={setLastName}
      />
      <RNPickerSelect
        onValueChange={(value) => setSex(value)}
        items={[
          { label: 'Férfi', value: 'férfi' },
          { label: 'Nő', value: 'nő' },
        ]}
        style={pickerSelectStyles}
        placeholder={{ label: 'Select Sex', value: null }}
      />
      <Text style={styles.label}>Date of Expiry</Text>
      {Platform.OS !== 'web' ? (
        <>
          <Button title="Select Date" onPress={() => setShowExpiryDatePicker(true)} />
          {showExpiryDatePicker && (
            <DateTimePicker
              value={dateOfExpiry}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowExpiryDatePicker(Platform.OS === 'ios');
                if (selectedDate) {
                  setDateOfExpiry(selectedDate);
                }
              }}
            />
          )}
        </>
      ) : (
        <TextInput
          style={styles.input}
          placeholder="Date of Expiry"
          value={dateOfExpiry.toISOString().split('T')[0]}
          onChangeText={(text) => setDateOfExpiry(new Date(text))}
        />
      )}
      <Text style={styles.label}>Date of Birth</Text>
      {Platform.OS !== 'web' ? (
        <>
          <Button title="Select Date" onPress={() => setShowBirthDatePicker(true)} />
          {showBirthDatePicker && (
            <DateTimePicker
              value={dateOfBirth}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowBirthDatePicker(Platform.OS === 'ios');
                if (selectedDate) {
                  setDateOfBirth(selectedDate);
                }
              }}
            />
          )}
        </>
      ) : (
        <TextInput
          style={styles.input}
          placeholder="Date of Birth"
          value={dateOfBirth.toISOString().split('T')[0]}
          onChangeText={(text) => setDateOfBirth(new Date(text))}
        />
      )}
      <TextInput
        style={styles.input}
        placeholder="Place of Birth"
        value={placeOfBirth}
        onChangeText={setPlaceOfBirth}
      />
      <TextInput
        style={styles.input}
        placeholder="Mother's Maiden Name"
        value={mothersMaidenName}
        onChangeText={setMothersMaidenName}
      />
      <TextInput
        style={styles.input}
        placeholder="CAN Number"
        value={canNumber}
        onChangeText={setCanNumber}
      />
      <Button title="Upload" onPress={handleUpload} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
});

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  inputAndroid: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    marginBottom: 12,
    paddingHorizontal: 8,
  },
});

export default IdCardScreen;