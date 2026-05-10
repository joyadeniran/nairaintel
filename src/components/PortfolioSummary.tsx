import React from 'react';
import { ChevronRight } from 'lucide-react';

interface PortfolioSummaryProps {
  totalValue: number;
  mockGain: number;
  mockTotalReturn: number;
}

export const PortfolioSummary: React.FC<PortfolioSummaryProps> = ({
  totalValue,
  mockGain,
  mockTotalReturn
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
      <div className="md:col-span-6 premium-card bg-gradient-to-br from-brand-slate via-[#1e293b] to-brand-green p-8 text-white relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-green/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-125 transition-transform duration-700" />
        
        <div className="relative z-10">
          <p className="text-xs font-display font-bold text-brand-green-light uppercase tracking-[0.2em] mb-4">Total Portfolio Balance</p>
          <div className="flex items-center gap-4">
            <h2 className="text-5xl font-display font-extrabold tracking-tight">
              ₦{totalValue.toLocaleString()}
            </h2>
            <div className="p-2 bg-white/10 backdrop-blur-md rounded-xl border border-white/10">
              <ChevronRight size={24} className="text-brand-green-light" />
            </div>
          </div>
          
          <div className="mt-8 flex gap-6">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 flex-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Annual Yield</p>
              <p className="text-xl font-display font-bold text-brand-gold">14.2%</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 flex-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Risk Profile</p>
              <p className="text-xl font-display font-bold text-white">Moderate</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="md:col-span-3 premium-card p-8 flex flex-col justify-between">
        <div>
          <p className="text-xs font-display font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Day's Profit</p>
          <h3 className="text-3xl font-display font-bold text-brand-green">+₦{mockGain.toLocaleString()}</h3>
        </div>
        <div className="mt-4">
          <span className="inline-flex items-center px-3 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-full border border-emerald-100 dark:border-emerald-500/20">
            +0.88% Today
          </span>
        </div>
      </div>

      <div className="md:col-span-3 premium-card p-8 flex flex-col justify-between">
        <div>
          <p className="text-xs font-display font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Total Returns</p>
          <h3 className="text-3xl font-display font-bold text-brand-green">+₦{(totalValue * 0.134).toLocaleString(undefined, {maximumFractionDigits: 0})}</h3>
        </div>
        <div className="mt-4">
          <span className="inline-flex items-center px-3 py-1 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold rounded-full border border-emerald-100 dark:border-emerald-500/20">
            +{mockTotalReturn}% All-time
          </span>
        </div>
      </div>
    </div>
  );
};
