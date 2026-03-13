import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  ShieldCheck,
  CalendarClock,
  TrendingUp,
  Activity,
  Zap,
  ExternalLink,
  MessageSquare,
  Send,
  Repeat,
  BarChart3,
  Monitor,
  Brain,
  Cog,
  KeyRound,
  Link2,
  ArrowRight,
} from 'lucide-react';
import type { Wallet as WalletType, Transaction, SpendingRule, RecurringPayment, Page } from '../types';
import { cn } from '../utils/cn';

interface DashboardProps {
  wallets: WalletType[];
  transactions: Transaction[];
  rules: SpendingRule[];
  recurringPayments: RecurringPayment[];
  onNavigate: (page: Page) => void;
}

export default function Dashboard({ wallets, transactions, rules, recurringPayments, onNavigate }: DashboardProps) {
  const totalBalance = wallets.reduce((sum, w) => sum + w.balance, 0);
  const totalSent = transactions.filter(t => t.type === 'send' || t.type === 'recurring').reduce((sum, t) => sum + t.amount, 0);
  const totalReceived = transactions.filter(t => t.type === 'receive').reduce((sum, t) => sum + t.amount, 0);
  const activeRules = rules.filter(r => r.enabled).length;
  const activeRecurring = recurringPayments.filter(r => r.active).length;
  const dueRecurring = recurringPayments.filter(r => r.active && r.nextExecution <= new Date()).length;

  const stats = [
    { label: 'Total Balance', value: `${totalBalance.toFixed(2)}`, suffix: 'USDT', icon: Wallet, color: 'from-cyan-400 to-teal-400', textColor: 'text-cyan-400' },
    { label: 'Total Sent', value: `${totalSent.toFixed(2)}`, suffix: 'USDT', icon: ArrowUpRight, color: 'from-rose-400 to-pink-400', textColor: 'text-rose-400' },
    { label: 'Total Received', value: `${totalReceived.toFixed(2)}`, suffix: 'USDT', icon: ArrowDownLeft, color: 'from-emerald-400 to-green-400', textColor: 'text-emerald-400' },
    { label: 'Active Rules', value: `${activeRules}`, suffix: '', icon: ShieldCheck, color: 'from-amber-400 to-orange-400', textColor: 'text-amber-400' },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs text-emerald-400 font-medium uppercase tracking-wider">Agent Online</span>
        </div>
        <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">Dashboard</h1>
        <p className="text-slate-400">Your autonomous AI wallet agent overview</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, i) => (
          <div key={i} className="glass-card rounded-2xl p-5 animate-slide-up" style={{ animationDelay: `${i * 80}ms` }}>
            <div className="flex items-start justify-between mb-3">
              <div className={cn('w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center', stat.color)}>
                <stat.icon className="w-5 h-5 text-dark-950" />
              </div>
              <TrendingUp className={cn('w-4 h-4', stat.textColor)} />
            </div>
            <div className={cn('text-2xl font-bold mb-1', stat.textColor)}>{stat.value} <span className="text-sm font-normal text-slate-500">{stat.suffix}</span></div>
            <div className="text-xs text-slate-500">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-cyan-400" />
              Recent Transactions
            </h2>
            <button onClick={() => onNavigate('transactions')} className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors">
              View All <ExternalLink className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-3">
            {transactions.slice(0, 5).map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-3 rounded-xl bg-dark-950/50 hover:bg-dark-800/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'w-9 h-9 rounded-lg flex items-center justify-center',
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
                  <div>
                    <p className="text-sm font-medium text-white">{tx.description || tx.type}</p>
                    <p className="text-xs text-slate-500">{tx.timestamp.toLocaleDateString()} · {tx.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={cn(
                    'text-sm font-semibold',
                    tx.type === 'receive' ? 'text-emerald-400' : 'text-rose-400'
                  )}>
                    {tx.type === 'receive' ? '+' : '-'}{tx.amount} {tx.token}
                  </p>
                  <p className={cn(
                    'text-[10px] font-medium uppercase',
                    tx.status === 'confirmed' ? 'text-emerald-400/60' : tx.status === 'pending' ? 'text-amber-400/60' : 'text-rose-400/60'
                  )}>
                    {tx.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Wallet Card */}
          <div className="glass-card rounded-2xl p-6 animate-pulse-glow">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Primary Wallet</h2>
              <div className="px-2 py-0.5 rounded-full bg-emerald-400/10 text-emerald-400 text-[10px] font-semibold uppercase">Active</div>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-slate-500 mb-1">Balance</p>
                <p className="text-3xl font-bold gradient-text">{wallets[0]?.balance.toFixed(2)} <span className="text-lg">USDT</span></p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Address</p>
                <p className="break-all text-sm font-mono text-slate-300 bg-dark-950/50 px-3 py-2 rounded-lg">{wallets[0]?.address}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">Network</p>
                <p className="text-sm text-slate-300">{wallets[0]?.network}</p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="glass-card rounded-2xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              Quick Actions
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'AI Agent', page: 'chat' as Page, icon: MessageSquare },
                { label: 'Send', page: 'chat' as Page, icon: Send },
                { label: 'Wallets', page: 'wallets' as Page, icon: Wallet },
                { label: 'Rules', page: 'rules' as Page, icon: ShieldCheck },
                { label: 'Recurring', page: 'recurring' as Page, icon: Repeat },
                { label: 'Status', page: 'status' as Page, icon: BarChart3 },
              ].map((action, i) => (
                <button
                  key={i}
                  onClick={() => onNavigate(action.page)}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl bg-dark-950/50 hover:bg-dark-800/50 transition-colors group"
                >
                  <action.icon className="w-5 h-5 text-cyan-400" />
                  <span className="text-xs text-slate-400 group-hover:text-slate-200 transition-colors">{action.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Recurring Summary */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <CalendarClock className="w-5 h-5 text-teal-400" />
                Scheduled
              </h2>
              <span className="text-xs text-teal-400 font-medium">{activeRecurring} active{dueRecurring > 0 ? ` · ${dueRecurring} due` : ''}</span>
            </div>
            <div className="space-y-2">
              {recurringPayments.filter(r => r.active).slice(0, 3).map(rp => (
                <div key={rp.id} className="flex items-center justify-between p-2 rounded-lg bg-dark-950/50">
                  <div>
                    <p className="text-sm text-white">{rp.recipient}</p>
                    <p className="text-[10px] text-slate-500">{rp.frequency} · Next: {rp.nextExecution.toLocaleDateString()}</p>
                  </div>
                  <p className="text-sm font-semibold text-teal-400">{rp.amount} {rp.token}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Architecture Section */}
      <div className="mt-8 glass-card rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
          <Zap className="w-5 h-5 text-cyan-400" />
          System Architecture
        </h2>
        <div className="flex flex-wrap items-center justify-center gap-3 lg:gap-4">
          {[
            { label: 'User Interface', sub: 'Web / Telegram / CLI', icon: Monitor },
            { label: 'OpenClaw Agent', sub: 'AI Reasoning Layer', icon: Brain },
            { label: 'Agent Logic', sub: 'Rules & Validation', icon: Cog },
            { label: 'WDK Wallet', sub: 'Key & Tx Management', icon: KeyRound },
            { label: 'Blockchain', sub: 'Ethereum Sepolia', icon: Link2 },
          ].map((node, i) => (
            <div key={i} className="flex items-center gap-3 lg:gap-4">
              <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-dark-950/50 border border-cyan-500/10 hover:border-cyan-500/20 transition-colors min-w-[120px]">
                <node.icon className="w-6 h-6 text-cyan-400" />
                <div className="text-center">
                  <p className="text-sm font-medium text-white">{node.label}</p>
                  <p className="text-[10px] text-slate-500">{node.sub}</p>
                </div>
              </div>
              {i < 4 && <ArrowRight className="w-4 h-4 text-cyan-500/50 hidden lg:block" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
