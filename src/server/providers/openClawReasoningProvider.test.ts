import { describe, expect, it } from 'vitest';
import { DeterministicReasoningProvider } from '../../engine/reasoningProvider';
import { createInitialAgentState } from '../../lib/agentRuntime';
import { OpenClawReasoningProvider } from './openClawReasoningProvider';

describe('OpenClawReasoningProvider', () => {
  it('parses JSON intent output from OpenClaw runner', async () => {
    const state = createInitialAgentState();
    let capturedArgs: string[] = [];
    const provider = new OpenClawReasoningProvider({
      command: 'openclaw',
      timeoutMs: 15000,
      sessionId: 'aegispay-test',
      useLocal: true,
      thinkingLevel: 'high',
      runner: async (_command, args) => {
        capturedArgs = args;
        return JSON.stringify({
          action: 'send_payment',
          walletName: null,
          amount: 15,
          recipientAddress: '0x7a3b79b8c1497de4ceb8f6e2469fea7ba1344f2e',
          frequency: null,
          recipientLabel: null,
          ruleType: null,
          addresses: null,
        });
      },
    });

    const intent = await provider.analyze('send 15 usdt', state);
    expect(intent).toEqual({
      action: 'send_payment',
      amount: 15,
      recipientAddress: '0x7a3b79b8c1497de4ceb8f6e2469fea7ba1344f2e',
    });
    expect(capturedArgs).toContain('--local');
    expect(capturedArgs).toContain('--session-id');
    expect(capturedArgs).toContain('aegispay-test');
  });

  it('falls back when OpenClaw runner fails', async () => {
    const state = createInitialAgentState();
    const provider = new OpenClawReasoningProvider({
      command: 'openclaw',
      timeoutMs: 15000,
      sessionId: 'aegispay-test',
      useLocal: true,
      thinkingLevel: 'high',
      fallback: new DeterministicReasoningProvider(),
      runner: async () => {
        throw new Error('openclaw unavailable');
      },
    });

    const intent = await provider.analyze('what is my balance?', state);
    expect(intent).toEqual({ action: 'check_balance' });
  });
});
