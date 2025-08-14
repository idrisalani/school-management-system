//server\tests\unit\email.service.test.js
import emailService from '../../src/services/email.service';
import { APIError } from '../../src/middleware/error.middleware';

// Mock AWS SDK
jest.mock('aws-sdk', () => ({
  SES: jest.fn(() => ({
    sendEmail: jest.fn().mockReturnThis(),
    promise: jest.fn()
  }))
}));

describe('EmailService', () => {
  describe('sendEmail', () => {
    it('should send email successfully', async () => {
      const emailData = {
        to: 'test@example.com',
        subject: 'Test Email',
        html: '<p>Test content</p>'
      };

      await expect(emailService.sendEmail(emailData)).resolves.not.toThrow();
    });

    it('should handle email sending failure', async () => {
      const emailData = {
        to: 'invalid-email',
        subject: 'Test Email',
        html: '<p>Test content</p>'
      };

      await expect(emailService.sendEmail(emailData)).rejects.toThrow(APIError);
    });
  });

  describe('sendTemplate', () => {
    it('should send template email successfully', async () => {
      const templateData = {
        name: 'Test User',
        verificationLink: 'http://example.com/verify'
      };

      await expect(
        emailService.sendTemplate('welcomeEmail', templateData, 'test@example.com')
      ).resolves.not.toThrow();
    });

    it('should throw error for invalid template', async () => {
      await expect(
        emailService.sendTemplate('invalidTemplate', {}, 'test@example.com')
      ).rejects.toThrow(APIError);
    });
  });
});