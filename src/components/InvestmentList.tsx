import React from 'react';
import { Search, Plus, Edit2, Trash2, TrendingUp } from 'lucide-react';
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

export const InvestmentList: React.FC<InvestmentListProps> = ({
  investments,
  livePrices,
  searchQuery,
  setSearchQuery,
  setShowAddModal,
  setEditingInvestment,
  handleDeleteInvestment
}) => {
  const stocks = investments.filter(i => i.type === 'stock').filter(i => 
    i.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || 
    i.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const tbills = investments.filter(i => i.type === 'tbill').filter(i => 
    i.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || 
    i.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const hasAny = stocks.length > 0 || tbills.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h3 className="text-xl font-display font-bold text-slate-900 dark:text-white">Holdings</h3>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text"
              placeholder="Search holdings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-4 focus:ring-brand-green/10 text-sm w-48 transition-all text-slate-800 dark:text-white"
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
        <div className="py-16 text-center premium-card bg-white dark:bg-slate-900">
          <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-5 text-slate-300 dark:text-slate-600">
            <Search size={28} />
          </div>
          <p className="text-lg font-display font-bold text-slate-500 dark:text-slate-400 mb-2">
            {searchQuery ? 'No matching holdings' : 'No assets yet'}
          </p>
          <p className="text-sm text-slate-400 dark:text-slate-500 mb-6">
            {searchQuery ? 'Try a different search term.' : 'Add your first stock or T-Bill to start tracking.'}
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
            <div className="premium-card bg-white dark:bg-slate-900 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800">
                      <th className="px-6 py-4 text-left text-[10px] font-display font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Asset</th>
                      <th className="px-6 py-4 text-left text-[10px] font-display font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Entry / Market</th>
                      <th className="px-6 py-4 text-right text-[10px] font-display font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Qty</th>
                      <th className="px-6 py-4 text-right text-[10px] font-display font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Value & P&L</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                    {stocks.map((inv) => {
                      const marketPrice = livePrices[inv.symbol] || inv.entry_price;
                      const marketValue = marketPrice * inv.quantity;
                      const cost = inv.entry_price * inv.quantity;
                      const pnl = marketValue - cost;
                      const pnlPct = cost > 0 ? (pnl / cost) * 100 : 0;
                      const isUp = pnl >= 0;

                      return (
                        <tr key={inv.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-brand-green/10 flex items-center justify-center text-xs font-display font-bold text-brand-green">
                                {inv.symbol.substring(0, 2)}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-800 dark:text-white">{inv.name}</p>
                                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{inv.symbol}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm font-bold text-slate-800 dark:text-white">₦{inv.entry_price.toLocaleString()}</p>
                            <p className={`text-[11px] font-bold ${isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                              Mkt: ₦{marketPrice.toLocaleString()}
                            </p>
                          </td>
                          <td className="px-6 py-4 text-right text-sm font-bold text-slate-600 dark:text-slate-400">
                            {inv.quantity.toLocaleString()}
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
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                  onClick={() => {
                                    setEditingInvestment(inv);
                                    setShowAddModal(true);
                                  }}
                                  className="p-2 text-slate-400 dark:text-slate-500 hover:text-brand-green dark:hover:text-white hover:bg-white dark:hover:bg-slate-700 rounded-lg shadow-sm transition-all"
                                >
                                  <Edit2 size={14} />
                                </button>
                                <button 
                                  onClick={() => handleDeleteInvestment(inv.id)}
                                  className="p-2 text-slate-400 dark:text-slate-500 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-white dark:hover:bg-slate-700 rounded-lg shadow-sm transition-all"
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
              <h4 className="text-xs font-display font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest pl-2">
                Fixed Income
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tbills.map(inv => (
                  <div key={inv.id} className="group p-5 premium-card bg-white dark:bg-slate-900 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center">
                        <TrendingUp size={22} />
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
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => { setEditingInvestment(inv); setShowAddModal(true); }} 
                          className="p-2 text-slate-400 dark:text-slate-500 hover:text-brand-green dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-all"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          onClick={() => handleDeleteInvestment(inv.id)} 
                          className="p-2 text-slate-400 dark:text-slate-500 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-all"
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
