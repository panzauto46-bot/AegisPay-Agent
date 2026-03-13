import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { createInitialAgentState } from '../lib/agentRuntime';
import { JsonFileStateStore } from './statePersistence';

const tempDirs: string[] = [];

function createTempFilePath() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'aegispay-state-'));
  tempDirs.push(directory);
  return path.join(directory, 'agent-state.json');
}

afterEach(() => {
  while (tempDirs.length > 0) {
    const directory = tempDirs.pop();
    if (directory && fs.existsSync(directory)) {
      fs.rmSync(directory, { recursive: true, force: true });
    }
  }
});

describe('JsonFileStateStore', () => {
  it('persists and restores serialized agent state', () => {
    const filePath = createTempFilePath();
    const state = createInitialAgentState();
    state.wallets[0] = {
      ...state.wallets[0],
      balance: 999.42,
    };

    const writer = new JsonFileStateStore({
      enabled: true,
      filePath,
    });
    writer.save(state);

    const reader = new JsonFileStateStore({
      enabled: true,
      filePath,
    });
    const restored = reader.load();

    expect(restored).toBeDefined();
    expect(restored?.wallets[0]?.balance).toBe(999.42);
    expect(restored?.messages.length).toBe(state.messages.length);
    expect(reader.getStatus().loadedFromDisk).toBe(true);
  });

  it('is a no-op when disabled', () => {
    const filePath = createTempFilePath();
    const store = new JsonFileStateStore({
      enabled: false,
      filePath,
    });

    const state = createInitialAgentState();
    store.save(state);

    expect(fs.existsSync(filePath)).toBe(false);
    expect(store.load()).toBeUndefined();
  });
});
