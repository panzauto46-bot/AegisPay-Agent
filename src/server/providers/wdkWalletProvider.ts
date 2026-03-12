import WDK from '@tetherto/wdk';
import WalletManagerEvm from '@tetherto/wdk-wallet-evm';
import {
  createAddressExplorerUrl,
  createTransactionExplorerUrl,
  NETWORK_NAME,
  TOKEN_SYMBOL,
} from '../../lib/agentRuntime';
import type { Wallet } from '../../types';
import type { CreateWalletInput, WalletProvider, WalletTransferInput } from '../../engine/walletProvider';

interface WdkWalletProviderOptions {
  seedPhrase: string;
  rpcUrl: string;
  tokenAddress: string;
  tokenDecimals: number;
  transferMaxFeeWei?: bigint;
  explorerBaseUrl?: string;
  networkName?: string;
}

function decimalToUnits(amount: number, decimals: number) {
  const [integerPart, fractionPart = ''] = amount.toString().split('.');
  const normalizedFraction = fractionPart.padEnd(decimals, '0').slice(0, decimals);
  return BigInt(`${integerPart}${normalizedFraction}`);
}

function unitsToDecimal(amount: bigint, decimals: number) {
  const negative = amount < 0n;
  const absolute = negative ? -amount : amount;
  const digits = absolute.toString().padStart(decimals + 1, '0');
  const whole = digits.slice(0, -decimals) || '0';
  const fraction = digits.slice(-decimals).replace(/0+$/, '');
  const normalized = fraction ? `${whole}.${fraction}` : whole;
  const value = Number.parseFloat(normalized);
  return negative ? -value : value;
}

export class WdkWalletProvider implements WalletProvider {
  readonly mode = 'live' as const;
  readonly label = 'wdk';

  private readonly options: WdkWalletProviderOptions;
  private readonly wdk: WDK;

  constructor(options: WdkWalletProviderOptions) {
    this.options = options;
    this.wdk = new WDK(options.seedPhrase).registerWallet('ethereum', WalletManagerEvm, {
      provider: options.rpcUrl,
      transferMaxFee: options.transferMaxFeeWei,
    });
  }

  async createWallet(input: CreateWalletInput): Promise<Wallet> {
    const account = await this.wdk.getAccount('ethereum', input.walletCount);
    const address = await account.getAddress();
    const tokenBalance = await account.getTokenBalance(this.options.tokenAddress);
    const nativeBalance = await account.getBalance();

    return {
      id: crypto.randomUUID(),
      name: input.name,
      address,
      balance: unitsToDecimal(tokenBalance, this.options.tokenDecimals),
      nativeBalance: unitsToDecimal(nativeBalance, 18),
      token: TOKEN_SYMBOL,
      network: this.options.networkName ?? NETWORK_NAME,
      walletIndex: input.walletCount,
      derivationPath: `m/44'/60'/0'/0/${input.walletCount}`,
      explorerUrl: createAddressExplorerUrl(address, this.options.explorerBaseUrl),
      syncMode: 'live',
      createdAt: new Date(),
    };
  }

  async refreshWallets(wallets: Wallet[]) {
    const refreshedWallets = await Promise.all(
      wallets.map(async (wallet, index) => {
        const accountIndex = wallet.walletIndex ?? index;
        const account = await this.wdk.getAccount('ethereum', accountIndex);
        const address = await account.getAddress();
        const tokenBalance = await account.getTokenBalance(this.options.tokenAddress);
        const nativeBalance = await account.getBalance();

        return {
          ...wallet,
          address,
          balance: unitsToDecimal(tokenBalance, this.options.tokenDecimals),
          nativeBalance: unitsToDecimal(nativeBalance, 18),
          explorerUrl: createAddressExplorerUrl(address, this.options.explorerBaseUrl),
          syncMode: 'live' as const,
        };
      }),
    );

    return refreshedWallets;
  }

  async sendToken(input: WalletTransferInput) {
    const accountIndex = input.wallet.walletIndex ?? 0;
    const account = await this.wdk.getAccount('ethereum', accountIndex);
    const transfer = await account.transfer({
      token: this.options.tokenAddress,
      recipient: input.recipient,
      amount: decimalToUnits(input.amount, this.options.tokenDecimals),
    });

    return {
      hash: transfer.hash,
      fee: transfer.fee.toString(),
      explorerUrl: createTransactionExplorerUrl(transfer.hash, this.options.explorerBaseUrl),
    };
  }
}
