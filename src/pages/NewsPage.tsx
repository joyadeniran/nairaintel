import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Share2, TrendingUp, TrendingDown, Minus, Zap } from 'lucide-react';
import { MarketNews } from '../types';

interface NewsPageProps {
  marketNews: MarketNews[];
  loadingNews: boolean;
}

export const NewsPage: React.FC<NewsPageProps> = ({ marketNews, loadingNews }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="max-w-6xl mx-auto space-y-10"
    >
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-green/5 dark:bg-brand-green/10 border border-brand-green/10 text-brand-green text-xs font-display font-bold uppercase tracking-widest mb-2">
          <Zap size={12} /> AI-Powered
        </div>
        <h2 className="text-4xl md:text-5xl font-display font-bold text-slate-900 dark:text-white tracking-tight">
          Market Intelligence
        </h2>
        <p className="text-base text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
          Real-time insights on the Nigerian economy and financial markets.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loadingNews ? (
          [1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden">
              <div className="p-8 space-y-4">
                <div className="flex gap-2">
                  <div className="h-6 w-20 bg-slate-100 dark:bg-slate-800 rounded-full shimmer" />
                </div>
                <div className="h-6 bg-slate-100 dark:bg-slate-800 rounded-lg w-5/6 shimmer" />
                <div className="h-6 bg-slate-100 dark:bg-slate-800 rounded-lg w-3/4 shimmer" />
                <div className="space-y-2 pt-2">
                  <div className="h-4 bg-slate-50 dark:bg-slate-800/50 rounded w-full shimmer" />
                  <div className="h-4 bg-slate-50 dark:bg-slate-800/50 rounded w-5/6 shimmer" />
                </div>
              </div>
            </div>
          ))
        ) : marketNews.map((news, idx) => (
          <motion.article
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.08 }}
            className="group flex flex-col rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-100 dark:border-slate-800 overflow-hidden hover:border-brand-green/20 dark:hover:border-brand-green/20 hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-none transition-all duration-300"
          >
            <div className="p-7 flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-5">
                <span className={`flex items-center gap-1.5 text-[10px] px-3 py-1.5 rounded-full font-display font-bold uppercase tracking-widest border ${
                  news.sentiment === 'Positive' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/15' :
                  news.sentiment === 'Negative' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/15' :
                  'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                }`}>
                  {news.sentiment === 'Positive' && <TrendingUp size={12} />}
                  {news.sentiment === 'Negative' && <TrendingDown size={12} />}
                  {news.sentiment === 'Neutral' && <Minus size={12} />}
                  {news.sentiment}
                </span>
                <button className="p-2 text-slate-300 dark:text-slate-600 hover:text-brand-green transition-colors rounded-lg"><Share2 size={15} /></button>
              </div>

              <h3 className="text-lg font-display font-bold text-slate-900 dark:text-white leading-snug mb-3 group-hover:text-brand-green transition-colors">
                {news.headline}
              </h3>

              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-5 line-clamp-3">
                {news.summary}
              </p>

              <div className="mt-auto pt-5 border-t border-slate-50 dark:border-slate-800">
                <div className="mb-4 p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border-l-3 border-brand-green">
                  <p className="text-[10px] font-display font-bold text-brand-green uppercase tracking-widest mb-1">Impact</p>
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">
                    {news.impact}
                  </p>
                </div>

                <a
                  href={news.source_url || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between group/link"
                >
                  <span className="text-sm font-display font-bold text-slate-800 dark:text-white group-hover/link:text-brand-green transition-colors">Read Full Insight</span>
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 flex items-center justify-center group-hover/link:bg-brand-green group-hover/link:text-white transition-all group-hover/link:translate-x-0.5">
                    <ArrowRight size={15} />
                  </div>
                </a>
              </div>
            </div>
          </motion.article>
        ))}
      </div>

      {!loadingNews && marketNews.length === 0 && (
        <div className="text-center py-20">
          <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-6 rotate-6">
            <Zap size={36} className="text-slate-300 dark:text-slate-600 -rotate-6" />
          </div>
          <h3 className="text-xl font-display font-bold text-slate-500 dark:text-slate-400 mb-2">No intelligence reports yet</h3>
          <p className="text-sm text-slate-400 dark:text-slate-500">Fresh AI-powered market insights will appear here shortly.</p>
        </div>
      )}
    </motion.div>
  );
};
