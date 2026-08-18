import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Search, Loader2, Check, Landmark } from 'lucide-react';
import { Investment, CompanyQuote } from '../types';
import { searchCompanies } from '../services/geminiService';

interface AddInvestmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingInvestment: Investment | null;
  onConfirm: (data: any) => void;
}

const inputClass =
  'w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 focus:outline-none focus:ring-4 focus:ring-brand-green/10 font-bold text-slate-800 dark:text-white placeholder:text-slate-400 transition-all';

const labelClass =
  'text-xs font-display font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest ml-1';

export const AddInvestmentModal: React.FC<AddInvestmentModalProps> = ({
  isOpen,
  onClose,
  editingInvestment,
  onConfirm
}) => {
  const [type, setType] = useState<'stock' | 'tbill'>('stock');
  const [symbol, setSymbol] = useState('');
  const [name, setName] = useState('');
  const [entryPrice, setEntryPrice] = useState('');
  const [quantity, setQuantity] = useState('');

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CompanyQuote[]>([]);
  const [searching, setSearching] = useState(false);
  const [picked, setPicked] = useState<CompanyQuote | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ref is the source of truth for the selected equity — avoids stale state on submit
  const pickedRef = useRef<CompanyQuote | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const inv = editingInvestment;
    setType((inv?.type as 'stock' | 'tbill') || 'stock');
    setSymbol(inv?.symbol || '');
    setName(inv?.name || '');
    setEntryPrice(inv?.entry_price != null ? String(inv.entry_price) : '');
    setQuantity(inv?.quantity != null ? String(inv.quantity) : '');
    setQuery(inv ? `${inv.symbol} — ${inv.name}` : '');
    // Editing an existing stock counts as already "picked"
    if (inv?.type === 'stock' && inv.symbol) {
      const existing: CompanyQuote = {
        symbol: inv.symbol,
        name: inv.name,
        price: Number(inv.entry_price) || 0,
        change: null,
        change_percent: null,
      };
      setPicked(existing);
      pickedRef.current = existing;
    } else {
      setPicked(null);
      pickedRef.current = null;
    }
    setResults([]);
    setShowResults(false);
    setError(null);
  }, [isOpen, editingInvestment]);

  useEffect(() => {
    if (type !== 'stock') return;
    const q = query.trim();
    // Don't search while a firm selection is locked in
    if (!q || pickedRef.current) {
      setResults([]);
      return;
    }
    let cancelled = false;
    setSearching(true);
    const t = setTimeout(async () => {
      const found = await searchCompanies(q);
      if (cancelled) return;
      setResults(found);
      setShowResults(true);
      setSearching(false);
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(t);
      setSearching(false);
    };
  }, [query, type]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  if (!isOpen) return null;

  const choose = (company: CompanyQuote) => {
    // Lock selection immediately (ref + state)
    pickedRef.current = company;
    setPicked(company);
    setSymbol(company.symbol);
    setName(company.name);
    setQuery(`${company.symbol} — ${company.name}`);
    setEntryPrice((prev) => (prev ? prev : String(company.price)));
    setShowResults(false);
    setResults([]);
    setError(null);
  };

  const onQueryChange = (value: string) => {
    setQuery(value);
    // Any edit after a pick invalidates the selection — user must pick again
    if (pickedRef.current) {
      pickedRef.current = null;
      setPicked(null);
      setSymbol('');
      setName('');
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const price = Number(entryPrice);
    const qty = Number(quantity);

    if (type === 'stock') {
      const selection = pickedRef.current;
      if (!selection?.symbol) {
        setError('Select a company from the search results — typing alone is not enough.');
        setShowResults(results.length > 0);
        return;
      }

      if (!Number.isFinite(price) || price <= 0) {
        setError('Entry price must be greater than zero.');
        return;
      }
      if (!Number.isInteger(qty) || qty <= 0) {
        setError('Quantity must be a whole number greater than zero.');
        return;
      }

      onConfirm({
        type: 'stock',
        symbol: selection.symbol.trim().toUpperCase(),
        name: (selection.name || selection.symbol).trim(),
        entry_price: price,
        quantity: qty,
      });
      return;
    }

    // T-Bill path
    if (!symbol.trim() || !name.trim()) {
      setError('Enter a name and reference for the instrument.');
      return;
    }
    if (!Number.isFinite(price) || price <= 0) {
      setError('Entry price must be greater than zero.');
      return;
    }
    if (!Number.isInteger(qty) || qty <= 0) {
      setError('Quantity must be a whole number greater than zero.');
      return;
    }

    onConfirm({
      type: 'tbill',
      symbol: symbol.trim().toUpperCase(),
      name: name.trim(),
      entry_price: price,
      quantity: qty,
    });
  };

  const total = Number(entryPrice) * Number(quantity);
  const showTotal = Number.isFinite(total) && total > 0;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/50 dark:bg-black/70 backdrop-blur-xl"
        />
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative premium-card p-8 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto"
        >
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-display font-bold text-slate-900 dark:text-white leading-tight">
              {editingInvestment ? 'Edit Asset' : 'New Asset'}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
            >
              <Plus size={24} className="rotate-45" />
            </button>
          </div>

          <form className="space-y-6" onSubmit={submit}>
            <div className="grid grid-cols-2 gap-3">
              {([
                { v: 'stock', label: 'Equity', hint: 'NGX listed' },
                { v: 'tbill', label: 'T-Bill', hint: 'Fixed income' }
              ] as const).map(opt => (
                <button
                  key={opt.v}
                  type="button"
                  onClick={() => {
                    setType(opt.v);
                    pickedRef.current = null;
                    setPicked(null);
                    setSymbol('');
                    setName('');
                    setQuery('');
                    setResults([]);
                    setShowResults(false);
                  }}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    type === opt.v
                      ? 'border-brand-green bg-brand-green/5 dark:bg-brand-green/10'
                      : 'border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:border-slate-200 dark:hover:border-slate-600'
                  }`}
                >
                  <span
                    className={`block text-sm font-display font-bold ${
                      type === opt.v ? 'text-brand-green' : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {opt.label}
                  </span>
                  <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mt-0.5">
                    {opt.hint}
                  </span>
                </button>
              ))}
            </div>

            {type === 'stock' ? (
              <div className="space-y-2" ref={boxRef}>
                <label className={labelClass}>Find ticker</label>
                <div className="relative">
                  {searching ? (
                    <Loader2 className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-green animate-spin" size={18} />
                  ) : picked ? (
                    <Check className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-green" size={18} />
                  ) : (
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  )}
                  <input
                    value={query}
                    onChange={e => onQueryChange(e.target.value)}
                    onFocus={() => {
                      if (!pickedRef.current && results.length > 0) setShowResults(true);
                    }}
                    placeholder="Search DANGCEM, MTN, GTCO…"
                    autoComplete="off"
                    className={`${inputClass} pl-12`}
                  />

                  {showResults && results.length > 0 && !picked && (
                    <div className="absolute z-30 left-0 right-0 mt-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden max-h-64 overflow-y-auto">
                      {results.map(r => (
                        <button
                          key={r.symbol}
                          type="button"
                          // mousedown + preventDefault: commit selection before input blur/outside-click races
                          onMouseDown={(e) => {
                            e.preventDefault();
                            choose(r);
                          }}
                          className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left border-b border-slate-50 dark:border-slate-800 last:border-0"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-display font-bold text-slate-800 dark:text-white">
                              {r.symbol}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{r.name}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-bold text-slate-800 dark:text-white tabular-nums">
                              ₦{r.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                            </p>
                            {r.change_percent != null && (
                              <p
                                className={`text-[11px] font-bold tabular-nums ${
                                  r.change_percent >= 0 ? 'text-emerald-500' : 'text-rose-500'
                                }`}
                              >
                                {r.change_percent > 0 ? '+' : ''}
                                {r.change_percent.toFixed(2)}%
                              </p>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {picked ? (
                  <p className="text-[11px] font-bold text-brand-green ml-1 flex items-center gap-1">
                    <Check size={12} /> {picked.symbol} · {picked.name}
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 ml-1">
                    Type to search, then click a result to select it.
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className={labelClass}>Instrument name</label>
                  <input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. 364-day Treasury Bill"
                    className={inputClass}
                  />
                </div>
                <div className="space-y-2">
                  <label className={labelClass}>Reference</label>
                  <input
                    value={symbol}
                    onChange={e => setSymbol(e.target.value)}
                    placeholder="e.g. NTB-2027"
                    className={inputClass}
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className={labelClass}>
                  {type === 'stock' ? 'Entry price (₦)' : 'Face value (₦)'}
                </label>
                <input
                  value={entryPrice}
                  onChange={e => setEntryPrice(e.target.value)}
                  type="number"
                  step="0.01"
                  min="0"
                  inputMode="decimal"
                  placeholder="0.00"
                  className={inputClass}
                />
                {picked && Number(entryPrice) !== picked.price && (
                  <button
                    type="button"
                    onClick={() => setEntryPrice(String(picked.price))}
                    className="text-[11px] font-bold text-brand-green hover:text-brand-green-light ml-1 transition-colors"
                  >
                    Use market ₦{picked.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </button>
                )}
              </div>
              <div className="space-y-2">
                <label className={labelClass}>Quantity</label>
                <input
                  value={quantity}
                  onChange={e => setQuantity(e.target.value)}
                  type="number"
                  min="1"
                  step="1"
                  inputMode="numeric"
                  placeholder="0"
                  className={inputClass}
                />
              </div>
            </div>

            {showTotal && (
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
                <span className="text-[10px] font-display font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Landmark size={12} /> Total cost
                </span>
                <span className="text-lg font-display font-bold text-slate-900 dark:text-white tabular-nums">
                  ₦{total.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </span>
              </div>
            )}

            {error && (
              <p className="text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl px-4 py-3">
                {error}
              </p>
            )}

            <button type="submit" className="glow-button w-full py-4 mt-2">
              {editingInvestment ? 'Update Asset' : 'Add to Portfolio'}
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
