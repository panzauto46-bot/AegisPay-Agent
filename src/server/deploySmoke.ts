import dotenv from 'dotenv';

dotenv.config();

interface JsonObject {
  [key: string]: unknown;
}

function getRequiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} is required.`);
  }
  return value;
}

function trimTrailingSlash(url: string) {
  return url.endsWith('/') ? url.slice(0, -1) : url;
}

function getAuthHeaders(): Record<string, string> {
  const apiKey = process.env.AEGIS_API_KEY?.trim();
  if (!apiKey) {
    return {};
  }

  return {
    'x-aegis-api-key': apiKey,
  };
}

async function fetchJson(path: string, options?: RequestInit) {
  const baseUrl = trimTrailingSlash(getRequiredEnv('AEGIS_DEPLOYMENT_URL'));
  const response = await fetch(`${baseUrl}${path}`, options);
  const bodyText = await response.text();

  let parsedBody: JsonObject | null = null;
  try {
    parsedBody = bodyText ? (JSON.parse(bodyText) as JsonObject) : null;
  } catch {
    parsedBody = null;
  }

  return {
    ok: response.ok,
    status: response.status,
    bodyText,
    body: parsedBody,
  };
}

function assertResponse(ok: boolean, message: string) {
  if (!ok) {
    throw new Error(message);
  }
}

async function main() {
  const expectedWalletProvider = process.env.AEGIS_EXPECTED_WALLET_PROVIDER?.trim();
  const expectedReasoningProvider = process.env.AEGIS_EXPECTED_REASONING_PROVIDER?.trim();
  const authHeaders = getAuthHeaders();

  const health = await fetchJson('/api/health');
  assertResponse(health.ok, `Health check failed (${health.status}): ${health.bodyText}`);
  assertResponse(Boolean(health.body?.ok), 'Health payload missing `ok: true`.');

  const runtime = await fetchJson('/api/runtime');
  assertResponse(runtime.ok, `Runtime check failed (${runtime.status}): ${runtime.bodyText}`);

  const state = await fetchJson('/api/state', {
    headers: authHeaders,
  });
  assertResponse(
    state.ok,
    `State check failed (${state.status}). If API auth is enabled, set AEGIS_API_KEY for this smoke run.`,
  );
  assertResponse(Boolean(state.body?.state), 'State payload missing `state` object.');

  const walletProvider = String(runtime.body?.walletProvider ?? '');
  const reasoningProvider = String(runtime.body?.reasoningProvider ?? '');

  if (expectedWalletProvider) {
    assertResponse(
      walletProvider === expectedWalletProvider,
      `Wallet provider mismatch. Expected ${expectedWalletProvider}, got ${walletProvider || 'unknown'}.`,
    );
  }

  if (expectedReasoningProvider) {
    assertResponse(
      reasoningProvider === expectedReasoningProvider,
      `Reasoning provider mismatch. Expected ${expectedReasoningProvider}, got ${reasoningProvider || 'unknown'}.`,
    );
  }

  console.log('[Deploy Smoke] Health endpoint: OK');
  console.log('[Deploy Smoke] Runtime endpoint: OK');
  console.log('[Deploy Smoke] State endpoint: OK');
  console.log('[Deploy Smoke] Wallet provider:', walletProvider);
  console.log('[Deploy Smoke] Reasoning provider:', reasoningProvider);
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : 'Unexpected deployment smoke failure.';
  console.error('[Deploy Smoke] Failed:', message);
  process.exit(1);
});
