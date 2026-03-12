import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import type { AgentState, SpendingRule } from '../../types';
import type { AgentIntent, ReasoningProvider } from '../../engine/reasoningProvider';

const execFileAsync = promisify(execFile);

interface OpenClawIntentShape {
  action?: AgentIntent['action'];
  walletName?: string | null;
  amount?: number | null;
  recipientAddress?: string | null;
  frequency?: 'daily' | 'weekly' | 'monthly' | null;
  recipientLabel?: string | null;
  ruleType?: SpendingRule['type'] | null;
  addresses?: string[] | null;
}

export interface OpenClawReasoningProviderOptions {
  command: string;
  timeoutMs: number;
  fallback?: ReasoningProvider;
  runner?: (command: string, prompt: string, timeoutMs: number) => Promise<string>;
}

function getStateSummary(state: AgentState) {
  const primaryWallet = state.wallets[0];

  return {
    walletCount: state.wallets.length,
    primaryWalletBalance: primaryWallet?.balance ?? 0,
    activeRuleCount: state.rules.filter((rule) => rule.enabled).length,
    activeRecurringCount: state.recurringPayments.filter((payment) => payment.active).length,
    dueRecurringCount: state.recurringPayments.filter((payment) => payment.active && payment.nextExecution <= new Date()).length,
  };
}

function buildOpenClawPrompt(input: string, state: AgentState) {
  const summary = getStateSummary(state);

  return [
    'You are classifying an AegisPay wallet-agent command.',
    'Return only a single JSON object. No markdown, no extra text.',
    'Use this schema exactly:',
    '{"action":"help|project_status|run_scheduler|create_wallet|list_wallets|check_balance|schedule_payment|update_address_rule|update_numeric_rule|history|send_payment|unknown","walletName":string|null,"amount":number|null,"recipientAddress":string|null,"frequency":"daily|weekly|monthly"|null,"recipientLabel":string|null,"ruleType":"whitelist|blacklist|daily_limit|max_transaction"|null,"addresses":string[]|null}',
    'If information is missing, keep the action and set missing fields to null.',
    `Current state: ${JSON.stringify(summary)}`,
    `User command: ${input}`,
  ].join('\n');
}

async function runOpenClaw(command: string, prompt: string, timeoutMs: number) {
  const result = await execFileAsync(
    command,
    ['agent', '--message', prompt, '--thinking', 'high'],
    {
      timeout: timeoutMs,
      maxBuffer: 1024 * 1024,
    },
  );

  return result.stdout?.toString() ?? '';
}

function extractJsonObject(value: string) {
  const fenced = value.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const source = fenced?.[1] ?? value;
  const start = source.indexOf('{');
  if (start < 0) {
    return null;
  }

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = start; index < source.length; index += 1) {
    const char = source[index];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }

      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === '{') {
      depth += 1;
      continue;
    }

    if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        return source.slice(start, index + 1);
      }
    }
  }

  return null;
}

function normalizeIntent(parsed: OpenClawIntentShape): AgentIntent {
  switch (parsed.action) {
    case 'create_wallet':
      return { action: 'create_wallet', walletName: parsed.walletName ?? undefined };
    case 'schedule_payment':
      return {
        action: 'schedule_payment',
        amount: parsed.amount ?? null,
        recipientAddress: parsed.recipientAddress ?? undefined,
        frequency: parsed.frequency ?? 'monthly',
        recipientLabel: parsed.recipientLabel ?? undefined,
      };
    case 'update_address_rule':
      if (parsed.ruleType === 'whitelist' || parsed.ruleType === 'blacklist') {
        return {
          action: 'update_address_rule',
          ruleType: parsed.ruleType,
          addresses: parsed.addresses ?? [],
        };
      }
      return { action: 'unknown' };
    case 'update_numeric_rule':
      if (parsed.ruleType === 'daily_limit' || parsed.ruleType === 'max_transaction') {
        return {
          action: 'update_numeric_rule',
          ruleType: parsed.ruleType,
          amount: parsed.amount ?? null,
        };
      }
      return { action: 'unknown' };
    case 'send_payment':
      return {
        action: 'send_payment',
        amount: parsed.amount ?? null,
        recipientAddress: parsed.recipientAddress ?? undefined,
      };
    case 'help':
    case 'project_status':
    case 'run_scheduler':
    case 'list_wallets':
    case 'check_balance':
    case 'history':
    case 'unknown':
      return { action: parsed.action };
    default:
      return { action: 'unknown' };
  }
}

export class OpenClawReasoningProvider implements ReasoningProvider {
  readonly label = 'openclaw';

  private readonly command: string;
  private readonly timeoutMs: number;
  private readonly fallback?: ReasoningProvider;
  private readonly runner: (command: string, prompt: string, timeoutMs: number) => Promise<string>;

  constructor(options: OpenClawReasoningProviderOptions) {
    this.command = options.command;
    this.timeoutMs = options.timeoutMs;
    this.fallback = options.fallback;
    this.runner = options.runner ?? runOpenClaw;
  }

  async analyze(input: string, state: AgentState): Promise<AgentIntent> {
    try {
      const prompt = buildOpenClawPrompt(input, state);
      const output = await this.runner(this.command, prompt, this.timeoutMs);
      const jsonPayload = extractJsonObject(output);

      if (!jsonPayload) {
        throw new Error('OpenClaw output did not include a valid JSON object.');
      }

      const parsed = JSON.parse(jsonPayload) as OpenClawIntentShape;
      return normalizeIntent(parsed);
    } catch {
      if (this.fallback) {
        return this.fallback.analyze(input, state);
      }

      return { action: 'unknown' };
    }
  }
}

