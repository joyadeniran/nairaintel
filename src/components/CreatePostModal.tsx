import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus } from 'lucide-react';
import { ForumPost } from '../types';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingPost: ForumPost | null;
  onConfirm: (e: React.FormEvent<HTMLFormElement>) => void;
}

const CATEGORIES = [
  { value: 'Stock Analysis', label: 'Stock Analysis' },
  { value: 'Investment Strategies', label: 'Investment Strategies' },
  { value: 'Fixed Income', label: 'Fixed Income (T-Bills, Bonds)' },
  { value: 'Market Rumours', label: 'Market News & Rumours' },
  { value: 'Personal Finance', label: 'Personal Finance' },
  { value: 'Beginner Questions', label: 'Beginner Questions' },
  { value: 'Portfolio Reviews', label: 'Portfolio Reviews' },
];

export const CreatePostModal: React.FC<CreatePostModalProps> = ({
  isOpen,
  onClose,
  editingPost,
  onConfirm
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
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
          className="relative premium-card p-10 w-full max-w-xl shadow-2xl"
        >
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-display font-bold text-slate-800 dark:text-white tracking-tight">
              {editingPost ? 'Edit Discussion' : 'Start Discussion'}
            </h2>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-rose-500 transition-colors">
              <Plus size={28} className="rotate-45" />
            </button>
          </div>

          <form className="space-y-6" onSubmit={onConfirm}>
            <div className="space-y-2">
              <label className="text-xs font-display font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest ml-1">
                Category
              </label>
              <select 
                name="category" 
                defaultValue={editingPost?.category || 'Stock Analysis'}
                className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 focus:outline-none focus:ring-4 focus:ring-brand-green/10 font-bold text-slate-800 dark:text-white appearance-none transition-all"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-display font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest ml-1">
                Headline
              </label>
              <input 
                name="title" 
                required 
                defaultValue={editingPost?.title || ''}
                placeholder="Clear, descriptive title..." 
                className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 focus:outline-none focus:ring-4 focus:ring-brand-green/10 font-bold text-slate-800 dark:text-white placeholder:text-slate-400 transition-all" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-display font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest ml-1">
                Details & Perspective
              </label>
              <textarea 
                name="content" 
                required 
                rows={6} 
                defaultValue={editingPost?.content || ''}
                placeholder="Share your analysis, thesis, questions or experience. What should other investors know?" 
                className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 focus:outline-none focus:ring-4 focus:ring-brand-green/10 font-medium text-slate-800 dark:text-white placeholder:text-slate-400 resize-none transition-all" 
              />
            </div>

            <div className="flex gap-4 pt-4">
              <button 
                type="button"
                onClick={onClose}
                className="flex-1 py-4 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-display font-bold text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-all border border-slate-100 dark:border-slate-700"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="flex-[2] glow-button py-4"
              >
                {editingPost ? 'Update Discussion' : 'Post Discussion'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
