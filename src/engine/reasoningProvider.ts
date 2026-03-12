import { extractAddresses, extractAmount, extractFrequency } from '../lib/agentRuntime';
import type { AgentState, SpendingRule } from '../types';

export type AgentIntent =
  | { action: 'help' }
  | { action: 'project_status' }
  | { action: 'run_scheduler' }
  | { action: 'create_wallet'; walletName?: string }
  | { action: 'list_wallets' }
  | { action: 'check_balance' }
  | {
      action: 'schedule_payment';
      amount?: number | null;
      recipientAddress?: string;
      frequency: 'daily' | 'weekly' | 'monthly';
      recipientLabel?: string;
    }
  | {
      action: 'update_address_rule';
      ruleType: 'whitelist' | 'blacklist';
      addresses: string[];
    }
  | {
      action: 'update_numeric_rule';
      ruleType: 'daily_limit' | 'max_transaction';
      amount?: number | null;
    }
  | { action: 'history' }
  | {
      action: 'send_payment';
      amount?: number | null;
      recipientAddress?: string;
    }
  | { action: 'unknown' };

export interface ReasoningProvider {
  readonly label: string;
  analyze(input: string, state: AgentState): Promise<AgentIntent>;
}

function inferWalletName(input: string) {
  const match = input.match(/wallet(?:\s+named|\s+called)?\s+["']?([a-z0-9 _-]{3,})["']?/i);
  if (!match) {
    return undefined;
  }

  const candidate = match[1].trim();
  if (/^(create|new)$/i.test(candidate)) {
    return undefined;
  }

  return candidate
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function inferRecipientLabel(input: string) {
  const forMatch = input.match(/for\s+([a-z0-9 _-]+)/i);
  if (!forMatch) {
    return undefined;
  }

  return forMatch[1]
    .trim()
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export class DeterministicReasoningProvider implements ReasoningProvider {
  readonly label = 'deterministic';

  async analyze(input: string): Promise<AgentIntent> {
    const lower = input.toLowerCase();

    if (lower.includes('help') || lower.includes('what can') || lower.includes('commands')) {
      return { action: 'help' };
    }

    if (
      lower.includes('project status') ||
      lower.includes('roadmap') ||
      lower.includes('progress') ||
      lower.includes('milestone')
    ) {
      return { action: 'project_status' };
    }

    if (
      lower.includes('run scheduler') ||
      lower.includes('process recurring') ||
      lower.includes('execute due payment')
    ) {
      return { action: 'run_scheduler' };
    }

    if ((lower.includes('create') || lower.includes('new')) && lower.includes('wallet')) {
      return {
        action: 'create_wallet',
        walletName: inferWalletName(input),
      };
    }

    if (
      lower.includes('show my wallets') ||
      lower.includes('show wallets') ||
      lower.includes('list wallets')
    ) {
      return { action: 'list_wallets' };
    }

    if (lower.includes('balance') || lower.includes('how much') || lower.includes('funds')) {
      return { action: 'check_balance' };
    }

    if (
      lower.includes('whitelist') ||
      lower.includes('allowlist') ||
      lower.startsWith('allow ') ||
      lower.includes('allow recipient')
    ) {
      return {
        action: 'update_address_rule',
        ruleType: 'whitelist',
        addresses: extractAddresses(input),
      };
    }

    if (
      lower.includes('blacklist') ||
      lower.includes('blocklist') ||
      lower.startsWith('block ') ||
      lower.includes('block recipient')
    ) {
      return {
        action: 'update_address_rule',
        ruleType: 'blacklist',
        addresses: extractAddresses(input),
      };
    }

    if (
      lower.includes('limit') ||
      lower.includes('max transaction') ||
      lower.includes('spending rule') ||
      lower.includes('restrict')
    ) {
      return {
        action: 'update_numeric_rule',
        ruleType: lower.includes('daily') ? 'daily_limit' : 'max_transaction',
        amount: extractAmount(lower),
      };
    }

    if (lower.includes('history') || lower.includes('transactions')) {
      return { action: 'history' };
    }

    if (
      lower.includes('recurring') ||
      lower.includes('monthly') ||
      lower.includes('weekly') ||
      lower.includes('daily') ||
      lower.includes('every month') ||
      lower.includes('every week') ||
      lower.includes('every day')
    ) {
      return {
        action: 'schedule_payment',
        amount: extractAmount(lower),
        recipientAddress: extractAddresses(input)[0],
        frequency: extractFrequency(lower),
        recipientLabel: inferRecipientLabel(input),
      };
    }

    if (lower.includes('send') || lower.includes('pay') || lower.includes('transfer')) {
      return {
        action: 'send_payment',
        amount: extractAmount(lower),
        recipientAddress: extractAddresses(input)[0],
      };
    }

    return { action: 'unknown' };
  }
}

interface OpenAIReasoningProviderOptions {
  apiKey: string;
  model: string;
  models?: string[];
  baseUrl?: string;
  fallback?: ReasoningProvider;
}

class ReasoningProviderHttpError extends Error {
  constructor(
    message: string,
    readonly status?: number,
    readonly code?: string,
    readonly body?: string,
  ) {
    super(message);
  }
}

function safeParseJson(value: string) {
  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function parseProviderError(status: number, bodyText: string) {
  const parsed = safeParseJson(bodyText);
  const rootError = parsed && typeof parsed.error === 'object' && parsed.error !== null
    ? parsed.error as Record<string, unknown>
    : parsed;

  const code = typeof rootError?.code === 'string' ? rootError.code : undefined;
  const message = typeof rootError?.message === 'string'
    ? rootError.message
    : bodyText || `Reasoning request failed with status ${status}.`;

  return {
    code,
    message,
  };
}

function shouldRetryWithNextModel(error: unknown) {
  if (!(error instanceof ReasoningProviderHttpError)) {
    const message = error instanceof Error ? error.message.toLowerCase() : '';
    return (
      message.includes('structured output') ||
      message.includes('json') ||
      message.includes('unsupported')
    );
  }

  const status = error.status ?? 0;
  const code = error.code?.toLowerCase() ?? '';
  const message = error.message.toLowerCase();

  if ([403, 408, 409, 429, 500, 502, 503, 504].includes(status)) {
    return true;
  }

  return [
    'allocationquota',
    'free tier',
    'free quota',
    'quota',
    'insufficient_quota',
    'rate limit',
    'rate_limit',
    'capacity',
    'unsupported',
    'not support',
    'modelnotfound',
    'model_not_found',
    'resource exhausted',
  ].some((needle) => code.includes(needle) || message.includes(needle));
}

function getOpenAiStateSummary(state: AgentState) {
  const primaryWallet = state.wallets[0];
  const ruleSummary = state.rules.map((rule) => ({
    type: rule.type,
    enabled: rule.enabled,
    value: rule.value,
  }));

  return {
    walletCount: state.wallets.length,
    primaryWalletBalance: primaryWallet?.balance ?? 0,
    activeRuleCount: state.rules.filter((rule) => rule.enabled).length,
    activeRecurringCount: state.recurringPayments.filter((payment) => payment.active).length,
    dueRecurringCount: state.recurringPayments.filter((payment) => payment.active && payment.nextExecution <= new Date()).length,
    ruleSummary,
  };
}

const intentSchema = {
  type: 'object',
  additionalProperties: false,
  properties: {
    action: {
      type: 'string',
      enum: [
        'help',
        'project_status',
        'run_scheduler',
        'create_wallet',
        'list_wallets',
        'check_balance',
        'schedule_payment',
        'update_address_rule',
        'update_numeric_rule',
        'history',
        'send_payment',
        'unknown',
      ],
    },
    walletName: { type: ['string', 'null'] },
    amount: { type: ['number', 'null'] },
    recipientAddress: { type: ['string', 'null'] },
    frequency: { type: ['string', 'null'], enum: ['daily', 'weekly', 'monthly', null] },
    recipientLabel: { type: ['string', 'null'] },
    ruleType: {
      type: ['string', 'null'],
      enum: ['whitelist', 'blacklist', 'daily_limit', 'max_transaction', null],
    },
    addresses: {
      type: ['array', 'null'],
      items: { type: 'string' },
    },
  },
  required: ['action', 'walletName', 'amount', 'recipientAddress', 'frequency', 'recipientLabel', 'ruleType', 'addresses'],
} as const;

function readOutputText(response: Record<string, unknown>) {
  if (typeof response.output_text === 'string' && response.output_text.trim()) {
    return response.output_text;
  }

  const output = Array.isArray(response.output) ? response.output : [];
  for (const item of output) {
    if (!item || typeof item !== 'object') {
      continue;
    }

    const content = Array.isArray((item as { content?: unknown[] }).content)
      ? ((item as { content: unknown[] }).content)
      : [];

    for (const part of content) {
      if (!part || typeof part !== 'object') {
        continue;
      }

      const text = (part as { text?: unknown }).text;
      if (typeof text === 'string' && text.trim()) {
        return text;
      }
    }
  }

  return null;
}

export class OpenAIReasoningProvider implements ReasoningProvider {
  readonly label = 'openai';

  private readonly apiKey: string;
  private readonly models: string[];
  private readonly baseUrl: string;
  private readonly fallback?: ReasoningProvider;

  constructor(options: OpenAIReasoningProviderOptions) {
    this.apiKey = options.apiKey;
    this.models = Array.from(new Set([...(options.models ?? []), options.model].map((model) => model.trim()).filter(Boolean)));
    this.baseUrl = options.baseUrl ?? 'https://api.openai.com/v1';
    this.fallback = options.fallback;
  }

  async analyze(input: string, state: AgentState): Promise<AgentIntent> {
    try {
      let lastError: unknown;

      for (let index = 0; index < this.models.length; index += 1) {
        const model = this.models[index];
        try {
          return await this.analyzeWithModel(model, input, state);
        } catch (error) {
          lastError = error;
          const hasFallbackModel = index < this.models.length - 1;
          if (hasFallbackModel && shouldRetryWithNextModel(error)) {
            continue;
          }

          throw error;
        }
      }

      throw lastError ?? new Error('No reasoning model is configured.');
    } catch {
      if (this.fallback) {
        return this.fallback.analyze(input, state);
      }

      return { action: 'unknown' };
    }
  }

  private async analyzeWithModel(model: string, input: string, state: AgentState): Promise<AgentIntent> {
    const summary = getOpenAiStateSummary(state);
    const response = await fetch(`${this.baseUrl}/responses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model,
        input: [
          {
            role: 'system',
            content: [
              {
                type: 'input_text',
                text:
                  'You classify wallet-agent commands into a strict JSON intent. Prefer the closest supported action. Never invent wallet addresses or amounts. If required data is missing, return the intended action with null fields.',
              },
            ],
          },
          {
            role: 'user',
            content: [
              {
                type: 'input_text',
                text: `Current agent state:\n${JSON.stringify(summary, null, 2)}\n\nUser command:\n${input}`,
              },
            ],
          },
        ],
        text: {
          format: {
            type: 'json_schema',
            name: 'aegispay_intent',
            strict: true,
            schema: intentSchema,
          },
        },
      }),
    });

    if (!response.ok) {
      const bodyText = await response.text();
      const parsedError = parseProviderError(response.status, bodyText);
      throw new ReasoningProviderHttpError(parsedError.message, response.status, parsedError.code, bodyText);
    }

    const payload = (await response.json()) as Record<string, unknown>;
    const outputText = readOutputText(payload);
    if (!outputText) {
      throw new Error(`Model ${model} did not include structured output text.`);
    }

    const parsed = JSON.parse(outputText) as {
      action: AgentIntent['action'];
      walletName?: string | null;
      amount?: number | null;
      recipientAddress?: string | null;
      frequency?: 'daily' | 'weekly' | 'monthly' | null;
      recipientLabel?: string | null;
      ruleType?: SpendingRule['type'] | null;
      addresses?: string[] | null;
    };

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
}

export class FallbackReasoningProvider implements ReasoningProvider {
  readonly label: string;

  constructor(private readonly providers: ReasoningProvider[]) {
    this.label = providers.map((provider) => provider.label).join(' -> ');
  }

  async analyze(input: string, state: AgentState): Promise<AgentIntent> {
    for (const provider of this.providers) {
      const intent = await provider.analyze(input, state);
      if (intent.action !== 'unknown') {
        return intent;
      }
    }

    return { action: 'unknown' };
  }
}
