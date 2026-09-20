import { AppError } from '../errors/app-error.js';

function errorPayload(request, code, message, details) {
  const error = { code, message, requestId: request.id };
  if (details) error.details = details;
  return { error };
}

export function notFound(request, _response, next) {
  next(new AppError(404, 'ROUTE_NOT_FOUND', 'Rota nao encontrada.'));
}

export function errorHandler(error, request, response, _next) {
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return response
      .status(400)
      .json(errorPayload(request, 'INVALID_JSON', 'O corpo da requisicao contem JSON invalido.'));
  }

  if (error.code === '23505') {
    return response
      .status(409)
      .json(errorPayload(request, 'ORDER_ALREADY_EXISTS', 'O numero do pedido ja existe.'));
  }

  if (error instanceof AppError) {
    return response
      .status(error.status)
      .json(errorPayload(request, error.code, error.message, error.details));
  }

  request.log.error({ err: error }, 'Erro nao tratado');
  return response
    .status(500)
    .json(errorPayload(request, 'INTERNAL_ERROR', 'Ocorreu um erro interno.'));
}
