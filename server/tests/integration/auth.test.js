//server\tests\integration\auth.test.js
import supertest from 'supertest';
import app from '../../src/app';
import User from '../../src/models/User';
import { connectDB, dropDB, dropCollections } from '../setup/testDb';

const request = supertest(app);

describe('Auth Endpoints', () => {
  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await dropDB();
  });

  afterEach(async () => {
    await dropCollections();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const res = await request
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Test123!@#',
          name: 'Test User',
          role: 'student'
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('message', 'Registration successful. Please verify your email.');
    });

    it('should not register with existing email', async () => {
      await User.create({
        email: 'test@example.com',
        password: 'Test123!@#',
        name: 'Test User',
        role: 'student'
      });

      const res = await request
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Test123!@#',
          name: 'Test User',
          role: 'student'
        });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message', 'User already exists');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      const user = await User.create({
        email: 'test@example.com',
        password: 'Test123!@#',
        name: 'Test User',
        role: 'student',
        isEmailVerified: true
      });
    });

    it('should login successfully', async () => {
      const res = await request
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Test123!@#'
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
    });

    it('should not login with wrong password', async () => {
      const res = await request
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpass'
        });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('message', 'Invalid credentials');
    });
  });
});