import jwt from 'jsonwebtoken';
import request from 'supertest';
import { beforeAll, describe, expect, it } from 'vitest';

describe('contrato HTTP sem acesso ao banco', () => {
  let app;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.DATABASE_URL = 'postgresql://unused:unused@localhost:1/unused';
    process.env.JWT_SECRET = 'unit-test-secret-with-at-least-32-characters';
    process.env.JWT_EXPIRES_IN = '1h';
    process.env.ADMIN_USERNAME = 'admin';
    process.env.ADMIN_PASSWORD = 'unit-test-password';
    process.env.LOG_LEVEL = 'silent';
    ({ createApp: app } = await import('../../src/app.js'));
    app = app();
  }, 30_000);

  it('mantem a documentacao publica', async () => {
    await request(app).get('/docs/').expect(200);
  });

  it('protege as rotas de pedidos', async () => {
    const response = await request(app).get('/order/list').expect(401);
    expect(response.body.error.code).toBe('AUTH_REQUIRED');
    expect(response.body.error.requestId).toBeTruthy();
  });

  it('valida o corpo antes de consultar o banco', async () => {
    const token = jwt.sign({}, process.env.JWT_SECRET, { expiresIn: '1m' });
    const response = await request(app)
      .post('/order')
      .set('authorization', `Bearer ${token}`)
      .send({ items: [] })
      .expect(422);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('trata JSON malformado e rota inexistente', async () => {
    const token = jwt.sign({}, process.env.JWT_SECRET, { expiresIn: '1m' });
    await request(app)
      .post('/order')
      .set('authorization', `Bearer ${token}`)
      .set('content-type', 'application/json')
      .send('{')
      .expect(400);
    await request(app).get('/rota-inexistente').expect(404);
  });
});
