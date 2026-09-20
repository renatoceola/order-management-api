import jwt from 'jsonwebtoken';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const databaseAvailable = Boolean(process.env.DATABASE_URL);

describe.runIf(databaseAvailable)('API com PostgreSQL', () => {
  let app;
  let pool;
  let token;
  let closePool;
  let createOrderInRepository;
  let findOrderById;

  const order = {
    numeroPedido: 'v10089015vdb-01',
    valorTotal: 10000,
    dataCriacao: '2023-07-19T12:24:11.5299601+00:00',
    items: [{ idItem: '2434', quantidadeItem: 1, valorItem: 1000 }],
  };

  beforeAll(async () => {
    const [{ createApp }, poolModule, migrationModule, seedModule, repositoryModule] =
      await Promise.all([
        import('../../src/app.js'),
        import('../../src/db/pool.js'),
        import('../../db/migrate.js'),
        import('../../db/seed.js'),
        import('../../src/repositories/order-repository.js'),
      ]);
    pool = poolModule.getPool();
    closePool = poolModule.closePool;
    createOrderInRepository = repositoryModule.createOrder;
    findOrderById = repositoryModule.findOrderById;
    await migrationModule.runMigrations(pool);
    await seedModule.seedAdmin(pool);
    app = createApp();

    const login = await request(app).post('/auth/login').send({
      usuario: process.env.ADMIN_USERNAME,
      senha: process.env.ADMIN_PASSWORD,
    });
    token = login.body.token;
  });

  beforeEach(async () => {
    await pool.query('TRUNCATE items, orders RESTART IDENTITY CASCADE');
  });

  afterAll(async () => {
    await closePool();
  });

  it('executa o fluxo CRUD e preserva o numero recebido', async () => {
    const created = await request(app)
      .post('/order')
      .set('authorization', `Bearer ${token}`)
      .send(order)
      .expect(201);

    expect(created.headers.location).toBe('/order/v10089015vdb-01');
    expect(created.body).toMatchObject({
      orderId: order.numeroPedido,
      value: 10000,
      creationDate: '2023-07-19T12:24:11.529Z',
      items: [{ productId: 2434, quantity: 1, price: 1000 }],
    });

    const found = await request(app)
      .get(`/order/${order.numeroPedido}`)
      .set('authorization', `Bearer ${token}`)
      .expect(200);
    expect(found.body.orderId).toBe(order.numeroPedido);

    const listed = await request(app)
      .get('/order/list')
      .set('authorization', `Bearer ${token}`)
      .expect(200);
    expect(listed.body).toHaveLength(1);

    const updated = await request(app)
      .put(`/order/${order.numeroPedido}`)
      .set('authorization', `Bearer ${token}`)
      .send({
        ...order,
        valorTotal: 12000,
        items: [{ idItem: '999', quantidadeItem: 2, valorItem: 500 }],
      })
      .expect(200);
    expect(updated.body).toMatchObject({
      value: 12000,
      items: [{ productId: 999, quantity: 2, price: 500 }],
    });

    await request(app)
      .delete(`/order/${order.numeroPedido}`)
      .set('authorization', `Bearer ${token}`)
      .expect(204);
    expect((await pool.query('SELECT COUNT(*)::int AS count FROM items')).rows[0].count).toBe(0);
  });

  it('protege todos os endpoints de pedidos', async () => {
    await request(app).get('/order/list').expect(401);
    await request(app).get('/order/list').set('authorization', 'Bearer invalido').expect(401);

    const expired = jwt.sign({}, process.env.JWT_SECRET, { expiresIn: -1 });
    await request(app).get('/order/list').set('authorization', `Bearer ${expired}`).expect(401);
  });

  it('rejeita credenciais incorretas sem revelar qual campo falhou', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({ usuario: process.env.ADMIN_USERNAME, senha: 'senha-incorreta' })
      .expect(401);
    expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('devolve erros para duplicidade, validacao e pedido inexistente', async () => {
    const authorizedPost = () =>
      request(app).post('/order').set('authorization', `Bearer ${token}`).send(order);
    await authorizedPost().expect(201);
    expect((await authorizedPost().expect(409)).body.error.code).toBe('ORDER_ALREADY_EXISTS');

    await request(app)
      .post('/order')
      .set('authorization', `Bearer ${token}`)
      .send({ ...order, numeroPedido: 'outro', items: [] })
      .expect(422);
    await request(app)
      .get('/order/inexistente')
      .set('authorization', `Bearer ${token}`)
      .expect(404);
  });

  it('rejeita JSON malformado com status 400', async () => {
    const response = await request(app)
      .post('/order')
      .set('authorization', `Bearer ${token}`)
      .set('content-type', 'application/json')
      .send('{')
      .expect(400);
    expect(response.body.error.code).toBe('INVALID_JSON');
  });

  it('rejeita divergencia entre URL e corpo na atualizacao', async () => {
    await request(app)
      .put('/order/outro-id')
      .set('authorization', `Bearer ${token}`)
      .send(order)
      .expect(422);
  });

  it('desfaz toda a criacao quando um item falha', async () => {
    await expect(
      createOrderInRepository({
        orderId: 'rollback-1',
        value: 10,
        creationDate: new Date().toISOString(),
        items: [
          { productId: 1, quantity: 1, price: 5 },
          { productId: 1, quantity: 1, price: 5 },
        ],
      }),
    ).rejects.toMatchObject({ code: '23505' });
    expect(await findOrderById('rollback-1')).toBeNull();
  });

  it('informa a saude do banco e mantem Swagger publico', async () => {
    await request(app).get('/health').expect(200, { status: 'ok', database: 'ok' });
    await request(app).get('/docs/').expect(200);
  });
});
