import React from 'react';
import { motion } from 'motion/react';
import { Newspaper, ArrowRight, Share2, TrendingUp, TrendingDown, Minus } from 'lucide-react';
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
      className="max-w-6xl mx-auto space-y-12"
    >
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-display font-bold text-slate-900 dark:text-white tracking-tight">Market Intelligence</h2>
        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto font-medium">Real-time AI-powered insights on the Nigerian economy and financial markets.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loadingNews ? (
          [1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-[400px] rounded-[2.5rem] bg-slate-50 dark:bg-slate-800 animate-pulse border border-slate-100 dark:border-slate-700" />
          ))
        ) : marketNews.map((news, idx) => (
          <motion.article 
            key={idx}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.1 }}
            className="group flex flex-col premium-card bg-white dark:bg-slate-900 overflow-hidden"
          >
            <div className="p-8 flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <span className={`flex items-center gap-1.5 text-[10px] px-3 py-1.5 rounded-full font-display font-bold uppercase tracking-widest border ${
                  news.sentiment === 'Positive' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                  news.sentiment === 'Negative' ? 'bg-rose-500/10 text-rose-600 border-rose-500/20' :
                  'bg-slate-500/10 text-slate-600 border-slate-500/20'
                }`}>
                  {news.sentiment === 'Positive' && <TrendingUp size={12} />}
                  {news.sentiment === 'Negative' && <TrendingDown size={12} />}
                  {news.sentiment === 'Neutral' && <Minus size={12} />}
                  {news.sentiment}
                </span>
                <button className="p-2 text-slate-300 hover:text-brand-green transition-colors"><Share2 size={16} /></button>
              </div>

              <h3 className="text-xl font-display font-bold text-slate-900 dark:text-white leading-tight mb-4 group-hover:text-brand-green transition-colors">
                {news.headline}
              </h3>
              
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6 line-clamp-4 font-medium">
                {news.summary}
              </p>

              <div className="mt-auto pt-6 border-t border-slate-100 dark:border-slate-800">
                <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border-l-4 border-brand-green">
                  <p className="text-[10px] font-display font-bold text-brand-green uppercase tracking-widest mb-1">Impact Analysis</p>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300 leading-relaxed italic line-clamp-2">
                    {news.impact}
                  </p>
                </div>
                
                <a 
                  href={news.source_url || "#"} 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between group/link"
                >
                  <span className="text-sm font-display font-bold text-slate-900 dark:text-white group-hover/link:text-brand-green transition-colors">Read Full Insight</span>
                  <div className="w-8 h-8 rounded-full bg-slate-900 dark:bg-brand-green text-white flex items-center justify-center group-hover/link:bg-brand-green-light transition-all group-hover/link:translate-x-1">
                    <ArrowRight size={16} />
                  </div>
                </a>
              </div>
            </div>
          </motion.article>
        ))}
      </div>
    </motion.div>
  );
};
