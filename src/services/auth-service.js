import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getEnv } from '../config/env.js';
import { AppError } from '../errors/app-error.js';
import { findUserByUsername } from '../repositories/user-repository.js';

export async function login({ usuario, senha }) {
  const user = await findUserByUsername(usuario);
  const validPassword = user ? await bcrypt.compare(senha, user.password_hash) : false;

  if (!validPassword) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Usuario ou senha invalidos.');
  }

  const env = getEnv();
  const token = jwt.sign({ username: user.username }, env.JWT_SECRET, {
    algorithm: 'HS256',
    subject: String(user.id),
    expiresIn: env.JWT_EXPIRES_IN,
  });

  return { token, tipo: 'Bearer', expiraEm: env.JWT_EXPIRES_IN };
}
