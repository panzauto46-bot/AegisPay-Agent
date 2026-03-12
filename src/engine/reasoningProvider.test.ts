import { afterEach, describe, expect, it, vi } from 'vitest';
import { OpenAIReasoningProvider } from './reasoningProvider';
import { createInitialAgentState } from '../lib/agentRuntime';

const state = createInitialAgentState();

describe('OpenAIReasoningProvider', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('falls back to the next model when the first model quota is exhausted', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            error: {
              code: 'AllocationQuota.FreeTierOnly',
              message: 'The free tier of the model has been exhausted.',
            },
          }),
          {
            status: 403,
            headers: {
              'Content-Type': 'application/json',
            },
          },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            output_text: JSON.stringify({
              action: 'check_balance',
              walletName: null,
              amount: null,
              recipientAddress: null,
              frequency: null,
              recipientLabel: null,
              ruleType: null,
              addresses: null,
            }),
          }),
          {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
            },
          },
        ),
      );

    const provider = new OpenAIReasoningProvider({
      apiKey: 'test-key',
      model: 'qwen-plus',
      models: ['qwen-plus', 'qwen-turbo'],
      baseUrl: 'https://example.com/v1',
    });

    const result = await provider.analyze('What is my balance?', state);

    expect(result).toEqual({ action: 'check_balance' });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0]?.[0]).toBe('https://example.com/v1/responses');
    expect(fetchMock.mock.calls[1]?.[0]).toBe('https://example.com/v1/responses');

    const firstBody = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body)) as { model: string };
    const secondBody = JSON.parse(String(fetchMock.mock.calls[1]?.[1]?.body)) as { model: string };

    expect(firstBody.model).toBe('qwen-plus');
    expect(secondBody.model).toBe('qwen-turbo');
  });
});
