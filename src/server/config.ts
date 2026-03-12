import dotenv from 'dotenv';
import { DEFAULT_EXPLORER_BASE_URL, NETWORK_NAME } from '../lib/agentRuntime';

dotenv.config();

export interface AegisServerConfig {
  port: number;
  walletProvider: 'demo' | 'wdk';
  reasoningProvider: 'deterministic' | 'openai' | 'openclaw';
  rpcUrl?: string;
  walletSeedPhrase?: string;
  tokenAddress?: string;
  tokenDecimals: number;
  transferMaxFeeWei?: bigint;
  explorerBaseUrl: string;
  networkName: string;
  openAiApiKey?: string;
  openAiModel: string;
  openAiModels: string[];
  openAiBaseUrl: string;
  openClawCommand: string;
  openClawTimeoutMs: number;
  schedulerEnabled: boolean;
  schedulerIntervalMs: number;
  schedulerRunOnStart: boolean;
  telegramBotToken?: string;
  serverUrl: string;
}

function getOptionalEnv(name: string) {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

function getBooleanEnv(name: string, fallback: boolean) {
  const value = getOptionalEnv(name);
  if (!value) {
    return fallback;
  }

  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
}

function getListEnv(name: string) {
  const value = getOptionalEnv(name);
  if (!value) {
    return [];
  }

  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function loadServerConfig(): AegisServerConfig {
  const configuredWalletProvider = (process.env.AEGIS_WALLET_PROVIDER?.trim().toLowerCase() as 'demo' | 'wdk' | undefined) ?? 'demo';
  const configuredReasoningProvider = (process.env.AEGIS_REASONING_PROVIDER?.trim().toLowerCase() as 'deterministic' | 'openai' | 'openclaw' | undefined) ?? 'deterministic';
  const port = Number.parseInt(process.env.AEGIS_PORT ?? '8787', 10);
  const tokenDecimals = Number.parseInt(process.env.AEGIS_TOKEN_DECIMALS ?? '6', 10);
  const schedulerIntervalMs = Number.parseInt(process.env.AEGIS_SCHEDULER_INTERVAL_MS ?? '60000', 10);
  const openClawTimeoutMs = Number.parseInt(process.env.AEGIS_OPENCLAW_TIMEOUT_MS ?? '15000', 10);
  const transferMaxFee = getOptionalEnv('AEGIS_TRANSFER_MAX_FEE_WEI');
  const openAiModel = getOptionalEnv('AEGIS_OPENAI_MODEL') ?? 'gpt-5-mini';
  const openAiModels = getListEnv('AEGIS_OPENAI_MODELS');
  const openAiApiKey = getOptionalEnv('OPENAI_API_KEY');
  const hasWdkConfig = Boolean(getOptionalEnv('AEGIS_WALLET_SEED_PHRASE') && getOptionalEnv('AEGIS_EVM_RPC_URL') && getOptionalEnv('AEGIS_USDT_TOKEN_ADDRESS'));

  let walletProvider = configuredWalletProvider;
  if (walletProvider === 'wdk' && !hasWdkConfig) {
    console.warn('[AegisPay] WDK mode requested but required env vars are missing. Falling back to demo wallet provider.');
    walletProvider = 'demo';
  }

  let reasoningProvider = configuredReasoningProvider;
  if (reasoningProvider === 'openai' && !openAiApiKey) {
    console.warn('[AegisPay] OpenAI-compatible reasoning requested but OPENAI_API_KEY is missing. Falling back to deterministic reasoning.');
    reasoningProvider = 'deterministic';
  }

  let transferMaxFeeWei: bigint | undefined;
  if (transferMaxFee) {
    try {
      transferMaxFeeWei = BigInt(transferMaxFee);
    } catch {
      console.warn('[AegisPay] Invalid AEGIS_TRANSFER_MAX_FEE_WEI value. Ignoring transfer max fee configuration.');
    }
  }

  return {
    port: Number.isFinite(port) ? port : 8787,
    walletProvider,
    reasoningProvider,
    rpcUrl: getOptionalEnv('AEGIS_EVM_RPC_URL'),
    walletSeedPhrase: getOptionalEnv('AEGIS_WALLET_SEED_PHRASE'),
    tokenAddress: getOptionalEnv('AEGIS_USDT_TOKEN_ADDRESS'),
    tokenDecimals: Number.isFinite(tokenDecimals) ? tokenDecimals : 6,
    transferMaxFeeWei,
    explorerBaseUrl: getOptionalEnv('AEGIS_EXPLORER_BASE_URL') ?? DEFAULT_EXPLORER_BASE_URL,
    networkName: getOptionalEnv('AEGIS_NETWORK_NAME') ?? NETWORK_NAME,
    openAiApiKey,
    openAiModel,
    openAiModels: openAiModels.length > 0 ? openAiModels : [openAiModel],
    openAiBaseUrl: getOptionalEnv('AEGIS_OPENAI_BASE_URL') ?? 'https://api.openai.com/v1',
    openClawCommand: getOptionalEnv('AEGIS_OPENCLAW_COMMAND') ?? 'openclaw',
    openClawTimeoutMs: Number.isFinite(openClawTimeoutMs) ? openClawTimeoutMs : 15000,
    schedulerEnabled: getBooleanEnv('AEGIS_SCHEDULER_ENABLED', true),
    schedulerIntervalMs: Number.isFinite(schedulerIntervalMs) ? schedulerIntervalMs : 60000,
    schedulerRunOnStart: getBooleanEnv('AEGIS_SCHEDULER_RUN_ON_START', false),
    telegramBotToken: getOptionalEnv('TELEGRAM_BOT_TOKEN'),
    serverUrl: getOptionalEnv('AEGIS_SERVER_URL') ?? `http://localhost:${port}`,
  };
}
