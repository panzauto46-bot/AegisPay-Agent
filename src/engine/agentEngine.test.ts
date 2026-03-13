import { describe, expect, it, vi } from 'vitest';
import { AgentEngine } from './agentEngine';
import { DemoWalletProvider } from './demoWalletProvider';

const RECIPIENT_A = '0x8b2f0c0bf2920e6f1d4ee93e7db0ab17c1d4e002';
const RECIPIENT_B = '0x4e7ac5519fd3b57f8c2fd269f92b5131aa8c2f10';

function createEngine() {
  return new AgentEngine({
    walletProvider: new DemoWalletProvider(),
  });
}

describe('AgentEngine', () => {
  it('creates a new wallet from natural language', async () => {
    const engine = createEngine();

    const before = await engine.getState(false);
    const after = await engine.processCommand('Create a new wallet');

    expect(after.wallets).toHaveLength(before.wallets.length + 1);
    expect(after.messages.at(-1)?.action).toBe('wallet_created');
  });

  it('rejects sends that exceed the active max transaction rule', async () => {
    const engine = createEngine();

    const state = await engine.processCommand(`Send 250 USDT to ${RECIPIENT_A}`);

    expect(state.transactions[0]?.description).not.toContain('Send 250 USDT');
    expect(state.messages.at(-1)?.action).toBe('tx_rejected');
    expect(state.messages.at(-1)?.content).toContain('max transaction limit');
  });

  it('runs the scheduler for due recurring payments', async () => {
    const engine = createEngine();

    const before = await engine.getState(false);
    const after = await engine.runScheduler();

    expect(after.lastSchedulerRun).not.toBeNull();
    expect(after.transactions.length).toBeGreaterThan(before.transactions.length);
    expect(after.transactions[0]?.type).toBe('recurring');
    expect(after.transactions[0]?.to).toBe(RECIPIENT_B.toLowerCase());
  });

  it('emits state change callbacks for persistence hooks', async () => {
    const onStateChange = vi.fn();
    const engine = new AgentEngine({
      walletProvider: new DemoWalletProvider(),
      onStateChange,
    });

    await engine.processCommand('What is my balance?');

    expect(onStateChange).toHaveBeenCalled();
  });
});
