import React, { useState } from 'react';
import { Material } from '../types';
import { Package, Search, Plus, Edit2, Trash2, Image as ImageIcon, X } from 'lucide-react';

interface InventoryListProps {
  materials: Material[];
  onAddMaterial: (m: Omit<Material, 'id' | 'totalValue'>) => void;
  onUpdateMaterial: (m: Material) => void;
  onDeleteMaterial: (id: string) => void;
}

export const InventoryList: React.FC<InventoryListProps> = ({ materials, onAddMaterial, onUpdateMaterial, onDeleteMaterial }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    unit: 'Cái',
    quantity: '',
    unitPrice: '',
    supplier: '',
    image: ''
  });

  const filteredMaterials = materials.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (m: Material) => {
    setEditingId(m.id);
    setFormData({
      name: m.name,
      unit: m.unit,
      quantity: m.quantity.toString(),
      unitPrice: m.unitPrice.toString(),
      supplier: m.supplier || '',
      image: m.image || ''
    });
    setShowModal(true);
  };

  const handleAddNew = () => {
    setEditingId(null);
    setFormData({ name: '', unit: 'Cái', quantity: '', unitPrice: '', supplier: '', image: '' });
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
          
          // Giảm chất lượng xuống 0.6 để giảm dung lượng file
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
    const quantity = Number(formData.quantity);
    const unitPrice = Number(formData.unitPrice);
    
    const materialData = {
      name: formData.name,
      unit: formData.unit,
      quantity,
      unitPrice,
      totalValue: quantity * unitPrice,
      supplier: formData.supplier,
      lastUpdated: new Date().toISOString().split('T')[0],
      image: formData.image
    };

    if (editingId) {
      onUpdateMaterial({
        id: editingId,
        ...materialData
      });
    } else {
      onAddMaterial(materialData);
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
      <div className="p-6 border-b border-white/20 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Kho Vật Liệu</h2>
          <p className="text-sm text-slate-700 font-medium">Quản lý nhập xuất vật tư</p>
        </div>
        <button 
          onClick={handleAddNew}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors shadow-sm"
        >
          <Plus size={18} />
          Thêm Vật Liệu
        </button>
      </div>

      <div className="p-4 bg-white/10 border-b border-white/20">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
          <input 
            type="text" 
            placeholder="Tìm kiếm vật liệu..."
            className="w-full pl-10 pr-4 py-2 border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white/40 text-slate-900 placeholder-slate-700 font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredMaterials.map(m => (
          <div key={m.id} className="bg-white/20 backdrop-blur-sm border border-white/20 rounded-xl p-4 hover:shadow-md hover:bg-white/30 transition-all relative group">
             {/* Material Image */}
             {m.image && (
                <div className="w-full h-32 mb-3 rounded-lg overflow-hidden bg-white/30 border border-white/20">
                  <img src={m.image} alt={m.name} className="w-full h-full object-cover" />
                </div>
             )}
             
             <div className="flex justify-between items-start mb-2">
                <div className={`p-2 rounded-lg text-indigo-800 ${m.image ? '' : 'bg-indigo-50/70'}`}>
                  {m.image ? <div className="text-sm font-bold text-indigo-900 bg-white/70 px-2 py-1 rounded">{m.name}</div> : <Package size={20} />}
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute top-4 right-4 bg-white/90 rounded shadow-sm">
                  <button onClick={() => handleEdit(m)} className="p-1.5 text-slate-600 hover:text-blue-700 hover:bg-blue-50 rounded">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => onDeleteMaterial(m.id)} className="p-1.5 text-slate-600 hover:text-red-700 hover:bg-red-50 rounded">
                    <Trash2 size={16} />
                  </button>
                </div>
             </div>
             
             {!m.image && <h3 className="font-bold text-slate-900 text-lg mb-1">{m.name}</h3>}
             
             <div className="space-y-1 text-sm text-slate-800 font-medium mt-2">
               <div className="flex justify-between">
                 <span>Số lượng:</span>
                 <span className="font-bold text-slate-900">{m.quantity} {m.unit}</span>
               </div>
               <div className="flex justify-between">
                 <span>Đơn giá:</span>
                 <span>{formatCurrency(m.unitPrice)}</span>
               </div>
               <div className="pt-2 mt-2 border-t border-white/30 flex justify-between items-center">
                 <span className="text-xs text-slate-700">Tổng giá trị</span>
                 <span className="font-bold text-indigo-900">{formatCurrency(m.totalValue)}</span>
               </div>
             </div>
          </div>
        ))}
        
        {filteredMaterials.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center h-64 text-slate-600">
            <Package size={48} className="mb-2 opacity-50" />
            <p className="font-medium">Chưa có vật liệu nào trong kho</p>
          </div>
        )}
      </div>

       {/* Modal */}
       {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/90 backdrop-blur-xl rounded-xl shadow-2xl w-full max-w-md p-6 animate-fade-in border border-white/50 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-800 mb-4">{editingId ? 'Cập Nhật Vật Liệu' : 'Thêm Vật Liệu Mới'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tên vật liệu</label>
                <input 
                  type="text" 
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                  placeholder="VD: Xi măng Hà Tiên"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Đơn vị</label>
                  <input 
                    type="text" 
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900"
                    value={formData.unit}
                    onChange={(e) => setFormData({...formData, unit: e.target.value})}
                    placeholder="Bao, Tấn..."
                  />
                </div>
                <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Số lượng</label>
                   <input 
                    type="number" 
                    className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                    required
                    min="0"
                   />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Đơn giá (VNĐ)</label>
                <input 
                  type="text" 
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900 font-semibold"
                  value={formatNumberInput(formData.unitPrice)}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setFormData({...formData, unitPrice: val});
                  }}
                  required
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nhà cung cấp</label>
                <input 
                  type="text" 
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900"
                  value={formData.supplier}
                  onChange={(e) => setFormData({...formData, supplier: e.target.value})}
                  placeholder="Tên cửa hàng/đại lý"
                />
              </div>

              {/* Image Upload Section */}
              <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1">Hình ảnh vật liệu</label>
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
                  className="flex-1 py-2 text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors font-medium"
                >
                  Lưu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};