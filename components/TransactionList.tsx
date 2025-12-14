import React, { useState } from 'react';
import { Transaction } from '../types';
import { Plus, Search, Filter, Trash2, ArrowUpRight, ArrowDownLeft, Edit2, Image as ImageIcon, X, Calculator, Truck, CheckSquare, Square, Loader2, Download, Maximize2 } from 'lucide-react';

interface TransactionListProps {
  transactions: Transaction[];
  suppliers: string[];
  materials: string[]; // Danh sách tên vật liệu
  units: string[]; // Danh sách đơn vị
  onAddTransaction: (t: Omit<Transaction, 'id'>) => void;
  onUpdateTransaction: (t: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  onAddSupplier: (name: string) => void;
  onAddMaterial: (name: string) => void;
  onAddUnit: (name: string) => void;
  isSyncing: boolean;
}

export const TransactionList: React.FC<TransactionListProps> = ({ 
  transactions, 
  suppliers, 
  materials,
  units,
  onAddTransaction, 
  onUpdateTransaction, 
  onDeleteTransaction,
  onAddSupplier,
  onAddMaterial,
  onAddUnit,
  isSyncing
}) => {
  const [filter, setFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // State cho xem ảnh
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [newSupplierName, setNewSupplierName] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    amount: '',
    quantity: '',
    unit: '', // Đơn vị tính
    unitPrice: '',
    type: 'EXPENSE',
    category: 'Vật liệu',
    description: '',
    date: new Date().toISOString().split('T')[0],
    image: '',
    supplier: 'Xuân Chí', // Default supplier
    isPaid: false
  });

