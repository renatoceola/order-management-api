import { AppError } from '../errors/app-error.js';

export function validate({ body, params }) {
  return (request, _response, next) => {
    const validated = {};

    for (const [key, schema] of Object.entries({ body, params })) {
      if (!schema) continue;
      const result = schema.safeParse(request[key]);
      if (!result.success) {
        const details = result.error.issues.map((issue) => ({
          campo: issue.path.join('.'),
          mensagem: issue.message,
        }));
        return next(new AppError(422, 'VALIDATION_ERROR', 'Dados de entrada invalidos.', details));
      }
      validated[key] = result.data;
    }

    request.validated = validated;
    return next();
  };
}
