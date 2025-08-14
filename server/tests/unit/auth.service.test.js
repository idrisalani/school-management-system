//server\tests\unit\auth.service.test.js
import authService from '../../src/services/auth.service';
import User from '../../src/models/User';
import { APIError } from '../../src/middleware/error.middleware';
import { mockUser, mockToken } from '../mocks/user.mock';

// Mock dependencies
jest.mock('../../src/models/User');
jest.mock('../../src/services/email.service');
jest.mock('jsonwebtoken');

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('authenticateUser', () => {
    it('should authenticate valid user credentials', async () => {
      User.findOne.mockResolvedValue(mockUser);
      const result = await authService.authenticateUser('test@example.com', 'password123');
      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
    });

    it('should throw error for invalid credentials', async () => {
      User.findOne.mockResolvedValue(null);
      await expect(
        authService.authenticateUser('wrong@email.com', 'wrongpass')
      ).rejects.toThrow(APIError);
    });
  });

  describe('verifyToken', () => {
    it('should verify valid token', async () => {
      User.findById.mockResolvedValue(mockUser);
      const result = await authService.validateToken(mockToken);
      expect(result).toEqual(mockUser);
    });

    it('should throw error for invalid token', async () => {
      await expect(
        authService.validateToken('invalid-token')
      ).rejects.toThrow(APIError);
    });
  });
});