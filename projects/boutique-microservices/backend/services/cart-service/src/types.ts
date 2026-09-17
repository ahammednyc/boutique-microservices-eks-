export interface CartItem {
  id: string;
  userId: string;
  productId: string;
  quantity: number;
  product?: {
    id: string;
    name: string;
    price: number;
    imageUrl?: string;
  };
}

export interface Cart {
  userId: string;
  items: CartItem[];
  itemCount: number;
  total: number;
}

export interface ServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}