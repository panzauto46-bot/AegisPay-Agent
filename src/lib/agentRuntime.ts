import type { AgentState, ChatMessage, RecurringPayment, SpendingRule, Transaction, Wallet } from '../types';

export const NETWORK_NAME = 'Ethereum Sepolia';
export const TOKEN_SYMBOL = 'USDT';
export const DEFAULT_EXPLORER_BASE_URL = 'https://sepolia.etherscan.io';

const DAY_IN_MS = 24 * 60 * 60 * 1000;

const PRIMARY_WALLET_ADDRESS = '0x7a3b79b8c1497de4ceb8f6e2469fea7ba1344f2e';
const FAUCET_ADDRESS = '0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc';
const TREASURY_ADDRESS = '0x9f1288f3bb8e6163c0b8fd2d5bcf7f5aa43bb70c';
const FREELANCER_ADDRESS = '0x1a5b9ce3f8c0b71e6d447ac7b89d1f22777e3d19';
const HOSTING_ADDRESS = '0x4e7ac5519fd3b57f8c2fd269f92b5131aa8c2f10';
const STIPEND_ADDRESS = '0x6d9c2e1f4b8a5f3d7c1a8b5e29c4f3d0ba32a5f4';

export function generateId() {
  return Math.random().toString(36).slice(2, 12);
}

export function generateAddress() {
  return `0x${Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
}

export function generateHash() {
  return `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
}

export function shortenAddress(address: string) {
  if (address.length <= 12) {
    return address;
  }
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function createAddressExplorerUrl(address: string, baseUrl = DEFAULT_EXPLORER_BASE_URL) {
  return `${baseUrl}/address/${address}`;
}

export function createTransactionExplorerUrl(hash: string, baseUrl = DEFAULT_EXPLORER_BASE_URL) {
  return `${baseUrl}/tx/${hash}`;
}

export function isValidAddress(address: string) {
  return /^0x[a-fA-F0-9]{40}$/.test(address.trim());
}

export function normalizeAddress(address: string) {
  return address.trim().toLowerCase();
}

export function normalizeAddressList(addresses: string[]) {
  return Array.from(new Set(addresses.map(normalizeAddress)));
}

export function extractAddresses(input: string) {
  const matches = input.match(/0x[a-fA-F0-9]{40}/g);
  return normalizeAddressList(matches ?? []);
}

export function extractAmount(input: string) {
  const tokens = input
    .replace(/[,]/g, ' ')
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);

  for (const token of tokens) {
    if (token.startsWith('0x')) {
      continue;
    }

    const numericToken = token.replace(/[^0-9.]/g, '');
    if (!numericToken) {
      continue;
    }

    const amount = Number.parseFloat(numericToken);
    if (Number.isFinite(amount)) {
      return amount;
    }
  }

  return null;
}

export function extractFrequency(input: string): RecurringPayment['frequency'] {
  if (input.includes('daily') || input.includes('every day')) {
    return 'daily';
  }

  if (input.includes('weekly') || input.includes('every week')) {
    return 'weekly';
  }

  return 'monthly';
}

export function getNextExecutionDate(
  frequency: RecurringPayment['frequency'],
  from = new Date(),
) {
  const nextExecution = new Date(from);

  if (frequency === 'daily') {
    nextExecution.setDate(nextExecution.getDate() + 1);
  } else if (frequency === 'weekly') {
    nextExecution.setDate(nextExecution.getDate() + 7);
  } else {
    nextExecution.setDate(nextExecution.getDate() + 30);
  }

  return nextExecution;
}

export function getMonthlyEstimate(payment: RecurringPayment) {
  if (payment.frequency === 'daily') {
    return payment.amount * 30;
  }

  if (payment.frequency === 'weekly') {
    return payment.amount * 4;
  }

  return payment.amount;
}

export function getTodaySpending(transactions: Transaction[], referenceDate = new Date()) {
  const startOfDay = new Date(referenceDate);
  startOfDay.setHours(0, 0, 0, 0);

  return transactions
    .filter((transaction) => {
      const isOutgoing = transaction.type === 'send' || transaction.type === 'recurring';
      return isOutgoing && transaction.status === 'confirmed' && transaction.timestamp >= startOfDay;
    })
    .reduce((sum, transaction) => sum + transaction.amount, 0);
}

