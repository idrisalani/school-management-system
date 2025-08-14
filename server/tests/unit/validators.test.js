//server\tests\unit\validators.test.js
import validators from '../../src/utils/validators';

describe('Validators', () => {
  describe('validateEmail', () => {
    it('should validate correct email format', () => {
      expect(validators.validateEmail('test@example.com')).toBe(true);
      expect(validators.validateEmail('test.name@domain.co.uk')).toBe(true);
    });

    it('should reject invalid email format', () => {
      expect(validators.validateEmail('invalid-email')).toBe(false);
      expect(validators.validateEmail('@domain.com')).toBe(false);
      expect(validators.validateEmail('test@')).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('should validate strong passwords', () => {
      expect(validators.validatePassword('StrongPass123!')).toBe(true);
      expect(validators.validatePassword('Complex@Pass789')).toBe(true);
    });

    it('should reject weak passwords', () => {
      expect(validators.validatePassword('weak')).toBe(false);
      expect(validators.validatePassword('12345678')).toBe(false);
      expect(validators.validatePassword('nospecialchar1')).toBe(false);
    });
  });

  describe('validateObjectId', () => {
    it('should validate correct MongoDB ObjectIds', () => {
      expect(validators.validateObjectId('507f1f77bcf86cd799439011')).toBe(true);
    });

    it('should reject invalid ObjectIds', () => {
      expect(validators.validateObjectId('invalid-id')).toBe(false);
      expect(validators.validateObjectId('123')).toBe(false);
    });
  });
});