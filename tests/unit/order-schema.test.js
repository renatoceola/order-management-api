import { describe, expect, it } from 'vitest';
import { orderBodySchema, orderParamsSchema } from '../../src/schemas/order-schema.js';

const validOrder = {
  numeroPedido: 'pedido-01',
  valorTotal: 100,
  dataCriacao: '2026-09-18T10:00:00-03:00',
  items: [{ idItem: '10', quantidadeItem: 2, valorItem: 50 }],
};

describe('validacao de pedidos', () => {
  it('aceita a data com a precisao usada no teste', () => {
    const result = orderBodySchema.safeParse({
      ...validOrder,
      dataCriacao: '2023-07-19T12:24:11.5299601+00:00',
    });
    expect(result.success).toBe(true);
  });

  it('aceita um pedido valido mesmo que o total nao seja a soma dos itens', () => {
    expect(orderBodySchema.safeParse({ ...validOrder, valorTotal: 999 }).success).toBe(true);
  });

  it.each([
    [{ ...validOrder, valorTotal: -1 }, 'valor negativo'],
    [{ ...validOrder, dataCriacao: '18/09/2026' }, 'data invalida'],
    [{ ...validOrder, items: [] }, 'lista vazia'],
    [
      { ...validOrder, items: [{ idItem: 'x10', quantidadeItem: 1, valorItem: 1 }] },
      'produto nao numerico',
    ],
  ])('rejeita %s (%s)', (body) => {
    expect(orderBodySchema.safeParse(body).success).toBe(false);
  });

  it('rejeita produtos repetidos', () => {
    const result = orderBodySchema.safeParse({
      ...validOrder,
      items: [validOrder.items[0], { ...validOrder.items[0], quantidadeItem: 1 }],
    });
    expect(result.success).toBe(false);
  });

  it('rejeita caracteres inseguros no identificador da URL', () => {
    expect(orderParamsSchema.safeParse({ orderId: "x' OR 1=1" }).success).toBe(false);
  });
});
