import { z } from 'zod';

const orderId = z
  .string()
  .trim()
  .min(1)
  .max(100)
  .regex(/^[A-Za-z0-9_-]+$/, 'Use apenas letras, numeros, hifen e sublinhado');

const money = z.number().finite().min(0).max(999_999_999_999.99);

const itemSchema = z
  .object({
    idItem: z.string().regex(/^\d+$/, 'idItem deve conter apenas digitos'),
    quantidadeItem: z.number().int().positive(),
    valorItem: money,
  })
  .strict();

export const orderBodySchema = z
  .object({
    numeroPedido: orderId,
    valorTotal: money,
    dataCriacao: z.iso.datetime({ offset: true }),
    items: z.array(itemSchema).min(1).max(1_000),
  })
  .strict()
  .superRefine((order, context) => {
    const ids = order.items.map((item) => item.idItem);
    if (new Set(ids).size !== ids.length) {
      context.addIssue({
        code: 'custom',
        path: ['items'],
        message: 'O mesmo idItem nao pode aparecer mais de uma vez no pedido',
      });
    }
  });

export const orderParamsSchema = z.object({ orderId });
