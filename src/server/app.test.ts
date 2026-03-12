import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { AgentEngine } from '../engine/agentEngine';
import { DemoWalletProvider } from '../engine/demoWalletProvider';
import { createApp } from './app';

function createTestApp() {
  const engine = new AgentEngine({
    walletProvider: new DemoWalletProvider(),
  });

  return createApp({ engine });
}

describe('AegisPay API', () => {
  it('returns health metadata', async () => {
    const app = createTestApp();

    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
    expect(response.body.scheduler).toBeDefined();
    expect(response.body.reasoningProvider).toBeDefined();
  });

  it('processes commands through the API', async () => {
    const app = createTestApp();

    const response = await request(app)
      .post('/api/command')
      .send({ input: 'What is my balance?' });

    expect(response.status).toBe(200);
    expect(response.body.state.wallets.length).toBeGreaterThan(0);
    expect(response.body.state.messages.at(-1).action).toBe('balance_check');
  });

  it('returns runtime status metadata', async () => {
    const app = createTestApp();

    const response = await request(app).get('/api/runtime');

    expect(response.status).toBe(200);
    expect(response.body.walletProvider).toBeDefined();
    expect(response.body.scheduler).toBeDefined();
  });
});
