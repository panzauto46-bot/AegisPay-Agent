import { ArrowUpRight, ArrowDownLeft, CalendarClock, ExternalLink, Search, Filter } from 'lucide-react';
import type { Transaction } from '../types';
import { cn } from '../utils/cn';
import { useState } from 'react';

interface TransactionHistoryProps {
  transactions: Transaction[];
}

export default function TransactionHistory({ transactions }: TransactionHistoryProps) {
  const [filter, setFilter] = useState<'all' | 'send' | 'receive' | 'recurring'>('all');
  const [search, setSearch] = useState('');

  const filtered = transactions.filter(tx => {
    if (filter !== 'all' && tx.type !== filter) return false;
    if (search && !tx.description?.toLowerCase().includes(search.toLowerCase()) &&
        !tx.to.toLowerCase().includes(search.toLowerCase()) &&
        !tx.from.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalSent = transactions.filter(t => t.type === 'send' || t.type === 'recurring').reduce((s, t) => s + t.amount, 0);
  const totalReceived = transactions.filter(t => t.type === 'receive').reduce((s, t) => s + t.amount, 0);

  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Transactions</h1>
        <p className="text-slate-400">Complete history of all wallet transactions</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="glass-card rounded-2xl p-4">
          <p className="text-xs text-slate-500 mb-1">Total Transactions</p>
          <p className="text-2xl font-bold text-white">{transactions.length}</p>
        </div>
        <div className="glass-card rounded-2xl p-4">
          <p className="text-xs text-slate-500 mb-1">Total Sent</p>
          <p className="text-2xl font-bold text-rose-400">{totalSent.toFixed(2)} <span className="text-sm text-slate-500">USDT</span></p>
        </div>
        <div className="glass-card rounded-2xl p-4">
          <p className="text-xs text-slate-500 mb-1">Total Received</p>
          <p className="text-2xl font-bold text-emerald-400">{totalReceived.toFixed(2)} <span className="text-sm text-slate-500">USDT</span></p>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card rounded-2xl p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search transactions..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-dark-950/50 border border-cyan-500/10 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/20"
            />
          </div>
          {/* Filter buttons */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            {(['all', 'send', 'receive', 'recurring'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize',
                  filter === f
                    ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/20'
                    : 'text-slate-500 hover:text-slate-300 border border-transparent'
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Transaction List */}
      <div className="glass-card rounded-2xl overflow-hidden">
        {/* Table Header */}
        <div className="hidden sm:grid grid-cols-12 gap-4 px-5 py-3 bg-dark-800/40 border-b border-cyan-500/5 text-xs font-medium text-slate-500 uppercase tracking-wider">
          <div className="col-span-1">Type</div>
          <div className="col-span-3">Description</div>
          <div className="col-span-2">Amount</div>
          <div className="col-span-2">From / To</div>
          <div className="col-span-2">Date</div>
          <div className="col-span-1">Status</div>
          <div className="col-span-1"></div>
        </div>

        {filtered.length === 0 ? (
          <div className="px-5 py-12 text-center text-slate-500 text-sm">
            No transactions found
          </div>
        ) : (
          <div className="divide-y divide-cyan-500/5">
            {filtered.map((tx, i) => (
              <div key={tx.id} className="grid grid-cols-12 gap-4 px-5 py-4 hover:bg-dark-800/30 transition-colors items-center animate-slide-up" style={{ animationDelay: `${i * 40}ms` }}>
                {/* Type Icon */}
                <div className="col-span-1">
                  <div className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center',
                    tx.type === 'receive' ? 'bg-emerald-400/10' : tx.type === 'recurring' ? 'bg-amber-400/10' : 'bg-rose-400/10'
                  )}>
                    {tx.type === 'receive' ? (
                      <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
                    ) : tx.type === 'recurring' ? (
                      <CalendarClock className="w-4 h-4 text-amber-400" />
                    ) : (
                      <ArrowUpRight className="w-4 h-4 text-rose-400" />
                    )}
                  </div>
                </div>

                {/* Description */}
                <div className="col-span-3">
                  <p className="text-sm font-medium text-white truncate">{tx.description || tx.type}</p>
                  <p className="text-[10px] text-slate-600 font-mono truncate">{tx.hash.slice(0, 16)}...</p>
                </div>

                {/* Amount */}
                <div className="col-span-2">
                  <p className={cn(
                    'text-sm font-semibold',
                    tx.type === 'receive' ? 'text-emerald-400' : 'text-rose-400'
                  )}>
                    {tx.type === 'receive' ? '+' : '-'}{tx.amount} {tx.token}
                  </p>
                </div>

                {/* Address */}
                <div className="col-span-2">
                  <p className="text-xs text-slate-400 font-mono truncate">
                    {tx.type === 'receive' ? tx.from : tx.to}
                  </p>
                </div>

                {/* Date */}
                <div className="col-span-2">
                  <p className="text-xs text-slate-400">{tx.timestamp.toLocaleDateString()}</p>
                  <p className="text-[10px] text-slate-600">{tx.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>

                {/* Status */}
                <div className="col-span-1">
                  <span className={cn(
                    'text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full',
                    tx.status === 'confirmed' ? 'bg-emerald-400/10 text-emerald-400' :
                    tx.status === 'pending' ? 'bg-amber-400/10 text-amber-400' :
                    'bg-rose-400/10 text-rose-400'
                  )}>
                    {tx.status}
                  </span>
                </div>

                {/* Action */}
                <div className="col-span-1 flex justify-end">
                  <a
                    href={tx.explorerUrl ?? '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="text-slate-600 hover:text-cyan-400 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
