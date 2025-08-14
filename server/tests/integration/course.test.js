//server\tests\integration\course.test.js
import supertest from 'supertest';
import app from '../../src/app';
import Course from '../../src/models/Course';
import User from '../../src/models/User';
import { connectDB, dropDB, dropCollections } from '../setup/testDb';
import { generateAuthToken } from '../utils/auth';

const request = supertest(app);

describe('Course Endpoints', () => {
  let teacherToken;
  let studentToken;
  let teacherId;
  let studentId;

  beforeAll(async () => {
    await connectDB();
    
    const teacher = await User.create({
      email: 'teacher@example.com',
      password: 'Teacher123!@#',
      name: 'Test Teacher',
      role: 'teacher'
    });
    teacherToken = generateAuthToken(teacher);
    teacherId = teacher._id;

    const student = await User.create({
      email: 'student@example.com',
      password: 'Student123!@#',
      name: 'Test Student',
      role: 'student'
    });
    studentToken = generateAuthToken(student);
    studentId = student._id;
  });

  afterAll(async () => {
    await dropDB();
  });

  afterEach(async () => {
    await dropCollections(['courses']);
  });

  describe('POST /api/courses', () => {
    it('should create a new course', async () => {
      const res = await request
        .post('/api/courses')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          code: 'CS101',
          name: 'Introduction to Programming',
          description: 'Basic programming concepts',
          credits: 3,
          maxStudents: 30
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('code', 'CS101');
    });
  });

  describe('GET /api/courses', () => {
    beforeEach(async () => {
      await Course.create({
        code: 'CS101',
        name: 'Introduction to Programming',
        description: 'Basic programming concepts',
        credits: 3,
        maxStudents: 30,
        teachers: [teacherId]
      });
    });

    it('should get all courses', async () => {
      const res = await request
        .get('/api/courses')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBeTruthy();
      expect(res.body.length).toBe(1);
    });
  });

  describe('POST /api/courses/:id/enroll', () => {
    let courseId;

    beforeEach(async () => {
      const course = await Course.create({
        code: 'CS101',
        name: 'Introduction to Programming',
        description: 'Basic programming concepts',
        credits: 3,
        maxStudents: 30,
        teachers: [teacherId]
      });
      courseId = course._id;
    });

    it('should enroll student in course', async () => {
      const res = await request
        .post(`/api/courses/${courseId}/enroll`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message', 'Enrolled successfully');
    });
  });
});