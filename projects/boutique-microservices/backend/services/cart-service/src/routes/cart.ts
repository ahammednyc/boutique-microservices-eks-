import express from 'express';
import axios from 'axios';
import { query } from '../database/connection';
import { Cart, CartItem, ServiceResponse } from '../types';

const router = express.Router();
const PRODUCTS_SERVICE_URL = process.env.PRODUCTS_SERVICE_URL || 'http://localhost:3003';
const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001';

async function buildCart(userId: string): Promise<Cart> {
  const result = await query(
    'SELECT id, user_id, product_id, quantity FROM cart_items WHERE user_id = $1 ORDER BY created_at ASC',
    [userId]
  );

  const items: CartItem[] = await Promise.all(result.rows.map(async (row: any) => {
    let product: CartItem['product'] = undefined;
    try {
      const productResponse = await axios.get(`${PRODUCTS_SERVICE_URL}/${row.product_id}`);
      const p = productResponse.data.data;
      if (p) {
        product = {
          id: p.id,
          name: p.name,
          price: parseFloat(p.price),
          imageUrl: p.imageUrl || p.image_url,
        };
      }
    } catch (e) {
      product = undefined;
    }

    return {
      id: row.id,
      userId: row.user_id,
      productId: row.product_id,
      quantity: row.quantity,
      product,
    };
  }));

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const total = items.reduce((sum, item) => sum + (item.product?.price || 0) * item.quantity, 0);

  return { userId, items, itemCount, total };
}

router.get('/', async (req, res) => {
  try {
    const userId = (req.query.userId as string) || DEMO_USER_ID;
    const cart = await buildCart(userId);
    res.json({ success: true, data: cart } as ServiceResponse<Cart>);
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({ success: false, error: 'Failed to get cart' });
  }
});

router.post('/items', async (req, res) => {
  try {
    const { productId, quantity = 1, userId = DEMO_USER_ID } = req.body;

    if (!productId) {
      return res.status(400).json({ success: false, error: 'productId is required' });
    }

    await query(`
      INSERT INTO cart_items (user_id, product_id, quantity)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id, product_id)
      DO UPDATE SET quantity = cart_items.quantity + EXCLUDED.quantity, updated_at = CURRENT_TIMESTAMP
    `, [userId, productId, quantity]);

    const cart = await buildCart(userId);
    res.status(201).json({ success: true, data: cart } as ServiceResponse<Cart>);
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ success: false, error: 'Failed to add item to cart' });
  }
});

router.put('/items/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity, userId = DEMO_USER_ID } = req.body;

    if (typeof quantity !== 'number' || quantity < 1) {
      return res.status(400).json({ success: false, error: 'quantity must be a number >= 1' });
    }

    await query(`
      UPDATE cart_items SET quantity = $1, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $2 AND product_id = $3
    `, [quantity, userId, productId]);

    const cart = await buildCart(userId);
    res.json({ success: true, data: cart } as ServiceResponse<Cart>);
  } catch (error) {
    console.error('Update cart item error:', error);
    res.status(500).json({ success: false, error: 'Failed to update cart item' });
  }
});

router.delete('/items/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = (req.query.userId as string) || DEMO_USER_ID;

    await query('DELETE FROM cart_items WHERE user_id = $1 AND product_id = $2', [userId, productId]);

    const cart = await buildCart(userId);
    res.json({ success: true, data: cart } as ServiceResponse<Cart>);
  } catch (error) {
    console.error('Remove cart item error:', error);
    res.status(500).json({ success: false, error: 'Failed to remove cart item' });
  }
});

router.delete('/', async (req, res) => {
  try {
    const userId = (req.query.userId as string) || DEMO_USER_ID;
    await query('DELETE FROM cart_items WHERE user_id = $1', [userId]);
    res.json({ success: true, data: { userId, items: [], itemCount: 0, total: 0 } } as ServiceResponse<Cart>);
  } catch (error) {
    console.error('Clear cart error:', error);
    res.status(500).json({ success: false, error: 'Failed to clear cart' });
  }
});

export { router as cartRoutes };