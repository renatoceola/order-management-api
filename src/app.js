import { readFileSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import helmet from 'helmet';
import pino from 'pino';
import pinoHttp from 'pino-http';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yaml';
import { getEnv } from './config/env.js';
import { getPool } from './db/pool.js';
import { authenticate } from './middlewares/authenticate.js';
import { errorHandler, notFound } from './middlewares/error-handler.js';
import { authRouter } from './routes/auth-routes.js';
import { orderRouter } from './routes/order-routes.js';

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const openapiPath = path.resolve(currentDirectory, '../docs/openapi.yaml');
const openapiDocument = YAML.parse(readFileSync(openapiPath, 'utf8'));

export function createApp() {
  const env = getEnv();
  const app = express();
  const logger = pino({ level: env.NODE_ENV === 'test' ? 'silent' : env.LOG_LEVEL });

  app.disable('x-powered-by');
  app.use(
    pinoHttp({
      logger,
      genReqId(request, response) {
        const id = request.headers['x-request-id'] || randomUUID();
        response.setHeader('x-request-id', id);
        return id;
      },
      redact: ['req.headers.authorization'],
    }),
  );
  app.use(helmet());
  app.use(express.json({ limit: '100kb' }));

  app.get('/health', async (_request, response) => {
    try {
      await getPool().query('SELECT 1');
      response.status(200).json({ status: 'ok', database: 'ok' });
    } catch {
      response.status(503).json({ status: 'indisponivel', database: 'erro' });
    }
  });
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapiDocument));
  app.use('/auth', authRouter);
  app.use('/order', authenticate, orderRouter);
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
