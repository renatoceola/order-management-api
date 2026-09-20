import { AppError } from '../errors/app-error.js';
import { mapIncomingOrder } from '../mappers/order-mapper.js';
import {
  createOrder as insertOrder,
  deleteOrder as removeOrder,
  findOrderById,
  listOrders as findAllOrders,
  replaceOrder,
} from '../repositories/order-repository.js';

export async function createOrder(body) {
  return insertOrder(mapIncomingOrder(body));
}

export async function getOrder(orderId) {
  const order = await findOrderById(orderId);
  if (!order) throw new AppError(404, 'ORDER_NOT_FOUND', 'Pedido nao encontrado.');
  return order;
}

export async function listOrders() {
  return findAllOrders();
}

export async function updateOrder(orderId, body) {
  if (body.numeroPedido !== orderId) {
    throw new AppError(
      422,
      'ORDER_ID_MISMATCH',
      'numeroPedido deve ser igual ao identificador informado na URL.',
    );
  }

  const order = await replaceOrder(orderId, mapIncomingOrder(body));
  if (!order) throw new AppError(404, 'ORDER_NOT_FOUND', 'Pedido nao encontrado.');
  return order;
}

export async function deleteOrder(orderId) {
  const deleted = await removeOrder(orderId);
  if (!deleted) throw new AppError(404, 'ORDER_NOT_FOUND', 'Pedido nao encontrado.');
}
