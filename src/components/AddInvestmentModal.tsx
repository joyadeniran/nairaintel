import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus } from 'lucide-react';
import { Investment } from '../types';

interface AddInvestmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingInvestment: Investment | null;
  onConfirm: (data: any) => void;
}

export const AddInvestmentModal: React.FC<AddInvestmentModalProps> = ({
  isOpen,
  onClose,
  editingInvestment,
  onConfirm
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/50 dark:bg-black/70 backdrop-blur-xl"
        />
        <motion.div 
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative premium-card p-8 w-full max-w-md shadow-2xl"
        >
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-display font-bold text-slate-900 dark:text-white leading-tight">
              {editingInvestment ? 'Edit Asset' : 'New Asset'}
            </h2>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-rose-500 transition-colors">
              <Plus size={24} className="rotate-45" />
            </button>
          </div>

          <form className="space-y-6" onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const data = Object.fromEntries(formData.entries());
            onConfirm(data);
          }}>
            <div className="space-y-2">
              <label className="text-xs font-display font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest ml-1">Asset Class</label>
              <select 
                name="type" 
                defaultValue={editingInvestment?.type || 'stock'}
                className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 focus:outline-none focus:ring-4 focus:ring-brand-green/10 font-bold text-slate-800 dark:text-white transition-all appearance-none"
              >
                <option value="stock">Equity / Stock</option>
                <option value="tbill">Federal T-Bill</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-display font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest ml-1">Ticker</label>
                <input 
                  name="symbol" 
                  defaultValue={editingInvestment?.symbol || ''}
                  placeholder="e.g. DANGCEM" 
                  className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 focus:outline-none focus:ring-4 focus:ring-brand-green/10 font-bold text-slate-800 dark:text-white placeholder:text-slate-400 transition-all" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-display font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest ml-1">Security Name</label>
                <input 
                  name="name" 
                  defaultValue={editingInvestment?.name || ''}
                  placeholder="e.g. Dangote Cement" 
                  className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 focus:outline-none focus:ring-4 focus:ring-brand-green/10 font-bold text-slate-800 dark:text-white placeholder:text-slate-400 transition-all" 
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-display font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest ml-1">Entry Price (₦)</label>
                <input 
                  name="entry_price" 
                  type="number" 
                  step="0.01" 
                  defaultValue={editingInvestment?.entry_price || ''}
                  className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 focus:outline-none focus:ring-4 focus:ring-brand-green/10 font-bold text-slate-800 dark:text-white transition-all" 
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-display font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest ml-1">Quantity</label>
                <input 
                  name="quantity" 
                  type="number" 
                  defaultValue={editingInvestment?.quantity || ''}
                  className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 focus:outline-none focus:ring-4 focus:ring-brand-green/10 font-bold text-slate-800 dark:text-white transition-all" 
                />
              </div>
            </div>

            <button type="submit" className="glow-button w-full py-4 mt-4">
              {editingInvestment ? 'Update Intelligence' : 'Confirm Allocation'}
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
