import { Router } from 'express';
import * as authController from '../controllers/auth-controller.js';
import { loginRateLimit } from '../middlewares/login-rate-limit.js';
import { validate } from '../middlewares/validate.js';
import { loginSchema } from '../schemas/auth-schema.js';

export const authRouter = Router();

authRouter.post('/login', loginRateLimit, validate({ body: loginSchema }), authController.login);
