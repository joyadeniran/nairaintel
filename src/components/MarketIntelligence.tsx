import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Newspaper, ChevronRight, ArrowRight, Sparkles } from 'lucide-react';
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
  const maxIndex = Math.min(marketNews.length - 1, 4);
  const safeIndex = Math.min(currentNewsIndex, maxIndex);
  const current = marketNews[safeIndex];

  const goPrev = () => {
    setCurrentNewsIndex(safeIndex === 0 ? maxIndex : safeIndex - 1);
  };

  const goNext = () => {
    setCurrentNewsIndex(safeIndex === maxIndex ? 0 : safeIndex + 1);
  };

  return (
    <section className="premium-card overflow-hidden flex flex-col min-h-[480px]">
      <div className="bg-brand-slate p-6 md:p-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-2 h-8 bg-brand-gold rounded-full" />
          <div>
            <h2 className="text-xl font-display font-bold text-white tracking-tight">Market Intel</h2>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">AI-powered insights</p>
          </div>
        </div>
        <div className="flex gap-2">
          {marketNews.length > 0 && marketNews.slice(0, 5).map((_, i) => (
            <button 
              key={i} 
              onClick={() => setCurrentNewsIndex(i)}
              aria-label={`Go to insight ${i + 1}`}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                safeIndex === i ? 'bg-brand-gold w-8' : 'bg-white/20 w-3 hover:bg-white/40'
              }`} 
            />
          ))}
        </div>
      </div>
      
      <div className="p-6 md:p-8 flex-1 flex flex-col">
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
                <div className="h-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg w-4/6 animate-pulse" />
              </div>
            </motion.div>
          ) : current ? (
            <motion.div
              key={safeIndex}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="flex flex-col h-full"
            >
              <div className="flex flex-wrap items-center gap-2 mb-5">
                <span className={`text-[10px] px-3 py-1 rounded-full font-display font-bold uppercase tracking-widest ${
                  current.sentiment === 'Positive' 
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                    : current.sentiment === 'Negative' 
                      ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20' 
                      : 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20'
                }`}>
                  {current.sentiment} Sentiment
                </span>
                <span className="text-[10px] px-2.5 py-1 rounded-full font-display font-bold uppercase tracking-widest bg-brand-gold/10 text-brand-gold border border-brand-gold/20 flex items-center gap-1">
                  <Sparkles size={10} /> Alpha
                </span>
              </div>

              <h3 className="text-xl md:text-2xl font-display font-bold text-slate-900 dark:text-white leading-snug mb-5">
                {current.headline}
              </h3>
              
              <div className="mb-6 p-5 bg-brand-green/5 dark:bg-brand-green/10 border-l-4 border-brand-green rounded-xl relative overflow-hidden">
                <p className="text-[10px] font-display font-bold text-brand-green uppercase tracking-[0.2em] mb-2">
                  Investor Impact
                </p>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed">
                  {current.impact}
                </p>
              </div>

              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6 font-medium line-clamp-4">
                {current.summary}
              </p>
              
              <div className="mt-auto pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setActiveTab('news')}
                    className="flex items-center gap-2 text-sm font-display font-bold text-brand-green hover:text-brand-green-light transition-colors group"
                  >
                    View full archive
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={goPrev}
                      aria-label="Previous insight"
                      className="p-2.5 text-slate-400 hover:text-brand-slate dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all"
                    >
                      <ChevronRight size={18} className="rotate-180" />
                    </button>
                    <button 
                      onClick={goNext}
                      aria-label="Next insight"
                      className="p-2.5 text-slate-400 hover:text-brand-slate dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
                
                <button 
                  onClick={() => setActiveTab('news')}
                  className="w-full py-3.5 bg-slate-900 dark:bg-brand-green text-white rounded-2xl font-display font-bold text-sm hover:bg-brand-slate dark:hover:bg-brand-green-light transition-all shadow-lg shadow-slate-900/20 flex items-center justify-center gap-2"
                >
                  <Newspaper size={16} />
                  Intelligence Archive
                </button>
              </div>
            </motion.div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-full mb-6">
                <Newspaper className="text-slate-300 dark:text-slate-600" size={40} />
              </div>
              <p className="text-slate-500 dark:text-slate-400 font-display font-semibold">No active reports</p>
              <p className="text-sm text-slate-400 dark:text-slate-500 mt-2">Fresh market intelligence will appear here.</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};
