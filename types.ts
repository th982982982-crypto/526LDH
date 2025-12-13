export type TransactionType = 'INCOME' | 'EXPENSE';

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  type: TransactionType;
  category: string;
  description: string;
  image?: string; // Base64 string
}

export interface Material {
  id: string;
  name: string; // e.g., Xi măng, Gạch
  unit: string; // e.g., Bao, Viên, Tấn
  quantity: number;
  unitPrice: number; // Price per unit
  totalValue: number; // quantity * unitPrice
  supplier?: string;
  lastUpdated: string;
  image?: string; // Base64 string
}

export interface AppData {
  transactions: Transaction[];
  materials: Material[];
  budget: number;
  backgroundImage?: string;
  adminUser?: string;
  adminPass?: string;
}

export type View = 'DASHBOARD' | 'TRANSACTIONS' | 'INVENTORY';