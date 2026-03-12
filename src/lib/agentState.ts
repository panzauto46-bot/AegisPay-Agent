import type { AgentState, ChatMessage, RecurringPayment, SpendingRule, Transaction, Wallet } from '../types';

export interface SerializedWallet extends Omit<Wallet, 'createdAt'> {
  createdAt: string;
}

export interface SerializedTransaction extends Omit<Transaction, 'timestamp'> {
  timestamp: string;
}

export interface SerializedRule extends Omit<SpendingRule, 'createdAt'> {
  createdAt: string;
}

export interface SerializedRecurringPayment extends Omit<RecurringPayment, 'nextExecution'> {
  nextExecution: string;
}

export interface SerializedChatMessage extends Omit<ChatMessage, 'timestamp'> {
  timestamp: string;
}

export interface SerializedAgentState {
  wallets: SerializedWallet[];
  transactions: SerializedTransaction[];
  rules: SerializedRule[];
  recurringPayments: SerializedRecurringPayment[];
  messages: SerializedChatMessage[];
  lastSchedulerRun: string | null;
}

function serializeWallet(wallet: Wallet): SerializedWallet {
  return {
    ...wallet,
    createdAt: wallet.createdAt.toISOString(),
  };
}

function serializeTransaction(transaction: Transaction): SerializedTransaction {
  return {
    ...transaction,
    timestamp: transaction.timestamp.toISOString(),
  };
}

function serializeRule(rule: SpendingRule): SerializedRule {
  return {
    ...rule,
    createdAt: rule.createdAt.toISOString(),
  };
}

function serializeRecurringPayment(payment: RecurringPayment): SerializedRecurringPayment {
  return {
    ...payment,
    nextExecution: payment.nextExecution.toISOString(),
  };
}

function serializeMessage(message: ChatMessage): SerializedChatMessage {
  return {
    ...message,
    timestamp: message.timestamp.toISOString(),
  };
}

export function serializeAgentState(state: AgentState): SerializedAgentState {
  return {
    wallets: state.wallets.map(serializeWallet),
    transactions: state.transactions.map(serializeTransaction),
    rules: state.rules.map(serializeRule),
    recurringPayments: state.recurringPayments.map(serializeRecurringPayment),
    messages: state.messages.map(serializeMessage),
    lastSchedulerRun: state.lastSchedulerRun ? state.lastSchedulerRun.toISOString() : null,
  };
}

export function deserializeAgentState(state: SerializedAgentState): AgentState {
  return {
    wallets: state.wallets.map((wallet) => ({
      ...wallet,
      createdAt: new Date(wallet.createdAt),
    })),
    transactions: state.transactions.map((transaction) => ({
      ...transaction,
      timestamp: new Date(transaction.timestamp),
    })),
    rules: state.rules.map((rule) => ({
      ...rule,
      createdAt: new Date(rule.createdAt),
    })),
    recurringPayments: state.recurringPayments.map((payment) => ({
      ...payment,
      nextExecution: new Date(payment.nextExecution),
    })),
    messages: state.messages.map((message) => ({
      ...message,
      timestamp: new Date(message.timestamp),
    })),
    lastSchedulerRun: state.lastSchedulerRun ? new Date(state.lastSchedulerRun) : null,
  };
}

export function cloneAgentState(state: AgentState): AgentState {
  return deserializeAgentState(serializeAgentState(state));
}
