import { useState } from 'react';
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

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('landing');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const agent = useAgent();

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
            onNavigate={setCurrentPage}
          />
        );
      case 'dashboard':
        return (
          <Dashboard
            wallets={agent.wallets}
            transactions={agent.transactions}
            rules={agent.rules}
            recurringPayments={agent.recurringPayments}
            onNavigate={setCurrentPage}
          />
        );
      case 'chat':
        return (
          <ChatInterface
            messages={agent.messages}
            isProcessing={agent.isProcessing}
            runtimeMode={agent.runtimeMode}
            onSendMessage={agent.processCommand}
          />
        );
      case 'wallets':
        return (
          <WalletPanel
            wallets={agent.wallets}
            onNavigate={setCurrentPage}
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

  if (currentPage === 'landing') {
    return renderPage();
  }

  return (
    <div className="flex h-screen overflow-hidden bg-dark-950">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar
          currentPage={currentPage}
          onPageChange={setCurrentPage}
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
          onPageChange={setCurrentPage}
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
