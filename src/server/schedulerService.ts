import type { AgentEngine } from '../engine/agentEngine';

export interface SchedulerStatus {
  enabled: boolean;
  started: boolean;
  running: boolean;
  intervalMs: number;
  tickCount: number;
  lastTickStartedAt: string | null;
  lastTickFinishedAt: string | null;
  lastError: string | null;
}

interface SchedulerServiceOptions {
  engine: AgentEngine;
  enabled: boolean;
  intervalMs: number;
  runOnStart?: boolean;
}

export class SchedulerService {
  private timer: ReturnType<typeof setInterval> | null = null;
  private started = false;
  private running = false;
  private tickCount = 0;
  private lastTickStartedAt: Date | null = null;
  private lastTickFinishedAt: Date | null = null;
  private lastError: string | null = null;

  constructor(private readonly options: SchedulerServiceOptions) {}

  start() {
    if (!this.options.enabled || this.started) {
      return;
    }

    this.started = true;
    this.timer = setInterval(() => {
      this.tick('interval').catch((error) => {
        this.lastError = error instanceof Error ? error.message : 'Unexpected scheduler failure';
      });
    }, this.options.intervalMs);

    if (this.options.runOnStart) {
      this.tick('startup').catch((error) => {
        this.lastError = error instanceof Error ? error.message : 'Unexpected scheduler failure';
      });
    }
  }

  async tick(_reason: 'startup' | 'interval' | 'manual') {
    if (this.running) {
      return;
    }

    this.running = true;
    this.tickCount += 1;
    this.lastTickStartedAt = new Date();
    this.lastError = null;

    try {
      await this.options.engine.runScheduler();
    } catch (error) {
      this.lastError = error instanceof Error ? error.message : 'Unexpected scheduler failure';
      throw error;
    } finally {
      this.lastTickFinishedAt = new Date();
      this.running = false;
    }
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.started = false;
  }

  getStatus(): SchedulerStatus {
    return {
      enabled: this.options.enabled,
      started: this.started,
      running: this.running,
      intervalMs: this.options.intervalMs,
      tickCount: this.tickCount,
      lastTickStartedAt: this.lastTickStartedAt ? this.lastTickStartedAt.toISOString() : null,
      lastTickFinishedAt: this.lastTickFinishedAt ? this.lastTickFinishedAt.toISOString() : null,
      lastError: this.lastError,
    };
  }
}
