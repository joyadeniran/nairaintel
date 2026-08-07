import React, { useLayoutEffect, useRef, useState } from 'react';
import { TrendingUp, TrendingDown, Minus, Activity } from 'lucide-react';
import { CompanyQuote } from '../types';

interface TickerTapeProps {
  quotes: CompanyQuote[];
  loading: boolean;
}

/**
 * Scroll speed in pixels per second. A fixed animation duration would mean the
 * tape runs faster the more companies are listed; deriving the duration from the
 * measured track width keeps the reading speed constant instead.
 */
const PX_PER_SECOND = 40;
const MIN_DURATION_S = 30;

function TickerItem({ q }: { q: CompanyQuote }) {
  const pct = q.change_percent;
  const dir = pct == null ? 'flat' : pct > 0 ? 'up' : pct < 0 ? 'down' : 'flat';

  const tone =
    dir === 'up'
      ? 'text-emerald-500'
      : dir === 'down'
        ? 'text-rose-500'
        : 'text-slate-400 dark:text-slate-500';

  const Icon = dir === 'up' ? TrendingUp : dir === 'down' ? TrendingDown : Minus;

  return (
    <div className="flex items-center gap-2.5 px-5 shrink-0" title={q.name}>
      <span className="text-[11px] font-display font-bold text-slate-700 dark:text-slate-200 tracking-wide">
        {q.symbol}
      </span>
      <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 tabular-nums">
        ₦{q.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
      </span>
      {pct != null && (
        <span className={`text-[11px] font-bold tabular-nums flex items-center gap-0.5 ${tone}`}>
          <Icon size={11} strokeWidth={2.5} />
          {pct > 0 ? '+' : ''}
          {pct.toFixed(2)}%
        </span>
      )}
    </div>
  );
}

/**
 * Continuously scrolling NGX quote strip. The list is rendered twice back to
 * back and the track is translated by exactly -50%, so the second copy lands
 * where the first began and the loop has no visible seam.
 */
export const TickerTape: React.FC<TickerTapeProps> = ({ quotes, loading }) => {
  const copyRef = useRef<HTMLDivElement>(null);
  const [duration, setDuration] = useState<number | null>(null);

  // Measure one copy of the list and derive the loop duration from its width, so
  // the tape reads at PX_PER_SECOND no matter how many companies are listed.
  useLayoutEffect(() => {
    if (quotes.length === 0) return;
    const measure = () => {
      const width = copyRef.current?.scrollWidth ?? 0;
      if (width > 0) {
        setDuration(Math.max(MIN_DURATION_S, width / PX_PER_SECOND));
      }
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [quotes]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 overflow-hidden">
        <div className="flex items-center gap-4 px-4 py-2.5">
          <div className="h-4 w-20 bg-slate-100 dark:bg-slate-800 rounded shimmer shrink-0" />
          <div className="h-4 flex-1 bg-slate-50 dark:bg-slate-800/50 rounded shimmer" />
        </div>
      </div>
    );
  }

  if (quotes.length === 0) return null;

  return (
    <div className="group relative rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 overflow-hidden">
      <div className="flex items-stretch">
        {/* Fixed label */}
        <div className="flex items-center gap-1.5 px-3.5 py-2.5 bg-brand-green text-white shrink-0 z-20">
          <Activity size={12} strokeWidth={2.5} className="animate-pulse" />
          <span className="text-[10px] font-display font-bold uppercase tracking-widest">NGX</span>
        </div>

        {/* Scrolling track */}
        <div className="relative flex-1 overflow-hidden py-2.5">
          <div
            className="ticker-track flex w-max group-hover:[animation-play-state:paused]"
            style={duration ? { animationDuration: `${duration}s` } : undefined}
          >
            {[0, 1].map(copy => (
              <div
                key={copy}
                ref={copy === 0 ? copyRef : undefined}
                className="flex items-center"
                aria-hidden={copy === 1}
              >
                {quotes.map(q => (
                  <TickerItem key={`${copy}-${q.symbol}`} q={q} />
                ))}
              </div>
            ))}
          </div>

          {/* Edge fades */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-white dark:from-slate-900 to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-white dark:from-slate-900 to-transparent" />
        </div>
      </div>
    </div>
  );
};
