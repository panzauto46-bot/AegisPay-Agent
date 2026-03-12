import { mvpChecklist, nextBuildPriorities, projectStatusMeta } from '../data/projectStatus';
import {
  cloneAgentState,
} from '../lib/agentState';
import {
  createInitialAgentState,
  createTransactionExplorerUrl,
  evaluateTransactionRules,
  generateAddress,
  generateId,
  getNextExecutionDate,
  getTodaySpending,
  inferRecurringRecipient,
  isValidAddress,
  normalizeAddress,
  normalizeAddressList,
  shortenAddress,
  TOKEN_SYMBOL,
} from '../lib/agentRuntime';
import type { AgentState, ChatMessage, RecurringPayment, SpendingRule, Transaction } from '../types';
import { DeterministicReasoningProvider, type ReasoningProvider } from './reasoningProvider';
import type { WalletProvider } from './walletProvider';

const ADDRESS_RULE_TYPES: SpendingRule['type'][] = ['whitelist', 'blacklist'];

function isAddressRule(type: SpendingRule['type']) {
  return ADDRESS_RULE_TYPES.includes(type);
}

interface AgentEngineOptions {
  walletProvider: WalletProvider;
  reasoningProvider?: ReasoningProvider;
  initialState?: AgentState;
  now?: () => Date;
}

export class AgentEngine {
  private state: AgentState;
  private readonly walletProvider: WalletProvider;
  private readonly reasoningProvider: ReasoningProvider;
  private readonly now: () => Date;

  constructor(options: AgentEngineOptions) {
    this.walletProvider = options.walletProvider;
    this.reasoningProvider = options.reasoningProvider ?? new DeterministicReasoningProvider();
    this.state = cloneAgentState(options.initialState ?? createInitialAgentState());
    this.now = options.now ?? (() => new Date());
  }

  async getState(sync = false) {
    if (sync) {
      await this.syncWallets();
    }

    return cloneAgentState(this.state);
  }

  async syncWallets() {
    this.state.wallets = await this.walletProvider.refreshWallets(this.state.wallets);
    return this.getState(false);
  }

