import {
  ArrowRight,
  Bot,
  CalendarClock,
  ChevronRight,
  Coins,
  Command,
  Cpu,
  Gauge,
  Globe,
  MessageSquareText,
  Orbit,
  ShieldCheck,
  Sparkles,
  Wallet,
  Zap,
} from 'lucide-react';
import { motion } from 'framer-motion';
import type { Page, RecurringPayment, SpendingRule, Transaction, Wallet as WalletType } from '../types';

interface LandingPageProps {
  wallets: WalletType[];
  transactions: Transaction[];
  rules: SpendingRule[];
  recurringPayments: RecurringPayment[];
  runtimeMode: 'local' | 'remote';
  onLaunchConsole: () => void;
  onNavigate: (page: Page) => void;
}

const tickerItems = [
  'Autonomous wallet orchestration',
  'Sepolia-ready payment rails',
  'Recurring execution engine',
  'Programmable guardrails',
  'Telegram + Web runtime',
  'AI command routing',
];

const pipeline = [
  {
    title: 'Intent Intake',
    subtitle: 'Chat, Telegram, API',
    icon: MessageSquareText,
    color: 'from-amber-300 via-orange-400 to-rose-400',
  },
  {
    title: 'Reasoning Core',
    subtitle: 'Deterministic + AI fallback',
    icon: Cpu,
    color: 'from-cyan-300 via-sky-400 to-blue-500',
  },
  {
    title: 'Rules & Safety',
    subtitle: 'Daily cap, whitelist, scheduler checks',
    icon: ShieldCheck,
    color: 'from-emerald-300 via-teal-400 to-cyan-500',
  },
  {
    title: 'On-chain Delivery',
    subtitle: 'WDK wallet + explorer trace',
    icon: Globe,
    color: 'from-fuchsia-300 via-violet-400 to-indigo-500',
  },
];

const timeline = [
  'User issues a natural-language financial instruction',
  'Agent classifies intent and resolves policy constraints',
  'Scheduler or direct execution path prepares transaction intent',
  'Wallet provider signs or simulates transfer flow',
  'System records state, replies, and exposes explorer trail',
];

