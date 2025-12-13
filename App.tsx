import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Receipt, Package, Menu, X, Loader2, RefreshCcw, Wifi, WifiOff, Settings, AlertTriangle, Image as ImageIcon, Lock, UploadCloud, Eye, EyeOff, Link as LinkIcon, CheckCircle2 } from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { TransactionList } from './components/TransactionList';
import { InventoryList } from './components/InventoryList';
import { Transaction, Material, AppData, View } from './types';
import { api, setApiUrl, getApiUrl } from './services/api';

const INITIAL_DATA: AppData = {
  budget: 0,
  transactions: [],
  materials: [],
  adminUser: 'admin', 
  adminPass: 'Voi123'
};

// Đã xóa link ảnh mặc định. Nếu bạn muốn mặc định là một chuỗi Base64 cụ thể, hãy dán vào giữa hai dấu ngoặc kép bên dưới.
const DEFAULT_BG = ""; 
const CACHE_KEY_BG = 'cached_bg_image';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('DASHBOARD');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [data, setData] = useState<AppData>(INITIAL_DATA);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  
  const [showSettings, setShowSettings] = useState(false);
  const [customUrl, setCustomUrl] = useState(getApiUrl());
  
  // Ưu tiên cao nhất: Lấy từ LocalStorage ngay khi khởi tạo App
  const [backgroundImage, setBackgroundImage] = useState(() => {
    const cached = localStorage.getItem(CACHE_KEY_BG);
    return cached && cached !== 'null' && cached !== 'undefined' ? cached : DEFAULT_BG;
  });

  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminUserInput, setAdminUserInput] = useState('');
  const [adminPassInput, setAdminPassInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  const [showUploadBg, setShowUploadBg] = useState(false);
  const [uploadingBg, setUploadingBg] = useState(false);
  const [bgUrlInput, setBgUrlInput] = useState(''); 

  const fetchData = async (isBackground = false) => {
    if (!isBackground && data.transactions.length === 0) setLoading(true);
    setErrorMessage('');
    
    try {
      const response = await api.getData();
      setData({
        transactions: response.transactions || [],
        materials: response.materials || [],
        budget: response.budget || 0,
        adminUser: response.adminUser || 'admin',
        adminPass: response.adminPass || 'Voi123'
      });
      
      // Đồng bộ ảnh từ Server về, NHƯNG chỉ cập nhật nếu link hợp lệ và có nội dung
      if (response.backgroundImage && response.backgroundImage.length > 10) {
        setBackgroundImage(response.backgroundImage);
        localStorage.setItem(CACHE_KEY_BG, response.backgroundImage);
      }
      setIsConnected(true);
    } catch (err: any) {
      console.error("Connection error:", err);
      setIsConnected(false);
      setErrorMessage(err.message || "Không thể kết nối.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (showUploadBg) {
      if (backgroundImage !== DEFAULT_BG && !backgroundImage.startsWith('data:')) {
        setBgUrlInput(backgroundImage);
      } else {
        setBgUrlInput('');
      }
    }
  }, [showUploadBg, backgroundImage]);

  const handleUpdateUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (customUrl.trim()) {
      setApiUrl(customUrl.trim());
      setShowSettings(false);
      setData(INITIAL_DATA);
      fetchData(); 
    }
  };

  const handleApiCall = async (apiCall: () => Promise<any>, onSuccess: () => void) => {
    setSyncing(true);
    try {
      await apiCall();
      onSuccess();
      setIsConnected(true);
      setErrorMessage('');
    } catch (err: any) {
      console.error(err);
      setIsConnected(false);
      setErrorMessage(err.message || "Lỗi khi lưu dữ liệu.");
      alert("Lỗi: " + (err.message || "Vui lòng kiểm tra kết nối mạng."));
    } finally {
      setSyncing(false);
    }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminUserInput === data.adminUser && adminPassInput === data.adminPass) {
      setIsAdminLoggedIn(true);
      setShowAdminLogin(false);
      setShowUploadBg(true);
      setLoginError('');
      setAdminUserInput('');
      setAdminPassInput('');
    } else {
      setLoginError('Sai ID hoặc Mật khẩu!');
    }
  };

  const handleBackgroundUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (readerEvent) => {
        const img = new Image();
        img.onload = async () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800; 
          const scaleSize = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;
          
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          const dataUrl = canvas.toDataURL('image/jpeg', 0.5);
          
          // LƯU NGAY LẬP TỨC (Optimistic Update)
          setBackgroundImage(dataUrl);
          localStorage.setItem(CACHE_KEY_BG, dataUrl);
          setShowUploadBg(false);
          
          // Sau đó mới gửi lên Server ngầm
          setUploadingBg(true);
          try {
            await api.saveSetting('background_image', dataUrl);
          } catch (error: any) {
            console.error("Lỗi lưu ảnh lên server:", error);
            alert("Đã lưu ảnh trên máy này, nhưng lỗi khi đồng bộ lên Server: " + error.message);
          } finally {
            setUploadingBg(false);
          }
        };
        img.src = readerEvent.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUrlSave = async () => {
    const url = bgUrlInput.trim();
    if (!url) return;
    
    setUploadingBg(true);

    const imgTest = new Image();
    imgTest.src = url;

    imgTest.onload = async () => {
      // 1. Ảnh hợp lệ -> LƯU VÀO MÁY NGAY LẬP TỨC
      setBackgroundImage(url);
      localStorage.setItem(CACHE_KEY_BG, url);
      setShowUploadBg(false);
      
      // 2. Sau đó mới gửi lên Server
      try {
        await api.saveSetting('background_image', url);
        alert("Đã cập nhật thành công!");
      } catch (error: any) {
        alert("Đã lưu link trên máy này, nhưng lỗi khi đồng bộ lên Google Sheet: " + error.message);
      } finally {
        setUploadingBg(false);
      }
    };

    imgTest.onerror = () => {
      setUploadingBg(false);
      alert("Link ảnh lỗi hoặc không cho phép truy cập! Vui lòng thử link khác.");
    };
  };

  const addTransaction = (t: Omit<Transaction, 'id'>) => {
    const newTrans: Transaction = { ...t, id: Math.random().toString(36).substr(2, 9) };
    setData(prev => ({ ...prev, transactions: [newTrans, ...prev.transactions] }));
    handleApiCall(() => api.saveTransaction(newTrans), () => {});
  };

  const updateTransaction = (t: Transaction) => {
    setData(prev => ({
      ...prev,
      transactions: prev.transactions.map(trans => trans.id === t.id ? t : trans)
    }));
    handleApiCall(() => api.saveTransaction(t), () => {});
  };

  const deleteTransaction = (id: string) => {
    const backup = [...data.transactions];
    setData(prev => ({ ...prev, transactions: prev.transactions.filter(t => t.id !== id) }));
    handleApiCall(() => api.deleteTransaction(id), () => setData(prev => ({...prev, transactions: backup})));
  };

  const addMaterial = (m: Omit<Material, 'id' | 'totalValue'>) => {
    const newMat: Material = { 
      ...m, 
      id: Math.random().toString(36).substr(2, 9),
      totalValue: m.quantity * m.unitPrice
    };
    setData(prev => ({ ...prev, materials: [...prev.materials, newMat] }));
    handleApiCall(() => api.saveMaterial(newMat), () => {});
  };

  const updateMaterial = (m: Material) => {
    setData(prev => ({
      ...prev,
      materials: prev.materials.map(mat => mat.id === m.id ? m : mat)
    }));
    handleApiCall(() => api.saveMaterial(m), () => {});
  };

  const deleteMaterial = (id: string) => {
    setData(prev => ({ ...prev, materials: prev.materials.filter(m => m.id !== id) }));
    handleApiCall(() => api.deleteMaterial(id), () => {});
  };

  const updateBudget = (newBudget: number) => {
    setData(prev => ({ ...prev, budget: newBudget }));
    handleApiCall(() => api.updateBudget(newBudget), () => {});
  };

  const NavItem = ({ view, icon: Icon, label }: { view: View, icon: any, label: string }) => (
    <button
      onClick={() => { setCurrentView(view); setIsMobileMenuOpen(false); }}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
        currentView === view 
          ? 'bg-blue-600/80 text-white shadow-md backdrop-blur-md' 
          : 'text-slate-800 hover:bg-white/30 hover:text-slate-900 hover:backdrop-blur-sm'
      }`}
    >
      <Icon size={20} />
      <span>{label}</span>
    </button>
  );

  return (
    <div 
      className="flex h-screen font-sans overflow-hidden transition-all duration-500"
      style={{ 
        backgroundImage: `url('${backgroundImage}')`,
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        backgroundColor: '#f3f4f6' // Màu nền dự phòng khi không có ảnh
      }}
    >
      <div className="absolute inset-0 bg-white/5 pointer-events-none z-0"></div>

      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white/20 backdrop-blur-sm border-r border-white/20 h-full p-4 shadow-sm z-20">
        <div className="flex items-center gap-2 px-2 mb-8 mt-2">
          <div className="bg-blue-600 text-white p-2 rounded-lg shadow-lg">
            <Receipt size={24} />
          </div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-700 drop-shadow-sm">
            256 Lê Đại Hành
          </h1>
        </div>
        
        <nav className="flex-1 space-y-2">
          <NavItem view="DASHBOARD" icon={LayoutDashboard} label="Tổng Quan" />
          <NavItem view="TRANSACTIONS" icon={Receipt} label="Sổ Thu Chi" />
          <NavItem view="INVENTORY" icon={Package} label="Kho Vật Liệu" />
        </nav>

        <div className="mt-auto pt-6 border-t border-white/30 space-y-2">
          {/* Status Indicator */}
          <div className={`mb-3 p-3 rounded-lg border flex flex-col gap-2 text-xs font-medium backdrop-blur-md ${
            isConnected 
              ? 'bg-emerald-50/60 border-emerald-100 text-emerald-900' 
              : 'bg-red-50/60 border-red-100 text-red-900'
          }`}>
            <div className="flex items-center gap-2">
               {isConnected ? <Wifi size={14} /> : <WifiOff size={14} />}
               <span className="flex-1">{isConnected ? 'Đã kết nối' : 'Mất kết nối'}</span>
               {!isConnected && (
                 <button onClick={() => fetchData(true)} className="p-1 hover:bg-red-100/50 rounded bg-white/50">
                   <RefreshCcw size={12} className={syncing ? "animate-spin" : ""} />
                 </button>
               )}
            </div>
          </div>
          
          <button 
            onClick={() => {
              if (isAdminLoggedIn) {
                setShowUploadBg(true);
              } else {
                setShowAdminLogin(true);
              }
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-800 hover:bg-white/40 rounded-lg transition-colors font-medium backdrop-blur-sm"
          >
             <ImageIcon size={14} /> Đổi hình nền
          </button>

          <button 
            onClick={() => setShowSettings(!showSettings)}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-800 hover:bg-white/40 rounded-lg transition-colors font-medium backdrop-blur-sm"
          >
            <Settings size={14} /> Cấu hình API
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative z-10">
        {/* Mobile Header */}
        <header className="md:hidden h-16 bg-white/20 backdrop-blur-sm border-b border-white/20 flex items-center justify-between px-4 z-20 sticky top-0">
          <div className="flex items-center gap-2">
             <div className="bg-blue-600 text-white p-1.5 rounded-lg">
              <Receipt size={20} />
            </div>
            <h1 className="text-lg font-bold text-slate-900">256 Lê Đại Hành</h1>
          </div>
          <div className="flex items-center gap-2">
             {!isConnected && <WifiOff size={16} className="text-red-500" />}
             <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-slate-800 bg-white/30 rounded-lg">
               {isMobileMenuOpen ? <X /> : <Menu />}
             </button>
          </div>
        </header>

        {isMobileMenuOpen && (
          <div className="md:hidden absolute inset-0 bg-white/80 backdrop-blur-xl z-30 pt-16 px-4 space-y-2 animate-fade-in">
             <NavItem view="DASHBOARD" icon={LayoutDashboard} label="Tổng Quan" />
             <NavItem view="TRANSACTIONS" icon={Receipt} label="Sổ Thu Chi" />
             <NavItem view="INVENTORY" icon={Package} label="Kho Vật Liệu" />
             <hr className="my-2 border-slate-300"/>
             <button 
               onClick={() => { 
                 setIsMobileMenuOpen(false); 
                 if (isAdminLoggedIn) setShowUploadBg(true); 
                 else setShowAdminLogin(true); 
               }}
               className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-800 font-medium"
             >
               <ImageIcon size={20} /> Đổi hình nền
             </button>
             <button 
               onClick={() => { setShowSettings(true); setIsMobileMenuOpen(false); }}
               className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-800 font-medium"
             >
               <Settings size={20} /> Cấu hình API
             </button>
          </div>
        )}

        {/* Global Loading Overlay */}
        {loading && data.transactions.length === 0 && (
           <div className="absolute inset-0 bg-white/20 backdrop-blur-sm z-50 flex items-center justify-center pointer-events-none">
              <div className="bg-white/80 p-4 rounded-xl shadow-lg border border-white flex flex-col items-center gap-2 backdrop-blur-md">
                <Loader2 className="animate-spin text-blue-600" size={30} />
                <span className="text-xs text-slate-800 font-medium">Đang tải dữ liệu...</span>
              </div>
           </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto h-full relative">
            
            {/* Warning Banner */}
            {!isConnected && !loading && (
              <div className="mb-4 bg-amber-50/70 backdrop-blur-md border border-amber-200 text-amber-900 px-4 py-3 rounded-xl flex items-start gap-3 text-sm shadow-sm">
                <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-700" />
                <div className="flex-1">
                  <p className="font-bold">Chế độ Offline (Mất kết nối)</p>
                  <p className="opacity-90 mt-1">
                    Dữ liệu bạn thấy có thể chưa được cập nhật. Các thay đổi sẽ không được lưu vào Google Sheet.
                  </p>
                </div>
                <button 
                  onClick={() => fetchData(true)}
                  className="bg-amber-100 hover:bg-amber-200 p-2 rounded-lg transition-colors"
                >
                  <RefreshCcw size={16} />
                </button>
              </div>
            )}

            {currentView === 'DASHBOARD' && (
              <Dashboard 
                transactions={data.transactions} 
                materials={data.materials} 
                budget={data.budget} 
                onUpdateBudget={updateBudget}
              />
            )}
            {currentView === 'TRANSACTIONS' && (
              <TransactionList 
                transactions={data.transactions}
                onAddTransaction={addTransaction}
                onUpdateTransaction={updateTransaction}
                onDeleteTransaction={deleteTransaction}
              />
            )}
            {currentView === 'INVENTORY' && (
              <InventoryList 
                materials={data.materials}
                onAddMaterial={addMaterial}
                onUpdateMaterial={updateMaterial}
                onDeleteMaterial={deleteMaterial}
              />
            )}
          </div>
        </div>

        {/* Admin Login Modal */}
        {showAdminLogin && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white/85 backdrop-blur-xl rounded-xl shadow-2xl w-full max-w-sm p-6 animate-fade-in border border-white/50">
               <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><Lock size={18} /> Đăng nhập Admin</h3>
                <button onClick={() => setShowAdminLogin(false)} className="text-slate-500 hover:text-slate-700">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleAdminLogin} className="space-y-4">
                 <div>
                   <label className="block text-sm font-medium text-slate-800 mb-1">ID Admin</label>
                   <input 
                    type="text" 
                    value={adminUserInput}
                    onChange={(e) => setAdminUserInput(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white/80 text-slate-900"
                    placeholder="Nhập ID..."
                   />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-slate-800 mb-1">Mật khẩu</label>
                   <div className="relative">
                     <input 
                      type={showPassword ? "text" : "password"} 
                      value={adminPassInput}
                      onChange={(e) => setAdminPassInput(e.target.value)}
                      className="w-full p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white/80 text-slate-900 pr-10"
                      placeholder="Nhập mật khẩu..."
                     />
                     <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 p-1"
                     >
                       {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                     </button>
                   </div>
                 </div>
                 {loginError && <p className="text-red-600 text-sm font-medium bg-red-50/50 p-2 rounded border border-red-100">{loginError}</p>}
                 <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-sm">
                   Đăng nhập
                 </button>
              </form>
            </div>
          </div>
        )}

        {/* Upload Background Modal */}
        {showUploadBg && (
           <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white/85 backdrop-blur-xl rounded-xl shadow-2xl w-full max-w-md p-6 animate-fade-in border border-white/50">
               <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><ImageIcon size={18} /> Thay đổi hình nền</h3>
                <button onClick={() => setShowUploadBg(false)} className="text-slate-500 hover:text-slate-700">
                  <X size={20} />
                </button>
              </div>
              
              {uploadingBg ? (
                 <div className="flex flex-col items-center justify-center py-12 gap-4">
                   <Loader2 className="animate-spin text-blue-600" size={40} />
                   <p className="text-slate-700 font-medium">Đang kiểm tra và lưu thay đổi...</p>
                 </div>
              ) : (
                <div className="space-y-6">
                  {/* Option 1: URL */}
                  <div className="bg-indigo-50/70 p-4 rounded-xl border border-indigo-100">
                    <label className="text-sm font-bold text-indigo-900 mb-2 flex items-center gap-2">
                       <LinkIcon size={16} /> Dùng Link Ảnh (Khuyên dùng - Nét nhất)
                    </label>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={bgUrlInput}
                        onChange={(e) => setBgUrlInput(e.target.value)}
                        placeholder="VD: https://imgur.com/anh-dep.jpg"
                        className="flex-1 p-2 border border-indigo-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-slate-900"
                      />
                      <button 
                        onClick={handleUrlSave}
                        disabled={!bgUrlInput.trim()}
                        className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white px-3 rounded-lg flex items-center justify-center"
                      >
                        <CheckCircle2 size={20} />
                      </button>
                    </div>
                    <p className="text-xs text-indigo-700 mt-1.5 opacity-80">Copy link ảnh từ Facebook, Google, hoặc các trang web khác dán vào đây để giữ chất lượng cao nhất.</p>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-300"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white/80 backdrop-blur text-slate-500">Hoặc tải lên từ máy</span>
                    </div>
                  </div>

                  {/* Option 2: Upload File */}
                  <div className="flex flex-col items-center justify-center gap-2 py-4 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50/50 hover:bg-slate-100/50 transition-colors">
                     <div className="p-3 bg-white rounded-full text-slate-500 shadow-sm">
                       <UploadCloud size={24} />
                     </div>
                     <div className="text-center">
                       <label className="cursor-pointer bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg font-medium transition-colors inline-block shadow-sm text-sm">
                         Chọn ảnh từ máy
                         <input type="file" accept="image/*" className="hidden" onChange={handleBackgroundUpload} />
                       </label>
                       <p className="text-[10px] text-slate-500 mt-2 max-w-[200px] mx-auto">Ảnh sẽ bị nén và mờ để phù hợp lưu trữ (Không khuyến khích).</p>
                     </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Settings Modal */}
        {showSettings && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white/85 backdrop-blur-xl rounded-xl shadow-2xl w-full max-w-md p-6 animate-fade-in border border-white/50">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-slate-800">Cấu hình Kết nối</h3>
                <button onClick={() => setShowSettings(false)} className="text-slate-500 hover:text-slate-700">
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={handleUpdateUrl} className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Google Web App URL</label>
                  <input 
                    type="text" 
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    placeholder="https://script.google.com/macros/s/..."
                    className="w-full p-3 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white/80 text-slate-900"
                  />
                </div>
                
                <div className="bg-blue-50/70 p-4 rounded-lg border border-blue-100 text-xs text-blue-800 space-y-2">
                  <p className="font-bold flex items-center gap-1"><AlertTriangle size={12}/> Lưu ý quan trọng:</p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li>Nếu vừa cập nhật code backend, hãy nhớ <strong>Deploy lại</strong> (New Deployment) trong Google Script.</li>
                    <li>Code mới hỗ trợ lưu hình nền vào Sheet "Settings".</li>
                  </ul>
                </div>

                <div className="flex gap-3 mt-2">
                   <button 
                    type="button"
                    onClick={() => setShowSettings(false)}
                    className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium"
                  >
                    Đóng
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
                  >
                    Lưu & Kết nối lại
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default App;