  async processCommand(input: string) {
    this.addMessage('user', input);

    const primaryWallet = this.state.wallets[0];
    const intent = await this.reasoningProvider.analyze(input, this.state);

    switch (intent.action) {
      case 'help':
        this.addMessage(
          'agent',
          `AegisPay Agent command guide:

- **Create wallet**
- **Show my wallets**
- **What is my balance?**
- **Send 10 USDT to 0x...**
- **Pay 20 USDT every month to 0x... for hosting**
- **Set daily limit to 500 USDT**
- **Whitelist 0x...**
- **Blacklist 0x...**
- **Run scheduler**
- **Show project status**
- **Show transaction history**`,
          'help',
        );
        break;
      case 'project_status': {
        const readyItems = mvpChecklist.filter((item) => item.status === 'ready').length;
        const dueRecurring = this.state.recurringPayments.filter(
          (payment) => payment.active && payment.nextExecution <= this.now(),
        ).length;

        this.addMessage(
          'agent',
          `Project status snapshot:

- Overall roadmap progress: **${projectStatusMeta.overallProgress}%**
- MVP readiness: **${readyItems}/${mvpChecklist.length}** items ready
- Wallets provisioned: **${this.state.wallets.length}**
- Transactions tracked: **${this.state.transactions.length}**
- Active rules: **${this.state.rules.filter((rule) => rule.enabled).length}**
- Recurring payments due now: **${dueRecurring}**
- Wallet runtime: **${this.walletProvider.label}**
- Reasoning runtime: **${this.reasoningProvider.label}**

Current focus:
- ${nextBuildPriorities[0]}
- ${nextBuildPriorities[1]}

Open the **Project Status** page for the full roadmap and risk breakdown.`,
          'project_status',
        );
        break;
      }
      case 'run_scheduler':
        return this.runScheduler();
      case 'create_wallet':
        await this.createWallet(intent.walletName);
        break;
      case 'list_wallets': {
        const walletList = this.state.wallets
          .map(
            (wallet, index) =>
              `- **${wallet.name}**${index === 0 ? ' (Primary)' : ''}: \`${wallet.address}\` - **${wallet.balance.toFixed(2)} ${wallet.token}**`,
          )
          .join('\n');

        this.addMessage('agent', `Wallet inventory:\n\n${walletList}`, 'wallet_list');
        break;
      }
      case 'check_balance': {
        await this.syncWallets();
        const totalBalance = this.state.wallets.reduce((sum, wallet) => sum + wallet.balance, 0);
        const walletList = this.state.wallets
          .map(
            (wallet, index) =>
              `- **${wallet.name}**${index === 0 ? ' (Primary)' : ''}: **${wallet.balance.toFixed(2)} ${wallet.token}** at \`${shortenAddress(wallet.address)}\``,
          )
          .join('\n');

        this.addMessage(
          'agent',
          `Wallet balance report:

${walletList}

Portfolio total: **${totalBalance.toFixed(2)} ${TOKEN_SYMBOL}**`,
          'balance_check',
        );
        break;
      }
      case 'schedule_payment': {
        if (!intent.amount) {
          this.addMessage(
            'agent',
            'Please include the recurring payment amount, for example `Pay 20 USDT every month to 0x...`.',
            'recurring_needs_amount',
          );
          break;
        }

        const address = intent.recipientAddress ?? generateAddress();
        const recipient = intent.recipientLabel ?? inferRecurringRecipient(input, address);
        const nextExecution = getNextExecutionDate(intent.frequency);

        this.addRecurringPayment({
          recipient,
          recipientAddress: address,
          amount: intent.amount,
          token: TOKEN_SYMBOL,
          frequency: intent.frequency,
          nextExecution,
          active: true,
          description: input,
        });

        this.addMessage(
          'agent',
          `Recurring payment scheduled.

- Recipient: **${recipient}**
- Address: \`${address}\`
- Amount: **${intent.amount} ${TOKEN_SYMBOL}**
- Frequency: **${intent.frequency}**
- Next execution: **${nextExecution.toLocaleDateString()}**

Each run will still be checked against balance and active spending rules before execution.`,
          'recurring_created',
        );
        break;
      }
      case 'update_address_rule': {
        if (intent.addresses.length === 0) {
          this.addMessage(
            'agent',
            `Please include at least one full wallet address to ${intent.ruleType}.`,
            'rule_needs_address',
          );
          break;
        }

        const label = intent.ruleType === 'whitelist' ? 'Recipient Whitelist' : 'Recipient Blacklist';
        this.upsertRule(intent.ruleType, label, intent.addresses);
        this.addMessage(
          'agent',
          `${label} updated.

${intent.ruleType === 'whitelist' ? 'Allowed' : 'Blocked'} addresses:
${intent.addresses.map((address) => `- \`${address}\``).join('\n')}

${intent.ruleType === 'whitelist'
  ? 'Only these recipients can receive funds while the whitelist rule is active.'
  : 'Transactions to these addresses will now be rejected.'}`,
          intent.ruleType === 'whitelist' ? 'whitelist_set' : 'blacklist_set',
        );
        break;
      }
      case 'update_numeric_rule': {
        if (!intent.amount) {
          this.addMessage(
            'agent',
            'Please provide the limit amount, for example `Set daily limit to 500 USDT`.',
            'rule_needs_amount',
          );
          break;
        }

        const label = intent.ruleType === 'daily_limit' ? 'Daily Spending Limit' : 'Max Single Transaction';
        this.upsertRule(intent.ruleType, label, intent.amount);
        this.addMessage(
          'agent',
          `Spending rule updated.

- Rule: **${label}**
- Amount: **${intent.amount} ${TOKEN_SYMBOL}**

This rule is active immediately and will be enforced before every send or recurring execution.`,
          'rule_set',
        );
        break;
      }
      case 'history': {
        const recentTransactions = this.state.transactions
          .slice(0, 5)
          .map(
            (transaction) =>
              `- **${transaction.amount} ${transaction.token}** ${transaction.type} to/from \`${shortenAddress(
                transaction.type === 'receive' ? transaction.from : transaction.to,
              )}\` (${transaction.status})`,
          )
          .join('\n');

        this.addMessage(
          'agent',
          `Recent transaction history:

${recentTransactions}

Tracked transactions: **${this.state.transactions.length}**`,
          'history',
        );
        break;
      }
      case 'send_payment':
        if (!primaryWallet) {
          this.addMessage('agent', 'No wallet is available yet. Create a wallet first.', 'no_wallet');
          break;
        }

