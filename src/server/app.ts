import path from 'node:path';
import express from 'express';
import cors from 'cors';
import { AgentEngine } from '../engine/agentEngine';
import { serializeAgentState } from '../lib/agentState';
import type { RecurringPayment, SpendingRule } from '../types';
import { agentEngine, schedulerService, serverConfig, stateStore } from './runtime';

function isRuleType(value: unknown): value is SpendingRule['type'] {
  return value === 'daily_limit' || value === 'max_transaction' || value === 'whitelist' || value === 'blacklist';
}

function isRecurringFrequency(value: unknown): value is RecurringPayment['frequency'] {
  return value === 'daily' || value === 'weekly' || value === 'monthly';
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Unexpected server error';
}

function normalizeApiPath(requestPath: string) {
  return requestPath.startsWith('/api') ? requestPath : `/api${requestPath}`;
}

function isPublicApiRoute(request: express.Request) {
  const path = normalizeApiPath(request.path);
  return path === '/api/health' || path === '/api/runtime' || path === '/api/scheduler/cron';
}

function isAllowedCorsOrigin(origin: string | undefined, allowedOrigins: string[]) {
  if (!origin) {
    return true;
  }

  return allowedOrigins.includes('*') || allowedOrigins.includes(origin);
}

function isAuthorizedApiRequest(request: express.Request, apiKey: string | undefined) {
  if (!apiKey) {
    return true;
  }

  const authorization = request.header('authorization');
  const directApiKey = request.header('x-aegis-api-key');
  return authorization === `Bearer ${apiKey}` || directApiKey === apiKey;
}

function isAuthorizedCronRequest(request: express.Request) {
  const cronSecret = process.env.CRON_SECRET?.trim();
  if (!cronSecret) {
    return true;
  }

  const authorization = request.header('authorization');
  return authorization === `Bearer ${cronSecret}`;
}

interface CreateAppOptions {
  engine?: AgentEngine;
  apiKey?: string;
  allowedOrigins?: string[];
}

export function createApp(options: CreateAppOptions = {}) {
  const engine = options.engine ?? agentEngine;
  const apiKey = options.apiKey ?? serverConfig.apiKey;
  const allowedOrigins = options.allowedOrigins ?? serverConfig.allowedOrigins;
  const app = express();

  app.use(
    cors({
      origin(origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) {
        callback(null, isAllowedCorsOrigin(origin, allowedOrigins));
      },
      credentials: true,
    }),
  );
  app.use(express.json());
  app.use('/api', (request, response, next) => {
    if (request.method === 'OPTIONS') {
      next();
      return;
    }

    if (isPublicApiRoute(request)) {
      next();
      return;
    }

    if (!isAuthorizedApiRequest(request, apiKey)) {
      response.status(401).json({
        error: 'Unauthorized API request.',
      });
      return;
    }

    next();
  });

  app.get('/api/health', async (_request, response) => {
    response.json({
      ok: true,
      walletProvider: serverConfig.walletProvider,
      reasoningProvider: serverConfig.reasoningProvider,
      apiAuthEnabled: Boolean(apiKey),
      allowedOrigins,
      port: serverConfig.port,
      scheduler: schedulerService.getStatus(),
      persistence: stateStore.getStatus(),
      serverTime: new Date().toISOString(),
    });
  });

  app.get('/api/runtime', async (_request, response) => {
    response.json({
      walletProvider: serverConfig.walletProvider,
      reasoningProvider: serverConfig.reasoningProvider,
      scheduler: schedulerService.getStatus(),
      security: {
        apiAuthEnabled: Boolean(apiKey),
        allowedOrigins,
      },
      persistence: stateStore.getStatus(),
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

  app.post('/api/scheduler/cron', async (request, response, next) => {
    try {
      if (!isAuthorizedCronRequest(request)) {
        response.status(401).json({
          error: 'Unauthorized cron request.',
        });
        return;
      }

      const state = await engine.runScheduler();
      response.json({
        ok: true,
        state: serializeAgentState(state),
        executedAt: new Date().toISOString(),
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
