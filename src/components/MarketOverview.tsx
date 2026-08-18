import React from 'react';
import { TrendingUp, TrendingDown, BarChart2 } from 'lucide-react';
import { CompanyQuote } from '../types';

interface MarketOverviewProps {
  tickers: CompanyQuote[];
  loading: boolean;
}

function MoverRow({ q, rank }: { q: CompanyQuote; rank: number }) {
  const isGainer = (q.change_percent ?? 0) >= 0;
  const tone = isGainer ? 'text-emerald-500' : 'text-rose-500';
  const pct = q.change_percent;

  return (
    <div className="flex items-center gap-2 py-1.5">
      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-600 w-4 shrink-0 tabular-nums">{rank}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[12px] font-display font-bold text-slate-800 dark:text-slate-200 truncate">{q.symbol}</span>
          <span className={`text-[11px] font-bold tabular-nums shrink-0 flex items-center gap-0.5 ${tone}`}>
            {isGainer
              ? <TrendingUp size={10} strokeWidth={2.5} />
              : <TrendingDown size={10} strokeWidth={2.5} />}
            {pct != null ? `${pct > 0 ? '+' : ''}${pct.toFixed(2)}%` : '—'}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{q.name}</span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400 tabular-nums shrink-0">
            ₦{q.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>
    </div>
  );
}

function SkeletonRows() {
  return (
    <div className="space-y-2">
      {[0, 1, 2, 3, 4].map(i => (
        <div key={i} className="flex items-center gap-2 py-1">
          <div className="w-4 h-3 bg-slate-100 dark:bg-slate-800 rounded shimmer shrink-0" />
          <div className="flex-1 space-y-1">
            <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded shimmer" />
            <div className="h-2.5 w-3/4 bg-slate-50 dark:bg-slate-800/60 rounded shimmer" />
          </div>
        </div>
      ))}
    </div>
  );
}

export const MarketOverview: React.FC<MarketOverviewProps> = ({ tickers, loading }) => {
  const withPct = tickers.filter(q => q.change_percent != null);

  const gainers = [...withPct]
    .filter(q => (q.change_percent ?? 0) > 0)
    .sort((a, b) => (b.change_percent ?? 0) - (a.change_percent ?? 0))
    .slice(0, 5);

  const losers = [...withPct]
    .filter(q => (q.change_percent ?? 0) < 0)
    .sort((a, b) => (a.change_percent ?? 0) - (b.change_percent ?? 0))
    .slice(0, 5);

  const [tab, setTab] = React.useState<'gainers' | 'losers'>('gainers');

  const rows = tab === 'gainers' ? gainers : losers;

  return (
    <section className="rounded-3xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/80 p-5 overflow-hidden">
      <div className="flex items-center gap-2 mb-4">
        <BarChart2 size={14} className="text-brand-green shrink-0" strokeWidth={2.5} />
        <h3 className="text-sm font-display font-bold text-slate-900 dark:text-white">Market Movers</h3>
        {!loading && withPct.length > 0 && (
          <span className="ml-auto text-[10px] text-slate-400 dark:text-slate-500">NGX today</span>
        )}
      </div>

      {/* Tab switcher */}
      <div className="flex rounded-xl overflow-hidden border border-slate-100 dark:border-slate-800 mb-4 text-[11px] font-display font-bold">
        <button
          type="button"
          onClick={() => setTab('gainers')}
          className={`flex-1 py-1.5 flex items-center justify-center gap-1 transition-colors ${
            tab === 'gainers'
              ? 'bg-emerald-500 text-white'
              : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <TrendingUp size={10} strokeWidth={2.5} />
          Gainers{!loading && gainers.length > 0 ? ` (${gainers.length})` : ''}
        </button>
        <button
          type="button"
          onClick={() => setTab('losers')}
          className={`flex-1 py-1.5 flex items-center justify-center gap-1 transition-colors ${
            tab === 'losers'
              ? 'bg-rose-500 text-white'
              : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <TrendingDown size={10} strokeWidth={2.5} />
          Losers{!loading && losers.length > 0 ? ` (${losers.length})` : ''}
        </button>
      </div>

      {loading ? (
        <SkeletonRows />
      ) : rows.length === 0 ? (
        <p className="text-center text-[11px] text-slate-400 dark:text-slate-500 py-4">
          {withPct.length === 0
            ? 'Change data not yet available'
            : tab === 'gainers'
              ? 'No gainers right now'
              : 'No losers right now'}
        </p>
      ) : (
        <div className="divide-y divide-slate-50 dark:divide-slate-800">
          {rows.map((q, i) => (
            <MoverRow key={q.symbol} q={q} rank={i + 1} />
          ))}
        </div>
      )}
    </section>
  );
};
