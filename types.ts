export type TransactionType = 'INCOME' | 'EXPENSE';

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  type: TransactionType;
  category: string;
  description: string;
  quantity?: number; // Thêm số lượng
  image?: string; // Base64 string
}

export interface Material {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  totalValue: number;
  supplier?: string;
  lastUpdated: string;
  image?: string;
}

export interface AppData {
  transactions: Transaction[];
  materials?: Material[];
  budget: number;
  backgroundImage?: string;
  adminUser?: string;
  adminPass?: string;
}

export type View = 'DASHBOARD' | 'TRANSACTIONS' | 'INVENTORY';