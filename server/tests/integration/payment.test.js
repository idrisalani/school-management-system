//server\tests\integration\payment.test.js
import supertest from 'supertest';
import app from '../../src/app';
import Payment from '../../src/models/Payment';
import User from '../../src/models/User';
import { connectDB, dropDB, dropCollections } from '../setup/testDb';
import { generateAuthToken } from '../utils/auth';

const request = supertest(app);

describe('Payment Endpoints', () => {
  let userToken;
  let userId;

  beforeAll(async () => {
    await connectDB();
    
    const user = await User.create({
      email: 'user@example.com',
      password: 'User123!@#',
      name: 'Test User',
      role: 'student'
    });
    userToken = generateAuthToken(user);
    userId = user._id;
  });

  afterAll(async () => {
    await dropDB();
  });

  afterEach(async () => {
    await dropCollections(['payments']);
  });

  describe('POST /api/payments/create-payment-intent', () => {
    it('should create a payment intent', async () => {
      const res = await request
        .post('/api/payments/create-payment-intent')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          amount: 1000,
          description: 'Test payment'
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('clientSecret');
    });
  });

  describe('GET /api/payments/history', () => {
    beforeEach(async () => {
      await Payment.create({
        user: userId,
        amount: 1000,
        description: 'Test payment',
        status: 'succeeded'
      });
    });

    it('should get payment history', async () => {
      const res = await request
        .get('/api/payments/history')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBeTruthy();
      expect(res.body.length).toBe(1);
    });
  });
});