import * as authService from '../services/auth-service.js';

export async function login(request, response) {
  const result = await authService.login(request.validated.body);
  response.status(200).json(result);
}
