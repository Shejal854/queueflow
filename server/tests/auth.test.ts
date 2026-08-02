/**
 * PURPOSE: Integration test for the register/login flow, hitting the
 * real Express `app` via supertest against a test MongoDB.
 *
 * WHY INTEGRATION TESTS FOR AUTH (over pure unit tests)
 * Auth is a cross-cutting flow through validate -> controller -> service
 * -> repository -> DB -> cookie -- a unit test of any single layer
 * wouldn't catch a wiring bug between them (e.g. wrong cookie name).
 * An integration test exercises the whole path the way a real client
 * would, which is where auth bugs actually hide.
 *
 * NOTE: requires a running MongoDB (set MONGO_URI env var, e.g. to a
 * local/dockerized test instance) to actually execute.
 */
import request from 'supertest';
import mongoose from 'mongoose';
import { buildApp } from '../src/app';

const app = buildApp();

describe('Auth flow', () => {
  const email = `test_${Date.now()}@example.com`;

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it('registers a new user and returns an access token', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test User', email, password: 'password123' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
  });

  it('rejects login with wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email, password: 'wrongpassword' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('logs in with correct credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email, password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe(email);
  });
});
