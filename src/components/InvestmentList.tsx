import React from 'react';
import { Search, Plus, Edit2, Trash2, TrendingUp, BarChart3, Landmark } from 'lucide-react';
import { Investment } from '../types';

interface InvestmentListProps {
  investments: Investment[];
  livePrices: Record<string, number>;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  setShowAddModal: (show: boolean) => void;
  setEditingInvestment: (inv: Investment | null) => void;
  handleDeleteInvestment: (id: string | number) => void;
}

function resolveMarketPrice(inv: Investment, livePrices: Record<string, number>) {
  const sym = String(inv.symbol || '').toUpperCase();
  const live = livePrices[sym] ?? livePrices[inv.symbol];
  const hasLive = typeof live === 'number' && live > 0;
  return {
    marketPrice: hasLive ? live : Number(inv.entry_price) || 0,
    hasLive,
  };
}

export const InvestmentList: React.FC<InvestmentListProps> = ({
  investments,
  livePrices,
  searchQuery,
  setSearchQuery,
  setShowAddModal,
  setEditingInvestment,
  handleDeleteInvestment
}) => {
  // Firestore docs written before field validation may be missing symbol/name,
  // so coerce rather than dereference — an unhandled throw here blanks the page.
  const q = searchQuery.toLowerCase();
  const matches = (i: Investment) =>
    String(i.symbol || '').toLowerCase().includes(q) ||
    String(i.name || '').toLowerCase().includes(q);

  const stocks = investments.filter(i => i.type === 'stock').filter(matches);
  const tbills = investments.filter(i => i.type === 'tbill').filter(matches);

  const hasAny = stocks.length > 0 || tbills.length > 0;
  const liveCount = stocks.filter(s => resolveMarketPrice(s, livePrices).hasLive).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-display font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 size={20} className="text-brand-green" />
            Holdings
          </h3>
          {stocks.length > 0 && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 ml-7">
              {liveCount > 0 ? (
                <>
                  <span className="inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Live prices on {liveCount}/{stocks.length} stocks
                  </span>
                </>
              ) : (
                'Using entry prices — live NGX feed connecting...'
              )}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search holdings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-green/20 focus:border-brand-green/30 text-sm w-48 transition-all text-slate-800 dark:text-white"
            />
          </div>
          <button
            onClick={() => { setEditingInvestment(null); setShowAddModal(true); }}
            className="glow-button flex items-center gap-2 px-5 py-2.5 text-sm"
          >
            <Plus size={16} /> Add Asset
          </button>
        </div>
      </div>

      {!hasAny ? (
        <div className="py-20 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-brand-green/10 to-brand-gold/10 dark:from-brand-green/15 dark:to-brand-gold/15 rounded-3xl flex items-center justify-center mx-auto mb-6 rotate-6">
            <BarChart3 size={36} className="text-brand-green -rotate-6" />
          </div>
          <h4 className="text-xl font-display font-bold text-slate-700 dark:text-slate-300 mb-2">
            {searchQuery ? 'No matching holdings' : 'Build your portfolio'}
          </h4>
          <p className="text-sm text-slate-400 dark:text-slate-500 mb-8 max-w-sm mx-auto leading-relaxed">
            {searchQuery
              ? 'Try a different search term.'
              : 'Add NGX stocks like DANGCEM, MTNN, or GTCO to track live market prices and P&L.'}
          </p>
          {!searchQuery && (
            <button
              onClick={() => { setEditingInvestment(null); setShowAddModal(true); }}
              className="glow-button inline-flex items-center gap-2"
            >
              <Plus size={16} /> Add First Asset
            </button>
          )}
        </div>
      ) : (
        <>
          {stocks.length > 0 && (
            <div className="rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900/50">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800">
                      <th className="px-6 py-3.5 text-left text-[10px] font-display font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Asset</th>
                      <th className="px-6 py-3.5 text-left text-[10px] font-display font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest hidden sm:table-cell">Entry / Market</th>
                      <th className="px-6 py-3.5 text-right text-[10px] font-display font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest hidden md:table-cell">Qty</th>
                      <th className="px-6 py-3.5 text-right text-[10px] font-display font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Value & P&L</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                    {stocks.map((inv) => {
                      const { marketPrice, hasLive } = resolveMarketPrice(inv, livePrices);
                      const marketValue = marketPrice * inv.quantity;
                      const cost = inv.entry_price * inv.quantity;
                      const pnl = marketValue - cost;
                      const pnlPct = cost > 0 ? (pnl / cost) * 100 : 0;
                      const isUp = pnl >= 0;

                      return (
                        <tr key={inv.id} className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-display font-bold ${
                                hasLive
                                  ? 'bg-brand-green/10 dark:bg-brand-green/15 text-brand-green'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                              }`}>
                                {String(inv.symbol || '—').substring(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-800 dark:text-white">{inv.name}</p>
                                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                  {inv.symbol}
                                  {hasLive && (
                                    <span className="inline-flex items-center gap-1 text-emerald-500 normal-case tracking-normal">
                                      <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                                      Live
                                    </span>
                                  )}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 hidden sm:table-cell">
                            <p className="text-sm font-bold text-slate-800 dark:text-white">₦{Number(inv.entry_price).toLocaleString()}</p>
                            <p className={`text-[11px] font-bold ${hasLive ? (isUp ? 'text-emerald-500' : 'text-rose-500') : 'text-slate-400 dark:text-slate-500'}`}>
                              Mkt: ₦{marketPrice.toLocaleString()}{!hasLive ? ' (entry)' : ''}
                            </p>
                          </td>
                          <td className="px-6 py-4 text-right text-sm font-bold text-slate-600 dark:text-slate-400 hidden md:table-cell">
                            {Number(inv.quantity).toLocaleString()}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-3">
                              <div className="text-right">
                                <p className="text-sm font-display font-bold text-slate-900 dark:text-white">
                                  ₦{marketValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                </p>
                                <p className={`text-[11px] font-bold ${isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                                  {isUp ? '+' : ''}{pnlPct.toFixed(1)}% · {isUp ? '+' : ''}₦{Math.abs(pnl).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                </p>
                              </div>
                              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => { setEditingInvestment(inv); setShowAddModal(true); }}
                                  className="p-2 text-slate-400 dark:text-slate-500 hover:text-brand-green dark:hover:text-brand-green-light rounded-lg transition-colors"
                                >
                                  <Edit2 size={14} />
                                </button>
                                <button
                                  onClick={() => handleDeleteInvestment(inv.id)}
                                  className="p-2 text-slate-400 dark:text-slate-500 hover:text-rose-500 rounded-lg transition-colors"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tbills.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-xs font-display font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-1 flex items-center gap-2">
                <Landmark size={14} />
                Fixed Income
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {tbills.map(inv => (
                  <div key={inv.id} className="group p-5 rounded-2xl bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 hover:border-brand-green/20 dark:hover:border-brand-green/20 flex items-center justify-between transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center">
                        <TrendingUp size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-display font-bold text-slate-900 dark:text-white">{inv.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                          {inv.symbol}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-base font-display font-bold text-slate-900 dark:text-white">
                          ₦{(inv.entry_price * inv.quantity).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </p>
                        <p className="text-[10px] font-bold text-emerald-500 dark:text-emerald-400 uppercase tracking-widest">
                          Face Value
                        </p>
                      </div>
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => { setEditingInvestment(inv); setShowAddModal(true); }}
                          className="p-2 text-slate-400 dark:text-slate-500 hover:text-brand-green rounded-lg transition-colors"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDeleteInvestment(inv.id)}
                          className="p-2 text-slate-400 dark:text-slate-500 hover:text-rose-500 rounded-lg transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
