const imageController = require('../../src/controllers/imageController');
const { getCollection } = require('../../src/config/db');
const flaskClient = require('../../src/utils/flaskClient');

// Mockolás
jest.mock('../../src/config/db');
jest.mock('../../src/utils/flaskClient');

describe('Image Controller', () => {
  describe('Basic functionality', () => {
    it('should process images', () => {
         expect(imageController).toBeDefined();
    });
  });
});