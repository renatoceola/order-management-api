import { getPool } from '../db/pool.js';

export async function findUserByUsername(username, pool = getPool()) {
  const result = await pool.query(
    'SELECT id, username, password_hash FROM users WHERE username = $1',
    [username],
  );
  return result.rows[0] ?? null;
}
