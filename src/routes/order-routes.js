import { Router } from 'express';
import * as orderController from '../controllers/order-controller.js';
import { validate } from '../middlewares/validate.js';
import { orderBodySchema, orderParamsSchema } from '../schemas/order-schema.js';

export const orderRouter = Router();

orderRouter.post('/', validate({ body: orderBodySchema }), orderController.createOrder);
orderRouter.get('/list', orderController.listOrders);
orderRouter.get('/:orderId', validate({ params: orderParamsSchema }), orderController.getOrder);
orderRouter.put(
  '/:orderId',
  validate({ params: orderParamsSchema, body: orderBodySchema }),
  orderController.updateOrder,
);
orderRouter.delete(
  '/:orderId',
  validate({ params: orderParamsSchema }),
  orderController.deleteOrder,
);
