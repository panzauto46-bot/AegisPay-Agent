import { startTransition, useEffect, useRef, useState } from 'react';
import { AgentEngine } from '../engine/agentEngine';
import { DemoWalletProvider } from '../engine/demoWalletProvider';
import { deserializeAgentState, type SerializedAgentState } from '../lib/agentState';
import { createInitialAgentState } from '../lib/agentRuntime';
import type { AgentState, RecurringPayment, SpendingRule } from '../types';

const DEFAULT_API_BASE_URL = import.meta.env.VITE_AEGIS_API_URL?.trim() || '/api';

interface ApiStatePayload {
  state: SerializedAgentState;
}

async function fetchJson<T>(input: RequestInfo | URL, init?: RequestInit) {
  const response = await fetch(input, init);
  if (!response.ok) {
    throw new Error(await response.text());
  }

  return (await response.json()) as T;
}

export function useAgent() {
  const engineRef = useRef<AgentEngine | null>(null);
  const [agentState, setAgentState] = useState<AgentState>(() => createInitialAgentState());
  const [isProcessing, setIsProcessing] = useState(false);
  const [runtimeMode, setRuntimeMode] = useState<'local' | 'remote'>('local');

  if (!engineRef.current) {
    engineRef.current = new AgentEngine({
      walletProvider: new DemoWalletProvider(),
    });
  }

  useEffect(() => {
    let cancelled = false;

    const loadRemoteState = async () => {
      try {
        const payload = await fetchJson<ApiStatePayload>(`${DEFAULT_API_BASE_URL}/state`);
        if (cancelled) {
          return;
        }

        startTransition(() => {
          setAgentState(deserializeAgentState(payload.state));
          setRuntimeMode('remote');
        });
      } catch {
        if (!cancelled) {
          setRuntimeMode('local');
        }
      }
    };

    loadRemoteState().catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);

  const updateState = (nextState: AgentState) => {
    startTransition(() => {
      setAgentState(nextState);
    });
  };

  const runLocal = async (operation: () => Promise<AgentState>) => {
    const state = await operation();
    updateState(state);
    return state;
  };

  const runRemote = async (path: string, init?: RequestInit) => {
    const payload = await fetchJson<ApiStatePayload>(`${DEFAULT_API_BASE_URL}${path}`, init);
    const nextState = deserializeAgentState(payload.state);
    updateState(nextState);
    return nextState;
  };

  const processCommand = async (input: string) => {
    setIsProcessing(true);
    try {
      if (runtimeMode === 'remote') {
        await runRemote('/command', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ input }),
        });
      } else {
        await runLocal(() => engineRef.current!.processCommand(input));
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleRule = async (id: string) => {
    if (runtimeMode === 'remote') {
      await runRemote(`/rules/${id}/toggle`, {
        method: 'PATCH',
      });
      return;
    }

    await runLocal(() => engineRef.current!.toggleRule(id));
  };

  const deleteRule = async (id: string) => {
    if (runtimeMode === 'remote') {
      await runRemote(`/rules/${id}`, {
        method: 'DELETE',
      });
      return;
    }

    await runLocal(() => engineRef.current!.deleteRule(id));
  };

  const toggleRecurring = async (id: string) => {
    if (runtimeMode === 'remote') {
      await runRemote(`/recurring/${id}/toggle`, {
        method: 'PATCH',
      });
      return;
    }

    await runLocal(() => engineRef.current!.toggleRecurring(id));
  };

  const deleteRecurring = async (id: string) => {
    if (runtimeMode === 'remote') {
      await runRemote(`/recurring/${id}`, {
        method: 'DELETE',
      });
      return;
    }

    await runLocal(() => engineRef.current!.deleteRecurring(id));
  };

  const addRule = async (type: SpendingRule['type'], label: string, value: number | string[]) => {
    if (runtimeMode === 'remote') {
      await runRemote('/rules', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type, label, value }),
      });
      return;
    }

    await runLocal(() => engineRef.current!.addRule(type, label, value));
  };

  const addRecurringPayment = async (payment: Omit<RecurringPayment, 'id' | 'executionCount'>) => {
    if (runtimeMode === 'remote') {
      await runRemote('/recurring', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payment),
      });
      return;
    }

    await runLocal(() => engineRef.current!.addRecurringPayment(payment));
  };

  const runScheduler = async () => {
    setIsProcessing(true);
    try {
      if (runtimeMode === 'remote') {
        await runRemote('/scheduler/run', {
          method: 'POST',
        });
      } else {
        await runLocal(() => engineRef.current!.runScheduler());
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const createWallet = async (name?: string) => {
    setIsProcessing(true);
    try {
      if (runtimeMode === 'remote') {
        return await runRemote('/wallets', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name }),
        });
      }

      return await runLocal(() => engineRef.current!.createWallet(name));
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    ...agentState,
    isProcessing,
    runtimeMode,
    createWallet,
    processCommand,
    toggleRule,
    deleteRule,
    toggleRecurring,
    deleteRecurring,
    addRule,
    addRecurringPayment,
    runScheduler,
  };
}