export default function LandingPage({
  wallets,
  transactions,
  rules,
  recurringPayments,
  runtimeMode,
  onLaunchConsole,
  onNavigate,
}: LandingPageProps) {
  const activeRules = rules.filter((rule) => rule.enabled).length;
  const activeRecurring = recurringPayments.filter((payment) => payment.active).length;
  const totalBalance = wallets.reduce((sum, wallet) => sum + wallet.balance, 0);

  return (
    <div className="landing-shell relative min-h-screen overflow-hidden text-slate-100">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="landing-grid absolute inset-0 opacity-50" />
        <motion.div
          className="landing-glow landing-glow-cyan"
          animate={{ x: [0, 60, -30, 0], y: [0, -40, 30, 0], scale: [1, 1.12, 0.95, 1] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="landing-glow landing-glow-amber"
          animate={{ x: [0, -90, 30, 0], y: [0, 50, -30, 0], scale: [1, 0.9, 1.08, 1] }}
          transition={{ duration: 21, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="landing-glow landing-glow-violet"
          animate={{ x: [0, 40, -40, 0], y: [0, -20, 45, 0], scale: [1, 1.05, 0.92, 1] }}
          transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      <header className="relative z-10 flex w-full items-center justify-between px-5 py-5 sm:px-8 xl:px-12 2xl:px-16">
        <button
          onClick={() => onNavigate('landing')}
          className="flex items-center gap-3 text-left"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-300 via-teal-300 to-emerald-300 text-slate-950 shadow-[0_20px_60px_rgba(34,211,238,0.35)]">
            <Zap className="h-5 w-5" strokeWidth={2.7} />
          </div>
          <div>
            <p className="landing-display text-lg font-bold tracking-tight text-white">AegisPay Agent</p>
            <p className="text-[11px] uppercase tracking-[0.28em] text-cyan-200/70">Autonomous wallet OS</p>
          </div>
        </button>

        <div className="hidden items-center gap-3 md:flex">
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-cyan-100/70">
            {runtimeMode === 'remote' ? 'API Runtime Active' : 'Local Runtime Active'}
          </span>
          <button
            onClick={() => onNavigate('status')}
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-200 transition hover:border-cyan-300/30 hover:bg-white/10"
          >
            Project Status
          </button>
          <button
            onClick={onLaunchConsole}
            className="rounded-full bg-gradient-to-r from-cyan-300 via-teal-300 to-emerald-300 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:scale-[1.02]"
          >
            Launch Console
          </button>
        </div>
      </header>

      <main className="relative z-10 flex w-full flex-col gap-12 px-5 pb-20 sm:px-8 xl:px-12 2xl:px-16">
        <section className="grid gap-10 pt-4 lg:min-h-[calc(100vh-7.5rem)] lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:items-center lg:gap-16 lg:pt-8 2xl:grid-cols-[minmax(0,0.86fr)_minmax(0,1.14fr)]">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="max-w-[58rem]"
          >
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/[0.08] px-4 py-1.5 text-[11px] uppercase tracking-[0.26em] text-cyan-100">
              <Sparkles className="h-3.5 w-3.5" />
              Built for Agent Wallets
            </div>
            <h1 className="landing-display max-w-[7.5ch] text-5xl font-bold leading-[0.94] tracking-tight text-white sm:text-6xl lg:text-7xl xl:text-[6.25rem]">
              Policy-first wallet
              <span className="block bg-gradient-to-r from-amber-200 via-cyan-200 to-emerald-200 bg-clip-text text-transparent">
                execution at runtime.
              </span>
            </h1>
            <p className="mt-6 max-w-3xl text-base leading-8 text-slate-300 sm:text-lg">
              AegisPay Agent turns natural-language payment commands into policy-validated on-chain
              execution. It combines recurring scheduling, runtime telemetry, and a WDK wallet runtime
              that is proven live on Sepolia.
            </p>
            <p className="mt-4 max-w-3xl text-xs leading-6 text-cyan-100/80 sm:text-sm">
              Live WDK proof (Sepolia):{' '}
              <span className="font-mono">
                0x84358ee464ea571d4a4b4472d1376740811e8cdbca1efc8d3659f2bf61efd073
              </span>
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <motion.button
                whileHover={{ y: -2, scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
              onClick={onLaunchConsole}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-cyan-300 via-teal-300 to-emerald-300 px-6 py-3.5 text-sm font-semibold text-slate-950 shadow-[0_20px_80px_rgba(34,211,238,0.22)]"
            >
                Open Agent Console
                <ArrowRight className="h-4 w-4" />
              </motion.button>
              <motion.button
                whileHover={{ y: -2, scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
              onClick={() => onNavigate('dashboard')}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/12 bg-white/[0.06] px-6 py-3.5 text-sm font-semibold text-slate-100 backdrop-blur-xl"
            >
                View Dashboard
                <ChevronRight className="h-4 w-4" />
              </motion.button>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-3 xl:max-w-[56rem]">
              {[
                { label: 'Portfolio Surface', value: `${totalBalance.toFixed(2)} USDT`, icon: Coins },
                { label: 'Active Guardrails', value: `${activeRules}`, icon: ShieldCheck },
                { label: 'Live Schedules', value: `${activeRecurring}`, icon: CalendarClock },
              ].map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.12 + index * 0.1, duration: 0.55 }}
                  className="landing-panel rounded-[28px] p-5"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <item.icon className="h-5 w-5 text-cyan-200" />
                    <span className="text-[11px] uppercase tracking-[0.24em] text-slate-500">Live</span>
                  </div>
                  <p className="landing-display text-2xl font-bold text-white">{item.value}</p>
                  <p className="mt-2 text-sm text-slate-400">{item.label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.9, ease: 'easeOut', delay: 0.15 }}
            className="relative w-full lg:min-h-[42rem] lg:justify-self-stretch"
          >
            <div className="landing-stage">
              <div className="landing-stage-grid" />
              <div className="landing-ring landing-ring-lg" />
              <div className="landing-ring landing-ring-md" />
              <div className="landing-ring landing-ring-sm" />
              <motion.div
                animate={{ rotateX: [0, 8, -6, 0], rotateY: [0, -14, 16, 0] }}
                transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
                className="landing-core-card"
              >
                <div className="absolute inset-x-8 top-7 flex items-center justify-between text-xs uppercase tracking-[0.24em] text-cyan-100/75">
                  <span>Runtime</span>
                  <span>{runtimeMode === 'remote' ? 'API' : 'Local'}</span>
                </div>
                <div className="absolute inset-x-8 bottom-8">
                  <div className="mb-2 flex items-center justify-between text-xs text-slate-400">
                    <span>Wallet orchestration</span>
                    <span className="text-cyan-100">Live pulse</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/10">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-amber-300 via-cyan-300 to-emerald-300"
                      animate={{ width: ['34%', '86%', '61%', '92%'] }}
                      transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
                    />
                  </div>
                </div>
                <div className="landing-orb">
                  <div className="landing-orb-core">
                    <Wallet className="h-9 w-9 text-slate-950" strokeWidth={2.5} />
                  </div>
                </div>
                <div className="landing-scan-line" />
              </motion.div>

              <motion.div
                animate={{ y: [0, -14, 0], x: [0, 8, 0] }}
                transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
                className="landing-float-card left-4 top-12"
              >
                <div className="mb-3 flex items-center gap-2">
                  <Bot className="h-4 w-4 text-cyan-200" />
                  <span className="text-xs uppercase tracking-[0.22em] text-cyan-100/70">Agent Core</span>
                </div>
                <p className="landing-display text-xl font-bold text-white">Intent → Policy → Send</p>
                <p className="mt-2 text-sm leading-6 text-slate-400">Commands stream into the reasoning core before touching wallet execution.</p>
              </motion.div>

              <motion.div
                animate={{ y: [0, 12, 0], x: [0, -6, 0] }}
                transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                className="landing-float-card right-4 bottom-10"
              >
                <div className="mb-4 flex items-center gap-2">
                  <Gauge className="h-4 w-4 text-amber-200" />
                  <span className="text-xs uppercase tracking-[0.22em] text-amber-100/70">Execution Pace</span>
                </div>
                <div className="space-y-2">
                  {[
                    { label: 'Payment rail', width: '86%' },
                    { label: 'Scheduler', width: '64%' },
                    { label: 'Telemetry', width: '92%' },
                  ].map((item) => (
                    <div key={item.label}>
                      <div className="mb-1 flex items-center justify-between text-xs text-slate-400">
                        <span>{item.label}</span>
                        <span>{item.width}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/[0.08]">
                        <motion.div
                          className="h-full rounded-full bg-gradient-to-r from-amber-300 via-orange-300 to-rose-300"
                          animate={{ width: [item.width, '40%', item.width] }}
                          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </motion.div>
        </section>

        <section className="relative left-1/2 w-screen -translate-x-1/2 px-5 sm:px-8 xl:px-12 2xl:px-16">
          <div className="landing-panel overflow-hidden rounded-[32px] py-4">
            <div className="mb-3 px-5 text-[11px] uppercase tracking-[0.28em] text-slate-500 sm:px-8">
              Running Signal Strip
            </div>
            <div className="marquee-shell">
              <div className="marquee-track">
                {[...tickerItems, ...tickerItems].map((item, index) => (
                  <div key={`${item}-${index}`} className="marquee-item">
                    <Orbit className="h-4 w-4 text-cyan-200" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] 2xl:grid-cols-[minmax(0,1.22fr)_minmax(0,0.78fr)]">
          <div className="landing-panel rounded-[32px] p-6 sm:p-8">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-300/25 to-emerald-300/25 text-cyan-100">
                <Command className="h-5 w-5" />
              </div>
                <div>
                <p className="landing-display text-2xl font-bold text-white">Execution flow with policy guardrails</p>
                <p className="mt-1 text-sm text-slate-400">A deterministic path from user intent to on-chain delivery.</p>
                </div>
              </div>

            <div className="flow-lane">
              <div className="flow-lane-line" />
              <div className="flow-lane-pulse" />
              <div className="grid gap-4 lg:grid-cols-2">
                {pipeline.map((item, index) => (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-60px' }}
                    transition={{ delay: index * 0.08, duration: 0.55 }}
                    className="flow-node rounded-[26px] p-5"
                  >
                    <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${item.color} text-slate-950`}>
                      <item.icon className="h-5 w-5" />
                    </div>
                    <p className="landing-display text-xl font-bold text-white">{item.title}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-400">{item.subtitle}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="landing-panel rounded-[32px] p-6 sm:p-7">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300/20 to-rose-300/20 text-amber-100">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <p className="landing-display text-xl font-bold text-white">Runtime highlights</p>
                  <p className="text-sm text-slate-400">Core delivery signals that matter for production demos.</p>
                </div>
              </div>
              <div className="grid gap-3">
                {[
                  'Policy validation before payment execution',
                  'Recurring scheduler with persisted runtime state',
                  'Unified command channels: Web, Telegram, and API',
                  'Explorer-linked transaction trace for live proof',
                ].map((item) => (
                  <div key={item} className="rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 text-sm text-slate-300">
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="landing-panel rounded-[32px] p-6 sm:p-7">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-300/20 to-cyan-300/20 text-emerald-100">
                  <CalendarClock className="h-5 w-5" />
                </div>
                <div>
                  <p className="landing-display text-xl font-bold text-white">Autonomous execution loop</p>
                  <p className="text-sm text-slate-400">A visual story for how the agent keeps moving.</p>
                </div>
              </div>
              <div className="space-y-4">
                {timeline.map((item, index) => (
                  <div key={item} className="relative pl-9">
                    <div className="absolute left-0 top-1 h-4 w-4 rounded-full border border-cyan-200/40 bg-dark-950">
                      <motion.div
                        className="absolute inset-1 rounded-full bg-gradient-to-br from-cyan-300 to-emerald-300"
                        animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.7, 1, 0.7] }}
                        transition={{ duration: 2.2, repeat: Infinity, delay: index * 0.18 }}
                      />
                    </div>
                    {index < timeline.length - 1 && (
                      <div className="absolute left-[7px] top-5 h-[calc(100%+10px)] w-px bg-gradient-to-b from-cyan-300/60 to-transparent" />
                    )}
                    <p className="text-sm leading-7 text-slate-300">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="relative left-1/2 w-screen -translate-x-1/2 px-5 sm:px-8 xl:px-12 2xl:px-16">
          <div className="landing-panel rounded-[36px] p-6 sm:p-8">
            <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <p className="mb-3 text-[11px] uppercase tracking-[0.28em] text-cyan-100/65">Ready to show it live</p>
                <h2 className="landing-display max-w-[14ch] text-3xl font-bold text-white sm:text-4xl xl:text-5xl">
                  Open the live console and run the agent flow end-to-end.
                </h2>
                <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-400 sm:text-base">
                  This surface introduces the architecture quickly, then routes users into the working wallet
                  runtime, dashboard, and project status pages used for submission verification.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                <button
                  onClick={onLaunchConsole}
                  className="rounded-full bg-gradient-to-r from-amber-300 via-cyan-300 to-emerald-300 px-6 py-3.5 text-sm font-semibold text-slate-950"
                >
                  Launch Agent Console
                </button>
                <button
                  onClick={() => onNavigate('status')}
                  className="rounded-full border border-white/12 bg-white/[0.06] px-6 py-3.5 text-sm font-semibold text-slate-100"
                >
                  View Project Status
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
