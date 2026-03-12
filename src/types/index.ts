export interface Wallet {
  id: string;
  name: string;
  address: string;
  balance: number;
  nativeBalance?: number;
  token: string;
  network: string;
  walletIndex?: number;
  derivationPath?: string;
  explorerUrl?: string;
  syncMode?: 'demo' | 'live';
  createdAt: Date;
}

export interface Transaction {
  id: string;
  type: 'send' | 'receive' | 'recurring';
  amount: number;
  token: string;
  from: string;
  to: string;
  status: 'pending' | 'confirmed' | 'failed' | 'rejected';
  hash: string;
  explorerUrl?: string;
  timestamp: Date;
  description?: string;
}

export interface SpendingRule {
  id: string;
  type: 'daily_limit' | 'max_transaction' | 'whitelist' | 'blacklist';
  label: string;
  value: number | string[];
  enabled: boolean;
  createdAt: Date;
}

export interface RecurringPayment {
  id: string;
  recipient: string;
  recipientAddress: string;
  amount: number;
  token: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  nextExecution: Date;
  active: boolean;
  description: string;
  executionCount: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'agent';
  content: string;
  timestamp: Date;
  action?: string;
}

export type Page = 'dashboard' | 'chat' | 'wallets' | 'transactions' | 'rules' | 'recurring' | 'status';

export interface AgentState {
  wallets: Wallet[];
  transactions: Transaction[];
  rules: SpendingRule[];
  recurringPayments: RecurringPayment[];
  messages: ChatMessage[];
  lastSchedulerRun: Date | null;
}
