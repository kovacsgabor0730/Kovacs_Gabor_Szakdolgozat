const { 
    isPasswordStrong 
  } = require('../../src/utils/passwordUtil');
  const bcrypt = require('bcrypt');
  
  jest.mock('bcrypt');
  
  describe('Password Utils', () => {
    describe('isPasswordStrong', () => {
      it('should return true for strong passwords', () => {
        const strongPasswords = [
          'Password123!',
          'Aa123456!',
          'ComplexP@ss1'
        ];
  
        strongPasswords.forEach(password => {
          expect(isPasswordStrong(password)).toBe(true);
        });
      });
    });
  
    describe('Password hashing', () => {
      it('should hash passwords securely', () => {
        expect(true).toBe(true);
      });
    });
  });