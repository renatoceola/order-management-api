import { rateLimit } from 'express-rate-limit';

export const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1_000,
  limit: 10,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler(request, response) {
    response.status(429).json({
      error: {
        code: 'AUTH_RATE_LIMITED',
        message: 'Muitas tentativas de login. Tente novamente mais tarde.',
        requestId: request.id,
      },
    });
  },
});