interface RuleEvaluationArgs {
  amount: number;
  recipient: string;
  rules: SpendingRule[];
  transactions: Transaction[];
  referenceDate?: Date;
}

export function evaluateTransactionRules({
  amount,
  recipient,
  rules,
  transactions,
  referenceDate = new Date(),
}: RuleEvaluationArgs) {
  const normalizedRecipient = normalizeAddress(recipient);
  const maxTransactionRule = rules.find(
    (rule) => rule.type === 'max_transaction' && rule.enabled && typeof rule.value === 'number',
  );

  if (maxTransactionRule && typeof maxTransactionRule.value === 'number' && amount > maxTransactionRule.value) {
    return `Amount exceeds the active max transaction limit of ${maxTransactionRule.value} ${TOKEN_SYMBOL}.`;
  }

  const dailyLimitRule = rules.find(
    (rule) => rule.type === 'daily_limit' && rule.enabled && typeof rule.value === 'number',
  );

  if (dailyLimitRule && typeof dailyLimitRule.value === 'number') {
    const todaySpend = getTodaySpending(transactions, referenceDate);
    if (todaySpend + amount > dailyLimitRule.value) {
      return `Daily spending limit would be exceeded (${todaySpend.toFixed(2)} / ${dailyLimitRule.value} ${TOKEN_SYMBOL} used today).`;
    }
  }

  const whitelistRule = rules.find(
    (rule) => rule.type === 'whitelist' && rule.enabled && Array.isArray(rule.value),
  );

  if (whitelistRule && Array.isArray(whitelistRule.value) && whitelistRule.value.length > 0) {
    const whitelist = normalizeAddressList(whitelistRule.value);
    if (!whitelist.includes(normalizedRecipient)) {
      return 'Recipient is not on the active whitelist.';
    }
  }

  const blacklistRule = rules.find(
    (rule) => rule.type === 'blacklist' && rule.enabled && Array.isArray(rule.value),
  );

  if (blacklistRule && Array.isArray(blacklistRule.value) && blacklistRule.value.length > 0) {
    const blacklist = normalizeAddressList(blacklistRule.value);
    if (blacklist.includes(normalizedRecipient)) {
      return 'Recipient is blocked by the active blacklist.';
    }
  }

  return null;
}

