const { login, register, resetPassword } = require('../../src/controllers/authController');
const { getCollection } = require('../../src/config/db');
const { generateToken } = require('../../src/utils/tokenUtil');
const { hashPassword, comparePassword } = require('../../src/utils/passwordUtil');

// Mockolás
jest.mock('../../src/config/db');
jest.mock('../../src/utils/tokenUtil');
jest.mock('../../src/utils/passwordUtil');

describe('Auth Controller', () => {
  let req, res, mockUserCollection;

  beforeEach(() => {
    req = {
      body: {
        email: 'test@example.com',
        password: 'Password123!'
      }
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    mockUserCollection = {
      findOne: jest.fn(),
      insertOne: jest.fn()
    };

    // Mock implementations
    getCollection.mockResolvedValue(mockUserCollection);
    generateToken.mockReturnValue('test-token');
    hashPassword.mockResolvedValue('hashed-password');
    comparePassword.mockResolvedValue(true);
  });

  describe('login', () => {
    it('should authenticate user and return token', async () => {
      // Arrange
      const user = { 
        _id: '123', 
        email: 'test@example.com',
        password: 'hashed-password'
      };
      mockUserCollection.findOne.mockResolvedValue(user);

      // Act
      await login(req, res);

      // Assert
      expect(mockUserCollection.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(comparePassword).toHaveBeenCalledWith('Password123!', 'hashed-password');
      expect(generateToken).toHaveBeenCalledWith('123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        token: 'test-token'
      }));
    });

    it('should return 401 for invalid credentials', async () => {
      // Arrange
      mockUserCollection.findOne.mockResolvedValue(null);

      // Act
      await login(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe('register', () => {
    it('should create new user and return token', async () => {
      // Arrange
      req.body = {
        first_name: 'Test',
        last_name: 'User',
        email: 'test@example.com',
        password: 'Password123!',
        country: 'Hungary',
        city: 'Budapest',
        postalCode: '1000',
        street: 'Test Street',
        number: '1'
      };
      mockUserCollection.findOne.mockResolvedValue(null);
      mockUserCollection.insertOne.mockResolvedValue({
        insertedId: '123'
      });

      // Act
      await register(req, res);

      // Assert
      expect(mockUserCollection.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(hashPassword).toHaveBeenCalledWith('Password123!');
      expect(mockUserCollection.insertOne).toHaveBeenCalled();
      expect(generateToken).toHaveBeenCalledWith('123');
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should return 400 if user already exists', async () => {
      // Arrange
      mockUserCollection.findOne.mockResolvedValue({ email: 'test@example.com' });

      // Act
      await register(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});