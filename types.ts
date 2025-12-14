export type TransactionType = 'INCOME' | 'EXPENSE';

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  type: TransactionType;
  category: string;
  description: string;
  quantity?: number; // Số lượng
  unit?: string; // Đơn vị tính (m3, cái, kg...)
  unitPrice?: number; // Đơn giá
  image?: string; // Base64 string
  supplier?: string; // Nhà cung cấp
  isPaid?: boolean; // Trạng thái thanh toán
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
  suppliers: string[]; // Danh sách nhà cung cấp
  materialNames: string[]; // Danh sách tên vật liệu gợi ý
  units: string[]; // Danh sách đơn vị tính gợi ý
}

export type View = 'DASHBOARD' | 'TRANSACTIONS' | 'INVENTORY';