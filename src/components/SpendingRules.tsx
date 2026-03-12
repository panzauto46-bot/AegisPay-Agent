import { ShieldCheck, Plus, Trash2, ToggleLeft, ToggleRight, AlertTriangle, DollarSign, Ban, Users, X } from 'lucide-react';
import type { SpendingRule } from '../types';
import { cn } from '../utils/cn';
import { useState } from 'react';

interface SpendingRulesProps {
  rules: SpendingRule[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onAdd: (type: SpendingRule['type'], label: string, value: number | string[]) => void;
}

const ruleIcons: Record<SpendingRule['type'], React.ElementType> = {
  daily_limit: DollarSign,
  max_transaction: AlertTriangle,
  whitelist: Users,
  blacklist: Ban,
};

const ruleColors: Record<SpendingRule['type'], string> = {
  daily_limit: 'from-cyan-400 to-teal-400',
  max_transaction: 'from-amber-400 to-orange-400',
  whitelist: 'from-emerald-400 to-green-400',
  blacklist: 'from-rose-400 to-pink-400',
};

export default function SpendingRules({ rules, onToggle, onDelete, onAdd }: SpendingRulesProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newType, setNewType] = useState<SpendingRule['type']>('daily_limit');
  const [newLabel, setNewLabel] = useState('');
  const [newValue, setNewValue] = useState('');

  const handleAdd = () => {
    if (!newLabel.trim() || !newValue.trim()) return;
    const value = newType === 'whitelist' || newType === 'blacklist'
      ? newValue.split(',').map(s => s.trim())
      : parseFloat(newValue);
    onAdd(newType, newLabel.trim(), value);
    setShowAddModal(false);
    setNewLabel('');
    setNewValue('');
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Spending Rules</h1>
          <p className="text-slate-400">Define financial constraints for your AI agent</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-dark-950 font-semibold text-sm hover:shadow-lg hover:shadow-cyan-500/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Rule
        </button>
      </div>

      {/* Info Card */}
      <div className="glass-card rounded-2xl p-5 mb-6 border-l-4 border-l-cyan-500">
        <div className="flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-white mb-1">How Spending Rules Work</p>
            <p className="text-xs text-slate-400 leading-relaxed">
              Spending rules act as guardrails for your AI agent. When the agent attempts to execute a transaction, 
              it validates the request against all active rules. If any rule is violated, the transaction is automatically 
              rejected. This ensures your funds are protected even when the agent operates autonomously.
            </p>
          </div>
        </div>
      </div>

      {/* Rules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {rules.map((rule, i) => {
          const Icon = ruleIcons[rule.type] || ShieldCheck;
          return (
            <div key={rule.id} className={cn('glass-card rounded-2xl p-5 animate-slide-up', !rule.enabled && 'opacity-50')} style={{ animationDelay: `${i * 80}ms` }}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={cn('w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center', ruleColors[rule.type])}>
                    <Icon className="w-5 h-5 text-dark-950" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">{rule.label}</h3>
                    <p className="text-[10px] text-slate-500 uppercase">{rule.type.replace('_', ' ')}</p>
                  </div>
                </div>
                <button
                  onClick={() => onToggle(rule.id)}
                  className="transition-colors"
                >
                  {rule.enabled ? (
                    <ToggleRight className="w-8 h-8 text-cyan-400" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-slate-600" />
                  )}
                </button>
              </div>

              <div className="bg-dark-950/50 rounded-xl p-3 mb-3">
                {typeof rule.value === 'number' ? (
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Limit</p>
                    <p className="text-xl font-bold text-white">{rule.value} <span className="text-sm text-slate-500">USDT</span></p>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Addresses</p>
                    <div className="flex flex-wrap gap-1">
                      {(rule.value as string[]).map((addr, j) => (
                        <span key={j} className="text-xs font-mono text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded">{addr}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <span className={cn(
                  'text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full',
                  rule.enabled ? 'bg-emerald-400/10 text-emerald-400' : 'bg-slate-600/10 text-slate-500'
                )}>
                  {rule.enabled ? 'Active' : 'Disabled'}
                </span>
                <button
                  onClick={() => onDelete(rule.id)}
                  className="text-slate-600 hover:text-rose-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}

        {rules.length === 0 && (
          <div className="md:col-span-2 glass-card rounded-2xl p-12 text-center">
            <ShieldCheck className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-lg font-medium text-slate-400 mb-2">No Spending Rules</p>
            <p className="text-sm text-slate-600">Add rules to protect your wallet from unauthorized transactions</p>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card rounded-2xl p-6 w-full max-w-md border border-cyan-500/20">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white">Add Spending Rule</h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Rule Type</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as SpendingRule['type'])}
                  className="w-full px-3 py-2 rounded-xl bg-dark-950/50 border border-cyan-500/10 text-sm text-white focus:outline-none focus:border-cyan-500/20 appearance-none"
                >
                  <option value="daily_limit">Daily Spending Limit</option>
                  <option value="max_transaction">Max Transaction Size</option>
                  <option value="whitelist">Address Whitelist</option>
                  <option value="blacklist">Address Blacklist</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">Label</label>
                <input
                  type="text"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="e.g., Daily Spending Limit"
                  className="w-full px-3 py-2 rounded-xl bg-dark-950/50 border border-cyan-500/10 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/20"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">
                  {newType === 'whitelist' || newType === 'blacklist' ? 'Addresses (comma separated)' : 'Amount (USDT)'}
                </label>
                <input
                  type="text"
                  value={newValue}
                  onChange={(e) => setNewValue(e.target.value)}
                  placeholder={newType === 'whitelist' || newType === 'blacklist' ? '0x..., 0x...' : '500'}
                  className="w-full px-3 py-2 rounded-xl bg-dark-950/50 border border-cyan-500/10 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/20"
                />
              </div>

              <button
                onClick={handleAdd}
                disabled={!newLabel.trim() || !newValue.trim()}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-dark-950 font-semibold text-sm hover:shadow-lg hover:shadow-cyan-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Rule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
