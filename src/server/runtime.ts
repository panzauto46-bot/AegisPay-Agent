import { AgentEngine } from '../engine/agentEngine';
import { DemoWalletProvider } from '../engine/demoWalletProvider';
import {
  DeterministicReasoningProvider,
  FallbackReasoningProvider,
  OpenAIReasoningProvider,
  type ReasoningProvider,
} from '../engine/reasoningProvider';
import type { WalletProvider } from '../engine/walletProvider';
import { loadServerConfig } from './config';
import { SchedulerService } from './schedulerService';
import { createRequire } from 'node:module';

export const serverConfig = loadServerConfig();
const require = createRequire(import.meta.url);

function createWalletProvider(): WalletProvider {
  if (serverConfig.walletProvider === 'wdk') {
    const { WdkWalletProvider } = require('./providers/wdkWalletProvider') as typeof import('./providers/wdkWalletProvider');
    return new WdkWalletProvider({
      seedPhrase: serverConfig.walletSeedPhrase!,
      rpcUrl: serverConfig.rpcUrl!,
      tokenAddress: serverConfig.tokenAddress!,
      tokenDecimals: serverConfig.tokenDecimals,
      transferMaxFeeWei: serverConfig.transferMaxFeeWei,
      explorerBaseUrl: serverConfig.explorerBaseUrl,
      networkName: serverConfig.networkName,
    });
  }

  return new DemoWalletProvider();
}

function createReasoningProvider(): ReasoningProvider {
  const deterministicProvider = new DeterministicReasoningProvider();

  if (serverConfig.reasoningProvider === 'openai' && serverConfig.openAiApiKey) {
    return new FallbackReasoningProvider([
      new OpenAIReasoningProvider({
        apiKey: serverConfig.openAiApiKey,
        model: serverConfig.openAiModel,
        models: serverConfig.openAiModels,
        baseUrl: serverConfig.openAiBaseUrl,
        fallback: deterministicProvider,
      }),
      deterministicProvider,
    ]);
  }

  return deterministicProvider;
}

export const agentEngine = new AgentEngine({
  walletProvider: createWalletProvider(),
  reasoningProvider: createReasoningProvider(),
});

export const schedulerService = new SchedulerService({
  engine: agentEngine,
  enabled: serverConfig.schedulerEnabled,
  intervalMs: serverConfig.schedulerIntervalMs,
  runOnStart: serverConfig.schedulerRunOnStart,
});
