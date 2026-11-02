// Tipi delle risposte JSON del backend. I decimali arrivano come stringhe ("179.8").

export type Role = 'user' | 'admin';

export interface User {
  id: number;
  email: string;
  role: Role;
  created_at: string;
}

export interface Product {
  id: number;
  name: string;
  description: string | null;
  price: string;
  stock: number;
  category_id: number;
  category: string;
  active: boolean;
}

export interface Category {
  id: number;
  name: string;
  default: boolean;
  products_count: number;
}

export interface Category {
  id: number;
  name: string;
  default: boolean;
  products_count: number;
}

export interface PageMeta {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

export interface LineItem {
  id: number;
  product_id: number;
  name: string;
  quantity: number;
  unit_price: string;
  subtotal: string;
}

export interface Cart {
  id: number;
  total: string;
  items: LineItem[];
}

export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'cancelled';

export interface CustomerData {
  full_name: string;
  email: string;
  address: string;
  city: string;
  postal_code: string;
}

export interface Order extends CustomerData {
  id: number;
  status: OrderStatus;
  total: string;
  created_at: string;
  items: LineItem[];
}
