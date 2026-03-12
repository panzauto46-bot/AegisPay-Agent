import {
  createAddressExplorerUrl,
  createTransactionExplorerUrl,
  generateAddress,
  generateHash,
  NETWORK_NAME,
  TOKEN_SYMBOL,
} from '../lib/agentRuntime';
import type { Wallet } from '../types';
import type { CreateWalletInput, WalletProvider, WalletTransferInput } from './walletProvider';

export class DemoWalletProvider implements WalletProvider {
  readonly mode = 'demo' as const;
  readonly label = 'demo';

  async createWallet(input: CreateWalletInput): Promise<Wallet> {
    const address = generateAddress();

    return {
      id: crypto.randomUUID(),
      name: input.name,
      address,
      balance: 0,
      nativeBalance: 0,
      token: TOKEN_SYMBOL,
      network: NETWORK_NAME,
      walletIndex: input.walletCount,
      derivationPath: `m/44'/60'/0'/0/${input.walletCount}`,
      explorerUrl: createAddressExplorerUrl(address),
      syncMode: 'demo',
      createdAt: new Date(),
    };
  }

  async refreshWallets(wallets: Wallet[]) {
    return wallets;
  }

  async sendToken(_input: WalletTransferInput) {
    const hash = generateHash();
    return {
      hash,
      fee: '0.00021',
      explorerUrl: createTransactionExplorerUrl(hash),
    };
  }
}
