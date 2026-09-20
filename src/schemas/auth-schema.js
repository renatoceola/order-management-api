import { z } from 'zod';

export const loginSchema = z
  .object({
    usuario: z.string().trim().min(3).max(100),
    senha: z.string().min(8).max(200),
  })
  .strict();
