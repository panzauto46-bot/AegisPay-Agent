import type { SerializedAgentState } from '../lib/agentState';

export interface TelegramBridgeConfig {
  serverUrl: string;
  apiKey?: string;
}

function trimTrailingSlash(value: string) {
  return value.endsWith('/') ? value.slice(0, -1) : value;
}

export function createAegisApiUrl(serverUrl: string, path: string) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${trimTrailingSlash(serverUrl)}${normalizedPath}`;
}

export function createAegisApiHeaders(apiKey?: string) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (apiKey?.trim()) {
    headers['x-aegis-api-key'] = apiKey.trim();
  }

  return headers;
}

export async function sendAegisCommand(
  input: string,
  config: TelegramBridgeConfig,
  fetcher: typeof fetch = fetch,
) {
  const response = await fetcher(createAegisApiUrl(config.serverUrl, '/api/command'), {
    method: 'POST',
    headers: createAegisApiHeaders(config.apiKey),
    body: JSON.stringify({ input }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`AegisPay API error: ${errorText}`);
  }

  const payload = (await response.json()) as { state: SerializedAgentState };
  const lastAgentMessage = [...payload.state.messages].reverse().find((message) => message.role === 'agent');

  return lastAgentMessage?.content ?? 'AegisPay processed the command, but no reply was returned.';
}
