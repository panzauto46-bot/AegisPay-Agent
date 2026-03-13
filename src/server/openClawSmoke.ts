import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import dotenv from 'dotenv';
import { createInitialAgentState } from '../lib/agentRuntime';
import { OpenClawReasoningProvider } from './providers/openClawReasoningProvider';
import { loadServerConfig } from './config';

dotenv.config();

const execFileAsync = promisify(execFile);

interface OpenClawModelsStatus {
  defaultModel?: string;
}

async function runCommand(command: string, args: string[], timeoutMs: number) {
  const result = await execFileAsync(command, args, {
    timeout: timeoutMs,
    maxBuffer: 1024 * 1024,
  });

  return (result.stdout ?? '').toString();
}

function parseModelsStatus(output: string): OpenClawModelsStatus | null {
  try {
    return JSON.parse(output) as OpenClawModelsStatus;
  } catch {
    return null;
  }
}

function assertIntentAction(actual: string, expected: string, input: string) {
  if (actual !== expected) {
    throw new Error(`Unexpected action for "${input}". Expected "${expected}", got "${actual}".`);
  }
}

async function main() {
  const config = loadServerConfig();
  const command = config.openClawCommand;

  await runCommand(command, ['--help'], 10_000);

  const statusRaw = await runCommand(command, ['models', 'status', '--json'], 10_000);
  const modelStatus = parseModelsStatus(statusRaw);
  console.log('[OpenClaw Smoke] CLI command:', command);
  if (modelStatus?.defaultModel) {
    console.log('[OpenClaw Smoke] Default model:', modelStatus.defaultModel);
  }

  const provider = new OpenClawReasoningProvider({
    command,
    timeoutMs: config.openClawTimeoutMs,
    sessionId: config.openClawSessionId,
    useLocal: config.openClawUseLocal,
    thinkingLevel: config.openClawThinkingLevel,
  });

  const state = createInitialAgentState();
  const checks = [
    {
      input: 'What is my balance?',
      expected: 'check_balance',
    },
    {
      input: 'Show project status',
      expected: 'project_status',
    },
    {
      input: 'Send 10 USDT to 0x7a3b79b8c1497de4ceb8f6e2469fea7ba1344f2e',
      expected: 'send_payment',
    },
  ] as const;

  for (const check of checks) {
    const intent = await provider.analyze(check.input, state);
    console.log(`[OpenClaw Smoke] "${check.input}" => ${intent.action}`);
    assertIntentAction(intent.action, check.expected, check.input);
  }

  console.log('[OpenClaw Smoke] Completed successfully.');
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : 'Unexpected OpenClaw smoke failure.';
  console.error('[OpenClaw Smoke] Failed:', message);
  process.exit(1);
});
