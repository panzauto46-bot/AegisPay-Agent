import { describe, expect, it, vi } from 'vitest';
import { createAegisApiHeaders, createAegisApiUrl, sendAegisCommand } from './telegramBridge';

describe('telegramBridge', () => {
  it('builds API URL without duplicate slashes', () => {
    expect(createAegisApiUrl('https://aegis-pay-agent.vercel.app/', '/api/command')).toBe(
      'https://aegis-pay-agent.vercel.app/api/command',
    );
  });

  it('adds API key header when provided', () => {
    expect(createAegisApiHeaders('my-secret')).toEqual({
      'Content-Type': 'application/json',
      'x-aegis-api-key': 'my-secret',
    });
  });

  it('forwards command to API and returns latest agent reply', async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          state: {
            wallets: [],
            transactions: [],
            rules: [],
            recurringPayments: [],
            messages: [
              {
                id: 'msg-user',
                role: 'user',
                content: 'What is my balance?',
                timestamp: new Date().toISOString(),
              },
              {
                id: 'msg-agent',
                role: 'agent',
                content: 'Your balance is 100 USDT.',
                timestamp: new Date().toISOString(),
              },
            ],
            lastSchedulerRun: null,
          },
        }),
        { status: 200 },
      ),
    );

    const reply = await sendAegisCommand(
      'What is my balance?',
      {
        serverUrl: 'https://aegis-pay-agent.vercel.app/',
        apiKey: 'my-secret',
      },
      fetcher as unknown as typeof fetch,
    );

    expect(fetcher).toHaveBeenCalledWith(
      'https://aegis-pay-agent.vercel.app/api/command',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'x-aegis-api-key': 'my-secret',
        }),
      }),
    );
    expect(reply).toBe('Your balance is 100 USDT.');
  });

  it('throws API error body when command request fails', async () => {
    const fetcher = vi.fn().mockResolvedValue(new Response('{"error":"Unauthorized API request."}', { status: 401 }));

    await expect(
      sendAegisCommand(
        'What is my balance?',
        {
          serverUrl: 'https://aegis-pay-agent.vercel.app',
          apiKey: 'wrong-key',
        },
        fetcher as unknown as typeof fetch,
      ),
    ).rejects.toThrow('Unauthorized API request');
  });
});
