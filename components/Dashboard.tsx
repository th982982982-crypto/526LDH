import React, { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { Transaction } from '../types';
import { TrendingUp, TrendingDown, Wallet, Edit2, X, Check } from 'lucide-react';

interface DashboardProps {
  transactions: Transaction[];
  budget: number;
  onUpdateBudget: (amount: number) => void;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export const Dashboard: React.FC<DashboardProps> = ({ transactions, budget, onUpdateBudget }) => {
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [tempBudget, setTempBudget] = useState(budget.toString());

  const totalIncome = transactions
    .filter(t => t.type === 'INCOME')
    .reduce((acc, t) => acc + t.amount, 0);
    
  const totalExpense = transactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((acc, t) => acc + t.amount, 0);

  // Remaining = Initial Budget + Income - Expense
  const balance = budget + totalIncome - totalExpense;

  // Prepare data for Expense by Category
  const expensesByCategory = transactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  const pieData = Object.keys(expensesByCategory).map(key => ({
    name: key,
    value: expensesByCategory[key]
  }));

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

  // Helper để format số khi nhập liệu (1.000.000)
  const formatNumberInput = (val: string) => {
    if (!val) return '';
    return new Intl.NumberFormat('vi-VN').format(Number(val));
  };

  const handleSaveBudget = () => {
    // Loại bỏ các ký tự không phải số trước khi lưu
    const val = Number(tempBudget);
    if (!isNaN(val)) {
      onUpdateBudget(val);
      setIsEditingBudget(false);
    }
  };

  const handleEditClick = () => {
    setTempBudget(budget.toString());
    setIsEditingBudget(true);
  }

  const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Chỉ lấy số từ input (xóa dấu chấm, phẩy, chữ)
    const rawValue = e.target.value.replace(/\D/g, '');
    setTempBudget(rawValue);
  };

  // Nền trong suốt hơn nữa: bg-white/20 và giảm blur
  const cardClass = "bg-white/20 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-white/20 flex flex-col justify-between relative group transition-all hover:bg-white/30";
  const flexCardClass = "bg-white/20 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-white/20 flex items-center justify-between transition-all hover:bg-white/30";
  const chartCardClass = "bg-white/20 backdrop-blur-sm p-6 rounded-xl shadow-lg border border-white/20 h-96 transition-all hover:bg-white/30";

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={cardClass}>
          <div className="flex justify-between items-start mb-2">
            <p className="text-sm text-slate-800 font-bold">Ngân Sách Ban Đầu</p>
            <div className="p-2 bg-blue-50/70 rounded-full text-blue-700">
               <Wallet size={20} />
            </div>
          </div>
          
          {isEditingBudget ? (
            <div className="flex items-center gap-2 mt-1">
              <input 
                type="text"
                value={formatNumberInput(tempBudget)}
                onChange={handleBudgetChange}
                className="w-full p-1 border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-lg font-semibold bg-white/80 text-slate-900"
                autoFocus
                placeholder="0"
              />
              <button onClick={handleSaveBudget} className="p-1 bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200">
                <Check size={16} />
              </button>
               <button onClick={() => setIsEditingBudget(false)} className="p-1 bg-slate-100 text-slate-600 rounded hover:bg-slate-200">
                <X size={16} />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold text-slate-900">{formatCurrency(budget)}</p>
              <button 
                onClick={handleEditClick}
                className="opacity-0 group-hover:opacity-100 text-slate-800 hover:text-blue-700 p-1 transition-all"
                title="Sửa ngân sách"
              >
                <Edit2 size={16} />
              </button>
            </div>
          )}
           <p className="text-xs text-slate-800 mt-1 font-medium">Tổng thu: +{formatCurrency(totalIncome)}</p>
        </div>

        <div className={flexCardClass}>
          <div>
            <p className="text-sm text-slate-800 font-bold">Đã Chi Tiêu</p>
            <p className="text-2xl font-bold text-red-800">{formatCurrency(totalExpense)}</p>
          </div>
          <div className="p-3 bg-red-50/70 rounded-full text-red-800">
            <TrendingDown size={24} />
          </div>
        </div>

        <div className={flexCardClass}>
          <div>
            <p className="text-sm text-slate-800 font-bold">Số Dư Còn Lại</p>
            <p className="text-2xl font-bold text-emerald-800">{formatCurrency(balance)}</p>
            <p className="text-xs text-slate-800 mt-1 font-medium">(Gồm thu nhập)</p>
          </div>
          <div className="p-3 bg-emerald-50/70 rounded-full text-emerald-800">
            <TrendingUp size={24} />
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-6">
        {/* Expense Structure */}
        <div className={chartCardClass}>
          <h3 className="text-lg font-bold text-slate-800 mb-4">Cơ Cấu Chi Phí</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', color: '#1e293b' }} itemStyle={{ color: '#1e293b' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-600 font-medium">Chưa có dữ liệu chi tiêu</div>
          )}
        </div>
      </div>
    </div>
  );
};