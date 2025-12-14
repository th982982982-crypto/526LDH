import React, { useState } from 'react';
import { Transaction } from '../types';
import { Plus, Search, Filter, Trash2, ArrowUpRight, ArrowDownLeft, Edit2, Image as ImageIcon, X } from 'lucide-react';

interface TransactionListProps {
  transactions: Transaction[];
  onAddTransaction: (t: Omit<Transaction, 'id'>) => void;
  onUpdateTransaction: (t: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({ transactions, onAddTransaction, onUpdateTransaction, onDeleteTransaction }) => {
  const [filter, setFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    amount: '',
    quantity: '',
    type: 'EXPENSE',
    category: 'Vật liệu',
    description: '',
    date: new Date().toISOString().split('T')[0],
    image: ''
  });

  const filteredTransactions = transactions
    .filter(t => filter === 'ALL' || t.type === filter)
    .filter(t => 
      t.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
      t.category.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleAddNew = () => {
    setEditingId(null);
    setFormData({ amount: '', quantity: '', type: 'EXPENSE', category: 'Vật liệu', description: '', date: new Date().toISOString().split('T')[0], image: '' });
    setShowModal(true);
  };

  const handleEdit = (t: Transaction) => {
    setEditingId(t.id);
    setFormData({
      amount: t.amount.toString(),
      quantity: t.quantity ? t.quantity.toString() : '',
      type: t.type,
      category: t.category,
      description: t.description,
      date: t.date,
      image: t.image || ''
    });
    setShowModal(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (readerEvent) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 600; 
          const scaleSize = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;
          
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
          setFormData(prev => ({ ...prev, image: dataUrl }));
        };
        img.src = readerEvent.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(formData.amount);
    const quantity = formData.quantity ? Number(formData.quantity) : undefined;
    
    const transactionData = {
      amount,
      quantity,
      type: formData.type as 'INCOME' | 'EXPENSE',
      category: formData.category,
      description: formData.description,
      date: formData.date,
      image: formData.image
    };

    if (editingId) {
       onUpdateTransaction({
        id: editingId,
        ...transactionData
       });
    } else {
      onAddTransaction(transactionData);
    }
    
    setShowModal(false);
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  const formatNumberInput = (val: string) => {
    if (!val) return '';
    return new Intl.NumberFormat('vi-VN').format(Number(val));
  };

  return (
    <div className="bg-white/20 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 flex flex-col h-[calc(100vh-140px)]">
      {/* Header */}
      <div className="p-6 border-b border-white/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Sổ Thu Chi</h2>
          <p className="text-sm text-slate-700 font-medium">Quản lý dòng tiền dự án</p>
        </div>
        <button 
          onClick={handleAddNew}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors shadow-sm"
        >
          <Plus size={18} />
          Thêm Giao Dịch
        </button>
      </div>

      {/* Filters */}
      <div className="p-4 border-b border-white/20 bg-white/10 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
          <input 
            type="text" 
            placeholder="Tìm kiếm giao dịch..."
            className="w-full pl-10 pr-4 py-2 border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white/40 text-slate-900 placeholder-slate-700 font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {['ALL', 'INCOME', 'EXPENSE'].map(type => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${
                filter === type 
                  ? 'bg-white/80 text-blue-800 shadow-sm border border-white/40' 
                  : 'text-slate-800 hover:bg-white/30'
              }`}
            >
              {type === 'ALL' ? 'Tất cả' : type === 'INCOME' ? 'Thu' : 'Chi'}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-2">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-white/40 backdrop-blur-md z-10 text-xs font-bold text-slate-800 uppercase tracking-wider shadow-sm">
            <tr>
              <th className="px-4 py-3 border-b border-white/20">Ngày</th>
              <th className="px-4 py-3 border-b border-white/20">Ảnh</th>
              <th className="px-4 py-3 border-b border-white/20">Nội dung</th>
              <th className="px-4 py-3 border-b border-white/20">SL</th>
              <th className="px-4 py-3 border-b border-white/20">Danh mục</th>
              <th className="px-4 py-3 border-b border-white/20 text-right">Tổng Tiền</th>
              <th className="px-4 py-3 border-b border-white/20 text-right w-24">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/20">
            {filteredTransactions.map(t => (
              <tr key={t.id} className="hover:bg-white/30 group transition-colors">
                <td className="px-4 py-3 text-sm text-slate-900 font-medium">{t.date}</td>
                <td className="px-4 py-3 w-16">
                  {t.image ? (
                    <img src={t.image} alt="bill" className="w-8 h-8 object-cover rounded border border-white/40 bg-white/50" />
                  ) : (
                    <div className="w-8 h-8 rounded bg-white/30 flex items-center justify-center text-slate-500">
                      <ImageIcon size={14} />
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="font-bold text-slate-900">{t.description}</div>
                </td>
                <td className="px-4 py-3 font-medium text-slate-800">
                  {t.quantity ? t.quantity : '-'}
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/60 text-slate-800 border border-white/30">
                    {t.category}
                  </span>
                </td>
                <td className={`px-4 py-3 text-right font-bold ${t.type === 'INCOME' ? 'text-emerald-800' : 'text-slate-900'}`}>
                  <div className="flex items-center justify-end gap-1">
                    {t.type === 'INCOME' ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} className="text-red-600" />}
                    {formatCurrency(t.amount)}
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleEdit(t)}
                      className="text-slate-600 hover:text-blue-700 p-1 hover:bg-blue-50/50 rounded"
                      title="Sửa"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => onDeleteTransaction(t.id)}
                      className="text-slate-600 hover:text-red-700 p-1 hover:bg-red-50/50 rounded"
                      title="Xóa"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredTransactions.length === 0 && (
          <div className="flex flex-col items-center justify-center h-48 text-slate-600 font-medium">
            <Filter size={48} className="mb-2 opacity-50" />
            <p>Không tìm thấy giao dịch nào</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/90 backdrop-blur-xl rounded-xl shadow-2xl w-full max-w-md p-6 animate-fade-in border border-white/50 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-800 mb-4">{editingId ? 'Cập Nhật Giao Dịch' : 'Thêm Giao Dịch Mới'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Loại</label>
                  <select 
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900"
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                  >
                    <option value="EXPENSE">Chi tiêu</option>
                    <option value="INCOME">Thu nhập</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Ngày</label>
                  <input 
                    type="date" 
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tổng tiền (VNĐ)</label>
                    <input 
                      type="text" 
                      className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900 font-semibold"
                      placeholder="0"
                      value={formatNumberInput(formData.amount)}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        setFormData({...formData, amount: val});
                      }}
                      required
                    />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Số lượng (nếu có)</label>
                    <input 
                      type="number" 
                      className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900"
                      placeholder="VD: 50"
                      value={formData.quantity}
                      onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                    />
                 </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Danh mục</label>
                <select 
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900"
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                >
                  <option value="Vật liệu">Vật liệu</option>
                  <option value="Nhân công">Nhân công</option>
                  <option value="Máy móc">Máy móc</option>
                  <option value="Pháp lý">Pháp lý</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mô tả</label>
                <input 
                  type="text" 
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900"
                  placeholder="VD: Mua xi măng"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  required
                />
              </div>

              {/* Image Upload Section */}
              <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1">Hình ảnh (Hóa đơn/Chứng từ)</label>
                 <div className="flex items-center gap-4">
                    {formData.image && (
                      <div className="relative w-20 h-20 shrink-0">
                        <img src={formData.image} alt="preview" className="w-full h-full object-cover rounded-lg border border-slate-200"/>
                        <button 
                          type="button"
                          onClick={() => setFormData({...formData, image: ''})}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}
                    <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                       <ImageIcon size={16} />
                       {formData.image ? 'Thay ảnh khác' : 'Tải ảnh lên'}
                       <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                    </label>
                 </div>
                 <p className="text-[10px] text-slate-400 mt-1">* Ảnh sẽ được tự động nén để lưu trữ.</p>
              </div>

              <div className="flex gap-3 mt-6">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors font-medium"
                >
                  {editingId ? 'Cập nhật' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};