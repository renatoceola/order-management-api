import bcrypt from 'bcryptjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getEnv } from '../src/config/env.js';
import { closePool, getPool } from '../src/db/pool.js';

export async function seedAdmin(pool = getPool()) {
  const env = getEnv();
  const passwordHash = await bcrypt.hash(env.ADMIN_PASSWORD, 12);

  await pool.query(
    `INSERT INTO users (username, password_hash)
     VALUES ($1, $2)
     ON CONFLICT (username)
     DO UPDATE SET password_hash = EXCLUDED.password_hash, updated_at = NOW()`,
    [env.ADMIN_USERNAME, passwordHash],
  );
}

const isDirectExecution =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectExecution) {
  seedAdmin()
    .then(() => console.warn('Usuario administrador criado ou atualizado.'))
    .finally(closePool);
}
