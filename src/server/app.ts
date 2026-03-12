import path from 'node:path';
import express from 'express';
import cors from 'cors';
import { AgentEngine } from '../engine/agentEngine';
import { serializeAgentState } from '../lib/agentState';
import type { RecurringPayment, SpendingRule } from '../types';
import { agentEngine, schedulerService, serverConfig } from './runtime';

function isRuleType(value: unknown): value is SpendingRule['type'] {
  return value === 'daily_limit' || value === 'max_transaction' || value === 'whitelist' || value === 'blacklist';
}

function isRecurringFrequency(value: unknown): value is RecurringPayment['frequency'] {
  return value === 'daily' || value === 'weekly' || value === 'monthly';
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unexpected server error';
}

interface CreateAppOptions {
  engine?: AgentEngine;
}

export function createApp(options: CreateAppOptions = {}) {
  const engine = options.engine ?? agentEngine;
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get('/api/health', async (_request, response) => {
    response.json({
      ok: true,
      walletProvider: serverConfig.walletProvider,
      reasoningProvider: serverConfig.reasoningProvider,
      port: serverConfig.port,
      scheduler: schedulerService.getStatus(),
      serverTime: new Date().toISOString(),
    });
  });

  app.get('/api/runtime', async (_request, response) => {
    response.json({
      walletProvider: serverConfig.walletProvider,
      reasoningProvider: serverConfig.reasoningProvider,
      scheduler: schedulerService.getStatus(),
    });
  });

  app.get('/api/state', async (_request, response, next) => {
    try {
      const state = await engine.getState(true);
      response.json({
        state: serializeAgentState(state),
        walletProvider: serverConfig.walletProvider,
      });
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/command', async (request, response, next) => {
    try {
      const input = typeof request.body?.input === 'string' ? request.body.input.trim() : '';
      if (!input) {
        response.status(400).json({ error: 'Command input is required.' });
        return;
      }

      const state = await engine.processCommand(input);
      response.json({
        state: serializeAgentState(state),
      });
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/wallets', async (request, response, next) => {
    try {
      const name = typeof request.body?.name === 'string' ? request.body.name.trim() : undefined;
      const state = await engine.createWallet(name);
      response.json({
        state: serializeAgentState(state),
      });
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/rules', async (request, response, next) => {
    try {
      const { type, label, value } = request.body ?? {};
      if (!isRuleType(type) || typeof label !== 'string') {
        response.status(400).json({ error: 'Invalid rule payload.' });
        return;
      }

      const state = await engine.addRule(type, label.trim(), value);
      response.json({
        state: serializeAgentState(state),
      });
    } catch (error) {
      next(error);
    }
  });

  app.patch('/api/rules/:id/toggle', async (request, response, next) => {
    try {
      const state = await engine.toggleRule(request.params.id);
      response.json({
        state: serializeAgentState(state),
      });
    } catch (error) {
      next(error);
    }
  });

  app.delete('/api/rules/:id', async (request, response, next) => {
    try {
      const state = await engine.deleteRule(request.params.id);
      response.json({
        state: serializeAgentState(state),
      });
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/recurring', async (request, response, next) => {
    try {
      const payload = request.body ?? {};
      if (
        typeof payload.recipient !== 'string' ||
        typeof payload.recipientAddress !== 'string' ||
        typeof payload.amount !== 'number' ||
        typeof payload.token !== 'string' ||
        !isRecurringFrequency(payload.frequency) ||
        typeof payload.active !== 'boolean' ||
        typeof payload.description !== 'string'
      ) {
        response.status(400).json({ error: 'Invalid recurring payment payload.' });
        return;
      }

      const state = await engine.addRecurringPayment({
        recipient: payload.recipient.trim(),
        recipientAddress: payload.recipientAddress.trim(),
        amount: payload.amount,
        token: payload.token,
        frequency: payload.frequency,
        nextExecution: new Date(payload.nextExecution ?? Date.now()),
        active: payload.active,
        description: payload.description.trim(),
      });

      response.json({
        state: serializeAgentState(state),
      });
    } catch (error) {
      next(error);
    }
  });

  app.patch('/api/recurring/:id/toggle', async (request, response, next) => {
    try {
      const state = await engine.toggleRecurring(request.params.id);
      response.json({
        state: serializeAgentState(state),
      });
    } catch (error) {
      next(error);
    }
  });

  app.delete('/api/recurring/:id', async (request, response, next) => {
    try {
      const state = await engine.deleteRecurring(request.params.id);
      response.json({
        state: serializeAgentState(state),
      });
    } catch (error) {
      next(error);
    }
  });

  app.post('/api/scheduler/run', async (_request, response, next) => {
    try {
      const state = await engine.runScheduler();
      response.json({
        state: serializeAgentState(state),
      });
    } catch (error) {
      next(error);
    }
  });

  const distPath = path.resolve(process.cwd(), 'dist');
  app.use(express.static(distPath));
  app.use((request, response, next) => {
    if (request.path.startsWith('/api')) {
      next();
      return;
    }

    response.sendFile(path.join(distPath, 'index.html'));
  });

  app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
    response.status(500).json({
      error: getErrorMessage(error),
    });
  });

  return app;
}