        if (!intent.amount) {
          this.addMessage(
            'agent',
            'Please include the payment amount, for example `Send 10 USDT to 0x...`.',
            'payment_needs_amount',
          );
          break;
        }

        if (!intent.recipientAddress) {
          this.addMessage(
            'agent',
            'Please provide a full recipient address starting with `0x`.',
            'payment_needs_address',
          );
          break;
        }

        await this.executeSend({
          amount: intent.amount,
          recipient: intent.recipientAddress,
          description: input,
          type: 'send',
        });
        break;
      case 'unknown':
      default:
        this.addMessage(
          'agent',
          `I can help with wallet creation, balance checks, payments, recurring schedules, spending rules, and project tracking.

Try:
- **Create wallet**
- **Send 10 USDT to 0x...**
- **Set daily limit to 500 USDT**
- **Run scheduler**
- **Show project status**`,
          'default',
        );
        break;
    }

    return this.getState(false);
  }

  async createWallet(name?: string) {
    const wallet = await this.walletProvider.createWallet({
      walletCount: this.state.wallets.length,
      name: name ?? `Wallet ${this.state.wallets.length + 1}`,
    });

    this.state.wallets = [...this.state.wallets, wallet];
    this.addMessage(
      'agent',
      `Wallet created successfully.

- Name: **${wallet.name}**
- Address: \`${wallet.address}\`
- Network: **${wallet.network}**
- Balance: **${wallet.balance.toFixed(2)} ${wallet.token}**
- Runtime: **${wallet.syncMode ?? this.walletProvider.mode}**

This follows the PRD wallet-creation flow and is ready for funding.`,
      'wallet_created',
    );

    return this.getState(false);
  }

  toggleRule(id: string) {
    this.state.rules = this.state.rules.map((rule) =>
      rule.id === id ? { ...rule, enabled: !rule.enabled } : rule,
    );
    return this.getState(false);
  }

  deleteRule(id: string) {
    this.state.rules = this.state.rules.filter((rule) => rule.id !== id);
    return this.getState(false);
  }

  toggleRecurring(id: string) {
    this.state.recurringPayments = this.state.recurringPayments.map((payment) =>
      payment.id === id ? { ...payment, active: !payment.active } : payment,
    );
    return this.getState(false);
  }

  deleteRecurring(id: string) {
    this.state.recurringPayments = this.state.recurringPayments.filter((payment) => payment.id !== id);
    return this.getState(false);
  }

  addRule(type: SpendingRule['type'], label: string, value: number | string[]) {
    this.upsertRule(type, label, value);
    return this.getState(false);
  }

  addRecurringPayment(payment: Omit<RecurringPayment, 'id' | 'executionCount'>) {
    const recipientAddress = isValidAddress(payment.recipientAddress)
      ? normalizeAddress(payment.recipientAddress)
      : generateAddress();

    this.state.recurringPayments = [
      ...this.state.recurringPayments,
      {
        ...payment,
        recipientAddress,
        id: generateId(),
        executionCount: 0,
      },
    ];

    return this.getState(false);
  }

  async runScheduler() {
    const now = this.now();
    const primaryWallet = this.state.wallets[0];
    const duePayments = this.state.recurringPayments
      .filter((payment) => payment.active && payment.nextExecution <= now)
      .sort((left, right) => left.nextExecution.getTime() - right.nextExecution.getTime());

    this.state.lastSchedulerRun = now;

    if (!primaryWallet) {
      this.addMessage('agent', 'Scheduler cycle aborted because no wallet is available.', 'scheduler_error');
      return this.getState(false);
    }

    if (duePayments.length === 0) {
      const nextPayment = this.state.recurringPayments
        .filter((payment) => payment.active)
        .sort((left, right) => left.nextExecution.getTime() - right.nextExecution.getTime())[0];

      this.addMessage(
        'agent',
        `Scheduler cycle complete.

No recurring payments are due right now.${nextPayment ? ` Next up: **${nextPayment.recipient}** on **${nextPayment.nextExecution.toLocaleDateString()}**.` : ''}`,
        'scheduler_idle',
      );
      return this.getState(false);
    }

    let availableBalance = primaryWallet.balance;
    const blocked: string[] = [];
    const createdTransactions: Transaction[] = [];

    const updatedPayments: RecurringPayment[] = [];

    for (const payment of this.state.recurringPayments) {
      const isDue = payment.active && payment.nextExecution <= now;
      if (!isDue) {
        updatedPayments.push(payment);
        continue;
      }

      const ruleViolation = evaluateTransactionRules({
        amount: payment.amount,
        recipient: payment.recipientAddress,
        rules: this.state.rules,
        transactions: [...createdTransactions, ...this.state.transactions],
        referenceDate: now,
      });

      if (ruleViolation) {
        blocked.push(`- **${payment.recipient}**: ${ruleViolation}`);
        updatedPayments.push(payment);
        continue;
      }

      if (availableBalance < payment.amount) {
        blocked.push(
          `- **${payment.recipient}**: insufficient balance (${availableBalance.toFixed(2)} ${TOKEN_SYMBOL} available).`,
        );
        updatedPayments.push(payment);
        continue;
      }

      try {
        const transfer = await this.walletProvider.sendToken({
          wallet: primaryWallet,
          recipient: payment.recipientAddress,
          amount: payment.amount,
          token: payment.token,
        });

        const transaction: Transaction = {
          id: generateId(),
          type: 'recurring',
          amount: payment.amount,
          token: payment.token,
          from: primaryWallet.address,
          to: normalizeAddress(payment.recipientAddress),
          status: 'confirmed',
          hash: transfer.hash,
          explorerUrl: transfer.explorerUrl ?? createTransactionExplorerUrl(transfer.hash),
          timestamp: now,
          description: payment.description,
        };

        createdTransactions.unshift(transaction);
        availableBalance -= payment.amount;
        updatedPayments.push({
          ...payment,
          executionCount: payment.executionCount + 1,
          nextExecution: getNextExecutionDate(payment.frequency, payment.nextExecution),
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'provider error';
        blocked.push(`- **${payment.recipient}**: ${message}`);
        updatedPayments.push(payment);
      }
    }

    if (createdTransactions.length > 0) {
      this.state.transactions = [...createdTransactions, ...this.state.transactions];
      this.state.wallets = this.state.wallets.map((wallet, index) =>
        index === 0 ? { ...wallet, balance: availableBalance } : wallet,
      );
      if (this.walletProvider.mode === 'live') {
        await this.syncWallets();
      }
    }

    this.state.recurringPayments = updatedPayments;

    const summary = [
      'Scheduler cycle complete.',
      '',
      `Executed: **${createdTransactions.length}** payment(s)`,
      `Blocked: **${blocked.length}** payment(s)`,
    ];

    if (createdTransactions.length > 0) {
      summary.push('', `Remaining balance: **${availableBalance.toFixed(2)} ${TOKEN_SYMBOL}**`);
    }

    if (blocked.length > 0) {
      summary.push('', 'Blocked items:', ...blocked);
    }

    this.addMessage('agent', summary.join('\n'), 'scheduler_run');
    return this.getState(false);
  }

  private addMessage(role: 'user' | 'agent', content: string, action?: string) {
    const message: ChatMessage = {
      id: generateId(),
      role,
      content,
      timestamp: this.now(),
      action,
    };

    this.state.messages = [...this.state.messages, message];
    return message;
  }

  private upsertRule(type: SpendingRule['type'], label: string, value: number | string[]) {
    if (isAddressRule(type)) {
      const addresses = Array.isArray(value) ? normalizeAddressList(value.filter(isValidAddress)) : [];
      if (addresses.length === 0) {
        return false;
      }

      const existingIndex = this.state.rules.findIndex((rule) => rule.type === type);
      const nextRule: SpendingRule = {
        id: existingIndex >= 0 ? this.state.rules[existingIndex].id : generateId(),
        type,
        label,
        value: addresses,
        enabled: true,
        createdAt: existingIndex >= 0 ? this.state.rules[existingIndex].createdAt : this.now(),
      };

      if (existingIndex >= 0) {
        this.state.rules = this.state.rules.map((rule, index) => (index === existingIndex ? nextRule : rule));
      } else {
        this.state.rules = [...this.state.rules, nextRule];
      }

      return true;
    }

    const numericValue = typeof value === 'number' ? value : Number.NaN;
    if (!Number.isFinite(numericValue)) {
      return false;
    }

    const existingIndex = this.state.rules.findIndex((rule) => rule.type === type);
    const nextRule: SpendingRule = {
      id: existingIndex >= 0 ? this.state.rules[existingIndex].id : generateId(),
      type,
      label,
      value: numericValue,
      enabled: true,
      createdAt: existingIndex >= 0 ? this.state.rules[existingIndex].createdAt : this.now(),
    };

    if (existingIndex >= 0) {
      this.state.rules = this.state.rules.map((rule, index) => (index === existingIndex ? nextRule : rule));
    } else {
      this.state.rules = [...this.state.rules, nextRule];
    }

    return true;
  }

  private async executeSend({
    amount,
    recipient,
    description,
    type,
  }: {
    amount: number;
    recipient: string;
    description: string;
    type: Transaction['type'];
  }) {
    const primaryWallet = this.state.wallets[0];
    if (!primaryWallet) {
      this.addMessage('agent', 'No wallet is available yet. Create a wallet first.', 'no_wallet');
      return;
    }

    const ruleViolation = evaluateTransactionRules({
      amount,
      recipient,
      rules: this.state.rules,
      transactions: this.state.transactions,
      referenceDate: this.now(),
    });

    if (ruleViolation) {
      this.addMessage(
        'agent',
        `Transaction rejected.

- Amount: **${amount} ${TOKEN_SYMBOL}**
- Recipient: \`${recipient}\`
- Reason: **${ruleViolation}**`,
        'tx_rejected',
      );
      return;
    }

    if (primaryWallet.balance < amount) {
      this.addMessage(
        'agent',
        `Insufficient balance.

- Requested: **${amount} ${TOKEN_SYMBOL}**
- Available: **${primaryWallet.balance.toFixed(2)} ${TOKEN_SYMBOL}**`,
        'insufficient_funds',
      );
      return;
    }

    try {
      const transfer = await this.walletProvider.sendToken({
        wallet: primaryWallet,
        recipient,
        amount,
        token: TOKEN_SYMBOL,
      });

      const transaction: Transaction = {
        id: generateId(),
        type,
        amount,
        token: TOKEN_SYMBOL,
        from: primaryWallet.address,
        to: recipient,
        status: 'confirmed',
        hash: transfer.hash,
        explorerUrl: transfer.explorerUrl ?? createTransactionExplorerUrl(transfer.hash),
        timestamp: this.now(),
        description,
      };

      this.state.transactions = [transaction, ...this.state.transactions];
      this.state.wallets = this.state.wallets.map((wallet, index) =>
        index === 0 ? { ...wallet, balance: wallet.balance - amount } : wallet,
      );

      if (this.walletProvider.mode === 'live') {
        await this.syncWallets();
      }

      const refreshedPrimaryWallet = this.state.wallets[0];
      const dailySpend = getTodaySpending(this.state.transactions);

      this.addMessage(
        'agent',
        `Payment executed successfully.

- Amount: **${transaction.amount} ${transaction.token}**
- To: \`${transaction.to}\`
- Tx hash: \`${shortenAddress(transaction.hash)}\`
- Remaining balance: **${refreshedPrimaryWallet?.balance.toFixed(2) ?? (primaryWallet.balance - amount).toFixed(2)} ${TOKEN_SYMBOL}**
- Today's spend after execution: **${dailySpend.toFixed(2)} ${TOKEN_SYMBOL}**
- Runtime: **${this.walletProvider.label}**

The payment followed the PRD validation flow: balance check, spending rules, then execution.`,
        'tx_sent',
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unexpected provider failure';
      this.addMessage(
        'agent',
        `Transaction failed before confirmation.

- Amount: **${amount} ${TOKEN_SYMBOL}**
- Recipient: \`${recipient}\`
- Reason: **${message}**`,
        'tx_failed',
      );
    }
  }
}
