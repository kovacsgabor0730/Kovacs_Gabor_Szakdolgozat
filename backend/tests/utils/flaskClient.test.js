const axios = require('axios');
const flaskClient = require('../../src/utils/flaskClient');
const fs = require('fs');

jest.mock('axios');
jest.mock('fs');

describe('Flask Client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.FLASK_API_URL = 'http://test-api.com';
  });

  it('should send image for processing', async () => {
    const imageData = Buffer.from('test image data');
    fs.readFileSync.mockReturnValue(imageData);
    
    const mockResponse = { 
      data: { 
        success: true, 
        extractedData: { id_number: '123456AB' } 
      } 
    };
    axios.post.mockResolvedValue(mockResponse);

    const result = await flaskClient.processImage('test.jpg');

    expect(fs.readFileSync).toHaveBeenCalledWith('test.jpg');
    expect(axios.post).toHaveBeenCalledWith(
      process.env.FLASK_API_URL,
      expect.objectContaining({
        image: imageData.toString('base64')
      }),
      expect.any(Object)
    );
    expect(result).toEqual(mockResponse.data);
  });

  it('should handle API errors', async () => {
    fs.readFileSync.mockReturnValue(Buffer.from('test image data'));
    axios.post.mockRejectedValue(new Error('API Error'));

    await expect(flaskClient.processImage('test.jpg'))
      .rejects
      .toThrow('API Error');
  });
});