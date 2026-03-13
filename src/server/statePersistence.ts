import fs from 'node:fs';
import path from 'node:path';
import { deserializeAgentState, serializeAgentState, type SerializedAgentState } from '../lib/agentState';
import type { AgentState } from '../types';

interface PersistedAgentStateV1 {
  version: 1;
  savedAt: string;
  state: SerializedAgentState;
}

export interface StatePersistenceStatus {
  enabled: boolean;
  filePath: string;
  loadedFromDisk: boolean;
  lastLoadAt: string | null;
  lastSaveAt: string | null;
  lastLoadError: string | null;
  lastSaveError: string | null;
}

interface JsonFileStateStoreOptions {
  enabled: boolean;
  filePath: string;
}

function isPersistedV1(value: unknown): value is PersistedAgentStateV1 {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const candidate = value as Partial<PersistedAgentStateV1>;
  return candidate.version === 1 && typeof candidate.savedAt === 'string' && Boolean(candidate.state);
}

export class JsonFileStateStore {
  private readonly enabled: boolean;
  private readonly filePath: string;
  private loadedFromDisk = false;
  private lastLoadAt: Date | null = null;
  private lastSaveAt: Date | null = null;
  private lastLoadError: string | null = null;
  private lastSaveError: string | null = null;

  constructor(options: JsonFileStateStoreOptions) {
    this.enabled = options.enabled;
    this.filePath = options.filePath;
  }

  load(): AgentState | undefined {
    if (!this.enabled) {
      return undefined;
    }

    if (!fs.existsSync(this.filePath)) {
      return undefined;
    }

    try {
      const raw = fs.readFileSync(this.filePath, 'utf8');
      const parsed = JSON.parse(raw) as unknown;
      const serializedState = isPersistedV1(parsed) ? parsed.state : (parsed as SerializedAgentState);
      const state = deserializeAgentState(serializedState);

      this.loadedFromDisk = true;
      this.lastLoadAt = new Date();
      this.lastLoadError = null;
      return state;
    } catch (error) {
      this.lastLoadError = error instanceof Error ? error.message : 'Unexpected persistence load failure';
      return undefined;
    }
  }

  save(state: AgentState) {
    if (!this.enabled) {
      return;
    }

    const payload: PersistedAgentStateV1 = {
      version: 1,
      savedAt: new Date().toISOString(),
      state: serializeAgentState(state),
    };

    try {
      fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
      const temporaryFilePath = `${this.filePath}.tmp`;
      fs.writeFileSync(temporaryFilePath, JSON.stringify(payload, null, 2), 'utf8');
      fs.renameSync(temporaryFilePath, this.filePath);
      this.lastSaveAt = new Date();
      this.lastSaveError = null;
    } catch (error) {
      this.lastSaveError = error instanceof Error ? error.message : 'Unexpected persistence save failure';
      throw error;
    }
  }

  getStatus(): StatePersistenceStatus {
    return {
      enabled: this.enabled,
      filePath: this.filePath,
      loadedFromDisk: this.loadedFromDisk,
      lastLoadAt: this.lastLoadAt?.toISOString() ?? null,
      lastSaveAt: this.lastSaveAt?.toISOString() ?? null,
      lastLoadError: this.lastLoadError,
      lastSaveError: this.lastSaveError,
    };
  }
}
