import { describe, expect, it } from 'vitest';
import { mapIncomingOrder, mapOrderRows } from '../../src/mappers/order-mapper.js';

const input = {
  numeroPedido: 'v10089015vdb-01',
  valorTotal: 10000,
  dataCriacao: '2023-07-19T12:24:11.5299601+00:00',
  items: [{ idItem: '2434', quantidadeItem: 1, valorItem: 1000 }],
};

describe('mapeamento de pedidos', () => {
  it('preserva o numero do pedido e transforma nomes e tipos', () => {
    expect(mapIncomingOrder(input)).toEqual({
      orderId: 'v10089015vdb-01',
      value: 10000,
      creationDate: '2023-07-19T12:24:11.529Z',
      items: [{ productId: 2434, quantity: 1, price: 1000 }],
    });
  });

  it('converte tipos devolvidos pelo PostgreSQL', () => {
    const result = mapOrderRows(
      {
        order_id: 'pedido-1',
        value: '10.50',
        creation_date: new Date('2026-09-18T10:00:00Z'),
      },
      [{ product_id: '42', quantity: 2, price: '5.25' }],
    );

    expect(result).toEqual({
      orderId: 'pedido-1',
      value: 10.5,
      creationDate: '2026-09-18T10:00:00.000Z',
      items: [{ productId: 42, quantity: 2, price: 5.25 }],
    });
  });
});
