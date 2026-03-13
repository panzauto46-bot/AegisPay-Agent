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

  it('runs flat scheduler cron alias endpoint when CRON_SECRET is not set', async () => {
    delete process.env.CRON_SECRET;
    const app = createTestApp();

    const response = await request(app).post('/api/scheduler-cron');

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

  it('supports flat toggle/delete rule endpoints with id in body', async () => {
    const app = createTestApp();

    const created = await request(app)
      .post('/api/rules')
      .send({ type: 'daily_limit', label: 'Temp Rule', value: 123 });

    expect(created.status).toBe(200);
    const createdRule = created.body.state.rules.find((rule: { label: string }) => rule.label === 'Temp Rule');
    expect(createdRule).toBeDefined();

    const toggled = await request(app)
      .post('/api/rules-toggle')
      .send({ id: createdRule.id });

    expect(toggled.status).toBe(200);
    const toggledRule = toggled.body.state.rules.find((rule: { id: string }) => rule.id === createdRule.id);
    expect(toggledRule.enabled).toBe(false);

    const deleted = await request(app)
      .post('/api/rules-delete')
      .send({ id: createdRule.id });

    expect(deleted.status).toBe(200);
    const stillExists = deleted.body.state.rules.some((rule: { id: string }) => rule.id === createdRule.id);
    expect(stillExists).toBe(false);
  });

  it('supports flat toggle/delete recurring endpoints with id in body', async () => {
    const app = createTestApp();

    const created = await request(app)
      .post('/api/recurring')
      .send({
        recipient: 'Temp Recipient',
        recipientAddress: '0xabc123',
        amount: 10,
        token: 'USDT',
        frequency: 'monthly',
        nextExecution: new Date().toISOString(),
        active: true,
        description: 'Temp recurring payment',
      });

    expect(created.status).toBe(200);
    const createdRecurring = created.body.state.recurringPayments.find((payment: { description: string }) => payment.description === 'Temp recurring payment');
    expect(createdRecurring).toBeDefined();

    const toggled = await request(app)
      .post('/api/recurring-toggle')
      .send({ id: createdRecurring.id });

    expect(toggled.status).toBe(200);
    const toggledRecurring = toggled.body.state.recurringPayments.find((payment: { id: string }) => payment.id === createdRecurring.id);
    expect(toggledRecurring.active).toBe(false);

    const deleted = await request(app)
      .post('/api/recurring-delete')
      .send({ id: createdRecurring.id });

    expect(deleted.status).toBe(200);
    const stillExists = deleted.body.state.recurringPayments.some((payment: { id: string }) => payment.id === createdRecurring.id);
    expect(stillExists).toBe(false);
  });
});
