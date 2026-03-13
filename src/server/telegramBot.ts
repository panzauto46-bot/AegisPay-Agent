import { Bot, type Context } from 'grammy';
import { loadServerConfig } from './config';
import { sendAegisCommand } from './telegramBridge';

const config = loadServerConfig();

if (!config.telegramBotToken) {
  throw new Error('Missing TELEGRAM_BOT_TOKEN. Telegram bot cannot start.');
}

const bot = new Bot(config.telegramBotToken);

async function replyWithFallback(context: Context, text: string) {
  try {
    await context.reply(text, {
      parse_mode: 'Markdown',
    });
  } catch {
    await context.reply(text);
  }
}

bot.command('start', async (context) => {
  await replyWithFallback(
    context,
    'AegisPay Agent is online.\n\nTry commands like:\n- Create wallet\n- What is my balance?\n- Send 10 USDT to 0x...\n- Run scheduler',
  );
});

bot.on('message:text', async (context) => {
  try {
    const reply = await sendAegisCommand(context.message.text, {
      serverUrl: config.serverUrl,
      apiKey: config.apiKey,
    });
    await replyWithFallback(context, reply);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected Telegram bridge failure';
    await replyWithFallback(context, `AegisPay Telegram bridge error:\n${message}`);
  }
});

bot.start({
  onStart() {
    const authMode = config.apiKey ? 'API key enabled' : 'API key disabled';
    console.log(`AegisPay Telegram bot started. (${authMode})`);
  },
});
