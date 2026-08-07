import React from 'react';
import { TrendingUp, TrendingDown, PieChart, Wallet, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';

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
    <div className="space-y-6">
      {/* Hero balance card */}
      <div className="premium-card overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-slate via-[#1e293b] to-[#0d3320]" />
        <div className="absolute inset-0 gradient-mesh opacity-60" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-green/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-gold/10 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/3" />

        <div className="relative z-10 p-8 md:p-12">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-brand-green/20 rounded-lg flex items-center justify-center">
                  <Wallet size={16} className="text-brand-green-light" />
                </div>
                <p className="text-xs font-display font-bold text-brand-green-light uppercase tracking-[0.2em]">
                  Portfolio Value
                </p>
              </div>

              <h2 className="text-5xl md:text-6xl font-display font-extrabold text-white tracking-tight stat-animate">
                ₦{totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </h2>

              <div className="flex items-center gap-3 flex-wrap">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-display font-bold backdrop-blur-sm border ${
                  isPositive
                    ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20'
                    : 'bg-rose-500/15 text-rose-400 border-rose-500/20'
                }`}>
                  {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  {isPositive ? '+' : ''}{returnPct.toFixed(2)}%
                </span>
                <span className="text-sm text-slate-400">
                  {isPositive ? '+' : ''}₦{mockGain.toLocaleString(undefined, { maximumFractionDigits: 0 })} unrealized
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="bg-white/[0.06] backdrop-blur-sm border border-white/10 rounded-2xl p-5 min-w-[140px] stat-animate">
                <div className="flex items-center gap-1.5 mb-2">
                  <Activity size={12} className="text-slate-500" />
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Cost Basis</p>
                </div>
                <p className="text-lg font-display font-bold text-white">
                  ₦{totalCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
              </div>
              <div className="bg-white/[0.06] backdrop-blur-sm border border-white/10 rounded-2xl p-5 min-w-[140px] stat-animate">
                <div className="flex items-center gap-1.5 mb-2">
                  {isPositive ? <TrendingUp size={12} className="text-emerald-500" /> : <TrendingDown size={12} className="text-rose-500" />}
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">P&L</p>
                </div>
                <p className={`text-lg font-display font-bold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {isPositive ? '+' : ''}₦{Math.abs(mockGain).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Allocation strip */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="premium-card p-6 flex items-center gap-5">
          <div className="w-12 h-12 bg-brand-green/10 dark:bg-brand-green/15 rounded-2xl flex items-center justify-center shrink-0">
            <PieChart size={22} className="text-brand-green" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Equities</span>
              <span className="text-sm font-display font-bold text-slate-900 dark:text-white">{stockPct.toFixed(0)}%</span>
            </div>
            <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-brand-green to-brand-green-light rounded-full transition-all duration-700 ease-out"
                style={{ width: `${stockPct}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
              ₦{stockValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>

        <div className="premium-card p-6 flex items-center gap-5">
          <div className="w-12 h-12 bg-brand-gold/10 dark:bg-brand-gold/15 rounded-2xl flex items-center justify-center shrink-0">
            <TrendingUp size={22} className="text-brand-gold" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Fixed Income</span>
              <span className="text-sm font-display font-bold text-slate-900 dark:text-white">{fixedPct.toFixed(0)}%</span>
            </div>
            <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-brand-gold to-amber-400 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${fixedPct}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
              ₦{fixedIncomeValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
