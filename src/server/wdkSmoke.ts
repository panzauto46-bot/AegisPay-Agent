import dotenv from 'dotenv';
import { createInitialWallets } from '../lib/agentRuntime';
import { loadServerConfig } from './config';
import { WdkWalletProvider } from './providers/wdkWalletProvider';

dotenv.config();

function isTruthy(value: string | undefined) {
  return ['1', 'true', 'yes', 'on'].includes((value ?? '').trim().toLowerCase());
}

function getRequiredEnv(name: string) {
  const value = process.env[name]?.trim();
  return value && value.length > 0 ? value : undefined;
}

function getMissingRequiredEnv() {
  const required = ['AEGIS_WALLET_SEED_PHRASE', 'AEGIS_EVM_RPC_URL', 'AEGIS_USDT_TOKEN_ADDRESS'];
  return required.filter((name) => !getRequiredEnv(name));
}

async function main() {
  const missingEnv = getMissingRequiredEnv();
  if (missingEnv.length > 0) {
    throw new Error(`Missing required env vars for WDK smoke test: ${missingEnv.join(', ')}`);
  }

  const serverConfig = loadServerConfig();
  if (serverConfig.walletProvider !== 'wdk') {
    throw new Error('AEGIS_WALLET_PROVIDER must be set to "wdk" for live smoke verification.');
  }

  const provider = new WdkWalletProvider({
    seedPhrase: serverConfig.walletSeedPhrase!,
    rpcUrl: serverConfig.rpcUrl!,
    tokenAddress: serverConfig.tokenAddress!,
    tokenDecimals: serverConfig.tokenDecimals,
    transferMaxFeeWei: serverConfig.transferMaxFeeWei,
    explorerBaseUrl: serverConfig.explorerBaseUrl,
    networkName: serverConfig.networkName,
  });

  const [wallet] = await provider.refreshWallets(createInitialWallets().slice(0, 1));
  const recipient = process.env.AEGIS_WDK_SMOKE_RECIPIENT?.trim() || wallet.address;
  const amount = Number.parseFloat(process.env.AEGIS_WDK_SMOKE_AMOUNT ?? '0.01');
  const execute = isTruthy(process.env.AEGIS_WDK_SMOKE_EXECUTE);

  console.log('[WDK Smoke] Network:', wallet.network);
  console.log('[WDK Smoke] Wallet address:', wallet.address);
  console.log('[WDK Smoke] Token balance:', wallet.balance, wallet.token);
  console.log('[WDK Smoke] Native balance:', wallet.nativeBalance ?? 0);
  console.log('[WDK Smoke] Recipient:', recipient);
  console.log('[WDK Smoke] Amount:', amount, wallet.token);

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('AEGIS_WDK_SMOKE_AMOUNT must be a positive number.');
  }

  if (!execute) {
    console.log('[WDK Smoke] Read-only check complete. Set AEGIS_WDK_SMOKE_EXECUTE=true to execute transfer.');
    return;
  }

  if (wallet.balance < amount) {
    throw new Error(`Insufficient token balance. Required ${amount}, available ${wallet.balance}.`);
  }

  const transfer = await provider.sendToken({
    wallet,
    recipient,
    amount,
    token: wallet.token,
  });

  console.log('[WDK Smoke] Transfer submitted successfully.');
  console.log('[WDK Smoke] Hash:', transfer.hash);
  if (transfer.explorerUrl) {
    console.log('[WDK Smoke] Explorer:', transfer.explorerUrl);
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : 'Unexpected WDK smoke failure.';
  console.error('[WDK Smoke] Failed:', message);
  process.exit(1);
});

