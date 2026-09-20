function asNumber(value) {
  return typeof value === 'number' ? value : Number(value);
}

export function mapIncomingOrder(body) {
  return {
    orderId: body.numeroPedido,
    value: body.valorTotal,
    creationDate: new Date(body.dataCriacao).toISOString(),
    items: body.items.map((item) => ({
      productId: Number(item.idItem),
      quantity: item.quantidadeItem,
      price: item.valorItem,
    })),
  };
}

export function mapOrderRows(orderRow, itemRows = []) {
  return {
    orderId: orderRow.order_id,
    value: asNumber(orderRow.value),
    creationDate: new Date(orderRow.creation_date).toISOString(),
    items: itemRows.map((item) => ({
      productId: asNumber(item.product_id),
      quantity: item.quantity,
      price: asNumber(item.price),
    })),
  };
}
