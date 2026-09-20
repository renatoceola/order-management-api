import * as orderService from '../services/order-service.js';

export async function createOrder(request, response) {
  const order = await orderService.createOrder(request.validated.body);
  response
    .location(`/order/${encodeURIComponent(order.orderId)}`)
    .status(201)
    .json(order);
}

export async function getOrder(request, response) {
  const order = await orderService.getOrder(request.validated.params.orderId);
  response.status(200).json(order);
}

export async function listOrders(_request, response) {
  response.status(200).json(await orderService.listOrders());
}

export async function updateOrder(request, response) {
  const order = await orderService.updateOrder(
    request.validated.params.orderId,
    request.validated.body,
  );
  response.status(200).json(order);
}

export async function deleteOrder(request, response) {
  await orderService.deleteOrder(request.validated.params.orderId);
  response.status(204).send();
}