  const filteredTransactions = transactions
    .filter(t => filter === 'ALL' || t.type === filter)
    .filter(t => 
      t.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
      t.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.supplier && t.supplier.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleAddNew = () => {
    setEditingId(null);
    setFormData({ 
      amount: '', 
      quantity: '', 
      unit: units.length > 0 ? units[0] : 'Cái',
      unitPrice: '', 
      type: 'EXPENSE', 
      category: 'Vật liệu', 
      description: '', 
      date: new Date().toISOString().split('T')[0], 
      image: '',
      supplier: suppliers.length > 0 ? suppliers[0] : '',
      isPaid: false
    });
    setShowModal(true);
  };

  const handleEdit = (t: Transaction) => {
    setEditingId(t.id);
    
    let derivedUnitPrice = '';
    if (t.unitPrice) {
      derivedUnitPrice = t.unitPrice.toString();
    } else if (t.quantity && t.quantity > 0 && t.amount > 0) {
      derivedUnitPrice = Math.round(t.amount / t.quantity).toString();
    }

    setFormData({
      amount: t.amount.toString(),
      quantity: t.quantity ? t.quantity.toString() : '',
      unit: t.unit || (units.length > 0 ? units[0] : ''),
      unitPrice: derivedUnitPrice,
      type: t.type,
      category: t.category,
      description: t.description,
      date: t.date,
      image: t.image || '',
      supplier: t.supplier || (suppliers.length > 0 ? suppliers[0] : ''),
      isPaid: t.isPaid || false
    });
    setShowModal(true);
  };

  const handleCalculationChange = (field: 'quantity' | 'unitPrice', rawValue: string) => {
    let cleanValue = rawValue;

    if (field === 'quantity') {
       // Cho phép số thập phân: thay thế dấu phẩy bằng dấu chấm, chỉ giữ lại số và dấu chấm
       cleanValue = cleanValue.replace(/,/g, '.').replace(/[^0-9.]/g, '');
       // Đảm bảo chỉ có 1 dấu chấm
       const parts = cleanValue.split('.');
       if (parts.length > 2) {
         cleanValue = parts[0] + '.' + parts.slice(1).join('');
       }
    } else {
       // Đơn giá là tiền tệ nên chỉ giữ số nguyên
       cleanValue = cleanValue.replace(/\D/g, '');
    }
    
    const newQuantity = field === 'quantity' ? cleanValue : formData.quantity;
    const newUnitPrice = field === 'unitPrice' ? cleanValue : formData.unitPrice;
    
    const q = Number(newQuantity);
    const p = Number(newUnitPrice);
    
    let newAmount = formData.amount;
    
    if (q > 0 && p > 0) {
      // Tính toán và làm tròn số tiền thành tiền nguyên (VND)
      newAmount = Math.round(q * p).toString();
    } else if (newQuantity === '' || newUnitPrice === '') {
       if (field === 'quantity' && newQuantity === '') newAmount = '0';
       if (field === 'unitPrice' && newUnitPrice === '') newAmount = '0';
    }

    setFormData(prev => ({
      ...prev,
      [field]: cleanValue,
      quantity: newQuantity,
      unitPrice: newUnitPrice,
      amount: newAmount
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(formData.amount);
    const quantity = formData.quantity ? Number(formData.quantity) : undefined;
    const unitPrice = formData.unitPrice ? Number(formData.unitPrice) : undefined;
    
    // Auto-save new Material Name and Unit to the lists
    if (formData.category === 'Vật liệu' && formData.description) {
       onAddMaterial(formData.description);
    }
    if (formData.unit && quantity) {
       onAddUnit(formData.unit);
    }

    const transactionData = {
      amount,
      quantity,
      unit: formData.unit,
      unitPrice,
      type: formData.type as 'INCOME' | 'EXPENSE',
      category: formData.category,
      description: formData.description,
      date: formData.date,
      image: formData.image,
      supplier: formData.supplier,
      isPaid: formData.isPaid
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

  const handleQuickPaidToggle = (t: Transaction) => {
    onUpdateTransaction({
      ...t,
      isPaid: !t.isPaid
    });
  };

  const handleSaveNewSupplier = () => {
    if (newSupplierName.trim()) {
      onAddSupplier(newSupplierName.trim());
      setFormData(prev => ({ ...prev, supplier: newSupplierName.trim() }));
      setNewSupplierName('');
      setShowAddSupplier(false);
    }
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

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  const formatNumberInput = (val: string) => {
    if (!val) return '';
    return new Intl.NumberFormat('vi-VN').format(Number(val));
  };

  return (
    <div className="bg-white/20 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 flex flex-col h-[calc(100vh-140px)] relative">
      
      {/* Loading Indicator for Table */}
      {isSyncing && (
        <div className="absolute top-2 right-2 z-20 bg-white/90 px-3 py-1 rounded-full shadow-sm flex items-center gap-2 text-xs font-bold text-blue-600 border border-blue-100 animate-pulse">
          <Loader2 size={12} className="animate-spin" />
          Đang lưu dữ liệu... (Vui lòng không tắt trang)
        </div>
      )}

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
            placeholder="Tìm kiếm nội dung, nhà cung cấp..."
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
              <th className="px-4 py-3 border-b border-white/20 text-center w-12" title="Đã thanh toán?">TT</th>
              <th className="px-4 py-3 border-b border-white/20">Ngày</th>
              <th className="px-4 py-3 border-b border-white/20">Ảnh</th>
              <th className="px-4 py-3 border-b border-white/20">Nội dung</th>
              <th className="px-4 py-3 border-b border-white/20">NCC</th>
              <th className="px-4 py-3 border-b border-white/20 text-center">SL</th>
              <th className="px-4 py-3 border-b border-white/20 text-center">ĐVT</th>
              <th className="px-4 py-3 border-b border-white/20 text-right">Đơn giá</th>
              <th className="px-4 py-3 border-b border-white/20 text-right">Tổng Tiền</th>
              <th className="px-4 py-3 border-b border-white/20 text-right w-24">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/20">
            {filteredTransactions.map(t => (
              <tr key={t.id} className={`hover:bg-white/30 group transition-colors ${t.isPaid && t.type === 'EXPENSE' ? 'bg-emerald-50/30' : ''}`}>
                <td className="px-4 py-3 text-center">
                  {t.type === 'EXPENSE' && (
                    <button 
                      onClick={() => handleQuickPaidToggle(t)}
                      className={`transition-all active:scale-90 ${t.isPaid ? 'text-emerald-600' : 'text-slate-400 hover:text-slate-600'}`}
                      title={t.isPaid ? "Đã thanh toán" : "Chưa thanh toán"}
                    >
                      {t.isPaid ? <CheckSquare size={20} /> : <Square size={20} />}
                    </button>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-slate-900 font-medium">{t.date}</td>
                <td className="px-4 py-3 w-16">
                  {t.image ? (
                    <div 
                      className="group/img relative cursor-pointer"
                      onClick={() => setPreviewImage(t.image!)}
                    >
                      <img src={t.image} alt="bill" className="w-8 h-8 object-cover rounded border border-white/40 bg-white/50" />
                      <div className="absolute inset-0 bg-black/20 rounded opacity-0 group-hover/img:opacity-100 flex items-center justify-center">
                         <Maximize2 size={12} className="text-white drop-shadow-md" />
                      </div>
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded bg-white/30 flex items-center justify-center text-slate-500">
                      <ImageIcon size={14} />
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="font-bold text-slate-900">{t.description}</div>
                  <div className="text-xs text-slate-600 mt-0.5">{t.category}</div>
                </td>
                <td className="px-4 py-3 text-sm font-medium text-slate-800">
                  {t.supplier || '-'}
                </td>
                <td className="px-4 py-3 font-medium text-slate-800 text-center">
                  {t.quantity ? t.quantity : '-'}
                </td>
                <td className="px-4 py-3 font-medium text-slate-800 text-center text-sm">
                  {t.unit ? t.unit : '-'}
                </td>
                 <td className="px-4 py-3 text-sm text-slate-700 text-right">
                  {t.unitPrice ? formatCurrency(t.unitPrice) : '-'}
                </td>
                <td className={`px-4 py-3 text-right font-bold ${t.type === 'INCOME' ? 'text-emerald-800' : 'text-slate-900'}`}>
                  <div className="flex items-center justify-end gap-1">
                    {t.type === 'INCOME' ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} className="text-red-600" />}
                    {formatCurrency(t.amount)}
                  </div>
                  {t.isPaid && t.type === 'EXPENSE' && <div className="text-[10px] text-emerald-600 font-normal">Đã trả</div>}
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

      {/* Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 z-[60] bg-black/90 flex flex-col items-center justify-center p-4 animate-fade-in">
          <div className="relative max-w-4xl max-h-[90vh] w-full flex flex-col items-center">
             <div className="w-full flex justify-end gap-4 mb-2 text-white">
                <a 
                  href={previewImage} 
                  download={`image-${new Date().getTime()}.jpg`}
                  className="flex items-center gap-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors"
                >
                  <Download size={20} />
                  Tải ảnh xuống
                </a>
                <button 
                  onClick={() => setPreviewImage(null)}
                  className="bg-white/20 hover:bg-red-500/80 p-2 rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
             </div>
             <img 
               src={previewImage} 
               alt="Full preview" 
               className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl border border-white/20" 
             />
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
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

              {/* Supplier Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Đơn vị cung cấp</label>
                {showAddSupplier ? (
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      className="flex-1 p-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900"
                      placeholder="Nhập tên đơn vị mới..."
                      value={newSupplierName}
                      onChange={(e) => setNewSupplierName(e.target.value)}
                      autoFocus
                    />
                     <button 
                      type="button"
                      onClick={handleSaveNewSupplier}
                      className="bg-emerald-600 text-white px-3 rounded-lg hover:bg-emerald-700 font-bold"
                    >
                      Lưu
                    </button>
                     <button 
                      type="button"
                      onClick={() => setShowAddSupplier(false)}
                      className="bg-slate-200 text-slate-600 px-3 rounded-lg hover:bg-slate-300"
                    >
                      Hủy
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <select 
                      className="flex-1 p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900"
                      value={formData.supplier}
                      onChange={(e) => setFormData({...formData, supplier: e.target.value})}
                    >
                      {suppliers.map(s => <option key={s} value={s}>{s}</option>)}
                      <option value="">Khác (Trống)</option>
                    </select>
                    <button 
                      type="button"
                      onClick={() => setShowAddSupplier(true)}
                      className="bg-blue-100 text-blue-700 px-3 rounded-lg hover:bg-blue-200 border border-blue-200"
                      title="Thêm đơn vị mới"
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                 <div className="col-span-1">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Số lượng</label>
                    <div className="flex gap-1">
                       <input 
                        type="text" 
                        className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900"
                        placeholder="VD: 50.5"
                        value={formData.quantity}
                        onChange={(e) => handleCalculationChange('quantity', e.target.value)}
                      />
                    </div>
                 </div>
                 <div className="col-span-1">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Đơn vị</label>
                    <input 
                        type="text"
                        list="unit-suggestions"
                        className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900"
                        placeholder="m3, cái..."
                        value={formData.unit}
                        onChange={(e) => setFormData({...formData, unit: e.target.value})}
                      />
                      <datalist id="unit-suggestions">
                        {units.map(u => <option key={u} value={u} />)}
                      </datalist>
                 </div>
              </div>

              <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Đơn giá (VNĐ)</label>
                  <input 
                    type="text" 
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900"
                    placeholder="VD: 100.000"
                    value={formatNumberInput(formData.unitPrice)}
                    onChange={(e) => handleCalculationChange('unitPrice', e.target.value)}
                  />
              </div>

              <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-2">
                    Tổng Thành Tiền (VNĐ)
                    <Calculator size={14} className="text-blue-500"/>
                  </label>
                  <input 
                    type="text" 
                    className="w-full p-3 border border-blue-200 bg-blue-50/50 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-blue-900 font-bold text-lg text-right"
                    placeholder="0"
                    value={formatNumberInput(formData.amount)}
                    onChange={(e) => setFormData({...formData, amount: e.target.value.replace(/\D/g, '')})}
                    required
                  />
                  <p className="text-[10px] text-slate-500 mt-1 text-right italic">Tự động tính: Số lượng x Đơn giá</p>
               </div>

              <div className="grid grid-cols-2 gap-4">
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
                  <label className="block text-sm font-medium text-slate-700 mb-1">Trạng thái</label>
                  <div 
                    onClick={() => setFormData(prev => ({...prev, isPaid: !prev.isPaid}))}
                    className={`cursor-pointer w-full p-2 border rounded-lg flex items-center gap-2 select-none ${formData.isPaid ? 'bg-emerald-100 border-emerald-300 text-emerald-800' : 'bg-white border-slate-300 text-slate-600'}`}
                  >
                    {formData.isPaid ? <CheckSquare size={18} /> : <Square size={18} />}
                    <span className="font-medium text-sm">{formData.isPaid ? 'Đã thanh toán' : 'Chưa thanh toán'}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                   {formData.category === 'Vật liệu' ? 'Tên Vật Liệu' : 'Mô tả nội dung'}
                </label>
                <input 
                  type="text" 
                  list="material-suggestions"
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-slate-900"
                  placeholder={formData.category === 'Vật liệu' ? "Nhập hoặc chọn tên (VD: Cát, Đá...)" : "Mô tả chi tiết"}
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  required
                />
                {formData.category === 'Vật liệu' && (
                  <datalist id="material-suggestions">
                    {materials.map(m => <option key={m} value={m} />)}
                  </datalist>
                )}
                {formData.category === 'Vật liệu' && <p className="text-[10px] text-slate-500 mt-1">* Nhập tên mới sẽ tự động lưu vào danh sách gợi ý.</p>}
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