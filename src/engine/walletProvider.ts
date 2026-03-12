import type { Wallet } from '../types';

export interface WalletTransferResult {
  hash: string;
  fee?: string;
  explorerUrl?: string;
}

export interface CreateWalletInput {
  walletCount: number;
  name: string;
}

export interface WalletTransferInput {
  wallet: Wallet;
  recipient: string;
  amount: number;
  token: string;
}

export interface WalletProvider {
  readonly mode: 'demo' | 'live';
  readonly label: string;
  createWallet(input: CreateWalletInput): Promise<Wallet>;
  refreshWallets(wallets: Wallet[]): Promise<Wallet[]>;
  sendToken(input: WalletTransferInput): Promise<WalletTransferResult>;
}
