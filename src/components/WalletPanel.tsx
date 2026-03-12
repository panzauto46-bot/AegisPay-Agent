import { Wallet, Copy, ExternalLink, Plus, Shield, Check } from 'lucide-react';
import type { Wallet as WalletType, Page } from '../types';
import { cn } from '../utils/cn';
import { useState } from 'react';

interface WalletPanelProps {
  wallets: WalletType[];
  onNavigate: (page: Page) => void;
}

export default function WalletPanel({ wallets, onNavigate }: WalletPanelProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const totalBalance = wallets.reduce((sum, w) => sum + w.balance, 0);

  const handleCopy = (address: string, id: string) => {
    navigator.clipboard.writeText(address).catch(() => {});
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Wallets</h1>
        <p className="text-slate-400">Manage your self-custodial wallets created via WDK</p>
      </div>

      {/* Total Balance Card */}
      <div className="glass-card rounded-2xl p-6 mb-6 animate-pulse-glow">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-cyan-400" />
            <span className="text-sm text-slate-400">Total Portfolio Value</span>
          </div>
          <span className="text-xs text-emerald-400 font-medium bg-emerald-400/10 px-2 py-1 rounded-full">Self-Custodial</span>
        </div>
        <div className="text-4xl font-bold gradient-text mb-1">{totalBalance.toFixed(2)} <span className="text-xl">USDT</span></div>
        <p className="text-xs text-slate-500">Across {wallets.length} wallet{wallets.length > 1 ? 's' : ''} on Ethereum Sepolia</p>
      </div>

      {/* Wallets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {wallets.map((wallet, i) => (
          <div key={wallet.id} className="glass-card rounded-2xl p-5 animate-slide-up" style={{ animationDelay: `${i * 100}ms` }}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center',
                  i === 0 ? 'bg-gradient-to-br from-cyan-400 to-teal-400' : 'bg-gradient-to-br from-slate-600 to-slate-700'
                )}>
                  <Wallet className="w-5 h-5 text-dark-950" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">{wallet.name}</h3>
                  <p className="text-[10px] text-slate-500">{wallet.network}</p>
                </div>
              </div>
              {i === 0 && <span className="text-[10px] font-semibold uppercase text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded-full">Primary</span>}
            </div>

            <div className="mb-4">
              <p className="text-2xl font-bold text-white">{wallet.balance.toFixed(2)} <span className="text-sm text-slate-500">USDT</span></p>
            </div>

            <div className="flex items-center gap-2 bg-dark-950/50 rounded-lg px-3 py-2">
              <p className="text-xs font-mono text-slate-400 flex-1 truncate">{wallet.address}</p>
              <button
                onClick={() => handleCopy(wallet.address, wallet.id)}
                className="text-slate-500 hover:text-cyan-400 transition-colors"
              >
                {copiedId === wallet.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            <div className="flex items-center justify-between mt-3 pt-3 border-t border-cyan-500/5">
              <p className="text-[10px] text-slate-600">Created {wallet.createdAt.toLocaleDateString()}</p>
              <a
                href={wallet.explorerUrl ?? '#'}
                target="_blank"
                rel="noreferrer"
                className="text-[10px] text-cyan-400/60 hover:text-cyan-400 flex items-center gap-1 transition-colors"
              >
                Explorer <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
          </div>
        ))}

        {/* Create New Wallet */}
        <button
          onClick={() => onNavigate('chat')}
          className="border-2 border-dashed border-cyan-500/10 hover:border-cyan-500/30 rounded-2xl p-5 flex flex-col items-center justify-center gap-3 transition-all group min-h-[200px]"
        >
          <div className="w-12 h-12 rounded-xl bg-cyan-500/10 group-hover:bg-cyan-500/20 flex items-center justify-center transition-colors">
            <Plus className="w-6 h-6 text-cyan-400/50 group-hover:text-cyan-400" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-slate-400 group-hover:text-white transition-colors">Create New Wallet</p>
            <p className="text-xs text-slate-600 mt-1">Ask the AI agent to create one</p>
          </div>
        </button>
      </div>

      {/* WDK Info */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Shield className="w-4 h-4 text-cyan-400" />
          Wallet Development Kit (WDK)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Self-Custodial', desc: 'You own your keys' },
            { label: 'Secure Signing', desc: 'WDK manages signing' },
            { label: 'Multi-Chain', desc: 'Future expansion ready' },
            { label: 'Token Support', desc: 'USDT & ERC-20 tokens' },
          ].map((item, i) => (
            <div key={i} className="p-3 rounded-xl bg-dark-950/50">
              <p className="text-xs font-medium text-cyan-400 mb-1">{item.label}</p>
              <p className="text-[10px] text-slate-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
