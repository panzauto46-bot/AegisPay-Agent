import { Bot } from 'grammy';
import type { SerializedAgentState } from '../lib/agentState';
import { loadServerConfig } from './config';

const config = loadServerConfig();

if (!config.telegramBotToken) {
  throw new Error('Missing TELEGRAM_BOT_TOKEN. Telegram bot cannot start.');
}

const bot = new Bot(config.telegramBotToken);

async function sendCommand(input: string) {
  const response = await fetch(`${config.serverUrl}/api/command`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
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

bot.command('start', async (context) => {
  await context.reply(
    'AegisPay Agent is online.\n\nTry commands like:\n- Create wallet\n- What is my balance?\n- Send 10 USDT to 0x...\n- Run scheduler',
  );
});

bot.on('message:text', async (context) => {
  try {
    const reply = await sendCommand(context.message.text);
    await context.reply(reply, {
      parse_mode: 'Markdown',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected Telegram bridge failure';
    await context.reply(`AegisPay Telegram bridge error:\n${message}`);
  }
});

bot.start({
  onStart() {
    console.log('AegisPay Telegram bot started.');
  },
});
