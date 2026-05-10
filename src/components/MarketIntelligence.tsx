import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Newspaper, ChevronRight, ArrowRight } from 'lucide-react';
import { MarketNews } from '../types';

interface MarketIntelligenceProps {
  marketNews: MarketNews[];
  loadingNews: boolean;
  currentNewsIndex: number;
  setCurrentNewsIndex: (index: number) => void;
  setActiveTab: (tab: string) => void;
}

export const MarketIntelligence: React.FC<MarketIntelligenceProps> = ({
  marketNews,
  loadingNews,
  currentNewsIndex,
  setCurrentNewsIndex,
  setActiveTab
}) => {
  return (
    <section className="premium-card overflow-hidden flex flex-col min-h-[480px]">
      <div className="bg-brand-slate p-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-2 h-8 bg-brand-gold rounded-full" />
          <h2 className="text-xl font-display font-bold text-white tracking-tight">Market Intel</h2>
        </div>
        <div className="flex gap-2">
          {marketNews.length > 0 && marketNews.slice(0, 5).map((_, i) => (
            <button 
              key={i} 
              onClick={() => setCurrentNewsIndex(i)}
              className={`h-1.5 rounded-full transition-all duration-500 ${currentNewsIndex === i ? 'bg-brand-gold w-8' : 'bg-white/20 w-3 hover:bg-white/40'}`} 
            />
          ))}
        </div>
      </div>
      
      <div className="p-8 flex-1 flex flex-col">
        <AnimatePresence mode="wait">
          {loadingNews ? (
            <motion.div 
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6 py-8"
            >
              <div className="h-8 bg-slate-100 dark:bg-slate-800 rounded-xl w-3/4 animate-pulse" />
              <div className="space-y-3">
                <div className="h-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg w-full animate-pulse" />
                <div className="h-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg w-5/6 animate-pulse" />
              </div>
            </motion.div>
          ) : marketNews.length > 0 ? (
            <motion.div
              key={currentNewsIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="flex flex-col h-full"
            >
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <span className={`text-[10px] px-3 py-1 rounded-full font-display font-bold uppercase tracking-widest ${
                  marketNews[currentNewsIndex].sentiment === 'Positive' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' :
                  marketNews[currentNewsIndex].sentiment === 'Negative' ? 'bg-rose-500/10 text-rose-600 border border-rose-500/20' :
                  'bg-slate-500/10 text-slate-600 border border-slate-500/20'
                }`}>
                  {marketNews[currentNewsIndex].sentiment} Sentiment
                </span>
              </div>

              <h3 className="text-2xl font-display font-bold text-slate-900 dark:text-white leading-tight mb-6">
                {marketNews[currentNewsIndex].headline}
              </h3>
              
              <div className="mb-8 p-6 bg-brand-green/5 dark:bg-brand-green/10 border-l-4 border-brand-green rounded-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <ArrowRight size={48} className="rotate-45" />
                </div>
                <p className="text-[10px] font-display font-bold text-brand-green uppercase tracking-[0.2em] mb-2">Alpha Impact</p>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed">
                  {marketNews[currentNewsIndex].impact}
                </p>
              </div>

              <p className="text-base text-slate-500 dark:text-slate-400 leading-relaxed mb-8 font-medium">
                {marketNews[currentNewsIndex].summary}
              </p>
              
              <div className="mt-auto pt-8 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-6">
                <div className="flex items-center justify-between">
                  <a 
                    href={marketNews[currentNewsIndex].source_url || "#"} 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm font-display font-bold text-brand-green hover:text-brand-green-light transition-colors group"
                  >
                    Full Intelligence Report
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </a>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setCurrentNewsIndex(prev => (prev === 0 ? Math.min(marketNews.length - 1, 4) : prev - 1))}
                      className="p-3 text-slate-400 hover:text-brand-slate dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all border border-transparent hover:border-slate-100 dark:hover:border-slate-700"
                    >
                      <ChevronRight size={20} className="rotate-180" />
                    </button>
                    <button 
                      onClick={() => setCurrentNewsIndex(prev => (prev === Math.min(marketNews.length - 1, 4) ? 0 : prev + 1))}
                      className="p-3 text-slate-400 hover:text-brand-slate dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all border border-transparent hover:border-slate-100 dark:hover:border-slate-700"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>
                </div>
                
                <button 
                  onClick={() => setActiveTab('news')}
                  className="w-full py-4 bg-slate-900 dark:bg-brand-green text-white rounded-2xl font-display font-bold text-sm hover:bg-brand-slate dark:hover:bg-brand-green-light transition-all shadow-lg shadow-slate-900/20 flex items-center justify-center gap-3"
                >
                  <Newspaper size={18} />
                  Intelligence Archive
                </button>
              </div>
            </motion.div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-full mb-6">
                <Newspaper className="text-slate-300 dark:text-slate-600" size={48} />
              </div>
              <p className="text-slate-500 dark:text-slate-400 font-display font-semibold">No active reports found</p>
              <p className="text-sm text-slate-400 dark:text-slate-500 mt-2">Check back soon for fresh alpha.</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};
