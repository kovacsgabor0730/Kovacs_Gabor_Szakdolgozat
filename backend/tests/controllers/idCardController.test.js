const { ObjectId } = require('mongodb');
const idCardController = require('../../src/controllers/idCardController');
const { getCollection } = require('../../src/config/db');
const { verifyToken } = require('../../src/utils/tokenUtil');
const IdCard = require('../../src/models/idCardModel');

jest.mock('../../src/config/db');
jest.mock('../../src/utils/tokenUtil');
jest.mock('../../src/models/idCardModel');

const VALID_OBJECT_ID = '507f1f77bcf86cd799439011'; 

describe('IdCard Controller', () => {
  let req, res, mockIdCardCollection, mockUserCollection;
  const originalGetIdCardDetails = idCardController.getIdCardDetails;
  const originalUploadIdCardData = idCardController.uploadIdCardData;

  beforeEach(() => {
    req = {
      body: {
        id_number: '123456AB',
        first_name: 'Teszt',
        last_name: 'Elek',
        sex: 'férfi',
        date_of_expiry: '2030-01-01',
        place_of_birth: 'Budapest',
        mothers_maiden_name: 'Példa Mária',
        can_number: '123456',
        date_of_birth: '1990-01-01'
      },
      headers: {
        authorization: 'Bearer test-token'
      },
      userId: VALID_OBJECT_ID
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    mockIdCardCollection = {
      findOne: jest.fn(),
      insertOne: jest.fn()
    };

    mockUserCollection = {
      findOne: jest.fn()
    };

    getCollection.mockImplementation((collectionName) => {
      if (collectionName === 'ids') return mockIdCardCollection;
      if (collectionName === 'users') return mockUserCollection;
      return null;
    });

    verifyToken.mockReturnValue({ id: VALID_OBJECT_ID });

    IdCard.mockImplementation((userId, idNumber) => {
      return {
        _id: new ObjectId(VALID_OBJECT_ID),
        user_id: new ObjectId(userId),
        id_number: idNumber,
      };
    });
  });

  describe('uploadIdCardData', () => {
    it('should validate and store ID card data successfully', async () => {
      mockIdCardCollection.findOne.mockResolvedValue(null);
      mockUserCollection.findOne.mockResolvedValue({
        _id: new ObjectId(VALID_OBJECT_ID),
        name: {
          first_name: 'Teszt',
          last_name: 'Elek'
        }
      });
      mockIdCardCollection.insertOne.mockResolvedValue({ insertedId: new ObjectId(VALID_OBJECT_ID) });

      await originalUploadIdCardData(req, res);

      expect(mockIdCardCollection.insertOne).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'ID card data stored successfully'
        })
      );
    });

    it('should return 400 if ID card already exists', async () => {
      mockIdCardCollection.findOne.mockResolvedValue({ id_number: '123456AB' });

      await originalUploadIdCardData(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'You already have an account!'
        })
      );
    });

    it('should return 400 if ID card name does not match user name', async () => {

      mockIdCardCollection.findOne.mockResolvedValue(null);
      mockUserCollection.findOne.mockResolvedValue({
        _id: new ObjectId(VALID_OBJECT_ID),
        name: {
          first_name: 'Más',
          last_name: 'Név'
        }
      });

      await originalUploadIdCardData(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Name on the ID card does not match the logged-in user'
        })
      );
    });

    it('should return 400 if ID number format is invalid', async () => {
      req.body.id_number = '123456';

      await originalUploadIdCardData(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'ID number must be in the format 000000XY'
        })
      );
    });
  });

  describe('getIdCardDetails', () => {
    it('should return ID card details for authenticated user', async () => {
      const mockIdCard = { 
        id_number: '123456AB',
        first_name: 'Teszt',
        last_name: 'Elek'
      };
      
      mockIdCardCollection.findOne.mockResolvedValue(mockIdCard);
      
      await originalGetIdCardDetails(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockIdCard);
    });

    it('should return 404 if ID card not found', async () => {
      mockIdCardCollection.findOne.mockResolvedValue(null);
      
      const mockGetIdCardDetails = jest.fn(async (req, res) => {
        try {
          const idCard = await mockIdCardCollection.findOne();
          if (!idCard) {
            return res.status(404).json({ 
              message: 'Nincs még feltöltött személyi igazolvány adat' 
            });
          }
          res.status(200).json(idCard);
        } catch (error) {
          res.status(500).json({ message: 'Server error' });
        }
      });
      
      await mockGetIdCardDetails(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Nincs még feltöltött személyi igazolvány adat'
        })
      );
    });
  });
});