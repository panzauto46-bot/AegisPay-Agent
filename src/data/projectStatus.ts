export interface RoadmapPhaseStatus {
  id: string;
  title: string;
  window: string;
  progress: number;
  status: 'done' | 'in_progress' | 'planned';
  objective: string;
  shipped: string[];
  next: string[];
}

export interface MilestoneStatus {
  title: string;
  targetDate: string;
  status: 'complete' | 'in_progress' | 'pending';
  note: string;
}

export interface RiskStatus {
  title: string;
  impact: 'high' | 'medium' | 'low';
  likelihood: 'high' | 'medium' | 'low';
  mitigation: string;
}

export interface MvpChecklistItem {
  id: string;
  label: string;
  status: 'ready' | 'pending';
  note: string;
}

export const projectStatusMeta = {
  lastUpdated: 'March 12, 2026',
  deliveryTarget: 'April 30, 2026',
  overallProgress: 84,
  summary:
    'The current build is a full-stack MVP with an animated landing page, wallet-connect console flow, API runtime, Telegram bridge, tests, optional WDK-backed wallet operations, and Alibaba-compatible reasoning with model auto-switch. The biggest remaining gaps are OpenClaw integration, funded WDK live verification, persistence/security hardening, demo video, and submission assets.',
};

export const roadmapPhaseStatuses: RoadmapPhaseStatus[] = [
  {
    id: 'phase-1',
    title: 'Phase 1 - Foundation',
    window: 'Week 1-2',
    progress: 93,
    status: 'in_progress',
    objective: 'Set up the project infrastructure and model the wallet lifecycle around the WDK flow.',
    shipped: [
      'React + TypeScript web app scaffold',
      'Wallet creation and wallet inventory views',
      'WDK-aligned wallet state, transaction state, and rule state',
      'Node.js API runtime with swappable demo and WDK wallet providers',
    ],
    next: [
      'Run live credential verification against a funded Sepolia wallet',
      'Harden operational secrets handling before deployment',
    ],
  },
  {
    id: 'phase-2',
    title: 'Phase 2 - AI Agent Core',
    window: 'Week 2-3',
    progress: 80,
    status: 'in_progress',
    objective: 'Turn natural language instructions into wallet actions and user-facing explanations.',
    shipped: [
      'Chat interface for user-agent interaction',
      'Intent parsing for wallet, balance, payments, recurring, rules, and status',
      'Agent responses that explain validation decisions',
      'Shared agent engine used by UI and API',
      'Alibaba-compatible reasoning provider validated locally through a Responses API endpoint',
      'Multi-model auto-switch fallback before deterministic fallback',
    ],
    next: [
      'Integrate OpenClaw-native planning (track requirement — not yet started)',
      'Add richer fallback handling for ambiguous commands',
    ],
  },
  {
    id: 'phase-3',
    title: 'Phase 3 - Payment Engine',
    window: 'Week 3-4',
    progress: 90,
    status: 'in_progress',
    objective: 'Execute token transfers safely with validation, rules, and balance checks.',
    shipped: [
      'Single payment execution from the primary wallet',
      'Daily limit and max-transaction validation',
      'Whitelist and blacklist enforcement before send',
      'Optional WDK transfer path for live USDT sends',
      'Explorer links for wallets and transactions',
    ],
    next: [
      'Verify live transfer execution on a funded environment',
      'Add confirmation polling and richer failure states',
    ],
  },
  {
    id: 'phase-4',
    title: 'Phase 4 - Advanced Features',
    window: 'Week 4-5',
    progress: 88,
    status: 'in_progress',
    objective: 'Add recurring automation and user-facing channels that make the agent useful in practice.',
    shipped: [
      'Recurring payment scheduling UI',
      'API-backed scheduler run for due recurring payments',
      'Persistent server-side scheduler service',
      'Animated landing page and wallet-connect entry flow',
      'Dedicated web chat interface for the wallet agent',
      'Telegram bot bridge wired to the AegisPay API',
    ],
    next: [
      'Add notification delivery for payment outcomes',
      'Move recurring execution to a persistent worker or cron service',
    ],
  },
  {
    id: 'phase-5',
    title: 'Phase 5 - Polish & Submit',
    window: 'Week 5-6',
    progress: 52,
    status: 'in_progress',
    objective: 'Stabilize the product, document the architecture, and prepare the hackathon submission.',
    shipped: [
      'PRD, roadmap, and project status documentation',
      'Automated tests for engine, API, and reasoning fallback flows (7/7 passing)',
      'Backend startup and health verification',
      'Comprehensive technical README plus project review',
    ],
    next: [
      'Integrate OpenClaw (track requirement)',
      'Record demo video (mandatory deliverable)',
      'Add LICENSE file and fix package.json name',
      'Complete security review',
      'Add state persistence and API authentication',
      'Prepare final submission assets',
    ],
  },
];

