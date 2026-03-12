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
import { WdkWalletProvider } from './providers/wdkWalletProvider';
import { SchedulerService } from './schedulerService';

export const serverConfig = loadServerConfig();

function createWalletProvider(): WalletProvider {
  if (serverConfig.walletProvider === 'wdk') {
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