function toTitleCase(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function inferRecurringRecipient(input: string, address: string) {
  const forMatch = input.match(/for\s+([a-z0-9 _-]+)/i);
  if (forMatch) {
    return toTitleCase(forMatch[1]);
  }

  const recipientMatch = input.match(/recipient\s+([a-z0-9 _-]+)/i);
  if (recipientMatch) {
    return toTitleCase(recipientMatch[1]);
  }

  return `Recurring to ${shortenAddress(address)}`;
}

export function createInitialWallets(): Wallet[] {
  return [
    {
      id: generateId(),
      name: 'Primary Wallet',
      address: PRIMARY_WALLET_ADDRESS,
      balance: 1250.75,
      nativeBalance: 0.42,
      token: TOKEN_SYMBOL,
      network: NETWORK_NAME,
      walletIndex: 0,
      derivationPath: "m/44'/60'/0'/0/0",
      explorerUrl: createAddressExplorerUrl(PRIMARY_WALLET_ADDRESS),
      syncMode: 'demo',
      createdAt: new Date(Date.now() - 7 * DAY_IN_MS),
    },
  ];
}

export function createInitialTransactions(): Transaction[] {
  const initialFundingHash = generateHash();
  const treasuryTopUpHash = generateHash();
  const servicePaymentHash = generateHash();
  const hostingPaymentHash = generateHash();
  const freelancerPaymentHash = generateHash();

  return [
    {
      id: generateId(),
      type: 'receive',
      amount: 500,
      token: TOKEN_SYMBOL,
      from: FAUCET_ADDRESS,
      to: PRIMARY_WALLET_ADDRESS,
      status: 'confirmed',
      hash: initialFundingHash,
      explorerUrl: createTransactionExplorerUrl(initialFundingHash),
      timestamp: new Date(Date.now() - 6 * DAY_IN_MS),
      description: 'Initial funding',
    },
    {
      id: generateId(),
      type: 'receive',
      amount: 1000,
      token: TOKEN_SYMBOL,
      from: TREASURY_ADDRESS,
      to: PRIMARY_WALLET_ADDRESS,
      status: 'confirmed',
      hash: treasuryTopUpHash,
      explorerUrl: createTransactionExplorerUrl(treasuryTopUpHash),
      timestamp: new Date(Date.now() - 5 * DAY_IN_MS),
      description: 'Treasury faucet top-up',
    },
    {
      id: generateId(),
      type: 'send',
      amount: 50,
      token: TOKEN_SYMBOL,
      from: PRIMARY_WALLET_ADDRESS,
      to: HOSTING_ADDRESS,
      status: 'confirmed',
      hash: servicePaymentHash,
      explorerUrl: createTransactionExplorerUrl(servicePaymentHash),
      timestamp: new Date(Date.now() - 3 * DAY_IN_MS),
      description: 'Service payment',
    },
    {
      id: generateId(),
      type: 'recurring',
      amount: 20,
      token: TOKEN_SYMBOL,
      from: PRIMARY_WALLET_ADDRESS,
      to: HOSTING_ADDRESS,
      status: 'confirmed',
      hash: hostingPaymentHash,
      explorerUrl: createTransactionExplorerUrl(hostingPaymentHash),
      timestamp: new Date(Date.now() - DAY_IN_MS),
      description: 'Monthly hosting',
    },
    {
      id: generateId(),
      type: 'send',
      amount: 179.25,
      token: TOKEN_SYMBOL,
      from: PRIMARY_WALLET_ADDRESS,
      to: FREELANCER_ADDRESS,
      status: 'confirmed',
      hash: freelancerPaymentHash,
      explorerUrl: createTransactionExplorerUrl(freelancerPaymentHash),
      timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
      description: 'Freelancer payment',
    },
  ];
}

export function createInitialRules(): SpendingRule[] {
  return [
    {
      id: generateId(),
      type: 'daily_limit',
      label: 'Daily Spending Limit',
      value: 500,
      enabled: true,
      createdAt: new Date(Date.now() - 7 * DAY_IN_MS),
    },
    {
      id: generateId(),
      type: 'max_transaction',
      label: 'Max Single Transaction',
      value: 200,
      enabled: true,
      createdAt: new Date(Date.now() - 7 * DAY_IN_MS),
    },
  ];
}

export function createInitialRecurringPayments(): RecurringPayment[] {
  return [
    {
      id: generateId(),
      recipient: 'Cloud Hosting',
      recipientAddress: HOSTING_ADDRESS,
      amount: 20,
      token: TOKEN_SYMBOL,
      frequency: 'monthly',
      nextExecution: new Date(Date.now() - DAY_IN_MS),
      active: true,
      description: 'Monthly hosting subscription',
      executionCount: 3,
    },
    {
      id: generateId(),
      recipient: 'Team Stipend',
      recipientAddress: STIPEND_ADDRESS,
      amount: 100,
      token: TOKEN_SYMBOL,
      frequency: 'monthly',
      nextExecution: new Date(Date.now() + 15 * DAY_IN_MS),
      active: true,
      description: 'Monthly team member stipend',
      executionCount: 1,
    },
  ];
}

export function createWelcomeMessage(): ChatMessage {
  return {
    id: generateId(),
    role: 'agent',
    content: `Welcome to **AegisPay Agent**.

This MVP demo follows the PRD flow for wallet creation, balance checks, payment execution, recurring payments, and spending controls.

Try one of these commands:
- **Create wallet**
- **What is my balance?**
- **Send 10 USDT to ${shortenAddress(HOSTING_ADDRESS)}**
- **Pay 20 USDT every month to ${shortenAddress(HOSTING_ADDRESS)} for hosting**
- **Set daily limit to 500 USDT**
- **Show project status**

Primary wallet balance: **1250.75 ${TOKEN_SYMBOL}** on **${NETWORK_NAME}**.`,
    timestamp: new Date(),
  };
}

export function createInitialAgentState(): AgentState {
  return {
    wallets: createInitialWallets(),
    transactions: createInitialTransactions(),
    rules: createInitialRules(),
    recurringPayments: createInitialRecurringPayments(),
    messages: [createWelcomeMessage()],
    lastSchedulerRun: null,
  };
}