export const roadmapMilestones: MilestoneStatus[] = [
  {
    title: 'Project repo initialized',
    targetDate: 'March 12, 2026',
    status: 'complete',
    note: 'Base app, docs, and visual shell are already in place.',
  },
  {
    title: 'WDK integration layer',
    targetDate: 'March 17, 2026',
    status: 'complete',
    note: 'A WDK-backed provider is implemented and can be enabled with environment variables.',
  },
  {
    title: 'First wallet created',
    targetDate: 'March 20, 2026',
    status: 'complete',
    note: 'Wallet creation is working in the demo runtime and exposed through chat + UI.',
  },
  {
    title: 'AI agent responds to commands',
    targetDate: 'March 28, 2026',
    status: 'complete',
    note: 'Natural language commands now cover the MVP workflow across the frontend and API runtime.',
  },
  {
    title: 'Provider-backed AI verified locally',
    targetDate: 'March 12, 2026',
    status: 'complete',
    note: 'Alibaba Model Studio compatible-mode reasoning was verified locally with Qwen models.',
  },
  {
    title: 'First autonomous payment',
    targetDate: 'April 5, 2026',
    status: 'complete',
    note: 'Validated send flows and scheduler-driven recurring execution are both available in demo mode.',
  },
  {
    title: 'Recurring payments working',
    targetDate: 'April 15, 2026',
    status: 'complete',
    note: 'Recurring setup is supported and can be processed through the API scheduler cycle.',
  },
  {
    title: 'Chat interface live',
    targetDate: 'April 20, 2026',
    status: 'complete',
    note: 'The web chat interface is connected to the shared runtime, and a Telegram bridge is available.',
  },
  {
    title: 'All tests and submission assets',
    targetDate: 'April 30, 2026',
    status: 'in_progress',
    note: 'Unit tests pass (7/7); OpenClaw integration, demo video, LICENSE, security review, and final submission assets are still open.',
  },
];

export const projectRisks: RiskStatus[] = [
  {
    title: 'Live WDK mode still depends on external credentials and funded wallets',
    impact: 'high',
    likelihood: 'medium',
    mitigation: 'Keep the wallet adapter isolated and provide a demo fallback so local development continues without blocking on credentials.',
  },
  {
    title: 'OpenClaw integration is a track requirement but not yet started',
    impact: 'high',
    likelihood: 'high',
    mitigation: 'Prioritize wrapping the reasoning layer with OpenClaw-native planning before submission.',
  },
  {
    title: 'Natural language parsing is still rule-based',
    impact: 'medium',
    likelihood: 'medium',
    mitigation: 'Use the current parser plus Alibaba-compatible reasoning and model auto-switch now, then layer OpenClaw behind the same command interface.',
  },
  {
    title: 'Recurring automation still needs a persistent scheduler in deployment',
    impact: 'medium',
    likelihood: 'medium',
    mitigation: 'Move the scheduler to a backend worker or serverless cron before production use.',
  },
  {
    title: 'Test coverage exists but is still limited to core flows',
    impact: 'medium',
    likelihood: 'medium',
    mitigation: 'Expand coverage to end-to-end UI flow, live provider smoke tests, and Telegram bridge checks.',
  },
];

export const mvpChecklist: MvpChecklistItem[] = [
  {
    id: 'wallet_creation',
    label: 'Wallet creation via the agent',
    status: 'ready',
    note: 'Create new wallets from chat and view them in the wallet inventory.',
  },
  {
    id: 'balance_checking',
    label: 'Balance checking',
    status: 'ready',
    note: 'Dashboard and chat both report wallet balances.',
  },
  {
    id: 'single_payment',
    label: 'Single payment execution',
    status: 'ready',
    note: 'Send payments with amount, balance, and rule validation.',
  },
  {
    id: 'natural_language',
    label: 'Natural language commands',
    status: 'ready',
    note: 'The agent accepts commands for wallets, payments, rules, recurring, and status.',
  },
  {
    id: 'spending_limits',
    label: 'Basic spending limits',
    status: 'ready',
    note: 'Daily cap, max transaction, whitelist, and blacklist are enforced.',
  },
  {
    id: 'chat_interface',
    label: 'One chat interface',
    status: 'ready',
    note: 'The web chat interface is the primary MVP control surface.',
  },
];

export const nextBuildPriorities = [
  'Integrate OpenClaw-native planning (track requirement, not yet started).',
  'Record the hackathon demo video (mandatory deliverable).',
  'Run a funded Sepolia smoke test with the WDK provider enabled.',
  'Wire production/deployment env vars for Alibaba-backed reasoning.',
  'Fix package.json name and add LICENSE file.',
  'Add state persistence and basic API authentication.',
  'Expand automated coverage to UI + Telegram bridge paths.',
];
