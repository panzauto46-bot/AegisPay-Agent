import { ArrowLeft, CheckCircle2, Plus, ShieldCheck, Wallet as WalletIcon, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import type { Wallet } from '../types';

interface ConnectWalletPageProps {
  wallets: Wallet[];
  runtimeMode: 'local' | 'remote';
  isProcessing: boolean;
  onBack: () => void;
  onConnect: (walletId: string) => void;
  onCreateAndConnect: () => void | Promise<void>;
}

function shortenAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default function ConnectWalletPage({
  wallets,
  runtimeMode,
  isProcessing,
  onBack,
  onConnect,
  onCreateAndConnect,
}: ConnectWalletPageProps) {
  const primaryWallet = wallets[0];

  return (
    <div className="landing-shell relative min-h-screen overflow-hidden px-5 py-6 text-slate-100 sm:px-8 xl:px-12 2xl:px-16">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="landing-grid absolute inset-0 opacity-40" />
        <div className="landing-glow landing-glow-cyan" />
        <div className="landing-glow landing-glow-violet" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-7xl flex-col">
        <div className="mb-8 flex items-center justify-between gap-4">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <div className="rounded-full border border-cyan-300/20 bg-cyan-300/[0.08] px-4 py-2 text-[11px] uppercase tracking-[0.24em] text-cyan-100">
            {runtimeMode === 'remote' ? 'API Runtime Active' : 'Local Runtime Active'}
          </div>
        </div>

        <div className="grid flex-1 gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="max-w-2xl"
          >
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-4 py-1.5 text-[11px] uppercase tracking-[0.26em] text-emerald-100">
              <ShieldCheck className="h-3.5 w-3.5" />
              Wallet Access Step
            </div>
            <h1 className="landing-display text-5xl font-bold leading-[0.95] tracking-tight text-white sm:text-6xl">
              Connect wallet
              <span className="block bg-gradient-to-r from-cyan-200 via-teal-200 to-emerald-200 bg-clip-text text-transparent">
                before entering the console.
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-slate-300 sm:text-lg">
              Supaya flow-nya rapi, `Launch Console` sekarang lewat langkah koneksi wallet dulu.
              Setelah wallet tersambung, user langsung masuk ke AI console, bukan ke dashboard.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {[
                { label: 'Wallets Ready', value: `${wallets.length}` },
                { label: 'Runtime', value: runtimeMode === 'remote' ? 'API' : 'Local' },
                { label: 'Entry Path', value: 'Chat Console' },
              ].map((item) => (
                <div key={item.label} className="landing-panel rounded-[24px] p-4">
                  <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">{item.label}</p>
                  <p className="landing-display mt-3 text-2xl font-bold text-white">{item.value}</p>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.65, ease: 'easeOut', delay: 0.12 }}
            className="landing-panel rounded-[32px] p-6 sm:p-8"
          >
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-300 via-teal-300 to-emerald-300 text-slate-950">
                <WalletIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="landing-display text-2xl font-bold text-white">Wallet connection</p>
                <p className="text-sm text-slate-400">Pilih wallet yang mau dipakai untuk sesi console ini.</p>
              </div>
            </div>

            <div className="space-y-4">
              {wallets.map((wallet, index) => (
                <button
                  key={wallet.id}
                  onClick={() => onConnect(wallet.id)}
                  disabled={isProcessing}
                  className="group w-full rounded-[26px] border border-white/8 bg-white/[0.04] p-5 text-left transition hover:border-cyan-300/25 hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="mt-1 flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-300/20 to-emerald-300/20 text-cyan-100">
                        <WalletIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-base font-semibold text-white">{wallet.name}</p>
                          {index === 0 && (
                            <span className="rounded-full bg-cyan-400/10 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-cyan-300">
                              Primary
                            </span>
                          )}
                        </div>
                        <p className="mt-1 font-mono text-xs text-slate-400">{shortenAddress(wallet.address)}</p>
                        <p className="mt-3 text-sm text-slate-300">
                          {wallet.balance.toFixed(2)} {wallet.token} on {wallet.network}
                        </p>
                      </div>
                    </div>
                    <CheckCircle2 className="h-5 w-5 text-slate-600 transition group-hover:text-cyan-300" />
                  </div>
                </button>
              ))}

              <button
                onClick={() => void onCreateAndConnect()}
                disabled={isProcessing}
                className="flex w-full items-center justify-center gap-3 rounded-[26px] border border-dashed border-cyan-300/20 bg-cyan-300/[0.05] px-5 py-5 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-300/[0.09] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Plus className="h-4 w-4" />
                {isProcessing ? 'Preparing wallet...' : primaryWallet ? 'Create and connect a fresh wallet' : 'Create first wallet and enter console'}
              </button>
            </div>

            <div className="mt-6 rounded-[24px] border border-white/8 bg-dark-950/40 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-white">
                <Zap className="h-4 w-4 text-amber-300" />
                Session behavior
              </div>
              <p className="text-sm leading-7 text-slate-400">
                Setelah wallet tersambung, app akan masuk langsung ke halaman chat console agar user bisa
                kirim instruksi natural language tanpa lewat dashboard dulu.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
