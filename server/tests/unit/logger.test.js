//server\tests\unit\logger.test.js
import { logger, logUtils } from '../../src/utils/logger';

describe('Logger', () => {
  const originalConsole = console;
  let consoleOutput = [];

  beforeEach(() => {
    consoleOutput = [];
    console.log = jest.fn((...args) => {
      consoleOutput.push(args);
    });
  });

  afterEach(() => {
    console.log = originalConsole.log;
  });

  describe('logger.info', () => {
    it('should log info messages', () => {
      const message = 'Test info message';
      logger.info(message);
      expect(consoleOutput.length).toBeGreaterThan(0);
    });
  });

  describe('logger.error', () => {
    it('should log error messages', () => {
      const error = new Error('Test error');
      logger.error(error);
      expect(consoleOutput.length).toBeGreaterThan(0);
    });
  });

  describe('logUtils.logRequest', () => {
    it('should log HTTP requests', () => {
      const req = {
        method: 'GET',
        url: '/test',
        ip: '127.0.0.1'
      };
      const res = {
        statusCode: 200
      };

      logUtils.logRequest(req, res);
      expect(consoleOutput.length).toBeGreaterThan(0);
    });
  });
});