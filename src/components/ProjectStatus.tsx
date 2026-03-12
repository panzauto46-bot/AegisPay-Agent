import {
  AlertTriangle,
  ArrowRightLeft,
  BarChart3,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Flag,
  ShieldAlert,
  ShieldCheck,
  Target,
  Wallet,
} from 'lucide-react';
import {
  mvpChecklist,
  nextBuildPriorities,
  projectRisks,
  projectStatusMeta,
  roadmapMilestones,
  roadmapPhaseStatuses,
} from '../data/projectStatus';
import type { RecurringPayment, SpendingRule, Transaction, Wallet as WalletType } from '../types';
import { getMonthlyEstimate } from '../lib/agentRuntime';
import { cn } from '../utils/cn';

interface ProjectStatusProps {
  wallets: WalletType[];
  transactions: Transaction[];
  rules: SpendingRule[];
  recurringPayments: RecurringPayment[];
  lastSchedulerRun: Date | null;
}

const phaseStatusStyles = {
  done: 'bg-emerald-400/10 text-emerald-400',
  in_progress: 'bg-cyan-400/10 text-cyan-400',
  planned: 'bg-slate-500/10 text-slate-400',
} as const;

const milestoneStatusStyles = {
  complete: 'bg-emerald-400/10 text-emerald-400',
  in_progress: 'bg-cyan-400/10 text-cyan-400',
  pending: 'bg-slate-500/10 text-slate-400',
} as const;

const riskLevelStyles = {
  high: 'text-rose-400',
  medium: 'text-amber-400',
  low: 'text-emerald-400',
} as const;

