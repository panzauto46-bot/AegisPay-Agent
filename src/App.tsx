import { useEffect, useState } from 'react';
import type { Page } from './types';
import { useAgent } from './hooks/useAgent';
import Sidebar from './components/Sidebar';
import MobileNav from './components/MobileNav';
import Dashboard from './components/Dashboard';
import ChatInterface from './components/ChatInterface';
import WalletPanel from './components/WalletPanel';
import TransactionHistory from './components/TransactionHistory';
import SpendingRules from './components/SpendingRules';
import RecurringPayments from './components/RecurringPayments';
import ProjectStatus from './components/ProjectStatus';
import LandingPage from './components/LandingPage';
import ConnectWalletPage from './components/ConnectWalletPage';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('landing');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [connectedWalletId, setConnectedWalletId] = useState<string | null>(null);

  const agent = useAgent();
  const connectedWallet = connectedWalletId
    ? agent.wallets.find((wallet) => wallet.id === connectedWalletId) ?? null
    : null;

  useEffect(() => {
    if (connectedWalletId && !connectedWallet) {
      setConnectedWalletId(null);
    }
  }, [connectedWallet, connectedWalletId]);

  const handlePageChange = (page: Page) => {
    if (page === 'chat' && !connectedWalletId) {
      setCurrentPage('connect');
      return;
    }

    setCurrentPage(page);
  };

  const handleLaunchConsole = () => {
    if (connectedWalletId) {
      setCurrentPage('chat');
      return;
    }

    setCurrentPage('connect');
  };

  const handleConnectWallet = (walletId: string) => {
    setConnectedWalletId(walletId);
    setCurrentPage('chat');
  };

  const handleCreateAndConnectWallet = async () => {
    const nextState = await agent.createWallet();
    const nextWallet = nextState.wallets.at(-1);
    if (!nextWallet) {
      return;
    }

    setConnectedWalletId(nextWallet.id);
    setCurrentPage('chat');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'landing':
        return (
          <LandingPage
            wallets={agent.wallets}
            transactions={agent.transactions}
            rules={agent.rules}
            recurringPayments={agent.recurringPayments}
            runtimeMode={agent.runtimeMode}
            onLaunchConsole={handleLaunchConsole}
            onNavigate={handlePageChange}
          />
        );
      case 'connect':
        return (
          <ConnectWalletPage
            wallets={agent.wallets}
            runtimeMode={agent.runtimeMode}
            isProcessing={agent.isProcessing}
            onBack={() => setCurrentPage('landing')}
            onConnect={handleConnectWallet}
            onCreateAndConnect={handleCreateAndConnectWallet}
          />
        );
      case 'dashboard':
        return (
          <Dashboard
            wallets={agent.wallets}
            transactions={agent.transactions}
            rules={agent.rules}
            recurringPayments={agent.recurringPayments}
            onNavigate={handlePageChange}
          />
        );
      case 'chat':
        return (
          <ChatInterface
            messages={agent.messages}
            isProcessing={agent.isProcessing}
            runtimeMode={agent.runtimeMode}
            connectedWallet={connectedWallet}
            onSendMessage={agent.processCommand}
          />
        );
      case 'wallets':
        return (
          <WalletPanel
            wallets={agent.wallets}
            onNavigate={handlePageChange}
          />
        );
      case 'transactions':
        return (
          <TransactionHistory
            transactions={agent.transactions}
          />
        );
      case 'rules':
        return (
          <SpendingRules
            rules={agent.rules}
            onToggle={agent.toggleRule}
            onDelete={agent.deleteRule}
            onAdd={agent.addRule}
          />
        );
      case 'recurring':
        return (
          <RecurringPayments
            payments={agent.recurringPayments}
            onToggle={agent.toggleRecurring}
            onDelete={agent.deleteRecurring}
            onAdd={agent.addRecurringPayment}
            onRunScheduler={agent.runScheduler}
            lastSchedulerRun={agent.lastSchedulerRun}
          />
        );
      case 'status':
        return (
          <ProjectStatus
            wallets={agent.wallets}
            transactions={agent.transactions}
            rules={agent.rules}
            recurringPayments={agent.recurringPayments}
            lastSchedulerRun={agent.lastSchedulerRun}
          />
        );
      default:
        return null;
    }
  };

  if (currentPage === 'landing' || currentPage === 'connect') {
    return renderPage();
  }

  return (
    <div className="flex h-screen overflow-hidden bg-dark-950">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar
          currentPage={currentPage}
          onPageChange={handlePageChange}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          unreadMessages={0}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Mobile Nav */}
        <MobileNav
          currentPage={currentPage}
          onPageChange={handlePageChange}
          isOpen={mobileMenuOpen}
          onToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
        />

        {/* Page Content */}
        <div className="flex-1 min-h-0 flex flex-col pb-14 lg:pb-0">
          {renderPage()}
        </div>
      </div>
    </div>
  );
}
