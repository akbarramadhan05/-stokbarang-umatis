export type UserRole = 'admin' | 'owner' | 'barista';

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  updated_at: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  created_at: string;
}

export interface Item {
  id: string;
  name: string;
  category: string;
  unit: string;
  current_stock: number;
  minimum_stock: number;
  supplier_id: string | null;
  supplier_name?: string;
  created_at: string;
}

export interface Transaction {
  id: string;
  item_id: string;
  item_name?: string;
  category?: string;
  unit?: string;
  type: 'masuk' | 'keluar' | 'terpakai';
  quantity: number;
  actor_id: string;
  actor_name?: string;
  notes: string;
  created_at: string;
}

export interface StockOpname {
  id: string;
  opname_date: string;
  item_id: string;
  item_name?: string;
  category?: string;
  unit?: string;
  system_stock: number;
  physical_stock: number;
  discrepancy: number;
  status: 'draft' | 'submitted' | 'verified';
  barista_id: string;
  barista_name?: string;
  notes: string;
  created_at: string;
}
