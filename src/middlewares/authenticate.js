import jwt from 'jsonwebtoken';
import { getEnv } from '../config/env.js';
import { AppError } from '../errors/app-error.js';

export function authenticate(request, _response, next) {
  const authorization = request.get('authorization');
  const [scheme, token] = authorization?.split(' ') ?? [];

  if (scheme !== 'Bearer' || !token) {
    return next(new AppError(401, 'AUTH_REQUIRED', 'Token de acesso obrigatorio.'));
  }

  try {
    request.auth = jwt.verify(token, getEnv().JWT_SECRET, {
      algorithms: ['HS256'],
    });
    return next();
  } catch {
    return next(new AppError(401, 'INVALID_TOKEN', 'Token de acesso invalido ou expirado.'));
  }
}
