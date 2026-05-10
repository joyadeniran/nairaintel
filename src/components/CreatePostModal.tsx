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
              {editingPost ? 'Refine Post' : 'Start Discussion'}
            </h2>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-rose-500 transition-colors">
              <Plus size={28} className="rotate-45" />
            </button>
          </div>

          <form className="space-y-6" onSubmit={onConfirm}>
            <div className="space-y-2">
              <label className="text-xs font-display font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest ml-1">Forum Category</label>
              <select 
                name="category" 
                defaultValue={editingPost?.category || 'Stock Talk'}
                className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 focus:outline-none focus:ring-4 focus:ring-brand-green/10 font-bold text-slate-800 dark:text-white appearance-none transition-all"
              >
                <option value="General">General Talk</option>
                <option value="Stock Talk">Market Analysis</option>
                <option value="T-Bill & Bonds">Fixed Income</option>
                <option value="Investment Strategies">Proven Strategies</option>
                <option value="Market Rumours">Market Intelligence (Unverified)</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-display font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest ml-1">Headline</label>
              <input 
                name="title" 
                required 
                defaultValue={editingPost?.title || ''}
                placeholder="Make it catchy and descriptive..." 
                className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 focus:outline-none focus:ring-4 focus:ring-brand-green/10 font-bold text-slate-800 dark:text-white placeholder:text-slate-400 transition-all" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-display font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest ml-1">Details & Perspective</label>
              <textarea 
                name="content" 
                required 
                rows={6} 
                defaultValue={editingPost?.content || ''}
                placeholder="Deep dive into your thoughts. What should other investors know?" 
                className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 focus:outline-none focus:ring-4 focus:ring-brand-green/10 font-medium text-slate-800 dark:text-white placeholder:text-slate-400 resize-none transition-all" 
              />
            </div>

            <div className="flex gap-4 pt-4">
              <button 
                type="button"
                onClick={onClose}
                className="flex-1 py-4 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-display font-bold text-sm hover:bg-slate-100 dark:hover:bg-slate-700 transition-all border border-slate-100 dark:border-slate-700"
              >
                Draft
              </button>
              <button 
                type="submit" 
                className="flex-[2] glow-button py-4"
              >
                {editingPost ? 'Update' : 'Broadcast'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
