import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import apiClient from '../services/api';
import { Product } from '../types';
import { useAuth } from './AuthContext';

interface CartItem extends Product {
  quantity: number;
}

interface CartState {
  items: CartItem[];
  total: number;
  itemCount: number;
}

interface CartContextType extends CartState {
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
}

const initialState: CartState = {
  items: [],
  total: 0,
  itemCount: 0,
};

// Maps the cart-service API response (nested `product` object per item)
// into the flattened CartItem shape every existing page already expects.
const mapCartResponse = (data: any): CartState => {
  const items: CartItem[] = (data?.items || [])
    .filter((item: any) => item.product)
    .map((item: any) => ({
      ...item.product,
      id: item.productId,
      quantity: item.quantity,
    }));

  return {
    items,
    total: data?.total || 0,
    itemCount: data?.itemCount || 0,
  };
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [state, setState] = useState<CartState>(initialState);

  const userId = user?.id;

  const fetchCart = useCallback(async () => {
    if (!userId) {
      setState(initialState);
      return;
    }
    try {
      const response = await apiClient.get('/cart', { params: { userId } });
      setState(mapCartResponse(response.data.data));
    } catch (error) {
      console.error('Failed to fetch cart:', error);
    }
  }, [userId]);

  useEffect(() => {
    if (isAuthenticated && userId) {
      fetchCart();
    } else {
      setState(initialState);
    }
  }, [isAuthenticated, userId, fetchCart]);

  const addItem = async (product: Product) => {
    if (!userId) return;
    try {
      const response = await apiClient.post('/cart/items', {
        productId: product.id,
        quantity: 1,
        userId,
      });
      setState(mapCartResponse(response.data.data));
    } catch (error) {
      console.error('Failed to add item to cart:', error);
    }
  };

  const removeItem = async (productId: string) => {
    if (!userId) return;
    try {
      const response = await apiClient.delete(`/cart/items/${productId}`, { params: { userId } });
      setState(mapCartResponse(response.data.data));
    } catch (error) {
      console.error('Failed to remove item from cart:', error);
    }
  };

  const updateQuantity = async (productId: string, quantity: number) => {
    if (!userId) return;
    try {
      if (quantity === 0) {
        await removeItem(productId);
        return;
      }
      const response = await apiClient.put(`/cart/items/${productId}`, { quantity, userId });
      setState(mapCartResponse(response.data.data));
    } catch (error) {
      console.error('Failed to update cart item:', error);
    }
  };

  const clearCart = async () => {
    if (!userId) return;
    try {
      await apiClient.delete('/cart', { params: { userId } });
      setState(initialState);
    } catch (error) {
      console.error('Failed to clear cart:', error);
    }
  };

  return (
    <CartContext.Provider
      value={{ ...state, addItem, removeItem, updateQuantity, clearCart }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};