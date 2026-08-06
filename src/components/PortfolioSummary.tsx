import React from 'react';
import { TrendingUp, TrendingDown, PieChart, Wallet } from 'lucide-react';

interface PortfolioSummaryProps {
  totalValue: number;
  totalCost: number;
  mockGain: number;
  stockValue: number;
  fixedIncomeValue: number;
}

export const PortfolioSummary: React.FC<PortfolioSummaryProps> = ({
  totalValue,
  totalCost,
  mockGain,
  stockValue,
  fixedIncomeValue
}) => {
  const isPositive = mockGain >= 0;
  const returnPct = totalCost > 0 ? (mockGain / totalCost) * 100 : 0;
  
  const stockPct = totalValue > 0 ? (stockValue / totalValue) * 100 : 0;
  const fixedPct = totalValue > 0 ? (fixedIncomeValue / totalValue) * 100 : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
      {/* Main Balance Card */}
      <div className="md:col-span-6 premium-card bg-gradient-to-br from-brand-slate via-[#1e293b] to-brand-green p-8 text-white relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-green/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:scale-125 transition-transform duration-700" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <Wallet size={16} className="text-brand-green-light" />
            <p className="text-xs font-display font-bold text-brand-green-light uppercase tracking-[0.2em]">
              Total Portfolio Value
            </p>
          </div>
          
          <h2 className="text-5xl font-display font-extrabold tracking-tight mb-2">
            ₦{totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </h2>
          
          <p className="text-sm text-slate-300 mb-8">
            Cost basis: ₦{totalCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
          
          <div className="flex gap-4">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 flex-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Unrealized P&L</p>
              <p className={`text-xl font-display font-bold ${isPositive ? 'text-brand-gold' : 'text-rose-400'}`}>
                {isPositive ? '+' : ''}₦{mockGain.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 flex-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Total Return</p>
              <p className={`text-xl font-display font-bold ${isPositive ? 'text-brand-gold' : 'text-rose-400'}`}>
                {isPositive ? '+' : ''}{returnPct.toFixed(2)}%
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* P&L Card */}
      <div className="md:col-span-3 premium-card p-8 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-3">
            {isPositive ? (
              <TrendingUp size={16} className="text-brand-green" />
            ) : (
              <TrendingDown size={16} className="text-rose-500" />
            )}
            <p className="text-xs font-display font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              Unrealized Gain/Loss
            </p>
          </div>
          <h3 className={`text-3xl font-display font-bold ${isPositive ? 'text-brand-green' : 'text-rose-500'}`}>
            {isPositive ? '+' : ''}₦{Math.abs(mockGain).toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </h3>
        </div>
        <div className="mt-4">
          <span className={`inline-flex items-center px-3 py-1.5 text-xs font-bold rounded-full border ${
            isPositive 
              ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20' 
              : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-500/20'
          }`}>
            {isPositive ? '+' : ''}{returnPct.toFixed(2)}% vs cost
          </span>
        </div>
      </div>

      {/* Asset Allocation Card */}
      <div className="md:col-span-3 premium-card p-8 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <PieChart size={16} className="text-brand-green" />
            <p className="text-xs font-display font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              Asset Allocation
            </p>
          </div>
          
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-slate-700 dark:text-slate-300">Equities</span>
                <span className="font-bold text-slate-900 dark:text-white">{stockPct.toFixed(0)}%</span>
              </div>
              <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-brand-green rounded-full transition-all duration-500" 
                  style={{ width: `${stockPct}%` }}
                />
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-slate-700 dark:text-slate-300">Fixed Income</span>
                <span className="font-bold text-slate-900 dark:text-white">{fixedPct.toFixed(0)}%</span>
              </div>
              <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-brand-gold rounded-full transition-all duration-500" 
                  style={{ width: `${fixedPct}%` }}
                />
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            ₦{stockValue.toLocaleString(undefined, { maximumFractionDigits: 0 })} stocks · ₦{fixedIncomeValue.toLocaleString(undefined, { maximumFractionDigits: 0 })} fixed
          </p>
        </div>
      </div>
    </div>
  );
};
