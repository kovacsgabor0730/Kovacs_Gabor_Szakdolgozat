const { sendEmail } = require('../../src/utils/emailUtils');
const nodemailer = require('nodemailer');

jest.mock('nodemailer');

describe('Email Utils', () => {
  beforeEach(() => {
    const mockSendMail = jest.fn().mockResolvedValue({ messageId: 'test-id' });
    
    nodemailer.createTransport.mockReturnValue({
      sendMail: mockSendMail
    });
  });

  describe('Email functionality', () => {
    it('should send email successfully', async () => {
      const emailOptions = {
        to: 'user@example.com',
        subject: 'Test Subject',
        text: 'Test content',
        html: '<p>Test HTML content</p>'
      };

      const result = await sendEmail(emailOptions);

      expect(nodemailer.createTransport).toHaveBeenCalled();
      expect(result).toBeDefined();
    });
  });
});