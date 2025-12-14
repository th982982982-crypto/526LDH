import { Transaction } from '../types';

// URL chính xác bạn đã cung cấp
let API_URL = 'https://script.google.com/macros/s/AKfycbzspDgLEfKLtXQLB0YqZSQHmTWdOMr8zC1S9_MIUsvfeYvfjPnvIclohyXTyaCn-24/exec';

export const setApiUrl = (url: string) => {
  API_URL = url;
  localStorage.setItem('custom_api_url', url);
};

export const getApiUrl = () => {
  return localStorage.getItem('custom_api_url') || API_URL;
};

// Ưu tiên dùng URL bạn cung cấp nếu localStorage rỗng hoặc cũ
const savedUrl = localStorage.getItem('custom_api_url');
if (savedUrl) {
  API_URL = savedUrl;
}

const sendRequest = async (action: string, data: any = {}) => {
  // Cấu hình gửi request dạng text/plain để tránh lỗi CORS Preflight
  const options: RequestInit = {
    method: 'POST',
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },
    body: JSON.stringify({ action, data }),
    redirect: 'follow', // Tự động theo dõi chuyển hướng của Google
  };
  
  try {
    const response = await fetch(API_URL, options);
    
    if (!response.ok) {
      throw new Error(`Lỗi kết nối (${response.status})`);
    }
    
    // Kiểm tra xem phản hồi có phải là JSON không
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") === -1) {
      // Nếu Google trả về HTML (thường là trang đăng nhập hoặc lỗi quyền truy cập)
      const text = await response.text();
      if (text.includes("Google Drive") || text.includes("sign in")) {
         throw new Error("Lỗi quyền truy cập: Hãy đặt 'Who has access' là 'Anyone' trong Google Script.");
      }
    }

    const result = await response.json();
    
    if (result.status === 'error') {
      throw new Error(result.message || 'Lỗi xử lý tại Server');
    }
    
    return result;
  } catch (error: any) {
    console.warn("API Error:", error);
    throw error;
  }
};

export const api = {
  getData: async () => sendRequest('get_data'),
  // Gom cả Thêm và Sửa vào 1 hàm save_transaction
  saveTransaction: async (transaction: Transaction) => sendRequest('save_transaction', transaction),
  deleteTransaction: async (id: string) => sendRequest('delete_transaction', { id }),
  updateBudget: async (amount: number) => sendRequest('update_budget', { amount }),
  saveSetting: async (key: string, value: string) => sendRequest('save_setting', { key, value })
};