import dotenv from 'dotenv';
import { createInitialWallets, isValidAddress } from '../lib/agentRuntime';
import { loadServerConfig } from './config';
import { WdkWalletProvider } from './providers/wdkWalletProvider';
import type { Wallet } from '../types';

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

function getOptionalIntegerEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    return undefined;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(`${name} must be a non-negative integer when provided.`);
  }

  return parsed;
}

function getPositiveIntegerEnv(name: string, fallback: number) {
  const parsed = getOptionalIntegerEnv(name);
  if (parsed === undefined) {
    return fallback;
  }

  if (parsed <= 0) {
    throw new Error(`${name} must be greater than zero.`);
  }

  return parsed;
}

function createProbeWallets(startIndex: number, count: number): Wallet[] {
  const [baseWallet] = createInitialWallets();
  return Array.from({ length: count }, (_, offset) => {
    const walletIndex = startIndex + offset;
    return {
      ...baseWallet,
      id: `wdk-smoke-${walletIndex}`,
      name: `WDK Smoke ${walletIndex}`,
      walletIndex,
      createdAt: new Date(),
    };
  });
}

function selectWalletForSmoke(wallets: Wallet[]) {
  const fullyFunded = wallets.find((wallet) => wallet.balance > 0 && (wallet.nativeBalance ?? 0) > 0);
  if (fullyFunded) {
    return fullyFunded;
  }

  const tokenOnly = wallets.find((wallet) => wallet.balance > 0);
  if (tokenOnly) {
    return tokenOnly;
  }

  return wallets[0];
}

function printWalletScan(wallets: Wallet[]) {
  console.log(`[WDK Smoke] Scanned ${wallets.length} account(s):`);
  for (const wallet of wallets) {
    console.log(
      `[WDK Smoke] - #${wallet.walletIndex ?? 0} ${wallet.address} | ${wallet.balance} ${wallet.token} | native ${wallet.nativeBalance ?? 0}`,
    );
  }
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

  const accountIndex = getOptionalIntegerEnv('AEGIS_WDK_SMOKE_ACCOUNT_INDEX');
  const scanCount = getPositiveIntegerEnv('AEGIS_WDK_SMOKE_SCAN_COUNT', accountIndex === undefined ? 12 : 1);
  const probeWallets = createProbeWallets(accountIndex ?? 0, scanCount);
  const refreshedWallets = await provider.refreshWallets(probeWallets);
  const wallet = selectWalletForSmoke(refreshedWallets);
  const recipient = process.env.AEGIS_WDK_SMOKE_RECIPIENT?.trim() || wallet.address;
  const amount = Number.parseFloat(process.env.AEGIS_WDK_SMOKE_AMOUNT ?? '0.01');
  const execute = isTruthy(process.env.AEGIS_WDK_SMOKE_EXECUTE);

  printWalletScan(refreshedWallets);
  console.log('[WDK Smoke] Selected account index:', wallet.walletIndex ?? 0);
  console.log('[WDK Smoke] Network:', wallet.network);
  console.log('[WDK Smoke] Wallet address:', wallet.address);
  console.log('[WDK Smoke] Token balance:', wallet.balance, wallet.token);
  console.log('[WDK Smoke] Native balance:', wallet.nativeBalance ?? 0);
  console.log('[WDK Smoke] Recipient:', recipient);
  console.log('[WDK Smoke] Amount:', amount, wallet.token);

  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('AEGIS_WDK_SMOKE_AMOUNT must be a positive number.');
  }

  if (!isValidAddress(recipient)) {
    throw new Error('AEGIS_WDK_SMOKE_RECIPIENT must be a valid EVM address.');
  }

  if (!execute) {
    console.log('[WDK Smoke] Read-only check complete. Set AEGIS_WDK_SMOKE_EXECUTE=true to execute transfer.');
    return;
  }

  if ((wallet.nativeBalance ?? 0) <= 0) {
    throw new Error('Selected account has no native balance for gas. Fund it with Sepolia ETH first.');
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
