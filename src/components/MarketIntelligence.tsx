import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Newspaper, ChevronRight, ArrowRight, Sparkles, Zap } from 'lucide-react';
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

  const goPrev = () => setCurrentNewsIndex(safeIndex === 0 ? maxIndex : safeIndex - 1);
  const goNext = () => setCurrentNewsIndex(safeIndex === maxIndex ? 0 : safeIndex + 1);

  return (
    <section className="rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col min-h-[460px] bg-white dark:bg-slate-900/80">
      <div className="bg-gradient-to-r from-brand-slate to-[#1a2332] p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-brand-gold/20 rounded-lg flex items-center justify-center">
            <Zap size={14} className="text-brand-gold" />
          </div>
          <div>
            <h2 className="text-base font-display font-bold text-white tracking-tight">Market Intel</h2>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">AI-powered insights</p>
          </div>
        </div>
        <div className="flex gap-1.5">
          {marketNews.length > 0 && marketNews.slice(0, 5).map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentNewsIndex(i)}
              aria-label={`Go to insight ${i + 1}`}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                safeIndex === i ? 'bg-brand-gold w-6' : 'bg-white/15 w-2.5 hover:bg-white/30'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="p-6 flex-1 flex flex-col">
        <AnimatePresence mode="wait">
          {loadingNews ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-5 py-6"
            >
              <div className="flex gap-2">
                <div className="h-6 w-24 bg-slate-100 dark:bg-slate-800 rounded-full shimmer" />
                <div className="h-6 w-16 bg-slate-100 dark:bg-slate-800 rounded-full shimmer" />
              </div>
              <div className="h-7 bg-slate-100 dark:bg-slate-800 rounded-lg w-5/6 shimmer" />
              <div className="space-y-2.5">
                <div className="h-4 bg-slate-50 dark:bg-slate-800/50 rounded w-full shimmer" />
                <div className="h-4 bg-slate-50 dark:bg-slate-800/50 rounded w-4/5 shimmer" />
              </div>
            </motion.div>
          ) : current ? (
            <motion.div
              key={safeIndex}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col h-full"
            >
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className={`text-[10px] px-2.5 py-1 rounded-full font-display font-bold uppercase tracking-widest ${
                  current.sentiment === 'Positive'
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/15'
                    : current.sentiment === 'Negative'
                      ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/15'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                }`}>
                  {current.sentiment}
                </span>
                <span className="text-[10px] px-2.5 py-1 rounded-full font-display font-bold uppercase tracking-widest bg-brand-gold/10 text-brand-gold border border-brand-gold/15 flex items-center gap-1">
                  <Sparkles size={9} /> Alpha
                </span>
              </div>

              <h3 className="text-lg font-display font-bold text-slate-900 dark:text-white leading-snug mb-4">
                {current.headline}
              </h3>

              <div className="mb-4 p-4 bg-brand-green/5 dark:bg-brand-green/10 border-l-3 border-brand-green rounded-xl">
                <p className="text-[10px] font-display font-bold text-brand-green uppercase tracking-[0.15em] mb-1.5">
                  Investor Impact
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {current.impact}
                </p>
              </div>

              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-5 line-clamp-3">
                {current.summary}
              </p>

              <div className="mt-auto pt-5 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setActiveTab('news')}
                    className="flex items-center gap-1.5 text-sm font-display font-bold text-brand-green hover:text-brand-green-light transition-colors group"
                  >
                    View archive
                    <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                  </button>
                  <div className="flex items-center gap-0.5">
                    <button onClick={goPrev} aria-label="Previous" className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-all">
                      <ChevronRight size={16} className="rotate-180" />
                    </button>
                    <button onClick={goNext} aria-label="Next" className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-all">
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab('news')}
                  className="w-full py-3 bg-slate-900 dark:bg-slate-800 text-white rounded-xl font-display font-bold text-sm hover:bg-slate-800 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
                >
                  <Newspaper size={14} />
                  All Intelligence
                </button>
              </div>
            </motion.div>
          ) : (
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <div className="w-14 h-14 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4">
                <Newspaper className="text-slate-300 dark:text-slate-600" size={28} />
              </div>
              <p className="text-slate-500 dark:text-slate-400 font-display font-bold text-sm">No active reports</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Intelligence will appear here.</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};
