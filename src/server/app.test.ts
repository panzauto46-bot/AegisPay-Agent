import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { AgentEngine } from '../engine/agentEngine';
import { DemoWalletProvider } from '../engine/demoWalletProvider';
import { createApp } from './app';

function createTestApp() {
  const engine = new AgentEngine({
    walletProvider: new DemoWalletProvider(),
  });

  return createApp({ engine, allowedOrigins: ['*'] });
}

function createProtectedTestApp(apiKey = 'test-api-key') {
  const engine = new AgentEngine({
    walletProvider: new DemoWalletProvider(),
  });

  return createApp({
    engine,
    apiKey,
    allowedOrigins: ['https://example.com'],
  });
}

describe('AegisPay API', () => {
  it('returns health metadata', async () => {
    const app = createTestApp();

    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
    expect(response.body.scheduler).toBeDefined();
    expect(response.body.reasoningProvider).toBeDefined();
    expect(response.body.persistence).toBeDefined();
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

  it('runs scheduler cron endpoint when CRON_SECRET is not set', async () => {
    delete process.env.CRON_SECRET;
    const app = createTestApp();

    const response = await request(app).post('/api/scheduler/cron');

    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
    expect(response.body.state).toBeDefined();
  });

  it('rejects unauthorized scheduler cron endpoint requests when CRON_SECRET is set', async () => {
    process.env.CRON_SECRET = 'test-secret';
    const app = createTestApp();

    const response = await request(app).post('/api/scheduler/cron');

    expect(response.status).toBe(401);
    expect(response.body.error).toContain('Unauthorized');
    delete process.env.CRON_SECRET;
  });

  it('accepts authorized scheduler cron endpoint requests when CRON_SECRET is set', async () => {
    process.env.CRON_SECRET = 'test-secret';
    const app = createTestApp();

    const response = await request(app).post('/api/scheduler/cron').set('authorization', 'Bearer test-secret');

    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
    expect(response.body.state).toBeDefined();
    delete process.env.CRON_SECRET;
  });

  it('blocks protected API routes when API key auth is enabled', async () => {
    const app = createProtectedTestApp();

    const response = await request(app)
      .post('/api/command')
      .send({ input: 'What is my balance?' });

    expect(response.status).toBe(401);
    expect(response.body.error).toContain('Unauthorized');
  });

  it('allows protected API routes with x-aegis-api-key header', async () => {
    const app = createProtectedTestApp();

    const response = await request(app)
      .post('/api/command')
      .set('x-aegis-api-key', 'test-api-key')
      .send({ input: 'What is my balance?' });

    expect(response.status).toBe(200);
    expect(response.body.state.messages.at(-1).action).toBe('balance_check');
  });

  it('keeps health route public even when API key auth is enabled', async () => {
    const app = createProtectedTestApp();
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
  });

  it('allows preflight requests when API key auth is enabled', async () => {
    const app = createProtectedTestApp();

    const response = await request(app)
      .options('/api/command')
      .set('origin', 'https://example.com')
      .set('access-control-request-method', 'POST');

    expect(response.status).toBe(204);
  });
});
