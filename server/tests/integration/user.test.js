//server\tests\integration\user.test.js
import supertest from 'supertest';
import app from '../../src/app';
import User from '../../src/models/User';
import { connectDB, dropDB, dropCollections } from '../setup/testDb';
import { generateAuthToken } from '../utils/auth';

const request = supertest(app);

describe('User Endpoints', () => {
  let adminToken;
  let userToken;

  beforeAll(async () => {
    await connectDB();
    
    // Create admin user
    const admin = await User.create({
      email: 'admin@example.com',
      password: 'Admin123!@#',
      name: 'Admin User',
      role: 'admin'
    });
    adminToken = generateAuthToken(admin);

    // Create regular user
    const user = await User.create({
      email: 'user@example.com',
      password: 'User123!@#',
      name: 'Regular User',
      role: 'student'
    });
    userToken = generateAuthToken(user);
  });

  afterAll(async () => {
    await dropDB();
  });

  afterEach(async () => {
    await dropCollections(['users']);
  });

  describe('GET /api/users', () => {
    it('should get all users as admin', async () => {
      const res = await request
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.users)).toBeTruthy();
    });

    it('should not allow regular users to get all users', async () => {
      const res = await request
        .get('/api/users')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/users/:id', () => {
    it('should get user by id', async () => {
      const user = await User.create({
        email: 'test@example.com',
        password: 'Test123!@#',
        name: 'Test User',
        role: 'student'
      });

      const res = await request
        .get(`/api/users/${user._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('email', 'test@example.com');
    });
  });
});