import { CalendarClock, Plus, Trash2, ToggleLeft, ToggleRight, Clock, X } from 'lucide-react';
import type { RecurringPayment } from '../types';
import { cn } from '../utils/cn';
import { useState } from 'react';

interface RecurringPaymentsProps {
  payments: RecurringPayment[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onAdd: (payment: Omit<RecurringPayment, 'id' | 'executionCount'>) => void;
  onRunScheduler: () => void;
  lastSchedulerRun: Date | null;
}

const frequencyColors: Record<RecurringPayment['frequency'], string> = {
  daily: 'bg-amber-400/10 text-amber-400',
  weekly: 'bg-cyan-400/10 text-cyan-400',
  monthly: 'bg-teal-400/10 text-teal-400',
};

export default function RecurringPayments({
  payments,
  onToggle,
  onDelete,
  onAdd,
  onRunScheduler,
  lastSchedulerRun,
}: RecurringPaymentsProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRecipient, setNewRecipient] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newFrequency, setNewFrequency] = useState<RecurringPayment['frequency']>('monthly');
  const [newDescription, setNewDescription] = useState('');
  const duePayments = payments.filter((payment) => payment.active && payment.nextExecution <= new Date()).length;

  const totalMonthly = payments.filter(p => p.active).reduce((sum, p) => {
    const mult = p.frequency === 'daily' ? 30 : p.frequency === 'weekly' ? 4 : 1;
    return sum + p.amount * mult;
  }, 0);

  const handleAdd = () => {
    if (!newRecipient.trim() || !newAmount.trim()) return;
    const days = newFrequency === 'daily' ? 1 : newFrequency === 'weekly' ? 7 : 30;
    onAdd({
      recipient: newRecipient.trim(),
      recipientAddress: newAddress.trim() || '0x' + Math.random().toString(16).slice(2, 10) + '...' + Math.random().toString(16).slice(2, 6),
      amount: parseFloat(newAmount),
      token: 'USDT',
      frequency: newFrequency,
      nextExecution: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
      active: true,
      description: newDescription.trim() || `Recurring payment to ${newRecipient.trim()}`,
    });
    setShowAddModal(false);
    setNewRecipient('');
    setNewAddress('');
    setNewAmount('');
    setNewDescription('');
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Recurring Payments</h1>
          <p className="text-slate-400">Automated scheduled payment management</p>
          <p className="text-xs text-slate-500 mt-2">
            Last scheduler run: {lastSchedulerRun ? lastSchedulerRun.toLocaleString() : 'Not run yet'}
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            onClick={onRunScheduler}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-cyan-500/20 text-cyan-400 font-semibold text-sm hover:bg-cyan-500/10 transition-all"
          >
            <CalendarClock className="w-4 h-4" />
            Run Scheduler
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-dark-950 font-semibold text-sm hover:shadow-lg hover:shadow-cyan-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            Schedule Payment
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <div className="glass-card rounded-2xl p-4">
          <p className="text-xs text-slate-500 mb-1">Active Schedules</p>
          <p className="text-2xl font-bold text-white">{payments.filter(p => p.active).length}</p>
        </div>
        <div className="glass-card rounded-2xl p-4">
          <p className="text-xs text-slate-500 mb-1">Due Right Now</p>
          <p className="text-2xl font-bold text-amber-400">{duePayments}</p>
        </div>
        <div className="glass-card rounded-2xl p-4">
          <p className="text-xs text-slate-500 mb-1">Est. Monthly Total</p>
          <p className="text-2xl font-bold text-teal-400">{totalMonthly.toFixed(2)} <span className="text-sm text-slate-500">USDT</span></p>
        </div>
        <div className="glass-card rounded-2xl p-4">
          <p className="text-xs text-slate-500 mb-1">Total Executions</p>
          <p className="text-2xl font-bold text-cyan-400">{payments.reduce((s, p) => s + p.executionCount, 0)}</p>
        </div>
      </div>

      {/* Payment Cards */}
      <div className="space-y-4">
        {payments.map((payment, i) => (
          <div key={payment.id} className={cn('glass-card rounded-2xl p-5 animate-slide-up', !payment.active && 'opacity-50')} style={{ animationDelay: `${i * 80}ms` }}>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-400/20 to-cyan-400/20 flex items-center justify-center">
                  <CalendarClock className="w-6 h-6 text-teal-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base font-semibold text-white">{payment.recipient}</h3>
                    <span className={cn('text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full', frequencyColors[payment.frequency])}>
                      {payment.frequency}
                    </span>
                    {payment.active && payment.nextExecution <= new Date() && (
                      <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-400">
                        Due now
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mb-2">{payment.description}</p>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                    <span className="font-mono">{payment.recipientAddress}</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Next: {payment.nextExecution.toLocaleDateString()}
                    </span>
                    <span>Executed: {payment.executionCount}x</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end gap-3">
                <p className="text-xl font-bold text-white">{payment.amount} <span className="text-sm text-slate-500">USDT</span></p>
                <div className="flex items-center gap-2">
                  <button onClick={() => onToggle(payment.id)} className="transition-colors">
                    {payment.active ? (
                      <ToggleRight className="w-7 h-7 text-cyan-400" />
                    ) : (
                      <ToggleLeft className="w-7 h-7 text-slate-600" />
                    )}
                  </button>
                  <button onClick={() => onDelete(payment.id)} className="text-slate-600 hover:text-rose-400 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}

        {payments.length === 0 && (
          <div className="glass-card rounded-2xl p-12 text-center">
            <CalendarClock className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-lg font-medium text-slate-400 mb-2">No Recurring Payments</p>
            <p className="text-sm text-slate-600 mb-4">Set up automated payments for subscriptions, payroll, and more</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-dark-950 font-semibold text-sm"
            >
              Schedule First Payment
            </button>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card rounded-2xl p-6 w-full max-w-md border border-cyan-500/20">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white">Schedule Payment</h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Recipient Name</label>
                <input
                  type="text"
                  value={newRecipient}
                  onChange={(e) => setNewRecipient(e.target.value)}
                  placeholder="e.g., Cloud Hosting"
                  className="w-full px-3 py-2 rounded-xl bg-dark-950/50 border border-cyan-500/10 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/20"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">Recipient Address</label>
                <input
                  type="text"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  placeholder="0x..."
                  className="w-full px-3 py-2 rounded-xl bg-dark-950/50 border border-cyan-500/10 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Amount (USDT)</label>
                  <input
                    type="number"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    placeholder="20"
                    className="w-full px-3 py-2 rounded-xl bg-dark-950/50 border border-cyan-500/10 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/20"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Frequency</label>
                  <select
                    value={newFrequency}
                    onChange={(e) => setNewFrequency(e.target.value as RecurringPayment['frequency'])}
                    className="w-full px-3 py-2 rounded-xl bg-dark-950/50 border border-cyan-500/10 text-sm text-white focus:outline-none focus:border-cyan-500/20 appearance-none"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1 block">Description</label>
                <input
                  type="text"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="e.g., Monthly hosting subscription"
                  className="w-full px-3 py-2 rounded-xl bg-dark-950/50 border border-cyan-500/10 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/20"
                />
              </div>

              <button
                onClick={handleAdd}
                disabled={!newRecipient.trim() || !newAmount.trim()}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 text-dark-950 font-semibold text-sm hover:shadow-lg hover:shadow-cyan-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Schedule Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
