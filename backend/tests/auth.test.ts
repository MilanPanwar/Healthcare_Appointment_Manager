import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import prisma from '../src/config/database.js';

describe('Authentication & RBAC API Endpoints', () => {
  const patientEmail = `john.reg.${Date.now()}@test.local`;
  let patientToken = '';

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should successfully register a new patient', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: patientEmail,
        password: 'Password@123',
        firstName: 'Johnny',
        lastName: 'Tester',
        phone: '+1-555-8888',
        gender: 'Male',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.role).toBe('PATIENT');
    patientToken = res.body.data.token;
  });

  it('should prevent registration with duplicate email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: patientEmail,
        password: 'Password@123',
        firstName: 'Duplicate',
        lastName: 'User',
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('should login an existing user with valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: patientEmail,
        password: 'Password@123',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
  });

  it('should reject login with wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: patientEmail,
        password: 'WrongPassword!',
      });

    expect(res.status).toBe(401);
  });

  it('should return authenticated user profile on /api/auth/me', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${patientToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe(patientEmail);
  });

  it('should block non-admin users from admin routes (RBAC check)', async () => {
    const res = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${patientToken}`);

    expect(res.status).toBe(403);
  });
});