export default function ProjectStatus({
  wallets,
  transactions,
  rules,
  recurringPayments,
  lastSchedulerRun,
}: ProjectStatusProps) {
  const activeRules = rules.filter((rule) => rule.enabled).length;
  const duePayments = recurringPayments.filter(
    (payment) => payment.active && payment.nextExecution <= new Date(),
  ).length;
  const monthlyRecurringTotal = recurringPayments
    .filter((payment) => payment.active)
    .reduce((sum, payment) => sum + getMonthlyEstimate(payment), 0);
  const outgoingTransactions = transactions.filter(
    (transaction) =>
      (transaction.type === 'send' || transaction.type === 'recurring') &&
      transaction.status === 'confirmed',
  ).length;

  const readinessNotes: Record<string, string> = {
    wallet_creation: `${wallets.length} wallet(s) available in the current demo runtime.`,
    balance_checking: `Portfolio reporting is live for ${wallets.length} wallet(s).`,
    single_payment: `${outgoingTransactions} confirmed outgoing transaction(s) tracked.`,
    natural_language: 'Chat commands cover the MVP wallet, payment, rule, recurring, and status flows.',
    spending_limits: `${activeRules} active guardrail rule(s) are enforceable right now.`,
    chat_interface: 'The web chat is the primary control surface in this build.',
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 lg:p-8">
      <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-400">
            <Flag className="h-3.5 w-3.5" />
            Project Status
          </div>
          <h1 className="mb-2 text-3xl font-bold text-white lg:text-4xl">Roadmap progress and MVP readiness</h1>
          <p className="max-w-2xl text-sm leading-6 text-slate-400">
            {projectStatusMeta.summary}
          </p>
        </div>

        <div className="glass-card w-full max-w-md rounded-3xl p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Overall Progress</p>
              <p className="mt-1 text-3xl font-bold text-white">{projectStatusMeta.overallProgress}%</p>
            </div>
            <BarChart3 className="h-8 w-8 text-cyan-400" />
          </div>

          <div className="mb-4 h-2.5 overflow-hidden rounded-full bg-dark-950/80">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400"
              style={{ width: `${projectStatusMeta.overallProgress}%` }}
            />
          </div>

          <div className="space-y-2 text-sm text-slate-400">
            <div className="flex items-center justify-between">
              <span>Last updated</span>
              <span className="font-medium text-white">{projectStatusMeta.lastUpdated}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Submission target</span>
              <span className="font-medium text-white">{projectStatusMeta.deliveryTarget}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Scheduler run</span>
              <span className="font-medium text-white">
                {lastSchedulerRun ? lastSchedulerRun.toLocaleString() : 'Not run yet'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: 'Wallets Provisioned',
            value: wallets.length,
            detail: 'Wallet creation flow is live through the agent.',
            icon: Wallet,
            accent: 'text-cyan-400',
          },
          {
            label: 'Confirmed Outgoing',
            value: outgoingTransactions,
            detail: 'Validated sends and recurring executions are tracked here.',
            icon: ArrowRightLeft,
            accent: 'text-rose-400',
          },
          {
            label: 'Active Guardrails',
            value: activeRules,
            detail: 'Daily caps, transaction caps, and recipient controls.',
            icon: ShieldCheck,
            accent: 'text-emerald-400',
          },
          {
            label: 'Recurring Due Now',
            value: duePayments,
            detail: `Active recurring schedules estimate ${monthlyRecurringTotal.toFixed(2)} USDT per month.`,
            icon: CalendarClock,
            accent: 'text-amber-400',
          },
        ].map((item) => (
          <div key={item.label} className="glass-card rounded-2xl p-5">
            <div className="mb-3 flex items-center justify-between">
              <item.icon className={cn('h-5 w-5', item.accent)} />
              <span className="text-xs uppercase tracking-[0.18em] text-slate-500">Live</span>
            </div>
            <p className="text-3xl font-bold text-white">{item.value}</p>
            <p className="mt-1 text-sm font-medium text-slate-300">{item.label}</p>
            <p className="mt-2 text-xs leading-5 text-slate-500">{item.detail}</p>
          </div>
        ))}
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="glass-card rounded-3xl p-6">
          <div className="mb-5 flex items-center gap-3">
            <Target className="h-5 w-5 text-cyan-400" />
            <h2 className="text-lg font-semibold text-white">Roadmap Phases</h2>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {roadmapPhaseStatuses.map((phase) => (
              <div key={phase.id} className="rounded-2xl border border-cyan-500/10 bg-dark-950/40 p-4">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-white">{phase.title}</h3>
                    <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500">{phase.window}</p>
                  </div>
                  <span className={cn('rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase', phaseStatusStyles[phase.status])}>
                    {phase.status.replace('_', ' ')}
                  </span>
                </div>

                <p className="mb-4 text-sm leading-6 text-slate-400">{phase.objective}</p>

                <div className="mb-4">
                  <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
                    <span>Progress</span>
                    <span>{phase.progress}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-dark-900">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-teal-400"
                      style={{ width: `${phase.progress}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="mb-2 text-xs uppercase tracking-[0.16em] text-slate-500">Shipped</p>
                    <div className="space-y-2">
                      {phase.shipped.map((item) => (
                        <div key={item} className="flex items-start gap-2 text-sm text-slate-300">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="mb-2 text-xs uppercase tracking-[0.16em] text-slate-500">Next</p>
                    <div className="space-y-2">
                      {phase.next.map((item) => (
                        <div key={item} className="flex items-start gap-2 text-sm text-slate-300">
                          <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-card rounded-3xl p-6">
            <div className="mb-5 flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              <h2 className="text-lg font-semibold text-white">MVP Checklist</h2>
            </div>

            <div className="space-y-3">
              {mvpChecklist.map((item) => (
                <div key={item.id} className="rounded-2xl border border-cyan-500/10 bg-dark-950/35 p-4">
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold text-white">{item.label}</p>
                    <span className="rounded-full bg-emerald-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase text-emerald-400">
                      {item.status}
                    </span>
                  </div>
                  <p className="text-xs leading-5 text-slate-400">
                    {readinessNotes[item.id] ?? item.note}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card rounded-3xl p-6">
            <div className="mb-5 flex items-center gap-3">
              <Flag className="h-5 w-5 text-cyan-400" />
              <h2 className="text-lg font-semibold text-white">Next Build Priorities</h2>
            </div>
            <div className="space-y-3">
              {nextBuildPriorities.map((item) => (
                <div key={item} className="rounded-2xl border border-cyan-500/10 bg-dark-950/35 p-4 text-sm leading-6 text-slate-300">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_1fr]">
        <div className="glass-card rounded-3xl p-6">
          <div className="mb-5 flex items-center gap-3">
            <CalendarClock className="h-5 w-5 text-teal-400" />
            <h2 className="text-lg font-semibold text-white">Milestones</h2>
          </div>

          <div className="space-y-3">
            {roadmapMilestones.map((milestone) => (
              <div key={milestone.title} className="rounded-2xl border border-cyan-500/10 bg-dark-950/35 p-4">
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">{milestone.title}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-500">{milestone.targetDate}</p>
                  </div>
                  <span className={cn('rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase', milestoneStatusStyles[milestone.status])}>
                    {milestone.status.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-sm leading-6 text-slate-400">{milestone.note}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-3xl p-6">
          <div className="mb-5 flex items-center gap-3">
            <ShieldAlert className="h-5 w-5 text-amber-400" />
            <h2 className="text-lg font-semibold text-white">Risks</h2>
          </div>

          <div className="space-y-3">
            {projectRisks.map((risk) => (
              <div key={risk.title} className="rounded-2xl border border-cyan-500/10 bg-dark-950/35 p-4">
                <div className="mb-2 flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold text-white">{risk.title}</p>
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
                </div>
                <div className="mb-3 flex flex-wrap gap-3 text-[11px] uppercase tracking-[0.14em] text-slate-500">
                  <span>
                    Impact{' '}
                    <span className={cn('font-semibold', riskLevelStyles[risk.impact])}>
                      {risk.impact}
                    </span>
                  </span>
                  <span>
                    Likelihood{' '}
                    <span className={cn('font-semibold', riskLevelStyles[risk.likelihood])}>
                      {risk.likelihood}
                    </span>
                  </span>
                </div>
                <p className="text-sm leading-6 text-slate-400">{risk.mitigation}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
