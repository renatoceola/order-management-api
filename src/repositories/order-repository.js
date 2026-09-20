import { getPool } from '../db/pool.js';
import { mapOrderRows } from '../mappers/order-mapper.js';

const orderColumns = 'order_id, value, creation_date';
const itemColumns = 'product_id, quantity, price';

async function insertItems(client, order) {
  for (const item of order.items) {
    await client.query(
      `INSERT INTO items (order_id, product_id, quantity, price)
       VALUES ($1, $2, $3, $4)`,
      [order.orderId, item.productId, item.quantity, item.price],
    );
  }
}

export async function findOrderById(orderId, queryable = getPool()) {
  const orderResult = await queryable.query(
    `SELECT ${orderColumns} FROM orders WHERE order_id = $1`,
    [orderId],
  );
  if (orderResult.rowCount === 0) return null;

  const itemResult = await queryable.query(
    `SELECT ${itemColumns} FROM items WHERE order_id = $1 ORDER BY id`,
    [orderId],
  );
  return mapOrderRows(orderResult.rows[0], itemResult.rows);
}

export async function listOrders(queryable = getPool()) {
  const orders = await queryable.query(
    `SELECT ${orderColumns} FROM orders ORDER BY creation_date DESC, order_id`,
  );

  return Promise.all(orders.rows.map((order) => findOrderById(order.order_id, queryable)));
}

export async function createOrder(order, pool = getPool()) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `INSERT INTO orders (order_id, value, creation_date)
       VALUES ($1, $2, $3)`,
      [order.orderId, order.value, order.creationDate],
    );
    await insertItems(client, order);
    await client.query('COMMIT');
    return await findOrderById(order.orderId, pool);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function replaceOrder(orderId, order, pool = getPool()) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const locked = await client.query('SELECT 1 FROM orders WHERE order_id = $1 FOR UPDATE', [
      orderId,
    ]);
    if (locked.rowCount === 0) {
      await client.query('ROLLBACK');
      return null;
    }

    await client.query(
      `UPDATE orders
       SET value = $2, creation_date = $3, updated_at = NOW()
       WHERE order_id = $1`,
      [orderId, order.value, order.creationDate],
    );
    await client.query('DELETE FROM items WHERE order_id = $1', [orderId]);
    await insertItems(client, { ...order, orderId });
    await client.query('COMMIT');
    return await findOrderById(orderId, pool);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function deleteOrder(orderId, queryable = getPool()) {
  const result = await queryable.query('DELETE FROM orders WHERE order_id = $1', [orderId]);
  return result.rowCount > 0;
}
